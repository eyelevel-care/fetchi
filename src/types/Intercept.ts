import { Fetchi } from "src/fetchi";
import { Config } from "./Config"
import { FetchResponse } from "./response";

export type Interceptors = {
    request?: (config: Config) => Config;
    response<T1, T2 = never>(response: FetchResponse<T1>, request: Fetchi<T1>): FetchResponse<T1 | T2> | Promise<FetchResponse<T1 | T2>>;
}