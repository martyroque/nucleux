import { nanoid } from 'nanoid';

interface ReadOnlyAtomInterface<V> {
  readonly value: V;
  subscribe: (callback: (value: V) => void) => string;
  unsubscribe: (subId: string) => boolean;
}

interface AtomInterface<V> extends ReadOnlyAtomInterface<V> {
  value: V;
}

type Subscriber<V> = {
  callback: (value: V) => void;
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
  Pick<Storage, 'getItem' | 'setItem'>
>;

export type AtomOptions = {
  storage: SupportedStorage;
};

class Atom<V> implements AtomInterface<V> {
  private _value: V;
  private subscribers: Map<string, Subscriber<V>> = new Map();
  private persistKey?: string;
  private storage?: SupportedStorage;

  constructor(initialValue: V, persistKey?: string, options?: AtomOptions) {
    this._value = initialValue;
    this.persistKey = persistKey;

    if (persistKey) {
      this.storage = options?.storage || localStorage;
    }

    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);

    this.hydrate();
  }

  private async hydrate() {
    if (this.persistKey && this.storage) {
      const rawPersistedValue = await this.storage.getItem(this.persistKey);

      if (rawPersistedValue) {
        try {
          const persistedValue: V = JSON.parse(rawPersistedValue);

          this.value = persistedValue;
        } catch (error) {
          console.error(
            `Could not parse value ${rawPersistedValue} for ${this.persistKey}. Error:`,
            error,
          );
        }
      } else {
        // fire-and-forget
        this.storage.setItem(this.persistKey, JSON.stringify(this.value));
      }
    }
  }

  public get value(): V {
    return this._value;
  }

  public set value(newValue: V) {
    if (newValue === this.value) {
      return;
    }

    this._value = newValue;

    if (newValue !== undefined && this.persistKey && this.storage) {
      // fire-and-forget
      this.storage.setItem(this.persistKey, JSON.stringify(newValue));
    }

    for (const [, subscriber] of this.subscribers) {
      subscriber.callback(this.value);
    }
  }

  public subscribe(callback: (value: V) => void) {
    const subId = nanoid();

    this.subscribers.set(subId, { callback });

    return subId;
  }

  public unsubscribe(subId: string) {
    if (!this.subscribers.has(subId)) {
      console.warn(`Subscriber ${subId} not found`);
      return false;
    }

    return this.subscribers.delete(subId);
  }
}

export { Atom, AtomInterface, ReadOnlyAtomInterface };
