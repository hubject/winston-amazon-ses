/*
 * winston-amazon-ses.js: Transport for outputting logs to email using Amazon Simple Email Service (SES)
 *
 * (C) 2010 Juan Pablo Garcia Dalolla
 * MIT LICENCE
 */

var util      = require('util');
var os        = require('os');
var AmazonSES = require('amazon-ses');
var winston   = require('winston');
var _         = require('underscore');

// Set Underscore to Mustache style templates

function template(text, obj) {
  return _.template(text,obj, {
    interpolate : /\{\{(.+?)\}\}/g
  });
}

/**
 * @constructs SES
 * @param {object} options hash of options
 */

var SES = exports.SES = function (options) {
  options = options || {};

  if(!options.to){
    throw "winston-amazon-ses requires 'to' property";
  }

  if(!options.accessKey){
    throw "winston-amazon-ses requires 'accessKey' property";
  }

  if(!options.secretKey){
    throw "winston-amazon-ses requires 'secretKey' property";
  }


  this.name       = 'ses';
  this.to         = _.flatten([options.to]);
  this.from       = options.from                   || "winston@" + os.hostname();
  this.level      = options.level                  || 'info';
  this.silent     = options.silent                 || false;
  this.subject    = options.subject ? template(options.subject) : template("winston: {{level}} {{msg}}");

  this.handleExceptions = options.handleExceptions || false;

  this.server  = new AmazonSES(options.accessKey, options.secretKey);
};

/** @extends winston.Transport */
util.inherits(SES, winston.Transport);

/**
 * Define a getter so that `winston.transports.MongoDB`
 * is available and thus backwards compatible.
 */
winston.transports.SES = SES;

/**
 * Core logging method exposed to Winston. Metadata is optional.
 * @function log
 * @member SES
 * @param level {string} Level at which to log the message
 * @param msg {string} Message to log
 * @param meta {Object} **Optional** Additional metadata to attach
 * @param callback {function} Continuation to respond to when complete.
 */
SES.prototype.log = function (level, msg, meta, callback) {
  var self = this;
  if (this.silent) return callback(null, true);

  if (meta) // add some pretty printing
    meta = util.inspect(meta, null, 5);

  var body = meta ?  msg + "\n\n" + meta : msg;

  var message = {
      from: this.from,
      to: this.to,
      subject: this.subject({level: level, msg: msg}),
      body: {
          html: body
    }
  };

  this.server.send(message, function (err) {
    if (err) self.emit('error', err);
    self.emit('logged');
    callback(null, true);
  });
};
