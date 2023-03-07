// eslint-disable-next-line import/no-cycle
import { Config } from './configs';
// eslint-disable-next-line import/no-cycle
import { FetchResponse } from './response';

export interface Adaptor {
  request: <T>(config: Config) => Promise<FetchResponse<T>>;
  cancel: () => void;
}
