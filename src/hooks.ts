import { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { Container } from './Container';
import { StoreConstructable } from './types';
import { ReadOnlyValueInterface } from './Value';

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

function useValue<V>(storeValue: ReadOnlyValueInterface<V>): V {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const subId = storeValue.subscribe(onStoreChange);

    return () => {
      storeValue.unsubscribe(subId);
    };
  }, []);
  const getter = useCallback(() => storeValue.value, [storeValue.value]);

  return useSyncExternalStore(subscribe, getter);
}

export { useStore, useValue };
