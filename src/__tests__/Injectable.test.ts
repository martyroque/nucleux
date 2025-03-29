import { Container } from '../Container';
import { Injectable } from '../Injectable';

const storeContainer = Container.getInstance();

const mockDestroy = jest.fn();

class MockSubStore {
  destroy = mockDestroy;
}

class MockStore extends Injectable {
  public subStore = this.inject(MockSubStore);
}

describe('Injectable tests', () => {
  it('should inject a store', () => {
    const mockStore = storeContainer.get(MockStore);

    expect(mockStore.subStore).toBeInstanceOf(MockSubStore);

    storeContainer.remove(MockStore);
  });

  it('should destroy injected store when main store is destroyed', () => {
    storeContainer.get(MockStore);

    storeContainer.remove(MockStore);

    expect(mockDestroy).toHaveBeenCalled();
  });
});
