import { Cancelable } from './cancelable';
import { Config } from './configs';
import { FetchiError } from './error';
import { FetchResponse } from './response';
import { Retriable } from './retriable';

export interface FetchiType<T> extends Cancelable, Retriable {
  config: Config;

  fullResponse<TResult1 = T, TResult2 = never>(
    onfulfilled?: (
      value: FetchResponse<T>,
    ) => (T | TResult1 | PromiseLike<TResult1> | ThisType<TResult1>) | undefined | null,
    onrejected?: (reason: FetchiError) => (TResult2 | PromiseLike<TResult2> | ThisType<TResult2>) | undefined | null,
  ): ThisType<TResult1 | TResult2>;

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: (value: T) => (T | TResult1 | PromiseLike<TResult1> | ThisType<TResult1>) | undefined | null,
    onrejected?: (reason: FetchiError) => (TResult2 | PromiseLike<TResult2> | ThisType<TResult2>) | undefined | null,
  ): ThisType<TResult1 | TResult2>;
  rawPromise(): Promise<FetchResponse<T>>;
  catch<TResult = never>(
    onrejected?: (reason: FetchiError) => (TResult | Promise<TResult>) | undefined | null,
  ): ThisType<T | TResult>;
  finally(onfinally?: (() => void) | undefined | null): ThisType<T>;
}
