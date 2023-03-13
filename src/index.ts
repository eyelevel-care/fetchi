import { Fetchi } from './fetchi';
import { SharedGlobalVariable } from './configs/globals';
import { Config } from './types/configs';
import { FetchiError } from './types/error';
import { AnyAsyncService, FetchiType } from './types/fetchi';

const fetchi = <T>(config: Config) => new Fetchi<T>({ config });
fetchi.global = SharedGlobalVariable;

fetchi.all = <T>(values: Array<Fetchi<T>>) => ({
  cancel: () => {
    values.forEach((element) => element.cancel());
  },
  retry: () => {
    values.forEach((element) => element.retry());
  },
  promise: Promise.all(values.map((item) => item.rawPromise())),
});

fetchi.resolve = <T>(value: T) => {
  const dummyConfig = { url: 'no_url' };
  return new Fetchi<T>({
    config: dummyConfig,
    promise: Promise.resolve({
      response: value,
      status: 200,
      config: dummyConfig,
    }),
  });
};

fetchi.reject = <T>(value: T) => {
  const dummyConfig = { url: 'no_url' };
  return new Fetchi<T>({
    config: dummyConfig,
    promise: Promise.reject(
      new FetchiError({
        data: value,
        status: 200,
        config: dummyConfig,
      }),
    ),
  });
};

fetchi.race = <T>(values: Array<Fetchi<T>>) => ({
  cancel: () => {
    values.forEach((element) => element.cancel());
  },
  retry: () => {
    values.forEach((element) => element.retry());
  },
  promise: Promise.race(values.map((item) => item.rawPromise())),
});

export type { AnyAsyncService, FetchiType };
export default fetchi;
