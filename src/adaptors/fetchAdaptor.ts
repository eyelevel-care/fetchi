import { Adaptor } from "src/types/Adaptor";
import { Config } from "src/types/Config";
import { FetchiError } from "src/types/error";
import { FetchResponse } from "src/types/response";

export default class FetchAdaptor implements Adaptor {
    #abortCtrl = new AbortController();
    #CancelReason = "Canceled";
    request<T>(config: Config): Promise<FetchResponse<T>> {
        
        // timeout
        let timeoutErrorMessage = config.timeoutErrorMessage ?? "TIMEOUT";
        if(config.timeout) {
            AbortSignal.timeout(config.timeout).addEventListener("abort", () => this.#abortCtrl.abort(Error(timeoutErrorMessage)));
        }

        let requestUrl = config.url;
        let body = config.method !== "GET" && config.params ? JSON.stringify(config.params) : undefined;

        if (config.method === "GET"  && config.params) {
            requestUrl = requestUrl + '?' + Object.keys(config.params)
                .map(key => { 
                    let value = config.params[key];
                    return value !== undefined &&
                           value !== null &&
                           typeof value !== "object" && 
                           typeof value !== "function" ? 
                            `${key}=${encodeURIComponent(value)}` : "" 
                    })
                .join('&')
        }

        return fetch(requestUrl, { 
            headers: {
                "Content-Type": "application/json",
                ...config.headers
            },
            cache: config.cachePolicy ?? "default",
            body,
            method: config.method ?? "GET",
            signal: this.#abortCtrl.signal
        }).then((result) => {
            // parsing response
            return result.json()
                .then((response: T) => ({
                    config,
                    response,
                    status: result.status
                })).catch((err) => {
                    throw new FetchiError({
                        data: err,
                        status: result.status,
                        config
                    })
                })
        }).catch((err) => {
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
                config
            });
        })
    }

    cancel() {
        this.#abortCtrl.abort(this.#CancelReason);
    }
}