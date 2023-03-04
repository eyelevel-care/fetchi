import { Config } from "./Config";
import { FetchResponse } from "./response";

export interface Adaptor {
    request: <T>(config: Config) => Promise<FetchResponse<T>>
    cancel: () => void;
}