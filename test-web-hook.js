'use strict';

const express = require('express');
const bodyParser = require("body-parser");
const util = require('util');


// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());

app.post('/', (req, res) => {

  console.log('request comming in');
  console.log(req.body);
  res.send('got it');

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);