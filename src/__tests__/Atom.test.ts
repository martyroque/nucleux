import { nanoid } from 'nanoid';
import { Atom } from '../Atom';

jest.mock('nanoid');

const mockSubId = 'DYyib2HcqrjvrUm2k6ssU';
jest.mocked(nanoid).mockReturnValue(mockSubId);

const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

describe('Atom tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getter tests', () => {
    it('should get the current value', () => {
      const initialValue = 'test value';
      const value = new Atom(initialValue);

      expect(value.value).toBe(initialValue);
    });
  });

  describe('publish tests', () => {
    it('should update to the new value', () => {
      const value = new Atom('');

      value.value = 'test';

      expect(value.value).toBe('test');
    });

    describe('memoization tests', () => {
      describe('shallow memoization (default)', () => {
        it('should publish when value changes', () => {
          const value = new Atom('initial');
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = 'changed';

          expect(callback).toHaveBeenCalledWith('changed');
        });

        it('should skip publish when value is identical', () => {
          const value = new Atom('test');
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = 'test';

          expect(callback).not.toHaveBeenCalled();
        });

        it('should skip publish for same object reference', () => {
          const obj = { name: 'John' };
          const value = new Atom(obj);
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = obj;

          expect(callback).not.toHaveBeenCalled();
        });
      });

      describe('deep memoization', () => {
        it('should skip publish when object content is identical', () => {
          const value = new Atom(
            { name: 'John', age: 30 },
            {
              memoization: { type: 'deep' },
            },
          );
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = { name: 'John', age: 30 };

          expect(callback).not.toHaveBeenCalled();
        });

        it('should publish when object content changes', () => {
          const value = new Atom(
            { name: 'John', age: 30 },
            {
              memoization: { type: 'deep' },
            },
          );
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = { name: 'John', age: 31 };

          expect(callback).toHaveBeenCalledWith({ name: 'John', age: 31 });
        });

        it('should handle arrays with deep equality', () => {
          const value = new Atom([1, 2, 3], {
            memoization: { type: 'deep' },
          });
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = [1, 2, 3];

          expect(callback).not.toHaveBeenCalled();
        });

        it('should handle nested objects with deep equality', () => {
          const value = new Atom(
            { user: { name: 'John', settings: { theme: 'dark' } } },
            {
              memoization: { type: 'deep' },
            },
          );
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = { user: { name: 'John', settings: { theme: 'dark' } } };

          expect(callback).not.toHaveBeenCalled();
        });
      });

      describe('custom memoization', () => {
        it('should use custom comparator function', () => {
          const value = new Atom(
            { name: 'John', age: 25 },
            {
              memoization: {
                type: 'custom',
                compare: (a, b) => a.name === b.name,
              },
            },
          );
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = { name: 'John', age: 30 };

          expect(callback).not.toHaveBeenCalled();
        });

        it('should publish when custom comparator returns false', () => {
          const value = new Atom(
            { name: 'John', age: 25 },
            {
              memoization: {
                type: 'custom',
                compare: (a, b) => a.name === b.name,
              },
            },
          );
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = { name: 'Jane', age: 25 };

          expect(callback).toHaveBeenCalledWith({ name: 'Jane', age: 25 });
        });

        it('should fallback to shallow equality when compare function is not provided', () => {
          const value = new Atom('test', {
            memoization: { type: 'custom' },
          });
          const callback = jest.fn();
          value.subscribe(callback);

          value.value = 'test';

          expect(callback).not.toHaveBeenCalled();
        });
      });
    });

    describe('persistency on publish tests', () => {
      it('should persist the new value if persist key is defined', async () => {
        const expectedValue = 'initial value';
        const persistKey = 'persisted_key';
        const newValue = 'test';
        const value = new Atom(expectedValue, { persistence: { persistKey } });

        await new Promise(process.nextTick);

        value.value = newValue;

        expect(setItemSpy).toHaveBeenCalledWith(
          persistKey,
          JSON.stringify(newValue),
        );
      });

      it('should not persist the new value if persist key is not defined', () => {
        const value = new Atom<number>(2);

        value.value = 3;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value has not changed', () => {
        const persistKey = 'persisted_key';
        const value = new Atom(2, { persistence: { persistKey } });
        setItemSpy.mockClear();

        value.value = 2;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value is undefined', () => {
        const persistKey = 'persisted_key';
        const value = new Atom<number | undefined>(2, {
          persistence: { persistKey },
        });
        setItemSpy.mockClear();

        value.value = undefined;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist when memoization prevents update', () => {
        const persistKey = 'memoized_key';
        const value = new Atom(
          { name: 'John' },
          {
            persistence: { persistKey },
            memoization: { type: 'deep' },
          },
        );
        setItemSpy.mockClear();

        value.value = { name: 'John' };

        expect(setItemSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('subscribe tests', () => {
    it('should create the subscription', () => {
      const value = new Atom('');
      const callback = jest.fn();
      value.subscribe(callback);

      const newVal = 'test';
      value.value = newVal;

      expect(callback).toHaveBeenCalledWith(newVal);
    });

    it('should return the subscription ID', () => {
      const value = new Atom(null);

      expect(value.subscribe(() => undefined)).toBe(mockSubId);
    });

    it('should get the value when immediate is set', () => {
      const value = new Atom('immediate');
      const callback = jest.fn();
      value.subscribe(callback, true);

      expect(callback).toHaveBeenCalledWith('immediate');
    });

    it('should get the previous value when required by arity', () => {
      const value = new Atom('previous');
      const callback = jest.fn((current, previous) => ({ current, previous }));
      value.subscribe(callback, true);

      value.value = 'current';

      expect(callback).toHaveBeenCalledWith('current', 'previous');
    });
  });

  describe('unsubscribe tests', () => {
    it('should return false if subscriber ID is not found', () => {
      const value = new Atom('');

      expect(value.unsubscribe('subId')).toBe(false);
    });

    it('should return true if the subscriber ID is found and deleted', () => {
      const value = new Atom('');
      const callback = jest.fn();
      const subId = value.subscribe(callback);

      expect(value.unsubscribe(subId)).toBe(true);

      value.value = 'test';

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('persistency tests', () => {
    it('should hydrate persisted value when persisted value exists', async () => {
      const expectedValue = [1, 2, 3];
      const persistKey = 'persisted_key';
      new Atom(expectedValue, { persistence: { persistKey } });

      await new Promise(process.nextTick);

      const value = new Atom(null, { persistence: { persistKey } });

      await new Promise(process.nextTick);

      expect(getItemSpy).toHaveBeenCalledWith(persistKey);
      expect(value.value).toEqual(expectedValue);
    });

    it('should create new persisted value when persisted value does not exist', async () => {
      const expectedValue = false;
      const persistKey = 'persisted_key';

      const value = new Atom(expectedValue, { persistence: { persistKey } });

      await new Promise(process.nextTick);

      expect(setItemSpy).toHaveBeenCalledWith(
        persistKey,
        JSON.stringify(expectedValue),
      );
      expect(value.value).toEqual(expectedValue);
    });

    it('should not create new persisted value when persisted key is not defined', async () => {
      new Atom(false);

      await new Promise(process.nextTick);

      expect(setItemSpy).not.toHaveBeenCalled();
    });

    describe('with custom storage', () => {
      const customStorage = {
        setItem: jest.fn(),
        getItem: jest.fn(),
      };

      it('should hydrate persisted value when persisted value exists', async () => {
        const expectedValue = [1, 2, 3];
        const persistKey = 'persisted_key';
        customStorage.getItem.mockReturnValueOnce(
          Promise.resolve(JSON.stringify(expectedValue)),
        );

        const value = new Atom(null, {
          persistence: { persistKey, storage: customStorage },
        });

        await new Promise(process.nextTick);

        expect(customStorage.getItem).toHaveBeenCalledWith(persistKey);
        expect(value.value).toEqual(expectedValue);
      });

      it('should create new persisted value when persisted value does not exist', async () => {
        const expectedValue = false;
        const persistKey = 'persisted_key';

        const value = new Atom(expectedValue, {
          persistence: { persistKey, storage: customStorage },
        });

        await new Promise(process.nextTick);

        expect(customStorage.setItem).toHaveBeenCalledWith(
          persistKey,
          JSON.stringify(expectedValue),
        );
        expect(value.value).toEqual(expectedValue);
      });

      it('should not create new persisted value when persisted key is not defined', async () => {
        new Atom(false);

        await new Promise(process.nextTick);

        expect(customStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });
});
