import { act, renderHook } from '@testing-library/react';

import { Value } from '../Value';
import { useStore, useValue } from '../hooks';

const mockDestroy = jest.fn();

class MockStore {
  testValue = new Value(1);
  destroy = mockDestroy;
}

describe('hooks tests', () => {
  describe('useStore', () => {
    it('should return the store instance', () => {
      const { result } = renderHook(() => useStore(MockStore));

      expect(result.current).toBeInstanceOf(MockStore);
    });

    it('should remove the store instance', () => {
      const { unmount, rerender } = renderHook(() => useStore(MockStore));

      // trigger some rerenders to ensure a single store reference
      rerender();
      rerender();
      rerender();

      unmount();

      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  describe('useValue', () => {
    let store: MockStore;

    beforeEach(() => {
      const { result } = renderHook(() => useStore(MockStore));
      store = result.current;
    });

    it('should return the initial value', () => {
      const { result } = renderHook(() => useValue(store.testValue));

      expect(result.current).toBe(1);
    });

    it('should subscribe to the value', () => {
      const { result } = renderHook(() => useValue(store.testValue));

      act(() => {
        store.testValue.value = 2;
      });

      expect(result.current).toBe(2);
    });

    it('should unsubscribe from the value when unmounted', () => {
      const { result, unmount, rerender } = renderHook(() =>
        useValue(store.testValue),
      );

      act(() => {
        store.testValue.value = 2;
      });

      // trigger some rerenders to ensure a single subscription
      rerender();
      rerender();
      rerender();

      unmount();

      act(() => {
        store.testValue.value = 3;
      });

      expect(result.current).toBe(2);
    });
  });
});
