import { Fetchi } from './fetchi';
import { SharedGlobalVariable } from './configs/globals';
import { Config } from './types/configs';
import { FetchiError } from './types/error';
import { AnyAsyncService, FetchiType } from './types/fetchi';
import { Adaptor } from './types/adaptor';
import { FetchResponse } from './types/response';

const fetchi = <T>(config: Config) => new Fetchi<T>({ config });
fetchi.global = SharedGlobalVariable;

fetchi.all = <T extends readonly unknown[] | []>(values: T): {
  cancel: () => void;
  retry: () => void;
  promise: Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>
} => {
  return {
  cancel: () => {
    values.forEach((element) => element instanceof Fetchi && element.cancel());
  },
  retry: () => {
    values.forEach((element) => element instanceof Fetchi && element.retry());
  },
  // @ts-ignore
  promise: Promise.all(values.map((item) => {
    if (item instanceof Fetchi) {
      return item.rawPromise()
    } else {
      return Promise.resolve(item);
    }
  })),
}};

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

fetchi.reject = <T>(value: any): Fetchi<T> => {
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

export type { AnyAsyncService, FetchiType, Adaptor, FetchResponse, Config };
export { FetchiError };
export default fetchi;