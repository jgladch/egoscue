#! /usr/bin/env node

'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _progress = require('progress');

var _progress2 = _interopRequireDefault(_progress);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var gm = require('gm');
_bluebird2.default.promisifyAll(gm.prototype);
var fs = _bluebird2.default.promisifyAll(require('fs'));

var egoscuePath = '/Users/jgladch/Google\ Drive/Personal/Sun\ Shen/DaJie\ Work/Egoscue';
var clientPath = void 0;
var clientFiles = void 0;
var tempDir = _path2.default.join(__dirname, '..', 'temp');

var fileName = (0, _moment2.default)().format('M-D-YYYY');
var sessionNum = void 0;
var bar = void 0;

var cleanClientList = function cleanClientList(files) {
  var rejectNames = ['Icon\r', 'Photo Template.gdraw', '.DS_Store', 'Clients', 'Forms'];
  return _lodash2.default.filter(files, function (file) {
    return !_lodash2.default.includes(rejectNames, file);
  });
};

var cleanClientFiles = function cleanClientFiles(files) {
  return _lodash2.default.filter(files, function (file) {
    return _lodash2.default.includes(file, '.jpeg');
  });
};

fs.readdirAsync(egoscuePath).then(function (files) {
  files = cleanClientList(files);

  return _inquirer2.default.prompt([{
    type: 'list',
    name: 'clientPrompt',
    message: 'Which client?',
    choices: _lodash2.default.map(files, function (file) {
      return {
        name: file,
        value: file,
        short: file
      };
    })
  }]);
}).then(function (answers) {
  console.log('You selected ' + answers.clientPrompt);
  clientPath = egoscuePath + '/' + answers.clientPrompt;
  return fs.readdirAsync(egoscuePath + '/' + answers.clientPrompt);
}).then(function (files) {
  clientFiles = cleanClientFiles(files);
  if (clientFiles.length === 4) {
    console.log('There are 4 photos ready for this client...');

    return _inquirer2.default.prompt([{
      type: 'input',
      name: 'sessionNum',
      message: 'What number session is this?'
    }]);
  } else {
    console.log('There are no photos for this client yet...');
    process.exit(0);
  }
}).then(function (answers) {
  sessionNum = answers.sessionNum;

  bar = new _progress2.default('Generating new composite photo: [:bar]', {
    total: 9,
    width: 100
  });

  return gm(clientPath + '/' + clientFiles[0]).resize(1275).rotate('#FFF', 90).append(clientPath + '/' + clientFiles[1]).append(true).writeAsync(tempDir + '/top.jpg');
}).then(function () {
  bar.tick();
  return gm(clientPath + '/' + clientFiles[2]).resize(1275).rotate('#FFF', 90).append(clientPath + '/' + clientFiles[3]).append(true).writeAsync(tempDir + '/bottom.jpg');
}).then(function () {
  bar.tick();
  return fs.mkdirAsync(clientPath + '/' + fileName);
}).then(function () {
  bar.tick();
  return fs.mkdirAsync(clientPath + '/' + fileName + '/archive');
}).then(function () {
  bar.tick();
  return gm(tempDir + '/top.jpg').resize(2550).append(tempDir + '/bottom.jpg').append(false).writeAsync(clientPath + '/' + fileName + '/' + fileName + '.jpg');
}).then(function () {
  bar.tick();

  var promises = _lodash2.default.map(clientFiles, function (file) {
    return fs.renameAsync(clientPath + '/' + file, clientPath + '/' + fileName + '/archive/' + file);
  });

  return _bluebird2.default.all(promises);
}).then(function () {
  bar.tick();
  return gm(clientPath + '/' + fileName + '/' + fileName + '.jpg').rotate('#FFF', -90).fill('#FFFFFF').fontSize('100px').drawText(110, 110, '#' + sessionNum + ' ' + fileName, 'NorthEast').writeAsync(clientPath + '/' + fileName + '/' + fileName + '.jpg');
}).then(function () {
  bar.tick();
  return fs.unlinkAsync(tempDir + '/top.jpg');
}).then(function () {
  bar.tick();
  return fs.unlinkAsync(tempDir + '/bottom.jpg');
}).then(function () {
  bar.tick();
  console.log('Finished!');
}).error(function (err) {
  console.log('err: ', err);
});