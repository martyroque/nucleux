import { Container } from '../Container';
import { Store } from '../Store';
import { Value } from '../Value';

const storeContainer = Container.getInstance();

class MockSubStore {
  testValue = new Value(1);
  boolValue = new Value(false);
  stringValue = new Value<string | undefined>(undefined);
}

const mockSubscribeCallback = jest.fn();

class MockStore extends Store {
  public subStore = this.inject(MockSubStore);

  public computed = this.computedValue(
    [this.subStore.boolValue, this.subStore.stringValue],
    (boolValue, stringValue) => {
      return boolValue && stringValue === 'TEST';
    },
  );

  constructor() {
    super();
    this.subscribeToStoreValue(this.subStore.testValue, mockSubscribeCallback);
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

  describe('subscribeToStoreValue', () => {
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

  describe('computedValue', () => {
    it('should return initial computed value', () => {
      expect(mockStore.computed.value).toBe(false);
    });

    it('should return updated computed value', () => {
      mockSubStore.boolValue.value = true;
      mockSubStore.stringValue.value = 'TEST';

      expect(mockStore.computed.value).toBe(true);
    });

    it('should not update computed value when main store is removed', () => {
      mockSubStore.boolValue.value = false;
      mockSubStore.stringValue.value = undefined;

      storeContainer.remove(MockStore);

      mockSubStore.boolValue.value = true;
      mockSubStore.stringValue.value = 'TEST';

      expect(mockStore.computed.value).toBe(false);
    });
  });
});
