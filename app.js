var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var os = require('os');

var index = require('./routes/index');
var v1 = require('./routes/v1');
//var endpoint = require('./routes/endpoint');
var fileProp = 'config.properties';

var _f = JSON.parse(fs.readFileSync(fileProp, 'utf8'));

var app = express();

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use('/'+_f.pathMainWeb+'/endpoint', endpoint);
app.use('/'+_f.pathMainWeb+'/v1/', v1);
app.use('/', index);
//app.use('/'+_f.pathMainWeb+'/test/', express.static('test'));




app.listen(3000, function() {
    console.info("Servidor Iniciat");
});
//
app.use(function(req, res) {
    res.status(404).sendFile(__dirname+'/404.html');
});

app.use(function(err, req, res, next) {
    res.status(500).sendFile(__dirname+'/500.html');
});

//module.exports = app;
