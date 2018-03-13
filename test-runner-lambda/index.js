'use strict';
const request = require('request-promise');
const _get = require('lodash/get');
const _includes = require('lodash/includes');
const GIT_TOKEN = process.env.Token;
const TEST_RUNNER_URL = process.env.Test_Runner_Url;
const actions = ['reopened', 'opened', 'synchronize'];


const STATUS_SUCCESS = 'success';
const STATUS_PENDING = 'pending';
const STATUS_FAIL = 'failure';
const STATUS_ERROR = 'error';


var headers =  {
    'Content-Type': 'application/json',
    'user-agent': 'node.js',
    'Authorization': 'token ' + GIT_TOKEN
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
            branch: branch,
            commit: commit
        }});

    })
     //update github status from unit test service response
    .then((body) => {

        var status = _get(body, 'status');

        if(status === 'pass') {
            statusRequest.state = STATUS_SUCCESS;
            statusRequest.description = 'Unit test succeeded';
        } else if (status === 'fail') {
            statusRequest.state = STATUS_FAIL;
            statusRequest.description = 'Unit test failed';
        } else if (status === 'error') {
            statusRequest.state = STATUS_ERROR;
            statusRequest.description = "Error running unit test";
        }

        if(statusRequest.state === STATUS_PENDING) return;

        return request.post(statusURl, { json: statusRequest, headers: headers });
    })
    .catch((err) => {
        console.log('Request ERROR');
        console.log(body);
        console.log(err);
    });

};


