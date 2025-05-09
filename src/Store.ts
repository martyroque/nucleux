import autoBind from 'auto-bind';
import {
  Atom,
  AtomInterface,
  AtomOptions,
  ReadOnlyAtomInterface,
  SupportedStorage,
} from './Atom';
import { Injectable } from './Injectable';
import { StoreInterface } from './types';

type UnwrappedValue<T> = T extends ReadOnlyAtomInterface<infer R> ? R : T;

type UnwrappedValues<
  // The value types of the tuple can be anything
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Array<ReadOnlyAtomInterface<any>>,
> = {
  [P in keyof T]: UnwrappedValue<T[P]>;
};

abstract class Store extends Injectable implements StoreInterface {
  private subscriptions: Map<string, (subId: string) => boolean> = new Map();

  protected storage?: SupportedStorage;

  constructor() {
    super();
    autoBind(this);
  }

  protected atom<V>(
    initialValue: V,
    persistKey?: string,
    options?: AtomOptions,
  ): AtomInterface<V> {
    const atomOptions = options ?? (this.storage && { storage: this.storage });

    return new Atom(initialValue, persistKey, atomOptions);
  }

  protected watchAtom<V>(
    atom: ReadOnlyAtomInterface<V>,
    callback: (value: V) => void,
  ): void {
    const subId = atom.subscribe(callback);

    this.subscriptions.set(subId, atom.unsubscribe);
  }

  protected deriveAtom<
    V,
    // The value types of the tuple can be anything
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    A extends ReadOnlyAtomInterface<any>[] | [],
  >(
    sourceAtoms: A,
    transformer: (...args: UnwrappedValues<A>) => V,
  ): ReadOnlyAtomInterface<V> {
    function getDerivedValue(): V {
      const values = sourceAtoms.map((atom) => {
        return atom.value;
      });

      return transformer(...(values as UnwrappedValues<A>));
    }

    const derivedAtom = new Atom(getDerivedValue());

    function computedValueCallback() {
      const newComputedValue = getDerivedValue();

      derivedAtom.value = newComputedValue;
    }

    sourceAtoms.forEach((atom) => {
      this.watchAtom(atom, computedValueCallback);
    });

    return derivedAtom;
  }

  public destroy(): void {
    for (const [subId, unsubscribe] of this.subscriptions) {
      unsubscribe(subId);
      this.subscriptions.delete(subId);
    }

    super.destroy();
  }
}

export { Store };
