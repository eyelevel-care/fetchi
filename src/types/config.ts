import { ParamValue } from "./paramValue";

type Method = "GET" | "POST" | "PUT" | "DELETE";

export type Config = {
    url: string;
    method?: Method;
    validateStatus?: (status: number) => boolean;
    onPendingStatusChanged?: (isPending: boolean) => void;
    useMock: boolean;
    cachePolicy?: "default" | "no-cache" |"reload" | "force-cache" | "only-if-cached";
    timeout?: number;
    timeoutErrorMessage?: string;
    headers?: RequestInit["headers"];
    retryConfig?: {
        count: number;
        delay: number; //millisecnods
    }
    params: {[x in string]: ParamValue };
};