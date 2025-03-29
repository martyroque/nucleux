import { nanoid } from 'nanoid';

import { StoreConstructable, StoreDefinition } from './types';

function generateStoreDefinition<S>(
  storeClass: StoreConstructable<S>,
): StoreDefinition<S> {
  return {
    storeId: nanoid(),
    storeClass,
  };
}

export { generateStoreDefinition };
