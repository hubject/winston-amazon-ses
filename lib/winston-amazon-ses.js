/*
 * winston-amazon-ses.js: Transport for outputting logs to email using Amazon Simple Email Service (SES)
 *
 * (C) 2010 Juan Pablo Garcia Dalolla
 * MIT LICENCE
 */

var util = require('util');
var os = require('os');
var AmazonSES = require('amazon-ses');
var winston = require('winston');
var _ = require('underscore');

// Set Underscore to Mustache style templates

function template(text, obj) {
    return _.template(text, obj, {
        interpolate: /\{\{(.+?)\}\}/g
    });
}

/**
 * @constructs SES
 * @param {object} options hash of options
 */

var SES = exports.SES = function(options) {
    winston.Transport.call(this, options);
    options = options || {};

    if (!options.to) {
        throw "winston-amazon-ses requires 'to' property";
    }

    if (!options.accessKey) {
        throw "winston-amazon-ses requires 'accessKey' property";
    }

    if (!options.secretKey) {
        throw "winston-amazon-ses requires 'secretKey' property";
    }


    this.name = 'ses';
    this.to = _.flatten([options.to]);
    this.from = options.from || "winston@" + os.hostname();
    this.silent = options.silent || false;
    this.label = options.label || 'winston';
    this.subject = options.subject ? template(options.subject) : template(this.label + ": {{subject}}");

    this.handleExceptions = options.handleExceptions || false;

    this.server = new AmazonSES(options.accessKey, options.secretKey);

    this.waitUntilSend = options.waitUntilSend || 0;
    this.messageQueueLimit = options.messageQueueLimit || 500;
    this.messageQueue = [];
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
 * @param [meta] {Object} **Optional** Additional metadata to attach
 * @param [callback] {function} Continuation to respond to when complete.
 */
SES.prototype.log = function(level, msg, meta, callback) {

    if (this.silent) return callback && callback(null, true);

    this._push(msg, meta);
    this._initSending();
    this.emit('logged');

    callback && callback(null, true);
};

/**
 * Pushes logging message to queue
 * @param level {string} Level at which to log the message
 * @param msg {string} Message to log
 * @param meta {Object} **Optional** Additional metadata to attach
 * @private
 */
SES.prototype._push = function(level, msg, meta) {

    this.messageQueue.push({level: level, msg: msg, meta: meta});
};

/**
 * Clears message queue
 * @private
 */
SES.prototype._clear = function() {

    this.messageQueue.length = 0;
};

/**
 * Sends all messages of the queue after specified delay (waitUntilSend) unless
 * _initSending is called again
 * @private
 */
SES.prototype._initSending = function() {
    var self = this;

    // send immediately if limit is reached
    var waitUntilSend = this._isMessageQueueLimitReached() ? 0 : this.waitUntilSend;

    clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(function() {

        var message = self._getFormattedMessages();

        self.server.send({
            from: this.from,
            to: this.to,
            subject: self.subject(message),
            body: {
                html: message.body
            }
        }, function(err) {
            if(err) {
                console.error(err);
                self.emit('mail.error');
            }
        });

        self._clear();
        self.emit('mail.sending');

    }, waitUntilSend);
};

/**
 * Formats messages of queue to one subject and one body string
 * @returns {{subject: string, body: string}}
 * @private
 */
SES.prototype._getFormattedMessages = function() {

    var preSubject = {};
    var body = '';

    this.messageQueue.forEach(function(message) {

        var msg = message.msg;
        var level = message.level;
        var meta = message.meta;

        body += msg + "<br />";

        if (meta) {
            body += ('<h3>Metadata</h3><p>' + util.inspect(meta, true, null) + '</p>');

            if (meta.stack) {
                meta.stack = (typeof meta.stack == 'object') ? util.inspect(meta.stack, true, null) : meta.stack;
                body += ('<h3>Stack trace</h3><p>' + meta.stack.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;') + '</p>');
            }
        }
        body += '<br>---------------------------<br><br>';

        var _subject = '(' + level + ') ' + msg;

        preSubject[_subject] = (preSubject[_subject] || 0) + 1;
    });

    var subject = Object
        .keys(preSubject)
        .map(function(_subject) { return _subject + ' (' + preSubject[_subject] + ')' })
        .join(', ')
    ;

    return {subject: subject, body: body};
};

/**
 * Returns true if message queue limit is reached
 * @returns {boolean}
 * @private
 */
SES.prototype._isMessageQueueLimitReached = function() {
    return this.messageQueueLimit <= this.messageQueue.length;
};
