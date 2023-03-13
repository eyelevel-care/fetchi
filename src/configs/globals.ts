import { Adaptor } from '../types/adaptor';
// eslint-disable-next-line import/no-cycle
import { Interceptors } from '../types/interceptor';

type GlobalConfig = {
  baseUrl?: string;
  headers: Readonly<Headers>; // RequestInit['headers'] & { authorization?: string };
  interceptors: Interceptors;
  mockAdaptor?: Adaptor;
  shouldAllUseMockAdaptor?: boolean;
  validateStatus: (status: number) => boolean;
  onPendingRequestsChanged?: (isPending: boolean, numberOfRequests: number) => void;
  retryConfig?: {
    count: number;
    delay: number; // millisecnods
  };
};

export const SharedGlobalVariable: {
  config: GlobalConfig;
} = {
  config: {
    headers: new Headers(),
    interceptors: {},
    validateStatus: (status) => status >= 200 && status < 300, // default
  },
};
