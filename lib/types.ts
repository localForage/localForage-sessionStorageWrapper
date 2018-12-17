/// <reference types="localforage" />

export interface LocalForageWithPrivateProps<T> extends LocalForage {
    _dbInfo: LocalForageDbInfo<T>;
    _defaultConfig: LocalForageOptions;
}

export interface LocalForageDbInfo<T> {
    db: T;
    keyPrefix: string;
    serializer?: LocalForageSerializer;
}
