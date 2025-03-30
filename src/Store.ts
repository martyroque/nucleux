import autoBind from 'auto-bind';
import { Injectable } from './Injectable';
import { ReadOnlyValueInterface, Value, ValueInterface } from './Value';
import { StoreInterface } from './types';

type UnwrappedValue<T> = T extends ReadOnlyValueInterface<infer R> ? R : T;

type UnwrappedValues<
  // The value types of the tuple can be anything
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Array<ReadOnlyValueInterface<any>>,
> = {
  [P in keyof T]: UnwrappedValue<T[P]>;
};

abstract class Store extends Injectable implements StoreInterface {
  private subscriptions: Map<string, (subId: string) => boolean> = new Map();

  constructor() {
    super();
    autoBind(this);
  }

  protected value<V>(val: V): ValueInterface<V> {
    return new Value(val);
  }

  protected subscribeToValue<V>(
    storeValue: ReadOnlyValueInterface<V>,
    callback: (value: V) => void,
  ): void {
    const subId = storeValue.subscribe(callback);

    this.subscriptions.set(subId, storeValue.unsubscribe);
  }

  protected computedValue<
    V,
    // The value types of the tuple can be anything
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    A extends ReadOnlyValueInterface<any>[] | [],
  >(
    storeValues: A,
    callback: (...args: UnwrappedValues<A>) => V,
  ): ReadOnlyValueInterface<V> {
    function getComputedValue(): V {
      const values = storeValues.map((storeValue) => {
        return storeValue.value;
      });

      return callback(...(values as UnwrappedValues<A>));
    }

    const computedValue = new Value(getComputedValue());

    function computedValueCallback() {
      const newComputedValue = getComputedValue();

      computedValue.value = newComputedValue;
    }

    storeValues.forEach((storeValue) => {
      this.subscribeToValue(storeValue, computedValueCallback);
    });

    return computedValue;
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
