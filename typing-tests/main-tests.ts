/// <reference types="localforage" />
// import sessionStorageWrapper from '../lib/index';
// import sessionStorageWrapper from '../';
import * as sessionStorageWrapper from 'localforage-sessionstoragewrapper';

declare let localforage: LocalForage;

// tslint:disable-next-line:no-namespace
namespace LocalForageSessionStorageWrapperTest {
    // tslint:disable-next-line:no-unused-variable
    const sessionStorageWrapperDriver: LocalForageDriver = sessionStorageWrapper;

    const _driver = sessionStorageWrapper._driver;
    const _initStorage = sessionStorageWrapper._initStorage;
    const _support = sessionStorageWrapper._support;

    const getItem: LocalForageDriver['getItem'] = sessionStorageWrapper.getItem;
    const setItem: LocalForageDriver['setItem'] = sessionStorageWrapper.setItem;
    const removeItem: LocalForageDriver['removeItem'] = sessionStorageWrapper.removeItem;
    const clear: LocalForageDriver['clear'] = sessionStorageWrapper.clear;
    const length: LocalForageDriver['length'] = sessionStorageWrapper.length;
    const key: LocalForageDriver['key'] = sessionStorageWrapper.key;
    const keys: LocalForageDriver['keys'] = sessionStorageWrapper.keys;
    const iterate: LocalForageDriver['iterate'] = sessionStorageWrapper.iterate;

    localforage.defineDriver(sessionStorageWrapper);
}
