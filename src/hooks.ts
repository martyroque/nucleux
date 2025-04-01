import { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { ReadOnlyAtomInterface } from './Atom';
import { Container } from './Container';
import { StoreConstructable } from './types';

function useStore<S>(store: StoreConstructable<S>): S {
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
  }, []);

  return useSyncExternalStore(cleanup, getStore);
}

function useValue<V>(atom: ReadOnlyAtomInterface<V>): V {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const subId = atom.subscribe(onStoreChange);

    return () => {
      atom.unsubscribe(subId);
    };
  }, []);

  const getter = useCallback(() => atom.value, [atom.value]);

  return useSyncExternalStore(subscribe, getter);
}

export { useStore, useValue };
