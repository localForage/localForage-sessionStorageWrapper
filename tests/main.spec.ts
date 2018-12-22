import * as m from 'mochainon';

import * as localforage from 'localforage';
// import * as sessionStorageWrapper from '../../';
// The above ^ should have worked, but I had issues with it,
// so the following is a hack for now.
import '../';
const sessionStorageWrapper = (window as any)
    .sessionStorageWrapper as LocalForageDriver;

const { expect } = m.chai;

describe('Localforage', function() {
    it('should get ready', function() {
        return expect(localforage.ready()).to.eventually.be.fulfilled;
    });

    it('can define sessionStorageWrapper driver', function() {
        return expect(localforage.defineDriver(sessionStorageWrapper)).to.be
            .fulfilled;
    });

    it('can set the sessionStorageWrapper driver', function() {
        return localforage
            .setDriver(sessionStorageWrapper._driver)
            .then(() => localforage.driver())
            .then(driverName =>
                expect(driverName).to.be.equal(sessionStorageWrapper._driver),
            );
    });

    it('can save & restore an item to the sessionStorageWrapper driver', function() {
        const key = `${Date.now()}`;
        const value = `${Date.now()}!!`;
        return localforage
            .setItem(key, value)
            .then(() => localforage.getItem(key))
            .then(retrievedValue => {
                expect(retrievedValue).to.be.equal(value);
                return localforage.driver();
            })
            .then(driverName =>
                expect(driverName).to.be.equal(sessionStorageWrapper._driver),
            );
    });
});
