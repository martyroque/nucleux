import { Atom } from '../Atom';
import { Container } from '../Container';
import { Store } from '../Store';

const storeContainer = Container.getInstance();

class MockSubStore extends Store {
  testValue = this.atom(1);
  boolValue = this.atom(false);
  stringValue = this.atom<string | undefined>(undefined);
}

const mockSubscribeCallback = jest.fn();
const mockSubscribeImmediateCallback = jest.fn();
const mockStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
};

class MockStore extends Store {
  public subStore = this.inject(MockSubStore);

  public derived = this.deriveAtom(
    [this.subStore.boolValue, this.subStore.stringValue],
    (boolValue, stringValue) => {
      return boolValue && stringValue === 'TEST';
    },
  );

  constructor() {
    super();
    this.watchAtom(this.subStore.testValue, mockSubscribeCallback);
    this.watchAtom(
      this.subStore.testValue,
      mockSubscribeImmediateCallback,
      true,
    );
  }

  public getDerived() {
    return this.derived.value;
  }
}

describe('Store tests', () => {
  let mockStore: MockStore;
  let mockSubStore: MockSubStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = storeContainer.get(MockStore);
    mockSubStore = storeContainer.get(MockSubStore);
  });

  afterEach(() => {
    storeContainer.remove(MockStore);
  });

  describe('autoBind', () => {
    it('should automatically bind store methods', () => {
      const getDerived = mockStore.getDerived;

      expect(getDerived()).toBe(false);
    });
  });

  describe('atom', () => {
    it('should return a new atom instance', () => {
      const atom = mockSubStore.testValue;

      expect(atom.value).toBe(1);
      expect(atom).toBeInstanceOf(Atom);
    });

    describe('with options', () => {
      describe('memoization', () => {
        it('should prevent unnecessary updates with deep memoization', () => {
          const callback = jest.fn();

          class TestStore extends Store {
            user = this.atom(
              { name: 'John', age: 30 },
              { memoization: { type: 'deep' } },
            );

            constructor() {
              super();
              this.watchAtom(this.user, callback);
            }
          }

          const store = storeContainer.get(TestStore);

          store.user.value = { name: 'John', age: 30 };
          expect(callback).not.toHaveBeenCalled();

          store.user.value = { name: 'Jane', age: 30 };
          expect(callback).toHaveBeenCalledWith({ name: 'Jane', age: 30 });

          storeContainer.remove(TestStore);
        });

        it('should use custom comparator for memoization', () => {
          const callback = jest.fn();

          class TestStore extends Store {
            user = this.atom(
              { name: 'John', age: 30 },
              {
                memoization: {
                  type: 'custom',
                  compare: (a, b) => a.name === b.name,
                },
              },
            );

            constructor() {
              super();
              this.watchAtom(this.user, callback);
            }
          }

          const store = storeContainer.get(TestStore);

          store.user.value = { name: 'John', age: 35 };
          expect(callback).not.toHaveBeenCalled();

          store.user.value = { name: 'Jane', age: 35 };
          expect(callback).toHaveBeenCalledWith({ name: 'Jane', age: 35 });

          storeContainer.remove(TestStore);
        });
      });

      describe('persistence', () => {
        beforeEach(() => {
          jest.clearAllMocks();
        });

        it('should not apply store storage to atoms without persistence', () => {
          class StoreWithStorage extends Store {
            storage = mockStorage;
            regularAtom = this.atom('no-persistence');
          }

          const store = storeContainer.get(StoreWithStorage);

          expect(store.regularAtom.value).toBe('no-persistence');
          expect(mockStorage.setItem).not.toHaveBeenCalled();

          storeContainer.remove(StoreWithStorage);
        });

        it('should use store storage as default for persisted atoms', async () => {
          class StoreWithStorage extends Store {
            storage = mockStorage;
            persistedAtom = this.atom('with-persistence', {
              persistence: { persistKey: 'store-storage-key' },
            });
          }

          storeContainer.get(StoreWithStorage);

          await new Promise(process.nextTick);

          expect(mockStorage.setItem).toHaveBeenCalledWith(
            'store-storage-key',
            JSON.stringify('with-persistence'),
          );

          storeContainer.remove(StoreWithStorage);
        });

        it('should allow atom to override store storage', async () => {
          const atomCustomStorage = {
            setItem: jest.fn(),
            getItem: jest.fn(),
            removeItem: jest.fn(),
          };
          class StoreWithStorage extends Store {
            storage = mockStorage;
            customStorageAtom = this.atom('custom-override', {
              persistence: {
                persistKey: 'override-key',
                storage: atomCustomStorage,
              },
            });
          }

          storeContainer.get(StoreWithStorage);

          await new Promise(process.nextTick);

          expect(atomCustomStorage.setItem).toHaveBeenCalledWith(
            'override-key',
            JSON.stringify('custom-override'),
          );

          storeContainer.remove(StoreWithStorage);
        });
      });
    });
  });

  describe('watchAtom', () => {
    it('should receive value immediately upon subscribe', () => {
      expect(mockSubscribeImmediateCallback).toHaveBeenCalledWith(1);
    });

    it('should subscribe to any store value', () => {
      mockSubStore.testValue.value = 2;

      expect(mockSubscribeCallback).toHaveBeenCalledWith(2);
    });

    it('should unsubscribe from all values when main store is removed', () => {
      storeContainer.remove(MockStore);

      mockSubStore.testValue.value = 2;

      expect(mockSubscribeCallback).not.toHaveBeenCalled();
    });
  });

  describe('deriveAtom', () => {
    it('should return initial derived value', () => {
      expect(mockStore.derived.value).toBe(false);
    });

    it('should return updated derived value', () => {
      mockSubStore.boolValue.value = true;
      mockSubStore.stringValue.value = 'TEST';

      expect(mockStore.derived.value).toBe(true);
    });

    it('should not update computed value when main store is removed', () => {
      mockSubStore.boolValue.value = false;
      mockSubStore.stringValue.value = undefined;

      storeContainer.remove(MockStore);

      mockSubStore.boolValue.value = true;
      mockSubStore.stringValue.value = 'TEST';

      expect(mockStore.derived.value).toBe(false);
    });

    describe('with memoization', () => {
      it('should prevent unnecessary updates with deep memoization', () => {
        const callback = jest.fn();

        class TestStore extends Store {
          items = this.atom([{ id: 1, name: 'Item 1' }]);

          // Derived atom that returns a new object each time
          itemSummary = this.deriveAtom(
            [this.items],
            (items) => ({
              count: items.length,
              names: items.map((i) => i.name),
            }),
            { type: 'deep' },
          );

          constructor() {
            super();
            this.watchAtom(this.itemSummary, callback);
          }
        }

        const store = storeContainer.get(TestStore);

        // Same items array - derived value content should be the same
        store.items.value = [{ id: 1, name: 'Item 1' }];

        // Should not trigger callback due to deep equality
        expect(callback).not.toHaveBeenCalled();

        // Different content - should trigger
        store.items.value = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ];
        expect(callback).toHaveBeenCalledWith({
          count: 2,
          names: ['Item 1', 'Item 2'],
        });

        storeContainer.remove(TestStore);
      });

      it('should use custom comparator for derived atoms', () => {
        const callback = jest.fn();

        class TestStore extends Store {
          count = this.atom(5);

          // Only care about whether count is positive/negative, ignore exact value
          countStatus = this.deriveAtom(
            [this.count],
            (count) => ({ isPositive: count > 0, value: count }),
            {
              type: 'custom',
              compare: (a, b) => a.isPositive === b.isPositive,
            },
          );

          constructor() {
            super();
            this.watchAtom(this.countStatus, callback);
          }
        }

        const store = storeContainer.get(TestStore);

        // Still positive, should not notify
        store.count.value = 10;
        expect(callback).not.toHaveBeenCalled();

        // Changed from positive to negative, should notify
        store.count.value = -1;
        expect(callback).toHaveBeenCalledWith({ isPositive: false, value: -1 });

        storeContainer.remove(TestStore);
      });
    });
  });

  describe('Store Reset', () => {
    class ResetTestStore extends Store {
      persistedAtom1 = this.atom('default1', {
        persistence: { persistKey: 'key1', storage: mockStorage },
      });

      persistedAtom2 = this.atom('default2', {
        persistence: { persistKey: 'key2', storage: mockStorage },
      });

      nonPersistedAtom = this.atom('default3');
    }
    let testStore: ResetTestStore;

    beforeEach(() => {
      jest.clearAllMocks();
      testStore = storeContainer.get(ResetTestStore);
    });

    afterEach(() => {
      storeContainer.remove(ResetTestStore);
    });

    it('should reset all atoms in store', async () => {
      testStore.persistedAtom1.value = 'changed1';
      testStore.persistedAtom2.value = 'changed2';
      testStore.nonPersistedAtom.value = 'changed3';

      await testStore.reset();

      expect(testStore.persistedAtom1.value).toBe('default1');
      expect(testStore.persistedAtom2.value).toBe('default2');
      expect(testStore.nonPersistedAtom.value).toBe('default3');

      expect(mockStorage.removeItem).toHaveBeenCalledWith('key1');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key2');
    });

    it('should reset only specified atoms', async () => {
      testStore.persistedAtom1.value = 'changed1';
      testStore.persistedAtom2.value = 'changed2';

      await testStore.reset({ atomKeys: ['persistedAtom1'] });

      expect(testStore.persistedAtom1.value).toBe('default1');
      expect(testStore.persistedAtom2.value).toBe('changed2');

      expect(mockStorage.removeItem).toHaveBeenCalledWith('key1');
      expect(mockStorage.removeItem).not.toHaveBeenCalledWith('key2');
    });

    it('should not reset anything for non-existent atom', async () => {
      const store = new ResetTestStore();

      store.persistedAtom1.value = 'changed1';
      store.persistedAtom2.value = 'changed2';

      await store.reset({ atomKeys: ['nonExistentAtom'] });

      expect(store.persistedAtom1.value).toBe('changed1');
      expect(store.persistedAtom2.value).toBe('changed2');
    });

    it('should clear persisted data without resetting values', async () => {
      testStore.persistedAtom1.value = 'changed1';
      testStore.persistedAtom2.value = 'changed2';

      await testStore.clearPersistedData();

      expect(testStore.persistedAtom1.value).toBe('changed1');
      expect(testStore.persistedAtom2.value).toBe('changed2');

      expect(mockStorage.removeItem).toHaveBeenCalledWith('key1');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key2');
    });

    it('should reset values without clearing persisted data', async () => {
      testStore.persistedAtom1.value = 'changed1';
      testStore.persistedAtom2.value = 'changed2';

      await testStore.resetValues();

      expect(testStore.persistedAtom1.value).toBe('default1');
      expect(testStore.persistedAtom2.value).toBe('default2');

      expect(mockStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
