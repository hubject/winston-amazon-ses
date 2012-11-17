/*
 * winston-amazon-ses-test.js: Tests for instances of the SES transport
 *
 * (C) 2011 Juan Pablo Garcia Dalolla
 * MIT LICENSE
 */
var vows = require('vows');
var assert = require('assert');
var winston = require('winston');
var AmazonSES = require('amazon-ses');
var sinon = require('sinon');
var helpers = require('winston/test/helpers');

var SES = require('../lib/winston-amazon-ses').SES;

function assertSES (transport) {
  assert.instanceOf(transport, SES);
  assert.isFunction(transport.log);
}

var transport = new (SES)({ to: 'wavded@gmail.com', from: 'dev@server.com', accessKey: 'access-key-id', secretKey: 'secret-access-key' });

var mockSES = sinon.mock(transport.server);
mockSES.expects('send').yields(null).atLeast(9);

vows.describe('winston-amazon-ses').addBatch({
 "An instance of the SES Transport": {
   "should have the proper methods defined": function () {
     assertSES(transport);
   },
   "the log() method": helpers.testNpmLevels(transport, "should log messages to SES", function (ign, err, logged) {
     assert.isTrue(!err);
     assert.isTrue(logged);
     mockSES.verify();
   })
 }
}).export(module);
