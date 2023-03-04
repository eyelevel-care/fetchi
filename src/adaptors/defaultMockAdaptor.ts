import { Adaptor } from "src/types/Adaptor";
import { Config } from "src/types/Config";
import { FetchiError } from "src/types/error";
import { FetchResponse } from "src/types/response";

// mock adaptor must throw errors using FetchError! and you can use it for all of the possible configs
export default class DefaultMockAdaptor implements Adaptor {
    request<T>(config: Config): Promise<FetchResponse<T>> {
        throw new FetchiError({
            data: Error("Not Implemented"),
            status: 800,
            config
        });
    }
    cancel() {};
}