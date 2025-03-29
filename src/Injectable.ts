import { Container } from './Container';
import { StoreConstructable, StoreDefinition } from './types';

abstract class Injectable {
  private injectedStores: Map<string, StoreDefinition<unknown>> = new Map();
  private storeContainer = Container.getInstance();

  protected inject<S>(store: StoreConstructable<S>): S {
    const storeDefinition = this.storeContainer.getStoreDefinition(store);

    this.injectedStores.set(storeDefinition.storeId, storeDefinition);

    return this.storeContainer.get(store);
  }

  public destroy(): void {
    for (const [, injectedStore] of this.injectedStores) {
      this.storeContainer.remove(injectedStore.storeClass);
    }
  }
}

export { Injectable };
