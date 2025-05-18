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
    it('should return a new value instance', () => {
      const atom = mockSubStore.testValue;

      expect(atom.value).toBe(1);
      expect(atom).toBeInstanceOf(Atom);
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
  });
});
