interface StoreInterface {
  destroy?: () => void;
}

interface StoreConstructable<T> {
  new (...args: unknown[]): T & StoreInterface;
}

type StoreDefinition<S> = {
  storeId: string;
  storeClass: StoreConstructable<S>;
};

export { StoreConstructable, StoreDefinition, StoreInterface };
