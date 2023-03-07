// eslint-disable-next-line import/no-cycle
import { Adaptor } from './adaptor';
import { ParamValue } from './paramValue';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Config = {
  url: string;
  method?: Method;
  useMock?: boolean;
  mockAdaptor?: Adaptor;
  cachePolicy?: 'default' | 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached';
  timeout?: number;
  timeoutErrorMessage?: string;
  headers?: RequestInit['headers'];
  retryConfig?: {
    count: number;
    delay: number; // millisecnods
  };
  params?: { [x in string]: ParamValue };
  validateStatus?: (status: number) => boolean;
  onPendingStatusChanged?: (isPending: boolean) => void;
};
