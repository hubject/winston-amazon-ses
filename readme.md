# winston-amazon-ses [![Build Status](https://secure.travis-ci.org/jpgarcia/winston-amazon-ses.png)](http://travis-ci.org/jpgarcia/winston-amazon-ses)

A email transport for [winston][0] using Amazon Simple Email Service (SES) inspired in [winston-mail](https://github.com/wavded/winston-mail).

## Installation

### Installing npm (node package manager)

``` sh
  $ curl http://npmjs.org/install.sh | sh
```

### Installing winston-amazon-ses

``` sh
  $ npm install winston
  $ npm install winston-amazon-ses
```

## Usage
``` js
  var winston = require('winston');

  //
  // Requiring `winston-amazon-ses` will expose
  // `winston.transports.SES`
  //
  require('winston-amazon-ses').SES;

  winston.add(winston.transports.SES, options);
```

The SES transport uses [node-amazon-ses](https://github.com/jjenkins/node-amazon-ses.git) behind the scenes.  Options are the following:

* __to:__ The address(es) you want to send to. *[required]*
* __accessKey__: AWS SES access key. *[required]*
* __secretKey__: AWS SES secret key. *[required]*
* __from:__ The address you want to send from. (default: `winston@[server-host-name]`)
* __subject__ Subject for email (default: winston: {{level}} {{msg}})
* __level:__ Level of messages that this transport should log.
* __silent:__ Boolean flag indicating whether to suppress output.

[0]: https://github.com/flatiron/winston