'use strict';

const express = require('express');
const bodyParser = require("body-parser");
const git = require('nodegit');
const path = require('path');
const _get = require('lodash/get');
const local = path.join.bind(path, __dirname);
const { exec } = require('child_process');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';
const sshPublicKeyPath = local("./id_rsa.pub");
const sshPrivateKeyPath = local("./id_rsa");

// App
const app = express();

app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());

app.get('/healthCheck', (res) => {
 console.log('Health Check') ;
 res.send('Ok');
});

app.post('/', (req, res) => {

  console.log(req.body);
  res.setHeader('Content-Type', 'application/json');
  var branch = _get(req, 'body.branch');
  var repository;
  var debug = 0;

  if(!branch) {
    errorHandler('branch not specified');
    return;
  }
  // Open repo and pull branch
  git.Repository.open('./mercury')
  
  .then((repo) => {
    repository = repo;

    return repository.fetch('origin', {

      callbacks: {

        certificateCheck: () => {
            return 1;
        },
        credentials: (url, userName) => {
          // avoid infinite loop when authentication agent is not loaded
          if (debug++ > 10) throw 'Git authorization failed';
          // return git.Cred.sshKeyFromAgent(userName);
          // return git.Cred.defaultNew();
          return git.Cred.sshKeyNew(
              userName,
              sshPublicKeyPath,
              sshPrivateKeyPath,
              "");
        }
      }

    }, true);

  })
  .then(() => {
    return repository.getBranch('refs/remotes/origin/' + branch);
  })
  // check out request branch
  .then((reference) => {
    return repository.checkoutRef(reference);
  //install dependencies and run unit test
  }).then(() => {

    exec('npm install && bower install --allow-root', { cwd: './mercury', maxBuffer: 1024 * 5000 }, (err, stdout, stderr) => {

      if (err) {
        errorHandler(err);
        return;
      }
      
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);


      exec('npm run karma:phantomJS', { cwd: './mercury', maxBuffer: 1024 * 5000 }, (err, stdout, stderr) => {

        if (err) {
          console.log(err);
          console.log('fail');
          res.send(JSON.stringify({ status: 'fail' }));
          return;
        }

        console.log('pass');
        res.send(JSON.stringify({ status: 'pass' }));
      });

    });

  }, errorHandler);


  function errorHandler (err) {
    console.log(err);
    res.send(JSON.stringify({ status: 'error', error: err }));
  }

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);