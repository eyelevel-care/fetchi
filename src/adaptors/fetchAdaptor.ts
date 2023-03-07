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
    const body = config.method !== 'GET' && config.params ? JSON.stringify(config.params) : undefined;

    if (config.method === 'GET' && config.params !== undefined) {
      requestUrl = `${requestUrl}?${Object.keys(config.params)
        .map((key) => {
          const value = config.params?.[key];
          return value !== undefined && value !== null && typeof value !== 'object' && typeof value !== 'function'
            ? `${key}=${encodeURIComponent(value)}`
            : '';
        })
        .join('&')}`;
    }

    return fetch(requestUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      cache: config.cachePolicy ?? 'default',
      body,
      method: config.method ?? 'GET',
      signal: this.#abortCtrl.signal,
    })
      .then((result) =>
        // parsing response
        result
          .json()
          .then((response: T) => ({
            config,
            response,
            status: result.status,
          }))
          .catch((err) => {
            throw new FetchiError({
              data: err,
              status: result.status,
              config,
            });
          }),
      )
      .catch((err) => {
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
