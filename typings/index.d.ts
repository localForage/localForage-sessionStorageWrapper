/// <reference types="localforage" />

declare module 'localforage-sessionstoragewrapper' {
    let sessionStorageWrapper: LocalForageDriver & {
        dropInstance: LocalForageDropInstanceFn
    };
    export = sessionStorageWrapper;
}
