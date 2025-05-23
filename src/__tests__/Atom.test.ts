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

    describe('persistency on publish tests', () => {
      it('should persist the new value if persist key is defined', async () => {
        const expectedValue = 'initial value';
        const persistedKey = 'persisted_key';
        const newValue = 'test';
        const value = new Atom(expectedValue, persistedKey);

        await new Promise(process.nextTick);

        value.value = newValue;

        expect(setItemSpy).toHaveBeenCalledWith(
          persistedKey,
          JSON.stringify(newValue),
        );
      });

      it('should not persist the new value if persist key is not defined', () => {
        const value = new Atom<number>(2);

        value.value = 3;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value has not changed', () => {
        const persistedKey = 'persisted_key';
        const value = new Atom(2, persistedKey);
        setItemSpy.mockClear();

        value.value = 2;

        expect(setItemSpy).not.toHaveBeenCalled();
      });

      it('should not persist the new value if persist key is defined and value is undefined', () => {
        const persistedKey = 'persisted_key';
        const value = new Atom<number | undefined>(2, persistedKey);
        setItemSpy.mockClear();

        value.value = undefined;

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
      const persistedKey = 'persisted_key';
      new Atom(expectedValue, persistedKey);

      await new Promise(process.nextTick);

      const value = new Atom(null, persistedKey);

      await new Promise(process.nextTick);

      expect(getItemSpy).toHaveBeenCalledWith(persistedKey);
      expect(value.value).toEqual(expectedValue);
    });

    it('should create new persisted value when persisted value does not exist', async () => {
      const expectedValue = false;
      const persistedKey = 'persisted_key';

      const value = new Atom(expectedValue, persistedKey);

      await new Promise(process.nextTick);

      expect(setItemSpy).toHaveBeenCalledWith(
        persistedKey,
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
        const persistedKey = 'persisted_key';
        customStorage.getItem.mockReturnValueOnce(
          Promise.resolve(JSON.stringify(expectedValue)),
        );

        const value = new Atom(null, persistedKey, {
          storage: customStorage,
        });

        await new Promise(process.nextTick);

        expect(customStorage.getItem).toHaveBeenCalledWith(persistedKey);
        expect(value.value).toEqual(expectedValue);
      });

      it('should create new persisted value when persisted value does not exist', async () => {
        const expectedValue = false;
        const persistedKey = 'persisted_key';

        const value = new Atom(expectedValue, persistedKey, {
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
        new Atom(false);

        await new Promise(process.nextTick);

        expect(customStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });
});
