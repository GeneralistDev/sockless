'use strict';

const firebase = require('firebase');

module.exports = function (firebaseDatabaseObject, firebaseSocklessPath) {
    let fb = null;
    let fbSockPath = 'sockless';

    let subscribedTopics = {};

    const subscribeTopic = (topicId, userCallback, options) => {
        if (!topicId) {
            throw new Error('topicId cannot be null or undefined');
        }

        if (!userCallback) {
            throw new Error('callback cannot be null or undefined');
        }

        let callback = function (ds) {
            let val = ds.val();
            userCallback(val);
        };

        if (options && options.once === true) {
            callback = function (ds) {
                unsubscribeTopic(topicId, callback);
                let val = ds.val();
                userCallback(val);
            }
        }

        if (subscribedTopics[topicId]) {
            subscribedTopics[topicId].ref.on('child_added', callback);
            subscribedTopics[topicId].count++;
        } else {
            subscribedTopics[topicId] = {};
            subscribedTopics[topicId].ref = fb.ref(fbSockPath).child(topicId);
            subscribedTopics[topicId].ref.on('child_added', callback);
            subscribedTopics[topicId].count = 1;
        }

        return callback;
    };

    const unsubscribeTopic = (topicId, callback) => {
        if (!topicId) {
            throw new Error('topicId cannot be null or undefined');
        }

        if (subscribedTopics[topicId] && subscribedTopics[topicId].count > 0) {
            subscribedTopics[topicId].ref.off('child_added', callback);
            subscribedTopics[topicId].count--;
        }

        if (subscribedTopics[topicId] && subscribedTopics[topicId].count === 0) {
            delete subscribedTopics[topicId];
        }
    };

    const emitMessage = (topicId, message) => {
        if (!topicId) {
            throw new Error('topicId cannot be null or undefined');
        }

        if (!message) {
            throw new Error('message must not be null or undefined');
        }

        fb.ref(fbSockPath).child(topicId).push({
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            message: message,
        });
    };

    const sockless = {
        when: subscribeTopic,
        close: unsubscribeTopic,
        emit: emitMessage,
    };

    if (!firebaseDatabaseObject) {
        throw new Error('You must provide an initialised firebase database object. See https://firebase.google.com/docs/reference/js/firebase.database');
    }

    if (firebaseSocklessPath) {
        fbSockPath = firebaseSocklessPath;
    }

    fb = firebaseDatabaseObject;
    return sockless;
};