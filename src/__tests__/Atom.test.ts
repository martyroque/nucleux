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
      const testAtom = new Atom(initialValue);

      expect(testAtom.value).toBe(initialValue);
    });

    it('should get the initial value', () => {
      const initialValue = 'test value';
      const testAtom = new Atom(initialValue);

      testAtom.value = 'new value';

      expect(testAtom.initialValue).toBe(initialValue);
    });
  });

  describe('publish tests', () => {
    it('should update to the new value', () => {
      const testAtom = new Atom('');

      testAtom.value = 'test';

      expect(testAtom.value).toBe('test');
    });

    describe('memoization tests', () => {
      describe('shallow memoization (default)', () => {
        it('should publish when value changes', () => {
          const testAtom = new Atom('initial');
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = 'changed';

          expect(callback).toHaveBeenCalledWith('changed');
        });

        it('should skip publish when value is identical', () => {
          const testAtom = new Atom('test');
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = 'test';

          expect(callback).not.toHaveBeenCalled();
        });

        it('should skip publish for same object reference', () => {
          const obj = { name: 'John' };
          const testAtom = new Atom(obj);
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = obj;

          expect(callback).not.toHaveBeenCalled();
        });
      });

      describe('deep memoization', () => {
        it('should skip publish when object content is identical', () => {
          const testAtom = new Atom(
            { name: 'John', age: 30 },
            {
              memoization: { type: 'deep' },
            },
          );
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = { name: 'John', age: 30 };

          expect(callback).not.toHaveBeenCalled();
        });

        it('should publish when object content changes', () => {
          const testAtom = new Atom(
            { name: 'John', age: 30 },
            {
              memoization: { type: 'deep' },
            },
          );
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = { name: 'John', age: 31 };

          expect(callback).toHaveBeenCalledWith({ name: 'John', age: 31 });
        });

        it('should handle arrays with deep equality', () => {
          const testAtom = new Atom([1, 2, 3], {
            memoization: { type: 'deep' },
          });
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = [1, 2, 3];

          expect(callback).not.toHaveBeenCalled();
        });

        it('should handle nested objects with deep equality', () => {
          const testAtom = new Atom(
            { user: { name: 'John', settings: { theme: 'dark' } } },
            {
              memoization: { type: 'deep' },
            },
          );
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = {
            user: { name: 'John', settings: { theme: 'dark' } },
          };

          expect(callback).not.toHaveBeenCalled();
        });
      });

      describe('custom memoization', () => {
        it('should use custom comparator function', () => {
          const testAtom = new Atom(
            { name: 'John', age: 25 },
            {
              memoization: {
                type: 'custom',
                compare: (a, b) => a.name === b.name,
              },
            },
          );
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = { name: 'John', age: 30 };

          expect(callback).not.toHaveBeenCalled();
        });

        it('should publish when custom comparator returns false', () => {
          const testAtom = new Atom(
            { name: 'John', age: 25 },
            {
              memoization: {
                type: 'custom',
                compare: (a, b) => a.name === b.name,
              },
            },
          );
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = { name: 'Jane', age: 25 };

          expect(callback).toHaveBeenCalledWith({ name: 'Jane', age: 25 });
        });

        it('should fallback to shallow equality when compare function is not provided', () => {
          const testAtom = new Atom('test', {
            memoization: { type: 'custom' },
          });
          const callback = jest.fn();
          testAtom.subscribe(callback);

          testAtom.value = 'test';

          expect(callback).not.toHaveBeenCalled();
        });
      });
    });

    describe('persistency on publish tests', () => {
      it('should persist the new value if persist key is defined', async () => {
        const expectedValue = 'initial value';
        const persistKey = 'persisted_key';
        const newValue = 'test';
        const testAtom = new Atom(expectedValue, {
          persistence: { persistKey },
        });

        await new Promise(process.nextTick);

        testAtom.value = newValue;

        expect(setItemSpy).toHaveBeenCalledWith(
          persistKey,
          JSON.stringify(newValue),
        );
      });

      it('should not persist the new value if persist key is not defined', () => {
        const testAtom = new Atom<number>(2);

        testAtom.value = 3;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value has not changed', () => {
        const persistKey = 'persisted_key';
        const testAtom = new Atom(2, { persistence: { persistKey } });
        setItemSpy.mockClear();

        testAtom.value = 2;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value is undefined', () => {
        const persistKey = 'persisted_key';
        const testAtom = new Atom<number | undefined>(2, {
          persistence: { persistKey },
        });
        setItemSpy.mockClear();

        testAtom.value = undefined;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist when memoization prevents update', () => {
        const persistKey = 'memoized_key';
        const testAtom = new Atom(
          { name: 'John' },
          {
            persistence: { persistKey },
            memoization: { type: 'deep' },
          },
        );
        setItemSpy.mockClear();

        testAtom.value = { name: 'John' };

        expect(setItemSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('subscribe tests', () => {
    it('should create the subscription', () => {
      const testAtom = new Atom('');
      const callback = jest.fn();
      testAtom.subscribe(callback);

      const newVal = 'test';
      testAtom.value = newVal;

      expect(callback).toHaveBeenCalledWith(newVal);
    });

    it('should return the subscription ID', () => {
      const testAtom = new Atom(null);

      expect(testAtom.subscribe(() => undefined)).toBe(mockSubId);
    });

    it('should get the value when immediate is set', () => {
      const testAtom = new Atom('immediate');
      const callback = jest.fn();
      testAtom.subscribe(callback, true);

      expect(callback).toHaveBeenCalledWith('immediate');
    });

    it('should get the previous value when required by arity', () => {
      const testAtom = new Atom('previous');
      const callback = jest.fn((current, previous) => ({ current, previous }));
      testAtom.subscribe(callback, true);

      testAtom.value = 'current';

      expect(callback).toHaveBeenCalledWith('current', 'previous');
    });
  });

  describe('unsubscribe tests', () => {
    it('should return false if subscriber ID is not found', () => {
      const testAtom = new Atom('');

      expect(testAtom.unsubscribe('subId')).toBe(false);
    });

    it('should return true if the subscriber ID is found and deleted', () => {
      const testAtom = new Atom('');
      const callback = jest.fn();
      const subId = testAtom.subscribe(callback);

      expect(testAtom.unsubscribe(subId)).toBe(true);

      testAtom.value = 'test';

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('persistency tests', () => {
    it('should hydrate persisted value when persisted value exists', async () => {
      const expectedValue = [1, 2, 3];
      const persistKey = 'persisted_key';
      new Atom(expectedValue, { persistence: { persistKey } });

      await new Promise(process.nextTick);

      const testAtom = new Atom(null, { persistence: { persistKey } });

      await new Promise(process.nextTick);

      expect(getItemSpy).toHaveBeenCalledWith(persistKey);
      expect(testAtom.value).toEqual(expectedValue);
    });

    it('should create new persisted value when persisted value does not exist', async () => {
      const expectedValue = false;
      const persistKey = 'persisted_key';

      const testAtom = new Atom(expectedValue, { persistence: { persistKey } });

      await new Promise(process.nextTick);

      expect(setItemSpy).toHaveBeenCalledWith(
        persistKey,
        JSON.stringify(expectedValue),
      );
      expect(testAtom.value).toEqual(expectedValue);
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
        removeItem: jest.fn(),
      };

      it('should hydrate persisted value when persisted value exists', async () => {
        const expectedValue = [1, 2, 3];
        const persistKey = 'persisted_key';
        customStorage.getItem.mockReturnValueOnce(
          Promise.resolve(JSON.stringify(expectedValue)),
        );

        const testAtom = new Atom(null, {
          persistence: { persistKey, storage: customStorage },
        });

        await new Promise(process.nextTick);

        expect(customStorage.getItem).toHaveBeenCalledWith(persistKey);
        expect(testAtom.value).toEqual(expectedValue);
      });

      it('should create new persisted value when persisted value does not exist', async () => {
        const expectedValue = false;
        const persistKey = 'persisted_key';

        const testAtom = new Atom(expectedValue, {
          persistence: { persistKey, storage: customStorage },
        });

        await new Promise(process.nextTick);

        expect(customStorage.setItem).toHaveBeenCalledWith(
          persistKey,
          JSON.stringify(expectedValue),
        );
        expect(testAtom.value).toEqual(expectedValue);
      });

      it('should not create new persisted value when persisted key is not defined', async () => {
        new Atom(false);

        await new Promise(process.nextTick);

        expect(customStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe('reset', () => {
      const customStorage = {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      };

      it('should reset value to initial and clear storage by default', async () => {
        const atom = new Atom('initial', {
          persistence: { persistKey: 'test-key', storage: customStorage },
        });

        atom.value = 'changed';
        expect(atom.value).toBe('changed');

        await atom.reset();

        expect(atom.value).toBe('initial');
        expect(customStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('should only clear storage when resetValue is false', async () => {
        const atom = new Atom('initial', {
          persistence: { persistKey: 'test-key', storage: customStorage },
        });

        atom.value = 'changed';
        await atom.reset({ resetValue: false });

        expect(atom.value).toBe('changed');
        expect(customStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('should only reset value when clearPersisted is false', async () => {
        const atom = new Atom('initial', {
          persistence: { persistKey: 'test-key', storage: customStorage },
        });

        atom.value = 'changed';
        await atom.reset({ clearPersisted: false });

        expect(atom.value).toBe('initial');
        expect(customStorage.removeItem).not.toHaveBeenCalled();
      });

      it('should notify subscribers when value is reset', async () => {
        const atom = new Atom('initial');
        const callback = jest.fn((current, previous) => ({
          current,
          previous,
        }));

        atom.subscribe(callback);
        atom.value = 'changed';

        await atom.reset();

        expect(callback).toHaveBeenCalledWith('initial', 'changed');
      });
    });
  });
});
