import { act, renderHook } from '@testing-library/react';

import { useNucleux, useStore, useValue } from '../hooks';
import { Store } from '../Store';

const mockWatch = jest.fn();

class MockStore extends Store {
  testValue = this.atom(-1);
  testDerived = this.deriveAtom([this.testValue], (value) => value > 0);
  setTestValue(newValue: number) {
    this.testValue.value = newValue;
  }
  constructor() {
    super();
    this.watchAtom(this.testValue, mockWatch);
  }
}

describe('hooks tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useStore', () => {
    it('should return the store instance', () => {
      const { result } = renderHook(() => useStore(MockStore));

      expect(result.current).toBeInstanceOf(MockStore);
    });

    it('should remove the store instance', () => {
      const { result, unmount, rerender } = renderHook(() =>
        useStore(MockStore),
      );

      result.current.testValue.value = 2;

      expect(mockWatch).toHaveBeenCalledWith(2);

      // trigger some rerenders to ensure a single store reference
      rerender();
      rerender();
      rerender();

      unmount();
      mockWatch.mockClear();

      result.current.testValue.value = 3;

      expect(mockWatch).not.toHaveBeenCalled();
    });
  });

  describe('useValue', () => {
    describe('useValue(atom)', () => {
      it('should return the initial value', () => {
        const { result: store } = renderHook(() => useStore(MockStore));
        const { result } = renderHook(() => useValue(store.current.testValue));

        expect(result.current).toBe(-1);
      });

      it('should subscribe to the value', () => {
        const { result: store } = renderHook(() => useStore(MockStore));
        const { result } = renderHook(() => useValue(store.current.testValue));

        act(() => {
          store.current.testValue.value = 2;
        });

        expect(result.current).toBe(2);
      });

      it('should unsubscribe from the value when unmounted', () => {
        const { result: store } = renderHook(() => useStore(MockStore));
        const { result, unmount, rerender } = renderHook(() =>
          useValue(store.current.testValue),
        );

        act(() => {
          store.current.testValue.value = 2;
        });

        // trigger some rerenders to ensure a single subscription
        rerender();
        rerender();
        rerender();

        unmount();

        act(() => {
          store.current.testValue.value = 3;
        });

        expect(result.current).toBe(2);
      });
    });

    describe("useValue(store, 'atom')", () => {
      it('should return the initial value', () => {
        const { result } = renderHook(() => useValue(MockStore, 'testValue'));

        expect(result.current).toBe(-1);
      });

      it('should subscribe to the value', () => {
        const { result: store } = renderHook(() => useStore(MockStore));
        const { result } = renderHook(() => useValue(MockStore, 'testValue'));

        act(() => {
          store.current.setTestValue(2);
        });

        expect(result.current).toBe(2);
      });

      it('should unsubscribe from the value when unmounted', () => {
        const { result: store } = renderHook(() => useStore(MockStore));
        const { result, unmount, rerender } = renderHook(() =>
          useValue(MockStore, 'testValue'),
        );

        act(() => {
          store.current.setTestValue(2);
        });

        // trigger some rerenders to ensure a single subscription
        rerender();
        rerender();
        rerender();

        unmount();

        act(() => {
          store.current.setTestValue(3);
        });

        expect(result.current).toBe(2);
      });
    });
  });

  describe('useNucleux', () => {
    it('should expose store methods and readonly atoms', () => {
      const { result } = renderHook(() => useNucleux(MockStore));

      expect(result.current.testValue).toBe(-1);
      expect(result.current.testDerived).toBe(false);
      expect(mockWatch).not.toHaveBeenCalled();

      act(() => {
        result.current.setTestValue(3);
      });

      expect(result.current.testValue).toBe(3);
      expect(result.current.testDerived).toBe(true);
      expect(mockWatch).toHaveBeenCalledWith(3);

      act(() => {
        result.current.setTestValue(0);
      });

      expect(result.current.testValue).toBe(0);
      expect(result.current.testDerived).toBe(false);
      expect(mockWatch).toHaveBeenCalledWith(0);
    });

    it('should remove the store subscriptions and instance', () => {
      const { result, unmount, rerender } = renderHook(() =>
        useNucleux(MockStore),
      );

      act(() => {
        result.current.setTestValue(3);
      });

      expect(result.current.testValue).toBe(3);

      // trigger some rerenders to ensure a single store reference
      rerender();
      rerender();
      rerender();

      mockWatch.mockClear();

      unmount();

      act(() => {
        result.current.setTestValue(2);
      });

      expect(mockWatch).not.toHaveBeenCalled();
    });
  });
});
