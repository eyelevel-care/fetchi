import { Config } from './configs';
import { ParamValue } from './paramValue';

export class FetchiError<T = ParamValue> extends Error {
  status: number;

  config: Config;

  data: T;

  constructor({ data, status, config }: { data: T; status: number; config: Config }) {
    super();
    this.status = status;
    this.config = config;
    this.data = data;

    this.name = 'FetchiResponseError';
  }
}
