/// <reference types="localforage" />

let getSerializerPromiseCache: Promise<LocalForageSerializer>;

export function getSerializerPromise(localForageInstance: LocalForage) {
    if (getSerializerPromiseCache) {
        return getSerializerPromiseCache;
    }
    if (
        !localForageInstance ||
        typeof localForageInstance.getSerializer !== 'function'
    ) {
        return Promise.reject(
            new Error(
                'localforage.getSerializer() was not available! ' +
                    'localforage v1.4+ is required!',
            ),
        );
    }
    getSerializerPromiseCache = localForageInstance.getSerializer();
    return getSerializerPromiseCache;
}

export function getCallback(): ((arg1: any, arg2: any) => any) | undefined {
    if (
        arguments.length &&
        typeof arguments[arguments.length - 1] === 'function'
    ) {
        return arguments[arguments.length - 1];
    }
}

export function executeCallback<T>(
    promise: Promise<T>,
    callback?: (error: any, result?: T) => void,
) {
    if (callback) {
        promise.then(
            function(result) {
                callback(null, result);
            },
            function(error) {
                callback(error);
            },
        );
    }
    return promise;
}

export function isLocalStorageValid() {
    try {
        return (
            typeof localStorage !== 'undefined' &&
            'setItem' in localStorage &&
            // in IE8 typeof localStorage.setItem === 'object'
            !!localStorage.setItem
        );
    } catch (e) {
        return false;
    }
}

export function isSessionStorageValid() {
    try {
        return (
            typeof sessionStorage !== 'undefined' &&
            'setItem' in sessionStorage &&
            // in IE8 typeof sessionStorage.setItem === 'object'
            !!sessionStorage.setItem
        );
    } catch (e) {
        return false;
    }
}

export function isStorageValid(storage: 'localStorage' | 'sessionStorage') {
    if (storage === 'localStorage') {
        return isLocalStorageValid();
    }

    if (storage === 'sessionStorage') {
        return isSessionStorageValid();
    }

    return false;
}

export function normalizeKey(key: any) {
    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(`${key} used as a key, but it is not a string.`);
        key = String(key);
    }

    return key;
}
