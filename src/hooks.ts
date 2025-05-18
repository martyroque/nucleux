import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { Atom, ReadOnlyAtomInterface } from './Atom';
import { Container } from './Container';
import { Store } from './Store';
import { StoreConstructable, StoreProxy } from './types';
import { getStoreProxy, isAtom } from './utils';

/**
 * Provides access to a Nucleux store instance.
 *
 * This hook retrieves a store instance from the container and ensures proper
 * cleanup when the component unmounts.
 *
 * @template S - The store type that extends the base Store class
 * @param {StoreConstructable<S>} store - The store class constructor
 * @returns {S} The store instance
 *
 * @example
 * // Define your store
 * class CounterStore extends Store {
 *   count = this.atom(0);
 *
 *   increment() {
 *     this.count.value++;
 *   }
 * }
 *
 * // Use the store in a component
 * function Counter() {
 *   const counterStore = useStore(CounterStore);
 *   const count = useValue(counterStore.count);
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={counterStore.increment}>Increment</button>
 *     </div>
 *   );
 * }
 */
function useStore<S extends Store>(store: StoreConstructable<S>): S {
  const container = Container.getInstance();

  const [getStore, cleanup] = useMemo(() => {
    const storeInstance = container.get(store);
    return [
      () => storeInstance,
      () => {
        return () => {
          container.remove(store);
        };
      },
    ];
  }, [store]);

  return useSyncExternalStore(cleanup, getStore);
}

/**
 * Subscribes to an atom's value and returns the current value.
 *
 * This hook creates a subscription to an atom and triggers re-renders
 * when the atom's value changes.
 *
 * @template V - The type of the atom's value
 * @param {ReadOnlyAtomInterface<V>} atom - The atom to subscribe to
 * @returns {V} The current value of the atom
 *
 * @example
 * // Using with an atom directly
 * const userStore = useStore(UserStore);
 * const username = useValue(userStore.username);
 */
function useValue<V>(atom: ReadOnlyAtomInterface<V>): V;

/**
 * Directly accesses an atom value from a store by key name.
 *
 * This overload allows accessing a specific atom from a store without
 * explicitly retrieving the store instance first.
 *
 * @template S - The store type that extends the base Store class
 * @template K - The key of the atom in the store
 * @param {StoreConstructable<S>} store - The store class constructor
 * @param {K} atomKey - The key of the atom to access
 * @returns {S[K] extends AtomInterface<infer V> ? V : never} The current value of the atom
 *
 * @example
 * // Direct access to an atom value
 * const username = useValue(UserStore, "username");
 * const isLoggedIn = useValue(UserStore, "isLoggedIn");
 */
function useValue<S extends Store, K extends keyof S>(
  store: StoreConstructable<S>,
  atomKey: K,
): S[K] extends ReadOnlyAtomInterface<infer V> ? V : never;

function useValue<V, S extends Store, K extends keyof S>(
  atomOrStore: ReadOnlyAtomInterface<V> | StoreConstructable<S>,
  atomKey?: K,
): V | (S[K] extends ReadOnlyAtomInterface<infer V> ? V : never) {
  if (isAtom(atomOrStore) && atomOrStore instanceof Atom) {
    const [getter, subscribe] = useMemo(() => {
      return [
        () => atomOrStore.value,
        (onStoreChange: () => void) => {
          const subId = atomOrStore.subscribe(onStoreChange);

          return () => {
            atomOrStore.unsubscribe(subId);
          };
        },
      ];
    }, [atomOrStore, atomKey]);

    return useSyncExternalStore(subscribe, getter);
  }

  if (atomKey !== undefined) {
    const [getter, subscribe] = useMemo(() => {
      const container = Container.getInstance();
      const storeInstance = container.get(atomOrStore as StoreConstructable<S>);

      const atom = storeInstance[atomKey];

      if (!isAtom(atom) || !(atom instanceof Atom)) {
        throw new Error(`Property "${String(atomKey)}" is not an atom`);
      }

      const typedAtom = atom as ReadOnlyAtomInterface<V>;

      return [
        () => typedAtom.value,
        (onStoreChange: () => void) => {
          const subId = typedAtom.subscribe(onStoreChange);

          return () => {
            typedAtom.unsubscribe(subId);
            // We're only using this atom, so can release the store reference
            container.remove(atomOrStore as StoreConstructable<S>);
          };
        },
      ];
    }, [atomOrStore, atomKey]);

    return useSyncExternalStore(subscribe, getter);
  }

  throw new Error('Invalid arguments to useValue');
}

/**
 * Provides access to all methods and state values from a Nucleux store in a single hook.
 *
 * This hook creates a reactive proxy to the store that automatically updates when any atom
 * in the store changes. It's designed for components that need access to multiple atoms
 * from the same store without having to use multiple hooks.
 *
 * @template S - The store type that extends the base Store class
 * @param {StoreConstructable<S>} store - The store class constructor
 * @returns {StoreProxy<S>} A proxy object containing both store methods and atom values
 *
 * @example
 * // Define your store
 * class CounterStore extends Store {
 *   count = this.atom(0);
 *
 *   increment() {
 *     this.count.value++;
 *   }
 *
 *   decrement() {
 *     this.count.value--;
 *   }
 * }
 *
 * // Use the store in a component
 * function Counter() {
 *   const counter = useNucleux(CounterStore);
 *
 *   // Access both methods and state directly
 *   return (
 *     <div>
 *       <p>Count: {counter.count}</p>
 *       <button onClick={counter.increment}>+</button>
 *       <button onClick={counter.decrement}>-</button>
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - This hook subscribes to all atoms in the store, so components will re-render on any state change.
 * - For more selective reactivity, consider using `useStore` with individual `useValue` hooks instead.
 * - Cannot directly modify atom values through the proxy; use store methods for state updates.
 */
function useNucleux<S extends Store>(
  store: StoreConstructable<S>,
): StoreProxy<S> {
  const container = Container.getInstance();

  const [getSnapshot, subscribe] = useMemo(() => {
    const storeInstance = container.get(store);

    let proxy = getStoreProxy(storeInstance);

    return [
      () => {
        return proxy as StoreProxy<S>;
      },
      (onStoreChange: () => void) => {
        for (const key in storeInstance) {
          const potentialAtom = storeInstance[key];
          if (isAtom(potentialAtom) && potentialAtom instanceof Atom) {
            // @ts-expect-error protected store method
            storeInstance.watchAtom(
              potentialAtom,
              () => {
                proxy = getStoreProxy(storeInstance);
                onStoreChange();
              },
              true,
            );
          }
        }

        return () => {
          container.remove(store);
        };
      },
    ];
  }, [store]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export { useNucleux, useStore, useValue };
