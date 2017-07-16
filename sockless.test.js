'use strict';

const sockless = require('./sockless');
const MockFirebase = require('./libs/mock-firebase');

let fb = null;

beforeEach(() => {
    fb = new MockFirebase({
        sockless: {
            testevent: {

            }
        },
        custom: {
            testevent: {
                
            }
        }
    });
});

test('test failure to construct when firebase object not provided', () => {
    expect(() => {
        new sockless();
    }).toThrow();
});

test('construct a sock with custom firebase path', () => {
    let sock = new sockless(fb, 'custom');
    
    let cb = jest.fn();

    sock.when('testevent', cb);

    fb.ref('custom').child('testevent').push({
        message: 'test'
    });

    expect(cb).toHaveBeenCalledTimes(1);
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

test('single message subscribe only invokes callback once', () => {
    let sock = new sockless(fb);
    
    let cb = jest.fn();

    sock.when('testevent', cb, {
        once: true
    });

    fb.ref('sockless').child('testevent').push({
        message: 'test'
    });

    fb.ref('sockless').child('testevent').push({
        message: 'test2'
    });

    expect(cb).toHaveBeenCalledTimes(1);
});

test('unsubscribe when never subscribed', () => {
    let sock = new sockless(fb);

    let cb = jest.fn();

    sock.when('testevent', cb);

    sock.close('testevent');

    sock.close('testevent');

    fb.ref('sockless').child('testevent').push({
        message: 'test'
    });

    expect(cb).toHaveBeenCalledTimes(0);
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

test('should write when emitting', () => {
    let sock = new sockless(fb);

    sock.emit('testevent', {
        message: 'test'
    });

    const data = fb.getData();

    const entry = data.sockless.testevent[Object.keys(data.sockless.testevent)[0]];

    expect(entry).toEqual({
        message: {
            message: "test"
        },
        timestamp: {
            ".sv": "timestamp"
        }
    });
});

test('should throw error when no topic supplied to emit', () => {
    let sock = new sockless(fb);

    let cb = jest.fn();

    expect(() => {
        sock.emit();
    }).toThrow();
});

test('should throw error when no message supplied to emit', () => {
    let sock = new sockless(fb);

    let cb = jest.fn();

    expect(() => {
        sock.emit('testevent');
    }).toThrow();
});

test('should throw error when no topicId supplied to unsub', () => {
    let sock = new sockless(fb);

    let cb = jest.fn();

    expect(() => {
        sock.close();
    }).toThrow();
});

test('should throw error when no topic supplied to emit', () => {
    let sock = new sockless(fb);

    let cb = jest.fn();

    expect(() => {
        sock.when();
    }).toThrow();
});

test('should throw error when no message supplied to emit', () => {
    let sock = new sockless(fb);

    let cb = jest.fn();

    expect(() => {
        sock.when('testevent');
    }).toThrow();
});