'use strict';

const express = require('express');
const bodyParser = require("body-parser");
const request = require('request');
const token = '8957b46d70ee24d34467d1cab97fcb7fc386a3af';

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(bodyParser.urlencoded({extended: false }));

app.use(bodyParser.json());

app.get('/callback', (req) => {
  var sessionCode;
});

app.post('/', (req, res) => {

  if (!req.body) {
    res.send('no body');
  }

  var event = req.get('HTTP_X_GITHUB_EVENT');
  var payload = req.body.payload;
  var body = JSON.parse(payload);
  var pr = body.pull_request;
  var statusURl = pr.statuses_url;
  var branch = pr.head.ref;
  var authToken = '';

  console.log('branch: ' + branch);
  console.log('statusURL: ' + statusURl);

  var headers =  {
    'Content-Type': 'application/json',
    'user-agent': 'node.js',
    'Authorization': 'token ' + token
  };

  var statusRequest = {
    state: "pending",
    target_url: "",
    description: "pending",
    context: "mercury unit test"
  };

  res.send('request started');

  request.post(statusURl, { json: statusRequest, headers: headers }, (err, response, body) => {

    if (err) {

      console.log('error');
      console.log(err);
      res.send('error');

    } else {

      console.log('pending');
      console.log(response.statusCode);
      console.log(body);

      //run unit test
      request.post('http://localhost:49160', {
        json: {
          branch: branch
        }
      }, (err, response, body) => {
        console.log(body);

        if (err) {
          statusRequest.state = 'error';
          statusRequest.description = 'something went wrong';
        }

        if(body === 'Unit Test Pass\n') {
          console.log('succes');
          statusRequest.state = 'success';
          statusRequest.description = 'Unit test succeeded';

        } else if (body === 'Unit Test Fail') {
          console.log('fail');
          statusRequest.state = 'failure';
          statusRequest.description = 'Unit test failed';
        }

        console.log(statusRequest);
        request.post(statusURl, { json: statusRequest, headers: headers }, (err, resp, body) => {
          if(err) {
            console.log('err ' + err);
          }

          console.log('body ' + body);
        });

      });
    }
  });

 });


app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);