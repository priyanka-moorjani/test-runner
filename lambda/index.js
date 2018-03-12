'use strict';
const request = require('request-promise');
const _get = require('lodash/get');
const _includes = require('lodash/includes');
const token = '8957b46d70ee24d34467d1cab97fcb7fc386a3af';
const TEST_RUNNER_URL = 'http://05feb637.ngrok.io';
const actions = ['reopen', 'open'];


const STATUS_SUCCESS = 'success';
const STATUS_PENDING = 'pending';
const STATUS_FAIL = 'failure';
const STATUS_ERROR = 'error';


const statusRequest = {
    state: "pending",
    target_url: "",
    description: "pending",
    context: "mercury unit test"
};

var headers =  {
    'Content-Type': 'application/json',
    'user-agent': 'node.js',
    'Authorization': 'token ' + token
};

module.exports.handler = (event, context, callback) => {

    var response = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { },
        body: '{}'
    };

    callback(null, response);

    var body = event.body? JSON.parse(event.body): {};
    var statusURl = _get(body, 'pull_request.statuses_url');
    var branch = _get(body, 'pull_request.head.ref');
    var commit = _get(body, 'pull_request.head.sha');
    var action = _get(body, 'action');

    console.log(action);
    var statusRequest = {
        state: STATUS_PENDING,
        description: STATUS_PENDING,
        context: "mercury unit test"
    };

    if (!statusURl || !branch || !_includes(actions, action)) {
        //exit function
        return;
    }

    //update status to pending
    request.post(statusURl, { json: statusRequest, headers: headers })
     //call unit test runner service
    .then((body) => {

        // var state = _get(body, 'state');
        // if(state !== 'pending') return;

        return request.post(TEST_RUNNER_URL, { json: {
            branch: 'master',
            commit: commit
        }});

    })
     //update github status from unit test service response
    .then((body) => {

        if(body === 'Unit Test Pass\n') {
            statusRequest.state = STATUS_SUCCESS;
            statusRequest.description = 'Unit test succeeded';
        } else if (body === 'Unit Test Fail') {
            statusRequest.state = STATUS_FAIL;
            statusRequest.description = 'Unit test failed';
        } else if (body === 'error') {
            statusRequest.state = STATUS_ERROR;
            statusRequest.description = "Error running unit test";

        }

        if(statusRequest.state === 'pending') return;

        return request.post(statusURl, { json: statusRequest, headers: headers });
    })
    .catch((err) => {
        console.log('Request ERROR');
        console.log(body);
        console.log(err);
    });

};


