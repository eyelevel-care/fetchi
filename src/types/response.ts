// eslint-disable-next-line import/no-cycle
import { Config } from './configs';

export interface FetchResponse<R> {
  response: R;
  status: number;
  config: Config;
}

export function instanceOfFetchResponse(object: any): object is FetchResponse<any> {
  return 'status' in object && 'config' in object && 'response' in object;
}
