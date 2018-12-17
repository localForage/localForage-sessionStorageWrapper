/// <reference types="localforage" />

import { LocalForageDbInfo, LocalForageWithPrivateProps } from './types';
import {
    executeCallback,
    getCallback,
    getSerializerPromise,
    isSessionStorageValid,
    normalizeKey,
} from './utils';

function _getKeyPrefix(
    options: LocalForageOptions,
    defaultConfig: LocalForageOptions,
) {
    let keyPrefix = options.name + '/';

    if (options.storeName !== defaultConfig.storeName) {
        keyPrefix += options.storeName + '/';
    }
    return keyPrefix;
}

// Check if session/localStorage throws when saving an item
function checkIfStorageThrows(storage: Storage) {
    const storageTestKey = '_localforage_support_test';

    try {
        storage.setItem(storageTestKey, 'true');
        storage.removeItem(storageTestKey);

        return false;
    } catch (e) {
        return true;
    }
}

// Check if session/localStorage is usable and allows to save an item
// This method checks if session/localStorage is usable in Safari Private Browsing
// mode, or in any other case where the available quota for session/localStorage
// is 0 and there wasn't any saved items yet.
function _isStorageUsable(storage: Storage) {
    return !checkIfStorageThrows(storage) || storage.length > 0;
}

// Config the session/localStorage backend, using options set in the config.
function _initStorage(
    this: LocalForageWithPrivateProps<Storage>,
    options: LocalForageDbInstanceOptions = {},
) {
    const dbInfo: LocalForageDbInfo<Storage> = {
        ...(options as LocalForageDbInfo<Storage>),
        db: sessionStorage,
        keyPrefix: _getKeyPrefix(options, this._defaultConfig),
    };

    if (!_isStorageUsable(dbInfo.db)) {
        return Promise.reject();
    }

    this._dbInfo = dbInfo;

    return getSerializerPromise(this).then(serializer => {
        dbInfo.serializer = serializer;
    });
}

// Remove all keys from the datastore, effectively destroying all data in
// the app's key/value store!
function clear(
    this: LocalForageWithPrivateProps<Storage>,
    callback?: (err: any) => void,
): Promise<void> {
    const promise = this.ready().then(() => {
        const { db: store, keyPrefix } = this._dbInfo;

        for (let i = store.length - 1; i >= 0; i--) {
            const key = store.key(i) || '';

            if (key.indexOf(keyPrefix) === 0) {
                store.removeItem(key);
            }
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Retrieve an item from the store. Unlike the original async_storage
// library in Gaia, we don't modify return values at all. If a key's value
// is `undefined`, we pass that value to the callback function.
function getItem<T>(
    this: LocalForageWithPrivateProps<Storage>,
    key: string,
    callback?: (err: any, value: T) => void,
): Promise<T | null> {
    key = normalizeKey(key);

    const promise = this.ready().then(() => {
        const { db: store, keyPrefix, serializer } = this._dbInfo;
        const result = store.getItem(keyPrefix + key);

        if (!result) {
            return result as null;
        }

        // If a result was found, parse it from the serialized
        // string into a JS object. If result isn't truthy, the key
        // is likely undefined and we'll pass it straight to the
        // callback.
        return serializer!.deserialize<T>(result) as T;
    });

    executeCallback(promise, callback);
    return promise;
}

// Iterate over all items in the store.
function iterate<T, U>(
    this: LocalForageWithPrivateProps<Storage>,
    iterator: (value: T, key: string, iterationNumber: number) => U,
    callback?: (err: any, result: U) => void,
): Promise<U | undefined> {
    const promise = this.ready().then(() => {
        const { db: store, keyPrefix, serializer } = this._dbInfo;
        const keyPrefixLength = keyPrefix.length;
        const length = store.length;

        // We use a dedicated iterator instead of the `i` constiable below
        // so other keys we fetch in session/localStorage aren't counted in
        // the `iterationNumber` argument passed to the `iterate()`
        // callback.
        //
        // See: github.com/mozilla/localForage/pull/435#discussion_r38061530
        let iterationNumber = 1;

        for (let i = 0; i < length; i++) {
            const key = store.key(i) || '';
            if (key.indexOf(keyPrefix) !== 0) {
                continue;
            }
            const storeValue = store.getItem(key);

            // If a result was found, parse it from the serialized
            // string into a JS object. If result isn't truthy, the
            // key is likely undefined and we'll pass it straight
            // to the iterator.
            const value = storeValue
                ? (serializer!.deserialize<T>(storeValue) as T)
                : null;

            const iteratorResult = iterator(
                value as T,
                key.substring(keyPrefixLength),
                iterationNumber++,
            );

            if (iteratorResult !== void 0) {
                return iteratorResult;
            }
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Same as session/localStorage's key() method, except takes a callback.
function key(
    this: LocalForageWithPrivateProps<Storage>,
    keyIndex: number,
    callback?: (err: any, key: string) => void,
): Promise<string | null> {
    const promise = this.ready().then(() => {
        const { db: store, keyPrefix } = this._dbInfo;
        let result;
        try {
            result = store.key(keyIndex) || null;
        } catch (error) {
            result = null;
        }

        if (!result) {
            return result;
        }

        // Remove the prefix from the key, if a key is found.
        return result.substring(keyPrefix.length);
    });

    executeCallback(promise, callback);
    return promise;
}

function keys(
    this: LocalForageWithPrivateProps<Storage>,
    callback?: (err: any, keys: string[]) => void,
): Promise<string[]> {
    const promise = this.ready().then(() => {
        const { db: store, keyPrefix } = this._dbInfo;
        const length = store.length;
        const keys = [];

        for (let i = 0; i < length; i++) {
            const itemKey = store.key(i) || '';
            if (itemKey.indexOf(keyPrefix) === 0) {
                keys.push(itemKey.substring(keyPrefix.length));
            }
        }

        return keys;
    });

    executeCallback(promise, callback);
    return promise;
}

// Supply the number of keys in the datastore to the callback function.
function length(
    this: LocalForageWithPrivateProps<Storage>,
    callback?: (err: any, numberOfKeys: number) => void,
): Promise<number> {
    const promise = this.keys().then(keys => keys.length);

    executeCallback(promise, callback);
    return promise;
}

// Remove an item from the store, nice and simple.
function removeItem(
    this: LocalForageWithPrivateProps<Storage>,
    key: string,
    callback?: (err: any) => void,
): Promise<void> {
    key = normalizeKey(key);

    const promise = this.ready().then(() => {
        const { db: store, keyPrefix } = this._dbInfo;
        store.removeItem(keyPrefix + key);
    });

    executeCallback(promise, callback);
    return promise;
}

// Set a key's value and run an optional callback once the value is set.
// Unlike Gaia's implementation, the callback function is passed the value,
// in case you want to operate on that value only after you're sure it
// saved, or something like that.
function setItem<T>(
    this: LocalForageWithPrivateProps<Storage>,
    key: string,
    value: T,
    callback?: (err: any, value: T) => void,
): Promise<T> {
    key = normalizeKey(key);

    const promise = this.ready().then(() => {
        // Convert undefined values to null.
        // https://github.com/mozilla/localForage/pull/42
        if (value === undefined) {
            value = null as any;
        }

        // Save the original value to pass to the callback.
        const originalValue = value;

        const { db: store, keyPrefix, serializer } = this._dbInfo;
        return new Promise<T>((resolve, reject) => {
            serializer!.serialize(value, (value, error) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    store.setItem(keyPrefix + key, value);
                    resolve(originalValue);
                } catch (e) {
                    // storage capacity exceeded.
                    // TODO: Make this a specific error/event.
                    if (
                        e.name === 'QuotaExceededError' ||
                        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
                    ) {
                        reject(e);
                    }
                    reject(e);
                }
            });
        });
    });

    executeCallback(promise, callback);
    return promise;
}

function dropInstance(
    this: LocalForageWithPrivateProps<Storage>,
    dbInstanceOptions?: LocalForageDbInstanceOptions,
    callback?: (err: any) => void,
): Promise<void> {
    callback = getCallback.apply(this, arguments);

    const options =
        (typeof dbInstanceOptions !== 'function' && dbInstanceOptions) || {};
    if (!options.name) {
        const currentConfig = this.config();
        options.name = options.name || currentConfig.name;
        options.storeName = options.storeName || currentConfig.storeName;
    }

    let promise;
    if (!options.name) {
        promise = Promise.reject('Invalid arguments');
    } else {
        try {
            const keyPrefix = !options.storeName
                ? `${options.name}/`
                : _getKeyPrefix(options, this._defaultConfig);

            const { db: store } = this._dbInfo;
            for (let i = store.length - 1; i >= 0; i--) {
                const key = store.key(i) || '';

                if (key.indexOf(keyPrefix) === 0) {
                    store.removeItem(key);
                }
            }
            promise = Promise.resolve();
        } catch (e) {
            promise = Promise.reject(e);
        }
    }

    executeCallback(promise, callback);
    return promise;
}

const sessionStorageWrapper = {
    _driver: 'sessionStorageWrapper',
    _initStorage,
    _support: isSessionStorageValid(),
    iterate,
    getItem,
    setItem,
    removeItem,
    clear,
    length,
    key,
    keys,
    dropInstance,
};

export default sessionStorageWrapper;
