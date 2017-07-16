'use strict';

const sockless = require('./sockless');
const MockFirebase = require('./libs/mock-firebase');

let fb = null;

beforeEach(() => {
    fb = new MockFirebase({
        sockless: {
            testevent: {

            }
        }
    });
});

test('constructs a sock and messages are received', () => {
    let sock = new sockless(fb);
    
    let cb = jest.fn();

    sock.when('testevent', cb);

    fb.ref('sockless').child('testevent').push({
        message: 'test'
    });

    expect(cb).toHaveBeenCalledTimes(1);
});

test('deletes all registered callbacks', () => {
    let sock = new sockless(fb);

    let cb = jest.fn();

    sock.when('testevent', cb);

    sock.close('testevent');

    fb.ref('sockless').child('testevent').push({
        message: 'test'
    });

    expect(cb).toHaveBeenCalledTimes(0);
});

test('deletes a specific callback with unsub token', () => {
    let sock = new sockless(fb);

    let cb1 = jest.fn();
    let cb2 = jest.fn();

    let unsub = sock.when('testevent', cb1);
    sock.when('testevent', cb2);

    sock.close('testevent', unsub);

    fb.ref('sockless').child('testevent').push({
        message: 'test'
    });

    expect(cb1).toHaveBeenCalledTimes(0);
    expect(cb2).toHaveBeenCalledTimes(1);
});