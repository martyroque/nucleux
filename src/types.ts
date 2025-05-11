import { AtomInterface } from './Atom';

type StoreProxyAtoms<S> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [K in keyof S as S[K] extends AtomInterface<any>
    ? K
    : never]: S[K] extends AtomInterface<infer T> ? T : never;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

type StoreProxyMethods<S> = {
  readonly [K in keyof S as S[K] extends AnyFunction ? K : never]: S[K];
};

interface StoreInterface {
  destroy?: () => void;
}

type StoreProxy<S> = StoreProxyAtoms<S> & StoreProxyMethods<S>;

interface StoreConstructable<T> {
  new (...args: unknown[]): T & StoreInterface;
}

type StoreDefinition<S> = {
  storeId: string;
  storeClass: StoreConstructable<S>;
};

export {
  AnyFunction,
  StoreConstructable,
  StoreDefinition,
  StoreInterface,
  StoreProxy,
  StoreProxyAtoms,
};
