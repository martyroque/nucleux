import { nanoid } from 'nanoid';

import { Store } from '../Store';
import { generateStoreDefinition, getStoreProxy } from '../utils';

jest.mock('nanoid');

const mockStoreId = 'QAqQDsM9iwcMnZl7TyAnv';
jest.mocked(nanoid).mockReturnValue(mockStoreId);

describe('utils tests', () => {
  describe('generateStoreDefinition', () => {
    it('should generate a store definition', () => {
      class MockStore {
        destroy = jest.fn();
      }
      const storeDefinition = generateStoreDefinition(MockStore);

      expect(storeDefinition).toEqual({
        storeId: mockStoreId,
        storeClass: MockStore,
      });
    });
  });

  describe('getStoreProxy', () => {
    class TestStore extends Store {
      count = this.atom(5); // Initial value: 5

      increment() {
        this.count.value++;
      }
    }

    let store: TestStore;

    beforeEach(() => {
      store = new TestStore();
    });

    it('should return method functions', () => {
      const proxy = getStoreProxy(store);
      expect(typeof proxy.increment).toBe('function');
    });

    it('should return initial atom value', () => {
      const proxy = getStoreProxy(store);
      expect(proxy.count).toBe(5);
    });

    it('should return undefined for non-existent properties', () => {
      const proxy = getStoreProxy(store);
      expect((proxy as any).nonExistent).toBeUndefined();
    });

    it('should return current values in client mode after changes', () => {
      const proxy = getStoreProxy(store, false);

      store.count.value = 10;

      expect(proxy.count).toBe(10);
    });

    it('should return initial values in server mode even after changes', () => {
      const proxy = getStoreProxy(store, true);

      store.count.value = 10;

      expect(proxy.count).toBe(5);
    });

    it('should prevent setting values and log warning', () => {
      const proxy = getStoreProxy(store);

      expect(() => {
        (proxy as any).count = 99;
      }).toThrow('set');

      expect(store.count.value).toBe(5);
      expect(console.warn).toHaveBeenCalledWith(
        'Cannot modify store values directly. Use store methods instead.',
      );
    });
  });
});
