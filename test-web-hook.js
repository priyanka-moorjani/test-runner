'use strict';

const express = require('express');
const bodyParser = require("body-parser");
const util = require('util');
const http = require('http');
const request = require('request');


// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());

app.post('/', (req, res) => {

  var payload = res.body.payload;
  var body = JSON.parse(body);
  var pr = body.pull_request;
  var statusURl = body.statuses_url;

  console.log('statusURL: ' + statusURl);
  // var options =. {
  //   host: '',
  //   path: '',
  //   port: ''
  //   method: 'post'
  // }
  var options = {
    uri: statusURl,
    method: 'POST',
    // body: '',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  var statusRequest = {
    state: "success",
    target_url: "",
    description: "test passed"
    context: "continuous-integration"
  };

  options.body = JSON.stringify(statusRequest);

  request.post(options, (err, response) => {
    if (err) {
      console.log('error');
      console.log(err);
    } else {
      console.log('success');
      console.log(response);
    }

    res.send('got it');
  });

 });

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);