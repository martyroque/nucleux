import { nanoid } from 'nanoid';
import { Value } from '../Value';

jest.mock('nanoid');

const mockSubId = 'DYyib2HcqrjvrUm2k6ssU';
jest.mocked(nanoid).mockReturnValue(mockSubId);

const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

describe('Value tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getter tests', () => {
    it('should get the current value', () => {
      const initialValue = 'test value';
      const value = new Value(initialValue);

      expect(value.value).toBe(initialValue);
    });
  });

  describe('publish tests', () => {
    it('should update to the new value', () => {
      const value = new Value('');

      value.value = 'test';

      expect(value.value).toBe('test');
    });

    describe('persistency on publish tests', () => {
      it('should persist the new value if persist key is defined', async () => {
        const expectedValue = 'initial value';
        const persistedKey = 'persisted_key';
        const newValue = 'test';
        const value = new Value(expectedValue, persistedKey);

        await new Promise(process.nextTick);

        value.value = newValue;

        expect(setItemSpy).toHaveBeenCalledWith(
          persistedKey,
          JSON.stringify(newValue),
        );
      });

      it('should not persist the new value if persist key is not defined', () => {
        const value = new Value<number>(2);

        value.value = 3;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value has not changed', () => {
        const persistedKey = 'persisted_key';
        const value = new Value(2, persistedKey);
        setItemSpy.mockClear();

        value.value = 2;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value is undefined', () => {
        const persistedKey = 'persisted_key';
        const value = new Value<number | undefined>(2, persistedKey);
        setItemSpy.mockClear();

        value.value = undefined;

        expect(setItemSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('subscribe tests', () => {
    it('should create the subscription', () => {
      const value = new Value('');
      const callback = jest.fn();
      value.subscribe(callback);

      const newVal = 'test';
      value.value = newVal;

      expect(callback).toHaveBeenCalledWith(newVal);
    });

    it('should return the subscription ID', () => {
      const value = new Value(null);

      expect(value.subscribe(() => undefined)).toBe(mockSubId);
    });
  });

  describe('unsubscribe tests', () => {
    it('should return false if subscriber ID is not found', () => {
      const value = new Value('');

      expect(value.unsubscribe('subId')).toBe(false);
    });

    it('should return true if the subscriber ID is found and deleted', () => {
      const value = new Value('');
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
      const persistedKey = 'persisted_key';
      new Value(expectedValue, persistedKey);

      await new Promise(process.nextTick);

      const value = new Value(null, persistedKey);

      await new Promise(process.nextTick);

      expect(getItemSpy).toHaveBeenCalledWith(persistedKey);
      expect(value.value).toEqual(expectedValue);
    });

    it('should create new persisted value when persisted value does not exist', async () => {
      const expectedValue = false;
      const persistedKey = 'persisted_key';

      const value = new Value(expectedValue, persistedKey);

      await new Promise(process.nextTick);

      expect(setItemSpy).toHaveBeenCalledWith(
        persistedKey,
        JSON.stringify(expectedValue),
      );
      expect(value.value).toEqual(expectedValue);
    });

    it('should not create new persisted value when persisted key is not defined', async () => {
      new Value(false);

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
        const persistedKey = 'persisted_key';
        customStorage.getItem.mockReturnValueOnce(
          Promise.resolve(JSON.stringify(expectedValue)),
        );

        const value = new Value(null, persistedKey, {
          storage: customStorage,
        });

        await new Promise(process.nextTick);

        expect(customStorage.getItem).toHaveBeenCalledWith(persistedKey);
        expect(value.value).toEqual(expectedValue);
      });

      it('should create new persisted value when persisted value does not exist', async () => {
        const expectedValue = false;
        const persistedKey = 'persisted_key';

        const value = new Value(expectedValue, persistedKey, {
          storage: customStorage,
        });

        await new Promise(process.nextTick);

        expect(customStorage.setItem).toHaveBeenCalledWith(
          persistedKey,
          JSON.stringify(expectedValue),
        );
        expect(value.value).toEqual(expectedValue);
      });

      it('should not create new persisted value when persisted key is not defined', async () => {
        new Value(false);

        await new Promise(process.nextTick);

        expect(customStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });
});
