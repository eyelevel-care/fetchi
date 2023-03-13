import { Cancelable } from './cancelable';
import { Config } from './configs';
import { FetchiError } from './error';
import { FetchResponse } from './response';
import { Retriable } from './retriable';

export interface AnyAsyncService<T> extends Cancelable, Retriable {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: (value: T) => T | TResult1 | PromiseLike<TResult1> | AnyAsyncService<TResult1> | null | undefined,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2> | AnyAsyncService<TResult2> | null | undefined,
  ): AnyAsyncService<TResult1 | TResult2>;
  rawPromise(): Promise<FetchResponse<T>>;
  catch<TResult = never>(
    onrejected?: (reason: any) => (TResult | Promise<TResult>) | undefined | null,
  ): AnyAsyncService<T | TResult>;
  finally(onfinally?: (() => void) | undefined | null): this;
}

export interface FetchiType<T> extends AnyAsyncService<T> {
  config: Config;

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: (value: T) => T | TResult1 | PromiseLike<TResult1> | FetchiType<TResult1> | null | undefined,
    onrejected?: (reason: FetchiError) => TResult2 | PromiseLike<TResult2> | FetchiType<TResult2> | null | undefined,
  ): FetchiType<TResult1 | TResult2>;
  rawPromise(): Promise<FetchResponse<T>>;
  catch<TResult = never>(
    onrejected?: (reason: FetchiError) => (TResult | Promise<TResult>) | undefined | null,
  ): FetchiType<T | TResult>;
  finally(onfinally?: (() => void) | undefined | null): this;
  fullResponse<TResult1 = T, TResult2 = never>(
    onfulfilled?: (
      value: FetchResponse<T>,
    ) => T | TResult1 | PromiseLike<TResult1> | FetchiType<TResult1> | null | undefined,
    onrejected?: (reason: FetchiError) => TResult2 | PromiseLike<TResult2> | FetchiType<TResult2> | null | undefined,
  ): FetchiType<TResult1 | TResult2>;
}
