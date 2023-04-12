import DefaultMockAdaptor from './adaptors/defaultMockAdaptor';
import FetchAdaptor from './adaptors/fetchAdaptor';
import { SharedGlobalVariable } from './configs/globals';
import { mergeHeaders } from './helpers/mergeHeaders';
import { Adaptor } from './types/adaptor';
import { Config } from './types/configs';
import { FetchiError } from './types/error';
import { FetchiType } from './types/fetchi';
import { FetchResponse, instanceOfFetchResponse } from './types/response';

function configPromise<T>(this: Fetchi<T>, adaptor: Adaptor): Promise<FetchResponse<T>> {
  // adding possible base url
  if (
    SharedGlobalVariable.config.baseUrl !== undefined &&
    this.config.url.includes(SharedGlobalVariable.config.baseUrl) === false
  ) {
    this.config.url = `${
      this.config.url?.includes(SharedGlobalVariable.config.baseUrl) ? '' : SharedGlobalVariable.config.baseUrl
    }${this.config.url}`;
    this.config.url = this.config.url.replace(/([^:]\/)\/+/g, "$1"); // clean of possible double slashes
  }

  // config the possible timeout
  this.config.timeout = this.config.timeout ?? SharedGlobalVariable.config.timeout;

  // merging common possible headers
  this.config.headers = this.config.headers ?? SharedGlobalVariable.config.headers;
  this.config.headers = mergeHeaders(SharedGlobalVariable.config.headers, this.config.headers);

  // mutate by a possible interceptor
  if (SharedGlobalVariable.config.interceptors.request !== undefined) {
    this.config = SharedGlobalVariable.config.interceptors.request(this.config);
  }

  // retry configuration
  if (SharedGlobalVariable.config.retryConfig !== undefined && this.config.retryConfig === undefined) {
    this.config.retryConfig = {
      ...SharedGlobalVariable.config.retryConfig,
    };
  }

  // configuring the validation of the request
  this.config.validateStatus = this.config.validateStatus ?? SharedGlobalVariable.config.validateStatus;

  this.config.onPendingStatusChanged?.(true);
  return adaptor
    .request<T>(this.config)
    .then((response) =>
      Promise.resolve(response)
        .then((res) => SharedGlobalVariable.config.interceptors.response?.(res, this) ?? res)
        .then((res) => {
          if (this.config.validateStatus) {
            if (this.config.validateStatus(res.status)) {
              return res;
            }
            throw new FetchiError({
              config: this.config,
              status: res.status,
              data: res.response,
            });
          }

          throw new FetchiError({
            config: this.config,
            status: res.status,
            data: res.response,
          });
        }),
    )
    .catch((er) => {
      SharedGlobalVariable.config.interceptors.response?.(er, this);
      if (this.config.retryConfig !== undefined && this.config.retryConfig.count > 0) {
        this.cancel();
        setTimeout(() => {
          this.retry();
        }, this.config.retryConfig.delay);
        this.config.retryConfig.count -= 1;
      }
      throw er;
    })
    .finally(() => {
      this.config.onPendingStatusChanged?.(false);
    });
}

export class Fetchi<T> implements FetchiType<T> {
  public config: Config;

  #adaptor: Adaptor;

  #promise: Promise<FetchResponse<T>>;

  #subscriptions: {
    fullResponse?: { onfulfilled?: (value: any) => any; onrejected?: (reason: any) => any };
    onfulfilled?: (value: any) => any;
    onrejected?: (reason: any) => any;
    onfinally?: (() => any) | null;
  }[] = [];

  #isCanceled = {
    flag: false,
  };

  static #numberOfPendingReqs = 0;

  constructor({
    config,
  }: {
    config: Config;
    adaptor?: Adaptor;
    promise?: Promise<FetchResponse<T> | Fetchi<any>>;
    isCanceled?: { flag: boolean };
  }) {
    this.config = config;
    this.#adaptor = (this.config.useMock ?? SharedGlobalVariable.config.useMock ?? false)
        ? this.config.mockAdaptor ?? SharedGlobalVariable.config.mockAdaptor ?? new DefaultMockAdaptor()
        : new FetchAdaptor();
    this.retry = this.retry.bind(this);
    this.cancel = this.cancel.bind(this);

    this.#promise = configPromise.call(this, this.#adaptor) as Promise<FetchResponse<T>>;

    Fetchi.#numberOfPendingReqs += 1;
    SharedGlobalVariable.config.onPendingRequestsChanged?.(
      Fetchi.#numberOfPendingReqs !== 0,
      Fetchi.#numberOfPendingReqs,
    );
    this.#promise
      .catch(() => {})
      .finally(() => {
        Fetchi.#numberOfPendingReqs -= 1;
        SharedGlobalVariable.config.onPendingRequestsChanged?.(
          Fetchi.#numberOfPendingReqs !== 0,
          Fetchi.#numberOfPendingReqs,
        );
      });
  }

  #fullResponse<TResult1 = T, TResult2 = never>(
    onfulfilled?: (
      value: FetchResponse<T>,
    ) => T | TResult1 | PromiseLike<TResult1> | FetchiType<TResult1> | null | undefined,
    onrejected?: (reason: FetchiError) => TResult2 | PromiseLike<TResult2> | FetchiType<TResult2> | null | undefined,
  ): FetchiType<TResult1 | TResult2> {
    this.#subscriptions.push({
      fullResponse: {
        onfulfilled,
        onrejected,
      },
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.#promise = this.#promise.then(
      (res) => {
        if (this.#isCanceled.flag) {
          return res;
        }
        const convertedVersion = onfulfilled?.(res);
        if (convertedVersion instanceof Fetchi) {
          convertedVersion.retry = this.retry; // for chained fetchies!
        }
        return Promise.resolve(
          convertedVersion instanceof Fetchi ? convertedVersion.rawPromise() : convertedVersion,
        ).then((response) => {
          if (instanceOfFetchResponse(response)) {
            return response;
          }
          return {
            response,
            status: res.status,
            config: res.config,
          };
        });
      },
      (er) => {
        if (this.#isCanceled.flag) {
          throw er;
        }
        if (er instanceof FetchiError) {
          onrejected?.(er);
        }
        throw er;
      },
    );
    // trick the typescript in order to optimize the memory usage (not creating new instance)
    return this as FetchiType<TResult1 | TResult2>;
  }

  fullResponse<TResult1 = T, TResult2 = never>(
    onfulfilled?: (
      value: FetchResponse<T>,
    ) => T | TResult1 | PromiseLike<TResult1> | FetchiType<TResult1> | null | undefined,
    onrejected?: (reason: FetchiError) => TResult2 | PromiseLike<TResult2> | FetchiType<TResult2> | null | undefined,
  ): FetchiType<TResult1 | TResult2> {
    this.#subscriptions.push({
      onfulfilled,
      onrejected,
    });
    return this.#fullResponse(onfulfilled, onrejected);
  }

  #then<TResult1 = T, TResult2 = never | undefined>(
    onfulfilled?: (value: T) => T | TResult1 | PromiseLike<TResult1> | FetchiType<TResult1> | null | undefined,
    onrejected?: (reason: FetchiError) => TResult2 | PromiseLike<TResult2> | FetchiType<TResult2> | null | undefined,
  ): FetchiType<TResult1 | TResult2> {
    return this.#fullResponse((res) => onfulfilled?.(res.response), onrejected);
  }

  then<TResult1 = T, TResult2 = never | undefined>(
    onfulfilled?: (value: T) => T | TResult1 | PromiseLike<TResult1> | FetchiType<TResult1> | null | undefined,
    onrejected?: (reason: FetchiError) => TResult2 | PromiseLike<TResult2> | FetchiType<TResult2> | null | undefined,
  ): FetchiType<TResult1 | TResult2> {
    this.#subscriptions.push({
      onfulfilled,
      onrejected,
    });
    return this.#then(onfulfilled, onrejected);
  }

  #catch<TResult = never>(
    onrejected?: (reason: FetchiError) => (TResult | Promise<TResult>) | undefined | null,
  ): FetchiType<T | TResult> {
    this.#promise = this.#promise.catch((err) => {
      if (this.#isCanceled.flag) {
        return Promise.reject();
      }
      return onrejected?.(err) ?? err;
    });
    return this as FetchiType<T | TResult>;
  }

  catch<TResult = never>(
    onrejected?: (reason: FetchiError) => (TResult | Promise<TResult>) | undefined | null,
  ): FetchiType<T | TResult> {
    this.#subscriptions.push({
      onrejected,
    });
    return this.#catch(onrejected);
  }

  isCanceled() {
    return this.#isCanceled.flag;
  }

  rawPromise(): Promise<FetchResponse<T>> {
    return this.#promise;
  }

  #finally(onfinally?: (() => void) | undefined | null): this {
    this.#promise.finally(() => {
      if (this.#isCanceled.flag) {
        return;
      }
      onfinally?.();
    });
    return this;
  }

  finally(onfinally?: (() => void) | undefined | null): this {
    this.#subscriptions.push({
      onfinally,
    });
    return this.#finally(onfinally);
  }

  cancel() {
    this.#isCanceled.flag = true;
    this.#adaptor.cancel();
  }

  retry() {
    this.#isCanceled.flag = false;
    this.#adaptor = new FetchAdaptor();
    this.#promise = configPromise.call(this, this.#adaptor) as Promise<FetchResponse<T>>;

    this.#subscriptions.forEach(async (subscribe) => {
      if (subscribe.fullResponse !== undefined) {
        this.#fullResponse(subscribe.fullResponse.onfulfilled, subscribe.fullResponse.onrejected);
      }
      if (subscribe.onfulfilled !== undefined) {
        this.#then(subscribe.onfulfilled, subscribe.onrejected);
      }
      if (subscribe.onfulfilled === undefined && subscribe.onrejected !== undefined) {
        this.#catch(subscribe.onrejected);
      }
      if (subscribe.onfinally !== undefined) {
        this.#finally(subscribe.onfinally);
      }
    });
  }
}
