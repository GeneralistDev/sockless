'use strict';

const MockFirebase = require('./mock-firebase')

jest.mock('shortid', () => ({
    generate: jest.fn(),
}));

const shortid = require('shortid');

describe('#index', () => {
    beforeEach(() => {
        shortid.generate.mockClear();
    });

    describe('#child', () => {
        it('should move down the tree', () => {
            const child = {
                name: 'baby',
            };
            const parent = {
                child,
            };

            const fbRef = new MockFirebase({
                parent,
            });

            const childRef = fbRef.child('parent').child('child');

            expect(childRef.getCurrent()).toEqual(child);
        });

        it('should move down the tree with slash', () => {
            const child = {
                name: 'baby',
            };
            const parent = {
                child,
            };

            const fbRef = new MockFirebase({
                parent,
            });

            const childRef = fbRef.child('parent/child');

            expect(childRef.getCurrent()).toEqual(child);
        });

        it('should maintain transaction success setting', () => {
            const child = {
                name: 'baby',
            };
            const parent = {
                child,
            };

            const fbRef = new MockFirebase({
                parent,
            });

            const transactionSuccess = false;

            fbRef.setTransactionSuccess(transactionSuccess);

            const childRef = fbRef.child('parent').child('child');

            expect(childRef.transactionSuccess).toBe(transactionSuccess);
        });
    });

    describe('#parent', () => {
        it('should move up the tree', () => {
            const child = {
                name: 'baby',
            };
            const parent = {
                child,
            };

            const fbRef = new MockFirebase({
                parent,
            });

            const childRef = fbRef.child('parent').child('child');

            expect(childRef.getCurrent()).toEqual(child);

            const parentRef = childRef.parent();

            expect(parentRef.getCurrent()).toEqual(parent);
        });

        it('should maintain transaction success setting', () => {
            const child = {
                name: 'baby',
            };
            const parent = {
                child,
            };

            const fbRef = new MockFirebase({
                parent,
            });
            const transactionSuccess = false;

            fbRef.setTransactionSuccess(transactionSuccess);

            const childRef = fbRef.child('parent').child('child');
            const parentRef = childRef.parent();

            expect(childRef.transactionSuccess).toBe(transactionSuccess);
            expect(parentRef.transactionSuccess).toBe(transactionSuccess);
        });
    });

    describe('#set', () => {
        it('should set item in tree', () => {
            const child = {
                name: 'baby',
            };
            const parent = {
                child,
            };

            const fbRef = new MockFirebase({
                parent,
            });

            const childNameRef = fbRef.child('parent').child('child').child('name');

            const newBabyName = 'baby-2';
            return childNameRef.set(newBabyName).then(() => {

                expect(childNameRef.getCurrent()).toEqual(newBabyName);
                expect(fbRef.getData()).toEqual({
                    parent: {
                        child: {
                            name: newBabyName,
                        },
                    },
                });
            });
        });
    });

    describe('#update', () => {
        it('should merge item in tree', () => {
            const child = {
                name: 'baby',
                age: 0,
            };
            const parent = {
                child,
            };

            const fbRef = new MockFirebase({
                parent,
            });

            const childRef = fbRef.child('parent').child('child');

            const newBabyName = 'baby-2';
            const otherPropValue = 'some-other-value';

            return childRef.update({
                name: newBabyName,
                otherProp: otherPropValue,
            }).then(() => {
                const expectedChild = {
                    name: newBabyName,
                    age: 0,
                    otherProp: otherPropValue,
                };

                expect(childRef.getCurrent()).toEqual(expectedChild);
                expect(fbRef.getData()).toEqual({
                    parent: {
                        child: expectedChild,
                    },
                });
            });
        });

        it('should add item via update', () => {
            const child = {
                name: 'baby',
                age: 0,
            };

            const fbRef = new MockFirebase();

            const childRef = fbRef.child('parent').child('child');

            return childRef.update(child).then(() => {
                expect(childRef.getCurrent()).toEqual(child);
                expect(fbRef.getData()).toEqual({
                    parent: {
                        child,
                    },
                });
            });
        });
    });

    describe('#push', () => {
        it('should push new value with uniqueId', () => {
            const fbRef = new MockFirebase({
                array: {},
            });

            const arrayRef = fbRef.child('array');

            const uniqid = 'test-id';
            shortid.generate.mockImplementation(() => uniqid);

            const item = { id: 'item-1' };
            return arrayRef.push(item).then((snap) => {
                expect(shortid.generate.mock.calls.length).toBe(1);

                expect(snap.exists()).toBe(true);
                expect(snap.val()).toBe(item);

                const arrData = arrayRef.getCurrent();
                const arryKeys = Object.keys(arrData);

                expect(arryKeys.length).toBe(1);
                expect(arryKeys[0]).toBe(uniqid);
                expect(arrData[uniqid]).toBe(item);
            });
        });

        it('should push new value with uniqueId and check if clash', () => {

            const fbRef = new MockFirebase({
                array: {},
            });

            const arrayRef = fbRef.child('array');

            const uniqidOne = 'test-id-1';
            const uniqidTwo = 'test-id-2';
            shortid.generate
                .mockImplementationOnce(() => uniqidOne)
                .mockImplementationOnce(() => uniqidOne)
                .mockImplementationOnce(() => uniqidTwo);

            const itemOne = { id: 'item-1' };
            const itemTwo = { id: 'item-2' };

            return arrayRef.push(itemOne).then((snapOne) => {
                expect(shortid.generate.mock.calls.length).toBe(1);

                expect(snapOne.exists()).toBe(true);
                expect(snapOne.val()).toBe(itemOne);

                return arrayRef.push(itemTwo).then((snapTwo) => {
                    expect(shortid.generate.mock.calls.length).toBe(3);

                    expect(snapTwo.exists()).toBe(true);
                    expect(snapTwo.val()).toBe(itemTwo);

                    const arrData = arrayRef.getCurrent();
                    const arryKeys = Object.keys(arrData);

                    expect(arryKeys).toEqual([uniqidOne, uniqidTwo]);

                    expect(arrData[uniqidOne]).toBe(itemOne);
                    expect(arrData[uniqidTwo]).toBe(itemTwo);
                });
            });
        });
    });
});