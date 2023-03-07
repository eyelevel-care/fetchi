import { Config } from './configs';
import { FetchResponse } from './response';
import { FetchiType } from './fetchi';

export type Interceptors = {
  request?: (config: Config) => Config;
  response?: <T1, T2 = never>(
    response: FetchResponse<T1>,
    request: FetchiType<T1>,
  ) => FetchResponse<T1 | T2> | Promise<FetchResponse<T1 | T2>>;
};
