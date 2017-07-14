'use strict';

const sockless = require('./sockless');
const MockFirebase = require('./libs/mock-firebase');

let fb = new MockFirebase({
    sockless: {
        testevent: {
            
        }
    }
});

test('constructs a sock', () => {
    let sock = new sockless(fb);
    
    let cb = function(message) {
        expect(message).toEqual({
            message: 'test'
        });
    };

    sock.on('testevent', cb);

    fb.ref('sockless').child('testevent').push({
        message: 'test'
    });
});