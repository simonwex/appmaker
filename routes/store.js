/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var knox = require('knox');
var shortid = require('shortid');
var ejs = require('ejs-locals/node_modules/ejs');
var fs = require('fs');
var uuid = require('node-uuid');

var __knoxClient;
var __compiledPublishEJSTemplate;
var __urlPrefix;
var _s3ObjectPrefix;

function sendKnoxHTMLRequest (filename, data, callback) {
  var knoxReq = __knoxClient.put(filename, {
    'x-amz-acl': 'public-read',
    'Content-Length': Buffer.byteLength(data, 'utf8'),
    'Content-Type': 'text/html'
  });

  knoxReq.on('response', callback);
  knoxReq.end(data);
}

exports._init = function (key, secret, bucket, objectPrefix, viewsPath, urlPrefix) {
  _s3ObjectPrefix = objectPrefix || '';

  __knoxClient = knox.createClient({
    key: key,
    secret: secret,
    bucket: bucket
  });

  fs.readFile(viewsPath + '/publish.ejs', 'utf8', function (err, data) {
    __compiledPublishEJSTemplate = ejs.compile(data);
  });

  __urlPrefix = urlPrefix;
};

exports.publish = function(req, res) {
  var filename = shortid.generate();
  var inputData = req.body;

  var outputStr = __compiledPublishEJSTemplate({
    content: inputData.html
  });

  sendKnoxHTMLRequest(_s3ObjectPrefix + '/' + filename, outputStr, function (knoxRes) {
    if (200 == knoxRes.statusCode) {
      res.json({error: null, filename: __urlPrefix + '/' + _s3ObjectPrefix + '/' + filename}, 200);
    }
    else {
      res.send('Couldn\'t save to S3', 500);
    }
  });
};

// Server-side gen of ID since we'll likely eventually use this for persistance
exports.uuid = function (req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.send(uuid.v1());
};
