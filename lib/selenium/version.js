
/*
Copyright (c) 2014, Groupon, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

Neither the name of GROUPON nor the names of its contributors may be
used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var FALLBACK_SELENIUM_VERSION, FORCE_SELENIUM_VERSION, buildDownloadUrl, find, getLatestVersion, getMinor, parseSelenium, parseSeleniumMinor, parseXml, request, requestXml;

buildDownloadUrl = function(version, minorVersion) {
  return "http://selenium-release.storage.googleapis.com/" + minorVersion + "/selenium-server-standalone-" + version + ".jar";
};

FALLBACK_SELENIUM_VERSION = '2.53.0';

FORCE_SELENIUM_VERSION = {
  downloadUrl: buildDownloadUrl('2.53.0', '2.53'),
  version: '2.53.0'
};

request = require('request');

parseXml = require('xml2js').parseString;

find = require('underscore').find;

parseSeleniumMinor = function(result) {
  var error, error1, minorVersion, parseError, prefix, prefixes, versionPath;
  minorVersion = null;
  error = null;
  try {
    prefixes = result.ListBucketResult.CommonPrefixes;
    prefix = prefixes[prefixes.length - 2];
    versionPath = prefix.Prefix[0];
    minorVersion = versionPath.substring(0, versionPath.length - 1);
  } catch (error1) {
    parseError = error1;
    error = parseError;
  }
  return {
    error: error,
    minorVersion: minorVersion
  };
};

parseSelenium = function(result) {
  var content, contents, error, error1, parseError, version;
  version = null;
  error = null;
  try {
    contents = result.ListBucketResult.Contents;
    content = find(contents, function(content) {
      return content.Key[0].match(/selenium-server-standalone-/);
    });
    version = content.Key[0].match(/(\d+\.\d+\.\d+)/)[0];
  } catch (error1) {
    parseError = error1;
    error = parseError;
  }
  return {
    error: error,
    version: version
  };
};

requestXml = function(url, callback) {
  return request(url, function(error, response, body) {
    if (error != null) {
      return callback(error);
    }
    return parseXml(body, function(error, result) {
      if (error != null) {
        return callback(error);
      }
      return callback(null, result);
    });
  });
};

getMinor = function(version) {
  return version.split('.').slice(0, 2).join('.');
};

getLatestVersion = function(callback) {
  var url;
  url = 'http://selenium-release.storage.googleapis.com/?delimiter=/&prefix=';
  return requestXml(url, function(error, result) {
    var minorVersion, ref;
    if (error != null) {
      return callback(error);
    }
    ref = parseSeleniumMinor(result), error = ref.error, minorVersion = ref.minorVersion;
    if (error != null) {
      return callback(error);
    }
    return requestXml("http://selenium-release.storage.googleapis.com/?delimiter=/&prefix=" + minorVersion + "/", function(error, result) {
      var ref1, version;
      if (error != null) {
        return callback(error);
      }
      ref1 = parseSelenium(result), error = ref1.error, version = ref1.version;
      return callback(error, version);
    });
  });
};

module.exports = function(callback) {
  if (FORCE_SELENIUM_VERSION != null) {
    return callback(null, FORCE_SELENIUM_VERSION);
  }
  return getLatestVersion(function(error, version) {
    var downloadUrl, minorVersion;
    if (error != null) {
      version = FALLBACK_SELENIUM_VERSION;
      console.log("[testium] Unable to determine latest version of selenium standalone server; using " + version);
      console.error(error.stack || error);
    }
    minorVersion = getMinor(version);
    downloadUrl = buildDownloadUrl(version, minorVersion);
    return callback(null, {
      downloadUrl: downloadUrl,
      version: version
    });
  });
};
