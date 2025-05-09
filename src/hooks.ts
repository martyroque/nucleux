import { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { Atom, AtomInterface, ReadOnlyAtomInterface } from './Atom';
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
 * // Using with a store
 * function UserProfile() {
 *   const userStore = useStore(UserStore);
 *   const username = useValue(userStore.username);
 *   const isLoggedIn = useValue(userStore.isLoggedIn);
 *
 *   if (!isLoggedIn) {
 *     return <LoginForm />;
 *   }
 *
 *   return <div>Welcome, {username}!</div>;
 * }
 *
 * @remarks
 * - For better performance, only use this hook for the specific atoms you need in a component.
 * - To access multiple atoms efficiently, consider using them individually or use `useNucleux`.
 */
function useValue<V>(atom: ReadOnlyAtomInterface<V>): V {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const subId = atom.subscribe(onStoreChange);

      return () => {
        atom.unsubscribe(subId);
      };
    },
    [atom],
  );

  const getter = useCallback(() => atom.value, [atom.value]);

  return useSyncExternalStore(subscribe, getter);
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
    const atomsToWatch: Map<string, AtomInterface<unknown>> = new Map();

    for (const key in storeInstance) {
      if (Object.prototype.hasOwnProperty.call(storeInstance, key)) {
        const potentialAtom = storeInstance[key];
        if (isAtom(potentialAtom) && potentialAtom instanceof Atom) {
          atomsToWatch.set(key, potentialAtom);
        }
      }
    }

    let proxy = getStoreProxy(storeInstance);

    return [
      () => {
        return proxy as StoreProxy<S>;
      },
      (onStoreChange: () => void) => {
        for (const [, atom] of atomsToWatch) {
          // @ts-expect-error protected store method
          storeInstance.watchAtom(atom, () => {
            proxy = getStoreProxy(storeInstance);
            onStoreChange();
          });
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
