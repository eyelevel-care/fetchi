import { FetchResponse } from '../types/response';
import { FetchiError } from '../types/error';
import { Config } from '../types/configs';
import { Adaptor } from '../types/adaptor';

// mock adaptor must throw errors using FetchError! and you can use it for all of the possible configs
export default class DefaultMockAdaptor implements Adaptor {
  request<T>(config: Config): Promise<FetchResponse<T>> {
    throw new FetchiError({
      data: Error('Not Implemented'),
      status: 800,
      config,
    });
  }

  cancel() {}
}
