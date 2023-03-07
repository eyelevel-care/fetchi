import { Fetchi } from './fetchi';
import { SharedGlobalVariable } from './configs/globals';
import { Config } from './types/configs';

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

fetchi.race = <T>(values: Array<Fetchi<T>>) => ({
  cancel: () => {
    values.forEach((element) => element.cancel());
  },
  retry: () => {
    values.forEach((element) => element.retry());
  },
  promise: Promise.race(values.map((item) => item.rawPromise())),
});

export default fetchi;
