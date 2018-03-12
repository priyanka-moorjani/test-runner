'use strict';

const express = require('express');
const bodyParser = require("body-parser");
const git = require('nodegit');
const util = require('util');
const path = require("path");
const local = path.join.bind(path, __dirname);
const { exec } = require('child_process');
// const exec = util.promisify(require('child_process').exec);

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';
const sshPublicKeyPath = local("./id_rsa.pub");
const sshPrivateKeyPath = local("./id_rsa");

// App
const app = express();

app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());


app.post('/', (req, res) => {

  console.log(req.body);
  var branch = req.body.branch;
  var repository;
  var debug = 0;

  // Open repo and pull branch
  git.Repository.open('./mercury')
  
  .then((repo) => {
    repository = repo;

    return repository.fetch('origin', {

      callbacks: {

        certificateCheck: function() {
            return 1;
        },
        credentials: function(url, userName) {
          // avoid infinite loop when authentication agent is not loaded
          if (debug++ > 10) throw "Authentication agent not loaded.";
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

    // exec('npm run install:dependencies', { cwd: './mercury', maxBuffer: 1024 * 5000 }, (err, stdout, stderr) => {
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
          res.send('Unit Test Fail');
          return;
        }
      
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        res.send('Unit Test Pass');
      });

    });

  }, errorHandler);


  function errorHandler (err) {
    console.log(err);
    res.send('error');
  }

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);