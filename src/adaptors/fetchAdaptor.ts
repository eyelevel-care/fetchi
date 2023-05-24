import { mergeHeaders } from '../helpers/mergeHeaders';
import { Adaptor } from '../types/adaptor';
import { Config } from '../types/configs';
import { FetchiError } from '../types/error';
import { FetchResponse } from '../types/response';

export default class FetchAdaptor implements Adaptor {
  #abortCtrl = new AbortController();

  #CancelReason = 'Canceled';

  request<T>(config: Config): Promise<FetchResponse<T>> {
    // timeout
    const timeoutErrorMessage = config.timeoutErrorMessage ?? 'TIMEOUT';
    if (config.timeout) {
      AbortSignal.timeout(config.timeout).addEventListener('abort', () =>
        this.#abortCtrl.abort(Error(timeoutErrorMessage)),
      );
    }

    let requestUrl = config.url;
    const method = config.method ?? 'GET';
    const body = method !== 'GET' ? 
                    config.data !== undefined ? 
                        config.data 
                        : config.params !== undefined ? 
                            JSON.stringify(config.params) 
                            : undefined
                    : undefined;

    if (method === 'GET' && config.params !== undefined) {
      requestUrl = `${requestUrl}?${Object.keys(config.params)
        .map((key) => {
          const value = config.params?.[key];
          return value !== undefined && value !== null && typeof value !== 'object' && typeof value !== 'function'
            ? `${key}=${encodeURIComponent(value)}`
            : '';
        })
        .join('&')}`;
    }

    const parseBodyContent = (result: Response): Promise<FetchResponse<T>> =>
      result
        .json()
        .then((response: T) => ({
          config,
          response,
          status: result.status,
        }))
        .catch((err) => ({
          config,
          response: err,
          status: result.status,
        }));

    return fetch(requestUrl, {
      headers: mergeHeaders(config.headers ?? {}, {
        'Content-Type': 'application/json',
      }),
      cache: config.cachePolicy ?? 'default',
      body,
      method: method ?? 'GET',
      signal: this.#abortCtrl.signal,
    })
      .then((result) => {
        if (config.validateStatus?.(result.status)) {
          return parseBodyContent(result);
        }
        return parseBodyContent(result).then((errorData) => {
          throw new FetchiError({
            status: result.status,
            data: errorData.response,
            config,
          });
        });
      })
      .catch((err) => {
        if (err instanceof FetchiError) {
          throw err;
        }

        let puplishingError = err;

        if (this.#abortCtrl.signal.aborted && this.#abortCtrl.signal.reason === this.#CancelReason) {
          puplishingError = Error(this.#CancelReason);
        }

        if (this.#abortCtrl.signal.aborted && this.#abortCtrl.signal.reason === timeoutErrorMessage) {
          puplishingError = Error(timeoutErrorMessage);
        }

        throw new FetchiError({
          status: err.status,
          data: puplishingError,
          config,
        });
      });
  }

  cancel() {
    this.#abortCtrl.abort(this.#CancelReason);
  }
}
