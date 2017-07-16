'use strict';

const _ = require('lodash');
const BbPromise = require('bluebird');
const jp = require('jsonpath');
const shortid = require('shortid');

const util = require('./util');

class MockSnapshot {
    constructor(data) {
        this.data = data;
    }

    exists() {
        return !!this.data;
    }

    val() {
        return this.data;
    }
}

class MockFirebase {
    constructor(data, paths, success, callbacks) {
        this.paths = paths || [];

        const isRoot = !this.paths.length;

        this.data = isRoot ? _.cloneDeep(data || {}) : data;

        if (isRoot) {
            this.paths.push('$')
        }

        this.pathExpression = jp.stringify(this.paths);
        this.transactionSuccess = success === undefined ? true : success;

        this.eventCallbacks = callbacks || {};
    }

    setTransactionSuccess(success) {
        this.transactionSuccess = success;
    }

    getData() {
        return this.data;
    }

    getCurrent() {
        // console.log('Getting data at ', this.pathExpression)
        const query = jp.query(this.data, this.pathExpression);
        return query ? query[0] : null;
    }

    clonePaths() {
        return this.paths ? _.clone(this.paths) : [];
    }

    child(path) {
        const paths = this.clonePaths();

        path.split('/').forEach((section) =>
            paths.push(section)
        );

        return new MockFirebase(this.data, paths, this.transactionSuccess, this.eventCallbacks);
    }

        ref(path)  {
            return this.child(path);
        }

    parent() {
        if (!this.paths || this.paths.length <= 1) {
            throw new Error('Cannot call parent on root');
        }

        const paths = this.clonePaths();
        paths.pop();

        return new MockFirebase(this.data, paths, this.transactionSuccess, this.eventCallbacks);
    }

    once(type, success) {
        if (type !== 'value') throw new Error('Type ' + type + ' not supported');
        const item = this.getCurrent();
        const snapshot = new MockSnapshot(item);

        if (!(typeof success === 'function')) {
            return BbPromise.resolve(snapshot);
        } else {
            success(snapshot);
        }
    }

    set(val) {
        jp.value(this.data, this.pathExpression, val);
        return BbPromise.resolve();
    }

    update(updates) {
        if (!(updates instanceof Object)) {
            return BbPromise.reject('Expected object, got', typeof updates);
        }

        const newObject = Object.assign(this.getCurrent() || {}, updates);

        const cleanObject = util.deepClean(newObject);

        return this.set(cleanObject);
    }

    push(val) {
        const child = val || {};
        const current = this.getCurrent();

        if (!current) return BbPromise.reject(new Error('No item at path', this.pathExpression)); // not sure if this is correct

        let id = shortid.generate();

        while (current[id]) {
            id = shortid.generate();
        }
        current[id] = child;

        if (this.eventCallbacks[this.pathExpression] &&
            this.eventCallbacks[this.pathExpression]['child_added'] &&
            this.eventCallbacks[this.pathExpression]['child_added'].length > 0) {
                this.eventCallbacks[this.pathExpression]['child_added'].forEach(function(cb) {
                    cb({ val: () => child });
                });
            }

        return BbPromise.resolve(new MockSnapshot(current[id]));
    }

    transaction(valueFn, cb) {
        const item = this.getCurrent();
        const set = this.set.bind(this);
        const transactionSuccess = this.transactionSuccess;

        const transactionPromise = new BbPromise((resolve, reject) => {
            console.log('using data: ', item);
            if (!transactionSuccess) {
                resolve({
                    committed: false,
                    snapshot: new MockSnapshot(item),
                });
                return;
            }

            const newData = valueFn(item);
            const snapshot = new MockSnapshot(newData);
            if (newData === undefined) {
                resolve({
                    committed: false,
                    snapshot: snapshot
                });
                return;
            }

            set(newData)
                .then(() => resolve({
                    committed: true,
                    snapshot: snapshot
                }))
                .catch(reject);
        });

        // In case there's a callback call it
        if (!(typeof cb === 'function')) {
            return transactionPromise;
        } else {
            transactionPromise
                .then(result => {
                    return cb(null, result.committed, result.snapshot);
                }).catch(err => {
                    cb(err, false, {});
                });
        }
    }

    on(eventType, callback) {
        if (!this.eventCallbacks[this.pathExpression]) {
            this.eventCallbacks[this.pathExpression] = {};
        }

        if (!this.eventCallbacks[this.pathExpression][eventType]) {
            this.eventCallbacks[this.pathExpression][eventType] = [];
        }

        this.eventCallbacks[this.pathExpression][eventType].push(callback);
    }

    off(eventType, callback) {
        let removeAllCallbacks = true;

        if (callback) {
            removeAllCallbacks = false;
        }

        if (!this.eventCallbacks[this.pathExpression]) {
            throw new Error('No callbacks registered for path', this.pathExpression);
        }

        if (!this.eventCallbacks[this.pathExpression][eventType]) {
            throw new Error('No callbacks registered for event type', eventType, 'at path', this.pathExpression);
        }

        if (removeAllCallbacks) {
            delete this.eventCallbacks[this.pathExpression][eventType];
        } else {
            this.eventCallbacks[this.pathExpression][eventType] = this.eventCallbacks[this.pathExpression][eventType].filter(function(element) {
                return callback !== element;
            });
        }
    }
}

module.exports = MockFirebase;