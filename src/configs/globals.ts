import { Adaptor } from "src/types/Adaptor";
import { Interceptors } from "../types/Intercept";

type GlobalConfig = {
    baseUrl?: string;
    headers?: RequestInit["headers"] & { authorization?: string };
    interceptors?: Interceptors;
    mockAdaptor?: Adaptor;
    shouldAllUseMockAdaptor?: boolean; 
    validateStatus: (status: number) => boolean;
    onPendingRequestsChanged?: (isPending: boolean, numberOfRequests: number) => void
    retryConfig?: {
        count: number;
        delay: number; //millisecnods
    }
}

export const SharedGlobalVariable: {
    config: GlobalConfig
} = {
    config: {
        validateStatus: (status) => status >= 200 && status < 300 //default 
    }
}