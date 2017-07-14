'use strict';

const _ = require('lodash');

function arrayToObject(inArray) {
    return _.reduce(inArray, (accum, val, key) => {
        accum[key] = val;
        return accum;
    }, {});
}

function deepClean(object) {
    _.forEach(Object.keys(object), function (key) {
        if (Array.isArray(object[key])) {
            if (object[key].length === 0) {
                delete object[key];
            } else {
                object[key] = arrayToObject(object[key]);
            }
        } else if (object[key] instanceof Object) {
            object[key] = deepClean(object[key]);
        } else if (typeof object[key] === "string" && object[key].length === 0) {
            delete object[key];
        } else if (object[key] === null || object[key] === undefined) {
            delete object[key];
        }
    });

    return object;
}

module.exports = {
    arrayToObject,
    deepClean,
};