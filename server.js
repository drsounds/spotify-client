var express = require('express');
var evh = require('express-vhost');
var execPath = process.env.PWD;

console.log(execPath);


var www = require('./www.js');
var api = require('./api.js');
var appfinder = require('./appfinder.js');
var server = express();
server.use('/apps', appfinder);
server.use('/api', api);
server.use('/', www);
server.listen(9261);

