import { nanoid } from 'nanoid';

import { Atom, AtomInterface } from './Atom';
import { Store } from './Store';
import { AnyFunction, StoreConstructable, StoreDefinition } from './types';

function isAtom<T>(obj: unknown): obj is AtomInterface<T> {
  return obj != null && typeof obj === 'object' && 'value' in obj;
}

function isFunction(obj: unknown): obj is AnyFunction {
  return typeof obj === 'function';
}

function generateStoreDefinition<S>(
  storeClass: StoreConstructable<S>,
): StoreDefinition<S> {
  return {
    storeId: nanoid(),
    storeClass,
  };
}

function getStoreProxy<S extends Store>(storeInstance: S) {
  return new Proxy(storeInstance, {
    get(_, prop): unknown {
      const key = prop.toString();

      if (Object.prototype.hasOwnProperty.call(storeInstance, key)) {
        const value = storeInstance[key as keyof S];

        // Check for method first
        if (isFunction(value)) {
          return value.bind(storeInstance);
        }

        // Then check for atom
        if (isAtom(value) && value instanceof Atom) {
          return value.value;
        }
      }

      return undefined;
    },
    set(): boolean {
      console.warn(
        'Cannot modify store values directly. Use store methods instead.',
      );
      return false;
    },
  });
}

export { generateStoreDefinition, getStoreProxy, isAtom };
