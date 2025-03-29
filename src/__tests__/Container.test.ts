import { Container } from '../Container';

const mockDestroy = jest.fn();

class MockStore {
  destroy = mockDestroy;
}

const storeContainer = Container.getInstance();

describe('Container tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    storeContainer.remove(MockStore);
  });

  describe('get store', () => {
    it('should not have store definition initially', () => {
      expect('getStoreDefinition' in MockStore.prototype).toBe(false);
    });

    it('should generate store definition', () => {
      storeContainer.get(MockStore);

      expect('getStoreDefinition' in MockStore.prototype).toBe(true);
    });

    it('should return the same store definition', () => {
      const prevStoreDefinition = storeContainer.getStoreDefinition(MockStore);
      storeContainer.get(MockStore);

      expect(prevStoreDefinition).toBe(
        storeContainer.getStoreDefinition(MockStore),
      );
    });

    it('should return the store instance', () => {
      const store = storeContainer.get(MockStore);

      expect(store).toBeInstanceOf(MockStore);
    });
  });

  describe('remove store', () => {
    it('should return false when store record was not found', () => {
      expect(storeContainer.remove(MockStore)).toBe(false);
    });

    it('should return true when store record was found', () => {
      storeContainer.get(MockStore);

      expect(storeContainer.remove(MockStore)).toBe(true);
    });

    it('should call destroy the store instance when store has only 1 reference', () => {
      storeContainer.get(MockStore);

      storeContainer.remove(MockStore);

      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('should not destroy the store instance when store has more than 1 reference', () => {
      storeContainer.get(MockStore);
      storeContainer.get(MockStore);

      storeContainer.remove(MockStore);

      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });
});
