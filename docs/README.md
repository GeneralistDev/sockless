## What is sockless

Sockless is a serverless websockets library for use with FaaS (Function as a Service) services such as AWS Lambda. 

### The problem
Often serverless architectures result in loss of request context, for example when using DynamoDB streams as part of a workflow. If you want to know when a workflow has completed then until now there hasn't been a simple way to achieve that.

### What sockless does
Sockless uses Google's Firebase data binding functionality to provide a websockets-like replacement for serverless workflows like the one described above. 

### Setup
1. Create a Firebase account and project and follow [this guide](https://firebase.google.com/docs/database/web/start) to learn how to connect to Firebase with javascript.
2. Install `sockless` from npm and include the minified javascript client in your website.
    ```
    npm install sockless --save
    ```
3. Include the `sockless` Node.js library in your FaaS function package

### How to use it
#### Website
```
var config = {
    // Your firebase config
}

firebase.initializeApp(config);

var database = firebase.database();

var sl = new sockless(database);

var cancellationToken = sl.when('myevent', function(message) {
    // Do something
});

sl.close('myevent', cancellationToken);
```

#### FaaS function
The Node.js setup for Firebase is slightly different to web. See [the firebase-admin docs](https://firebase.google.com/docs/admin/setup)

AWS Lambda Node 6.10.x example
```
const admin = require('firebase-admin');
const Sockless = require('sockless');
const serviceAccount = require('./myprivatekey.json');

const firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<DATABASE_NAME>.firebaseio.com"
});

module.exports.handler = function(event, context, callback) {
    const database = firebase.database();
    const sl = new Sockless(database);

    sl.emit('myevent', {
        // Your event data
    });
};
```