import autoBind from 'auto-bind';
import {
  Atom,
  AtomInterface,
  AtomMemoizationOptions,
  AtomOptions,
  ReadOnlyAtomInterface,
  SupportedStorage,
} from './Atom';
import { logAtomChange } from './debug-utils';
import { Injectable } from './Injectable';
import { StoreInterface } from './types';
import { isAtom } from './utils';

type UnwrappedValue<T> = T extends ReadOnlyAtomInterface<infer R> ? R : T;

type UnwrappedValues<
  // The value types of the tuple can be anything
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Array<ReadOnlyAtomInterface<any>>,
> = {
  [P in keyof T]: UnwrappedValue<T[P]>;
};

interface StoreResetOptions {
  resetValues?: boolean;
  clearPersisted?: boolean;
  atomKeys?: string[];
}

abstract class Store extends Injectable implements StoreInterface {
  private subscriptions: Map<string, (subId: string) => boolean> = new Map();

  protected storage?: SupportedStorage;

  constructor() {
    super();
    autoBind(this);
  }

  protected atom<V>(
    initialValue: V,
    options?: AtomOptions<V>,
  ): AtomInterface<V> {
    let atomOptions = options;

    if (options?.persistence && !options.persistence.storage && this.storage) {
      atomOptions = {
        ...options,
        persistence: {
          ...options.persistence,
          storage: this.storage,
        },
      };
    }

    return new Atom(initialValue, atomOptions);
  }

  protected watchAtom<V>(
    atom: ReadOnlyAtomInterface<V>,
    callback: (value: V, previousValue?: V) => void,
    immediate = false,
  ): void {
    const subId = atom.subscribe(callback, immediate);

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
    memoization?: AtomMemoizationOptions<V>,
  ): ReadOnlyAtomInterface<V> {
    function getDerivedValue(): V {
      const values = sourceAtoms.map((atom) => {
        return atom.value;
      });

      return transformer(...(values as UnwrappedValues<A>));
    }

    const derivedAtom = new Atom(getDerivedValue(), { memoization });

    function computedValueCallback() {
      const newComputedValue = getDerivedValue();

      derivedAtom.value = newComputedValue;
    }

    sourceAtoms.forEach((atom) => {
      this.watchAtom(atom, computedValueCallback);
    });

    return derivedAtom;
  }

  public enableDebug(): void {
    console.log(
      `Nucleux debugging enabled for store: ${this.constructor.name}`,
    );

    for (const key in this) {
      const potentialAtom = this[key as keyof typeof this];
      if (isAtom(potentialAtom) && potentialAtom instanceof Atom) {
        this.watchAtom(potentialAtom, (newValue, previousValue) => {
          logAtomChange({
            storeName: this.constructor.name,
            atomName: key,
            newValue,
            previousValue,
            timestamp: Date.now(),
          });
        });
      }
    }
  }

  public async reset(options: StoreResetOptions = {}): Promise<void> {
    const { resetValues = true, clearPersisted = true, atomKeys } = options;

    const resetPromises: Promise<void>[] = [];

    for (const key in this) {
      const potentialAtom = this[key];

      if (isAtom(potentialAtom) && potentialAtom instanceof Atom) {
        if (atomKeys && !atomKeys.includes(key)) {
          continue;
        }

        resetPromises.push(
          potentialAtom.reset({ resetValue: resetValues, clearPersisted }),
        );
      }
    }

    await Promise.allSettled(resetPromises);
  }

  public async clearPersistedData(): Promise<void> {
    return this.reset({ resetValues: false, clearPersisted: true });
  }

  public async resetValues(): Promise<void> {
    return this.reset({ resetValues: true, clearPersisted: false });
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
