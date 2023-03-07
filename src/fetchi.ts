import DefaultMockAdaptor from './adaptors/defaultMockAdaptor';
import FetchAdaptor from './adaptors/fetchAdaptor';
import { SharedGlobalVariable } from './configs/globals';
import { Adaptor } from './types/adaptor';
import { Config } from './types/configs';
import { FetchiError } from './types/error';
import { FetchiType } from './types/fetchi';
import { FetchResponse } from './types/response';

function configPromise<T>(this: Fetchi<T>, adaptor: Adaptor): Promise<FetchResponse<T>> {
  // adding possible base url
  if (
    SharedGlobalVariable.config.baseUrl !== undefined &&
    this.config.url.includes(SharedGlobalVariable.config.baseUrl) === false
  ) {
    this.config.url = `${
      this.config.url?.includes(SharedGlobalVariable.config.baseUrl) ? '' : SharedGlobalVariable.config.baseUrl
    }${this.config.url}`;
    this.config.url.replace('//', '/'); // clean of possible double slashes
  }

  // merging common possible headers
  if (SharedGlobalVariable.config.headers) {
    this.config.headers = {
      ...this.config.headers,
      ...SharedGlobalVariable.config.headers,
    };
  }

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

          if (SharedGlobalVariable.config.validateStatus(res.status)) {
            return res;
          }
          throw new FetchiError({
            config: this.config,
            status: res.status,
            data: res.response,
          });
        }),
    )
    .catch((er) => {
      if (this.config.retryConfig !== undefined && this.config.retryConfig.count !== 0) {
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

  #isCanceled = false;

  static #numberOfPendingReqs = 0;

  constructor({
    config,
    adaptor,
    promise,
  }: {
    config: Config;
    adaptor?: Adaptor;
    promise?: Promise<FetchResponse<T> | Fetchi<any>>;
  }) {
    this.config = config;
    this.#adaptor =
      adaptor ??
      (SharedGlobalVariable.config.shouldAllUseMockAdaptor || this.config.useMock
        ? SharedGlobalVariable.config.mockAdaptor ?? new DefaultMockAdaptor()
        : new FetchAdaptor());
    this.retry = this.retry.bind(this);

    if (promise !== undefined) {
      this.#promise = promise.then((result) => {
        if (result instanceof Fetchi) {
          this.config = result.config;
          this.#adaptor = result.#adaptor;
          this.#isCanceled = result.#isCanceled || this.#isCanceled;
          // eslint-disable-next-line no-param-reassign
          result.#isCanceled = this.#isCanceled;
          return result.#promise;
        }
        // it can be another promise or raw value
        return result;
      });
      return;
    }

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

  fullResponse<TResult1 = T, TResult2 = never>(
    onfulfilled?: (
      value: FetchResponse<T>,
    ) => (T | TResult1 | PromiseLike<TResult1> | Fetchi<TResult1>) | undefined | null,
    onrejected?: (reason: FetchiError) => (TResult2 | PromiseLike<TResult2> | Fetchi<TResult2>) | undefined | null,
  ): Fetchi<TResult1 | TResult2> {
    return new Fetchi<TResult1 | TResult2>({
      config: this.config,
      adaptor: this.#adaptor,
      promise: this.#promise.then(
        (res) => {
          if (this.#isCanceled) {
            return res;
          }
          const convertedVersion = onfulfilled?.(res);
          if (convertedVersion instanceof Fetchi) {
            convertedVersion.retry = this.retry; // for chained fetchies!
            return convertedVersion as Fetchi<any>;
          }
          return {
            response: convertedVersion,
            staus: res.status,
            config: res.config,
          };
        },
        (er) => {
          if (this.#isCanceled) {
            return er;
          }
          if (er instanceof FetchiError) {
            onrejected?.(er);
          }
          return er;
        },
      ),
    });
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: (value: T) => (T | TResult1 | PromiseLike<TResult1> | Fetchi<TResult1>) | undefined | null,
    onrejected?: (reason: FetchiError) => (TResult2 | PromiseLike<TResult2> | Fetchi<TResult2>) | undefined | null,
  ): Fetchi<TResult1 | TResult2> {
    return this.fullResponse((res) => onfulfilled?.(res.response), onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined,
  ): Fetchi<T | TResult> {
    return new Fetchi<T | TResult>({
      config: this.config,
      adaptor: this.#adaptor,
      promise: this.#promise.catch((err) => {
        if (this.#isCanceled) {
          return Promise.reject();
        }
        return onrejected?.(err) ?? err;
      }),
    });
  }

  isCanceled() {
    this.#isCanceled;
  }

  rawPromise(): Promise<FetchResponse<T>> {
    return this.#promise;
  }

  finally(onfinally?: (() => void) | null | undefined): Fetchi<T> {
    return new Fetchi<T>({
      config: this.config,
      adaptor: this.#adaptor,
      promise: this.#promise.finally(() => {
        if (this.#isCanceled) {
          return;
        }
        onfinally?.();
      }),
    });
  }

  cancel() {
    this.#isCanceled = true;
    this.#adaptor.cancel();
  }

  retry() {
    this.#isCanceled = false;
    this.#adaptor = new FetchAdaptor();
    this.#promise = configPromise.call(this, this.#adaptor) as Promise<FetchResponse<T>>;
  }
}
