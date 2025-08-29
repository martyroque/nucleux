import isEqual from 'fast-deep-equal/es6';
import { nanoid } from 'nanoid';

interface AtomResetOptions {
  resetValue?: boolean;
  clearPersisted?: boolean;
}

interface ReadOnlyAtomInterface<V> {
  readonly value: V;
  readonly initialValue: V;
  subscribe: (
    callback: (value: V, previousValue?: V) => void,
    immediate?: boolean,
  ) => string;
  unsubscribe: (subId: string) => boolean;
}

interface AtomInterface<V> extends ReadOnlyAtomInterface<V> {
  value: V;
  reset(options?: AtomResetOptions): Promise<void>;
}

type Subscriber<V> = {
  callback: (value: V, previousValue?: V) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;
type MaybePromisify<T> = T | Promise<T>;

type PromisifyMethods<T> = {
  [K in keyof T]: T[K] extends AnyFunction
    ? (...args: Parameters<T[K]>) => MaybePromisify<ReturnType<T[K]>>
    : T[K];
};

export type SupportedStorage = PromisifyMethods<
  Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
>;

export interface AtomMemoizationOptions<V> {
  type: 'shallow' | 'deep' | 'custom';
  compare?: (a: V, b: V) => boolean;
}

export interface AtomPersistenceOptions {
  persistKey: string;
  storage?: SupportedStorage;
}

export interface AtomOptions<V> {
  persistence?: AtomPersistenceOptions;
  memoization?: AtomMemoizationOptions<V>;
}

class Atom<V> implements AtomInterface<V> {
  private _value: V;
  private _initialValue: V;
  private subscribers: Map<string, Subscriber<V>> = new Map();
  private persistence?: AtomPersistenceOptions;
  private memoization?: AtomMemoizationOptions<V>;

  constructor(initialValue: V, options?: AtomOptions<V>) {
    this._value = initialValue;
    this._initialValue = initialValue;
    this.persistence = options?.persistence;
    this.memoization = options?.memoization;

    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);

    this.hydrate();
  }

  private async hydrate() {
    if (this.persistence) {
      const { persistKey, storage = localStorage } = this.persistence;
      const rawPersistedValue = await storage.getItem(persistKey);

      if (rawPersistedValue) {
        try {
          const persistedValue: V = JSON.parse(rawPersistedValue);
          this.value = persistedValue;
        } catch (error) {
          console.error(
            `Could not parse value ${rawPersistedValue} for ${persistKey}. Error:`,
            error,
          );
        }
      } else {
        // fire-and-forget
        storage.setItem(persistKey, JSON.stringify(this.value));
      }
    }
  }

  private shouldSkipUpdate(newValue: V): boolean {
    const { type, compare } = this.memoization || { type: 'shallow' };

    if (type === 'deep') {
      return isEqual(newValue, this.value);
    }

    if (type === 'custom') {
      return compare ? compare(newValue, this.value) : newValue === this.value;
    }

    return newValue === this.value;
  }

  private notifySubscribers(newValue: V, previousValue: V): void {
    for (const [, subscriber] of this.subscribers) {
      try {
        if (subscriber.callback.length === 2) {
          subscriber.callback(newValue, previousValue);
        } else {
          subscriber.callback(newValue);
        }
      } catch (error) {
        console.error('Error in atom subscriber:', error);
      }
    }
  }

  public get initialValue(): V {
    return this._initialValue;
  }

  public get value(): V {
    return this._value;
  }

  public set value(newValue: V) {
    if (this.shouldSkipUpdate(newValue)) {
      return;
    }

    const previousValue = this._value;
    this._value = newValue;

    if (newValue !== undefined && this.persistence) {
      const { persistKey, storage = localStorage } = this.persistence;
      // fire-and-forget
      storage.setItem(persistKey, JSON.stringify(newValue));
    }

    this.notifySubscribers(newValue, previousValue);
  }

  public subscribe(
    callback: (value: V, previousValue?: V) => void,
    immediate = false,
  ) {
    const subId = nanoid();

    this.subscribers.set(subId, { callback });

    if (immediate) {
      callback(this.value);
    }

    return subId;
  }

  public unsubscribe(subId: string) {
    if (!this.subscribers.has(subId)) {
      console.warn(`Subscriber ${subId} not found`);
      return false;
    }

    return this.subscribers.delete(subId);
  }

  public async reset(options: AtomResetOptions = {}) {
    const { resetValue = true, clearPersisted = true } = options;

    if (clearPersisted && this.persistence) {
      const { persistKey, storage = localStorage } = this.persistence;
      try {
        await storage.removeItem(persistKey);
      } catch (error) {
        console.error(
          `Failed to clear persisted data for key ${persistKey}:`,
          error,
        );
      }
    }

    if (resetValue) {
      const previousValue = this._value;
      this._value = this._initialValue;
      this.notifySubscribers(this._initialValue, previousValue);
    }
  }
}

export { Atom, AtomInterface, ReadOnlyAtomInterface };
