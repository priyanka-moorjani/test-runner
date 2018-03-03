'use strict';

const express = require('express');
const bodyParser = require("body-parser");
const git = require('nodegit');
const util = require('util');
const { exec } = require('child_process');
// const exec = util.promisify(require('child_process').exec);

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());


app.post('/', (req, res) => {

  console.log(req.body);
  let branch = req.body.branch;
  var repository;

  // Open repo and pull branch
  git.Repository.open('./mercury')
  .then((repo) => {

    repository = repo;
    return repo.getBranch('refs/remotes/origin/' + branch);
  })

  // check out request branch
  .then((reference) => {

    return repository.checkoutRef(reference);

  //install dependencies and run unit test
  }).then(() => {

    // let { err, stdout, stderr } =  await exec('npm run install:dependencies', { cwd: './mercury' });

    // if (err) {
    //   console.log(err);
    //   return 
    // }
      
    // console.log(`stdout: ${stdout}`);
    // console.log(`stderr: ${stderr}`);
    // res.send('Hello world\n');

    // exec('npm run install:dependencies', { cwd: './mercury', maxBuffer: 1024 * 5000 }, (err, stdout, stderr) => {
    exec('npm run install:dependencies', { cwd: './mercury', maxBuffer: 1024 * 5000 }, (err, stdout, stderr) => {

      if (err) {
        console.log(err)
        errorHandler();
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
        res.send('Unit Test Pass\n');
      });

    });

  }, errorHandler);


  function errorHandler () {
    res.send('error');
  }

});






app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);