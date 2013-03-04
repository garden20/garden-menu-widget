/*Garden Topbar*/

(function() { var mlt='g',ml=null; if (typeof exports === 'object') {ml=exports;exports=undefined;mlt='r'} else if (typeof define === 'function' && define.amd) {ml=define;define=undefined;mlt='a'} 

/**
 * Adapted for use in the browser and packaged for Kanso by Caolan McMahon.
 * This build does not include IDNA Support in order to avoid the punycode
 * dependency.
 *
 * Adding amd support.
 *
 * @module
 */


// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// IDNA SUPPORT REMOVED FOR KANSO BUILD
//var punycode = require('punycode');

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['querystring'],factory);
    } else {
        root.url = factory(root.querystring);
    }
}(this, function (querystring) {

var exports = {};

// ADDED FOR BROWSER SUPPORT - functions borrowed from underscore.js
var _keys = Object.keys || function(obj) {
  if (obj !== Object(obj)) throw new TypeError('Invalid object');
  var keys = [];
  for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
  return keys;
};
var nativeIndexOf = Array.prototype.indexOf;
var _indexOf = function(array, item) {
  if (array == null) return -1;
  var i, l;
  if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
  for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
  return -1;
};


exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]+$/,
    // RFC 2396: characters reserved for delimiting URLs.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '[', ']', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''],
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    }


function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // cut off any delimiters.
  // This is to support parse stuff like "<http://foo.com>"
  for (var i = 0, l = rest.length; i < l; i++) {
    if (_indexOf(delims, rest.charAt(i)) === -1) break;
  }
  if (i !== 0) rest = rest.substr(i);


  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = rest.indexOf('@');
    if (atSign !== -1) {
      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        var index = rest.indexOf(nonAuthChars[i]);
        if (index !== -1 && index < atSign) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }
      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = rest.substr(0, atSign);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = rest.indexOf(nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = _keys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();


    // IDNA SUPPORT REMOVED FOR KANSO BUILD

    // IDNA Support: Returns a puny coded representation of "domain".
    // It only converts the part of the domain name that
    // has non ASCII characters. I.e. it dosent matter if
    // you call it with a domain that already is in ASCII.
    /*
    var domainArray = out.hostname.split('.');
    var newOut = [];
    for (var i = 0; i < domainArray.length; ++i) {
      var s = domainArray[i];
      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
          'xn--' + punycode.encode(s) : s);
    }
    out.hostname = newOut.join('.');
    */


    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }

    // Now make sure that delims never appear in a url.
    var chop = rest.length;
    for (var i = 0, l = delims.length; i < l; i++) {
      var c = rest.indexOf(delims[i]);
      if (c !== -1) {
        chop = Math.min(c, chop);
      }
    }
    rest = rest.substr(0, chop);
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = auth.split('@').join('%40');
    for (var i = 0, l = nonAuthChars.length; i < l; i++) {
      var nAC = nonAuthChars[i];
      auth = auth.split(nAC).join(encodeURIComponent(nAC));
    }
    auth += '@';
  }

  var protocol = obj.protocol || '',
      host = (obj.host !== undefined) ? auth + obj.host :
          obj.hostname !== undefined ? (
              auth + obj.hostname +
              (obj.port ? ':' + obj.port : '')
          ) :
          false,
      pathname = obj.pathname || '',
      query = obj.query &&
              ((typeof obj.query === 'object' &&
                _keys(obj.query).length) ?
                 querystring.stringify(obj.query) :
                 '') || '',
      search = obj.search || (query && ('?' + query)) || '',
      hash = obj.hash || '';

  if (protocol && protocol.substr(protocol.length - 1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && source.host.indexOf('@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(srcPath.length - 1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(srcPath.join('/').length - 1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && source.host.indexOf('@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    out.port = port.substr(1);
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}
    return exports;
}));
/*global setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root = this,
        previous_async = root.async;

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    //// cross-browser compatiblity functions ////

    var _forEach = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _forEach(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _forEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        async.nextTick = function (fn) {
            setTimeout(fn, 0);
        };
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.forEach = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _forEach(arr, function (x) {
            iterator(x, function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                }
            });
        });
    };

    async.forEachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };

    async.forEachLimit = function (arr, limit, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length || limit <= 0) {
            return callback();
        }
        var completed = 0;
        var started = 0;
        var running = 0;

        (function replenish () {
            if (completed === arr.length) {
                return callback();
            }

            while (running < limit && started < arr.length) {
                started += 1;
                running += 1;
                iterator(arr[started - 1], function (err) {
                    if (err) {
                        callback(err);
                        callback = function () {};
                    }
                    else {
                        completed += 1;
                        running -= 1;
                        if (completed === arr.length) {
                            callback();
                        }
                        else {
                            replenish();
                        }
                    }
                });
            }
        })();
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEach].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);


    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.forEachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _forEach(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _forEach(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    taskComplete();
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    async.parallel = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEach(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.queue = function (worker, concurrency) {
        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _forEach(data, function(task) {
                    q.tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (q.saturated && q.tasks.length == concurrency) {
                        q.saturated();
                    }
                    async.nextTick(q.process);
                });
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if(q.empty && q.tasks.length == 0) q.empty();
                    workers += 1;
                    worker(task.data, function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if(q.drain && q.tasks.length + workers == 0) q.drain();
                        q.process();
                    });
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _forEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define('async', [], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js** and **"CommonJS"**, with
  // backwards-compatibility for the old `require()` API. If we're not in
  // CommonJS, add `_` to the global object via a string identifier for
  // the Closure Compiler "advanced" mode. Registration as an AMD module
  // via define() happens at the end of this file.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(_.flatten(slice.call(arguments, 1)), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n_.escape(" + unescape(code) + ")+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" +
      "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

  // AMD define happens at the end for compatibility with AMD loaders
  // that don't enforce next-turn semantics on modules.
  if (typeof define === 'function' && define.amd) {
    define('underscore', function() {
      var exports = _;
      exports._ = _;
      return exports;
    });
  }

}).call(this);

/**
 * ## Events module
 *
 * This is a browser port of the node.js events module. Many objects and
 * modules emit events and these are instances of events.EventEmitter.
 *

 *
 * Functions can then be attached to objects, to be executed when an event is
 * emitted. These functions are called listeners.
 *
 * @module
 */

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.events = factory();
    }
}(this, function () {
/**
 * To access the EventEmitter class, require('events').EventEmitter.
 *
 * When an EventEmitter instance experiences an error, the typical action is to
 * emit an 'error' event. Error events are treated as a special case. If there
 * is no listener for it, then the default action is for the error to throw.
 *
 * All EventEmitters emit the event 'newListener' when new listeners are added.
 *
 * @name events.EventEmitter
 * @api public
 *
 * ```javascript
 *
 * // create an event emitter
 * var emitter = new EventEmitter();
 * ```
 */
 var exports = {};

var EventEmitter = function () {};

exports.EventEmitter = EventEmitter;

var toString = Object.prototype.toString;

var isArray = Array.isArray || function (obj) {
    return toString.call(obj) === '[object Array]';
};

var _indexOf = function (arr, el) {
    if (arr.indexOf) {
        return arr.indexOf(el);
    }
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) {
            return i;
        }
    }
    return -1;
};


/**
 * By default EventEmitters will print a warning if more than 10 listeners are
 * added for a particular event. This is a useful default which helps finding
 * memory leaks. Obviously not all Emitters should be limited to 10. This
 * function allows that to be increased. Set to zero for unlimited.
 *
 * @name emitter.setMaxListeners(n)
 * @param {Number} n - The maximum number of listeners
 * @api public
 */

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


/**
 * Execute each of the listeners in order with the supplied arguments.
 *
 * @name emitter.emit(event, [arg1], [arg2], [...])
 * @param {String} event - The event name/id to fire
 * @api public
 */

EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};


/**
 * Adds a listener to the end of the listeners array for the specified event.
 *
 * @name emitter.on(event, listener) | emitter.addListener(event, listener)
 * @param {String} event - The event name/id to listen for
 * @param {Function} listener - The function to bind to the event
 * @api public
 *
 * ```javascript
 * session.on('change', function (userCtx) {
 *     console.log('session changed!');
 * });
 * ```
 */

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

/**
 * Adds a one time listener for the event. This listener is invoked only the
 * next time the event is fired, after which it is removed.
 *
 * @name emitter.once(event, listener)
 * @param {String} event- The event name/id to listen for
 * @param {Function} listener - The function to bind to the event
 * @api public
 *
 * ```javascript
 * db.once('unauthorized', function (req) {
 *     // this event listener will fire once, then be unbound
 * });
 * ```
 */

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

/**
 * Remove a listener from the listener array for the specified event. Caution:
 * changes array indices in the listener array behind the listener.
 *
 * @name emitter.removeListener(event, listener)
 * @param {String} event - The event name/id to remove the listener from
 * @param {Function} listener - The listener function to remove
 * @api public
 *
 * ```javascript
 * var callback = function (init) {
 *     console.log('duality app loaded');
 * };
 * devents.on('init', callback);
 * // ...
 * devents.removeListener('init', callback);
 * ```
 */

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = _indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

/**
 * Removes all listeners, or those of the specified event.
 *
 * @name emitter.removeAllListeners([event])
 * @param {String} event - Event name/id to remove all listeners for (optional)
 * @api public
 */

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

/**
 * Returns an array of listeners for the specified event. This array can be
 * manipulated, e.g. to remove listeners.
 *
 * @name emitter.listeners(event)
 * @param {String} events - The event name/id to return listeners for
 * @api public
 *
 * ```javascript
 * session.on('change', function (stream) {
 *     console.log('session changed');
 * });
 * console.log(util.inspect(session.listeners('change'))); // [ [Function] ]
 * ```
 */

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};


/**
 * @name emitter Event: 'newListener'
 *
 * This event is emitted any time someone adds a new listener.
 *
 * ```javascript
 * emitter.on('newListener', function (event, listener) {
 *     // new listener added
 * });
 * ```
 */

return exports;

}));
/*
 * Stately.js: A JavaScript based finite-state machine (FSM) engine.
 *
 * Copyright (c) 2012 Florian Schäfer (florian.schaefer@gmail.com)
 * Released under MIT license.
 *
 * Version: 1.0.0
 *
 */
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Stately = factory();
    }
})(this, function () {

    var
        toString = Object.prototype.toString,

        InvalidStateError = (function () {

            function InvalidStateError(message) {

                this.name = 'InvalidStateError';

                this.message = message;
            }

            InvalidStateError.prototype = new Error();

            InvalidStateError.prototype.constructor = InvalidStateError;

            return InvalidStateError;
        })();

    function Stately(statesObject) {

        if (typeof statesObject === 'function') {

            statesObject = statesObject();
        }

        if (toString.call(statesObject) !== '[object Object]') {

            throw new InvalidStateError('Stately.js: Invalid states object: `' + statesObject + '`.');
        }

        var
            currentState,

            notificationStore = [],

            notify = function () {

                var notifications = notificationStore.slice();

                for (var i = 0, l = notifications.length; i < l; i++) {

                    notifications[i].apply(this, arguments);
                }
            },

            stateStore = {

                getMachineState: function getMachineState() {

                    return currentState.name;
                },

                setMachineState: function setMachineState(nextState /*, eventName */) {

                    var
                        eventName = arguments[1],

                        onBeforeState,

                        onEnterState,

                        onLeaveState,

                        lastState = currentState;

                    if (!nextState || !nextState.name || !stateStore[nextState.name]) {

                        throw new InvalidStateError('Stately.js: Transitioned into invalid state: `' + setMachineState.caller + '`.');
                    }

                    currentState = nextState;

                    onBeforeState = stateMachine['onbefore' + currentState.name];

                    if (onBeforeState && typeof onBeforeState === 'function') {

                        onBeforeState.call(stateStore, eventName, lastState.name, nextState.name);
                    }

                    onEnterState = stateMachine['onenter' + currentState.name] || stateMachine['on' + currentState.name];

                    if (onEnterState && typeof onEnterState === 'function') {

                        onEnterState.call(stateStore, eventName, lastState.name, nextState.name);
                    }

                    onLeaveState = stateMachine['onleave' + lastState.name];

                    if (onLeaveState && typeof onLeaveState === 'function') {

                        onLeaveState.call(stateStore, eventName, lastState.name, nextState.name);
                    }

                    notify.call(stateStore, eventName, lastState.name, nextState.name);

                    return this;
                },

                getMachineEvents: function getMachineEvents() {

                    var events = [];

                    for (var property in currentState) {

                        if (currentState.hasOwnProperty(property)) {

                            if (typeof currentState[property] === 'function') {

                                events.push(property);
                            }
                        }
                    }

                    return events;
                }

            },

            stateMachine = {

                getMachineState: stateStore.getMachineState,

                getMachineEvents: stateStore.getMachineEvents,

                bind: function bind(callback) {

                    if (callback) {

                        notificationStore.push(callback);
                    }

                    return this;
                },

                unbind: function unbind(callback) {

                    if (!callback) {

                        notificationStore = [];

                    } else {

                        for (var i = 0, l = notificationStore.length; i < l; i++) {

                            if (notificationStore[i] === callback) {

                                notificationStore.splice(i, 1);
                            }
                        }
                    }

                    return this;
                }
            },

            transition = function transition(stateName, eventName, nextEvent) {

                return function event() {

                    var
                        onBeforeEvent,

                        onAfterEvent,

                        nextState,

                        eventValue = stateMachine;

                    if (stateStore[stateName] !== currentState) {

                        if (nextEvent) {

                            eventValue = nextEvent.apply(stateStore, arguments);
                        }

                        return eventValue;
                    }

                    onBeforeEvent = stateMachine['onbefore' + eventName];

                    if (onBeforeEvent && typeof onBeforeEvent === 'function') {

                        onBeforeEvent.call(stateStore, eventName, currentState.name, currentState.name);
                    }

                    eventValue = stateStore[stateName][eventName].apply(stateStore, arguments);

                    if (typeof eventValue === 'undefined') {

                        nextState = currentState;

                        eventValue = stateMachine;

                    } else if (toString.call(eventValue) === '[object Object]') {

                        nextState = (eventValue === stateStore ? currentState : eventValue);

                        eventValue = stateMachine;

                    } else if (toString.call(eventValue) === '[object Array]' && eventValue.length >= 1) {

                        nextState = eventValue[0];

                        eventValue = eventValue[1];
                    }

                    onAfterEvent = stateMachine['onafter' + eventName] || stateMachine['on' + eventName];

                    if (onAfterEvent && typeof onAfterEvent === 'function') {

                        onAfterEvent.call(stateStore, eventName, currentState.name, nextState.name);
                    }

                    stateStore.setMachineState(nextState, eventName);

                    return eventValue;
                };
            };

        for (var stateName in statesObject) {

            if (statesObject.hasOwnProperty(stateName)) {

                stateStore[stateName] = statesObject[stateName];

                for (var eventName in stateStore[stateName]) {

                    if (stateStore[stateName].hasOwnProperty(eventName)) {

                        if (typeof stateStore[stateName][eventName] === 'string') {

                            stateStore[stateName][eventName] = (function (stateName) {

                                return function event() {

                                    return this[stateName];
                                };

                            })(stateStore[stateName][eventName]);
                        }

                        if (typeof stateStore[stateName][eventName] === 'function') {

                            stateMachine[eventName] = transition(stateName, eventName, stateMachine[eventName]);
                        }
                    }
                }

                stateStore[stateName].name = stateName;

                if (!currentState) {

                    currentState = stateStore[stateName];
                }
            }
        }

        if (!currentState) {

            throw new InvalidStateError('Stately.js: Invalid initial state.');
        }

        return stateMachine;
    }

    Stately.machine = function machine(statesObject) {
        return new Stately(statesObject);
    };

    Stately.InvalidStateError = InvalidStateError;

    return Stately;

});

/* svg.js v0.5-5-g7a2188b - svg element container fx event group arrange defs mask pattern gradient doc shape wrap rect ellipse line poly path image text nested sugar - svgjs.com/license */
(function (root, factory) {if (typeof exports === 'object') {module.exports = factory(); } else if (typeof define === 'function' && define.amd) {define([],factory); } else {root.jscss = factory(); } }(this, function () {

  this.svg = function(element) {
    return new SVG.Doc(element);
  };
  
  // The main wrapping element
  this.SVG = {
    /* default namespaces */
    ns:    'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',
    
    /* defs id sequence */
    did: 0,
    
    // Method for element creation
    create: function(element) {
      return document.createElementNS(this.ns, element);
    },
    // Method for extending objects
    extend: function(object, module) {
      for (var key in module)
        object.prototype[key] = module[key];
    }
    
  };

  SVG.Element = function Element(node) {
    /* keep reference to the element node */
    if (this.node = node)
      this.type = node.nodeName;
    
    /* initialize attribute store with defaults */
    this.attrs = {
      'fill-opacity':   1,
      'stroke-opacity': 1,
      'stroke-width':   0,
      fill:     '#000',
      stroke:   '#000',
      opacity:  1,
      x:        0,
      y:        0,
      cx:       0,
      cy:       0,
      width:    0,
      height:   0,
      r:        0,
      rx:       0,
      ry:       0
    };
    
    /* initialize transformation store with defaults */
    this.trans = {
      x:        0,
      y:        0,
      scaleX:   1,
      scaleY:   1,
      rotation: 0,
      skewX:    0,
      skewY:    0
    };
  
  };
  
  //
  SVG.extend(SVG.Element, {
    // Move element to given x and y values
    move: function(x, y) {
      return this.attr({
        x: x,
        y: y
      });
    },
    // Move element by its center
    center: function(x, y) {
      var box = this.bbox();
      
      return this.move(x - box.width / 2, y - box.height / 2);
    },
    // Set element size to given width and height
    size: function(width, height) { 
      return this.attr({
        width:  width,
        height: height
      });
    },
    // Clone element
    clone: function() {
      var clone;
      
      /* if this is a wrapped shape */
      if (this instanceof SVG.Wrap) {
        /* build new wrapped shape */
        clone = this.parent[this.child.node.nodeName]();
        clone.attrs = this.attrs;
        
        /* copy child attributes and transformations */
        clone.child.trans = this.child.trans;
        clone.child.attr(this.child.attrs).transform({});
        
        /* re-plot shape */
        if (clone.plot)
          clone.plot(this.child.attrs[this.child instanceof SVG.Path ? 'd' : 'points']);
        
      } else {
        var name = this.node.nodeName;
        
        /* invoke shape method with shape-specific arguments */
        clone = name == 'rect' ?
          this.parent[name](this.attrs.width, this.attrs.height) :
        name == 'ellipse' ?
          this.parent[name](this.attrs.rx * 2, this.attrs.ry * 2) :
        name == 'image' ?
          this.parent[name](this.src) :
        name == 'text' ?
          this.parent[name](this.content) :
        name == 'g' ?
          this.parent.group() :
          this.parent[name]();
        
        clone.attr(this.attrs);
      }
      
      /* copy transformations */
      clone.trans = this.trans;
      
      /* apply attributes and translations */
      return clone.transform({});
    },
    // Remove element
    remove: function() {
      return this.parent != null ? this.parent.remove(this) : void 0;
    },
    // Get parent document
    doc: function() {
      return this._parent(SVG.Doc);
    },
    // Get parent nested document
    nested: function() {
      return this._parent(SVG.Nested);
    },
    // Set svg element attribute
    attr: function(a, v, n) {
      if (arguments.length < 2) {
        /* apply every attribute individually if an object is passed */
        if (typeof a == 'object')
          for (v in a) this.attr(v, a[v]);
        
        /* act as a getter for style attributes */
        else if (this._isStyle(a))
          return a == 'text' ?
                   this.content :
                 a == 'leading' ?
                   this[a] :
                   this.style[a];
        
        /* act as a getter if the first and only argument is not an object */
        else
          return this.attrs[a];
      
      } else {
        /* store value */
        this.attrs[a] = v;
        
        /* treat x differently on text elements */
        if (a == 'x' && this._isText())
          for (var i = this.lines.length - 1; i >= 0; i--)
            this.lines[i].attr(a, v);
        
        /* set the actual attribute */
        else
          n != null ?
            this.node.setAttributeNS(n, a, v) :
            this.node.setAttribute(a, v);
        
        /* if the passed argument belongs to the style as well, add it there */
        if (this._isStyle(a)) {
          a == 'text' ?
            this.text(v) :
          a == 'leading' ?
            this[a] = v :
            this.style[a] = v;
        
          this.text(this.content);
        }
      }
      
      return this;
    },
    // Manage transformations
    transform: function(o) {
      /* act as a getter if the first argument is a string */
      if (typeof o === 'string')
        return this.trans[o];
        
      /* ... otherwise continue as a setter */
      var key, transform = [];
      
      /* merge values */
      for (key in o)
        if (o[key] != null)
          this.trans[key] = o[key];
      
      /* alias current transformations */
      o = this.trans;
      
      /* add rotation */
      if (o.rotation != 0) {
        var box = this.bbox();
        transform.push('rotate(' + o.rotation + ',' + (o.cx != null ? o.cx : box.cx) + ',' + (o.cy != null ? o.cy : box.cy) + ')');
      }
      
      /* add scale */
      transform.push('scale(' + o.scaleX + ',' + o.scaleY + ')');
      
      /* add skew on x axis */
      if (o.skewX != 0)
        transform.push('skewX(' + o.skewX + ')');
      
      /* add skew on y axis */
      if (o.skewY != 0)
        transform.push('skewY(' + o.skewY + ')')
      
      /* add translation */
      transform.push('translate(' + o.x + ',' + o.y + ')');
      
      /* add only te required transformations */
      return this.attr('transform', transform.join(' '));
    },
    // Store data values on svg nodes
    data: function(a, v, r) {
      if (arguments.length < 2) {
        try {
          return JSON.parse(this.attr('data-' + a));
        } catch(e) {
          return this.attr('data-' + a);
        };
        
      } else {
        v === null ?
          this.node.removeAttribute('data-' + a) :
          this.attr('data-' + a, r === true ? v : JSON.stringify(v));
      }
      
      return this;
    },
    // Get bounding box
    bbox: function() {
      /* actual, native bounding box */
      var box = this.node.getBBox();
      
      return {
        /* include translations on x an y */
        x:      box.x + this.trans.x,
        y:      box.y + this.trans.y,
        
        /* add the center */
        cx:     box.x + this.trans.x + box.width  / 2,
        cy:     box.y + this.trans.y + box.height / 2,
        
        /* plain width and height */
        width:  box.width,
        height: box.height
      };
    },
    // Checks whether the given point inside the bounding box of the element
    inside: function(x, y) {
      var box = this.bbox();
      
      return x > box.x &&
             y > box.y &&
             x < box.x + box.width &&
             y < box.y + box.height;
    },
    // Show element
    show: function() {
      this.node.style.display = '';
      
      return this;
    },
    // Hide element
    hide: function() {
      this.node.style.display = 'none';
      
      return this;
    },
    // Is element visible?
    visible: function() {
      return this.node.style.display != 'none';
    },
    // Private: find svg parent by instance
    _parent: function(parent) {
      var element = this;
      
      while (element != null && !(element instanceof parent))
        element = element.parent;
  
      return element;
    },
    // Private: tester method for style detection
    _isStyle: function(attr) {
      return typeof attr == 'string' && this._isText() ? (/^font|text|leading/).test(attr) : false;
    },
    // Private: element type tester
    _isText: function() {
      return this instanceof SVG.Text;
    }
    
  });


  SVG.Container = function Container(element) {
    this.constructor.call(this, element);
  };
  
  // Inherit from SVG.Element
  SVG.Container.prototype = new SVG.Element();
  
  //
  SVG.extend(SVG.Container, {
    // Add given element at a position
    add: function(element, index) {
      if (!this.has(element)) {
        index = index == null ? this.children().length : index;
        this.children().splice(index, 0, element);
        this.node.insertBefore(element.node, this.node.childNodes[index] || null);
        element.parent = this;
      }
      
      return this;
    },
    // Basically does the same as `add()` but returns the added element
    put: function(element, index) {
      this.add(element, index);
      return element;
    },
    // Checks if the given element is a child
    has: function(element) {
      return this.children().indexOf(element) >= 0;
    },
    // Returns all child elements
    children: function() {
      return this._children || (this._children = []);
    },
    // Iterates over all children and invokes a given block
    each: function(block) {
      var index,
          children = this.children();
      
      for (index = 0, length = children.length; index < length; index++)
        if (children[index] instanceof SVG.Shape)
          block.apply(children[index], [index, children]);
      
      return this;
    },
    // Remove a given child element
    remove: function(element) {
      return this.removeAt(this.children().indexOf(element));
    },
    // Remove a child element at a given position
    removeAt: function(index) {
      if (0 <= index && index < this.children().length) {
        var element = this.children()[index];
        this.children().splice(index, 1);
        this.node.removeChild(element.node);
        element.parent = null;
      }
      
      return this;
    },
    // Returns defs element
    defs: function() {
      return this._defs || (this._defs = this.put(new SVG.Defs(), 0));
    },
    // Re-level defs to first positon in element stack
    level: function() {
      return this.remove(this.defs()).put(this.defs(), 0);
    },
    // Create a group element
    group: function() {
      return this.put(new SVG.G());
    },
    // Create a rect element
    rect: function(width, height) {
      return this.put(new SVG.Rect().size(width, height));
    },
    // Create circle element, based on ellipse
    circle: function(diameter) {
      return this.ellipse(diameter);
    },
    // Create an ellipse
    ellipse: function(width, height) {
      return this.put(new SVG.Ellipse().size(width, height));
    },
    // Create a wrapped polyline element
    polyline: function(points) {
      return this.put(new SVG.Wrap(new SVG.Polyline())).plot(points);
    },
    // Create a wrapped polygon element
    polygon: function(points) {
      return this.put(new SVG.Wrap(new SVG.Polygon())).plot(points);
    },
    // Create a wrapped path element
    path: function(data) {
      return this.put(new SVG.Wrap(new SVG.Path())).plot(data);
    },
    // Create image element, load image and set its size
    image: function(source, width, height) {
      width = width != null ? width : 100;
      return this.put(new SVG.Image().load(source).size(width, height != null ? height : width));
    },
    // Create text element
    text: function(text) {
      return this.put(new SVG.Text().text(text));
    },
    // Create nested svg document
    nested: function() {
      return this.put(new SVG.Nested());
    },
    // Create gradient element in defs
    gradient: function(type, block) {
      return this.defs().gradient(type, block);
    },
    // Create pattern element in defs
    pattern: function(width, height, block) {
      return this.defs().pattern(width, height, block);
    },
    // Create masking element
    mask: function() {
      return this.defs().put(new SVG.Mask());
    },
    // Get first child, skipping the defs node
    first: function() {
      return this.children()[0] instanceof SVG.Defs ? this.children()[1] : this.children()[0];
    },
    // Get the last child
    last: function() {
      return this.children()[this.children().length - 1];
    },
    // Remove all elements in this container
    clear: function() {
      this._children = [];
      
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      return this;
    }
    
  });

  SVG.FX = function FX(element) {
    /* store target element */
    this.target = element;
  };
  
  //
  SVG.extend(SVG.FX, {
    // Add animation parameters and start animation
    animate: function(duration, ease) {
      /* ensure default duration and easing */
      duration = duration == null ? 1000 : duration;
      ease = ease || '<>';
      
      var akeys, tkeys, tvalues,
          element   = this.target,
          fx        = this,
          start     = (new Date).getTime(),
          finish    = start + duration;
      
      /* start animation */
      this.interval = setInterval(function(){
        // This code was borrowed from the emile.js micro framework by Thomas Fuchs, aka MadRobby.
        var index,
            time = (new Date).getTime(),
            pos = time > finish ? 1 : (time - start) / duration;
        
        /* collect attribute keys */
        if (akeys == null) {
          akeys = [];
          for (var key in fx.attrs)
            akeys.push(key);
        };
        
        /* collect transformation keys */
        if (tkeys == null) {
          tkeys = [];
          for (var key in fx.trans)
            tkeys.push(key);
          
          tvalues = {};
        };
        
        /* apply easing */
        pos = ease == '<>' ?
          (-Math.cos(pos * Math.PI) / 2) + 0.5 :
        ease == '>' ?
          Math.sin(pos * Math.PI / 2) :
        ease == '<' ?
          -Math.cos(pos * Math.PI / 2) + 1 :
        ease == '-' ?
          pos :
        typeof ease == 'function' ?
          ease(pos) :
          pos;
        
        /* run all position properties */
        if (fx._move)
          element.move(fx._at(fx._move.x, pos), fx._at(fx._move.y, pos));
        else if (fx._center)
          element.move(fx._at(fx._center.x, pos), fx._at(fx._center.y, pos));
        
        /* run all size properties */
        if (fx._size)
          element.size(fx._at(fx._size.width, pos), fx._at(fx._size.height, pos));
        
        /* animate attributes */
        for (index = akeys.length - 1; index >= 0; index--)
          element.attr(akeys[index], fx._at(fx.attrs[akeys[index]], pos));
        
        /* animate transformations */
        if (tkeys.length > 0) {
          for (index = tkeys.length - 1; index >= 0; index--)
            tvalues[tkeys[index]] = fx._at(fx.trans[tkeys[index]], pos);
          
          element.transform(tvalues);
        }
        
        /* finish off animation */
        if (time > finish) {
          clearInterval(fx.interval);
          fx._after ? fx._after.apply(element, [fx]) : fx.stop();
        }
          
      }, duration > 10 ? 10 : duration);
      
      return this;
    },
    // Add animatable attributes
    attr: function(a, v, n) {
      if (typeof a == 'object')
        for (var key in a)
          this.attr(key, a[key]);
      
      else
        this.attrs[a] = { from: this.target.attr(a), to: v };
      
      return this;  
    },
    // Add animatable transformations
    transform: function(o) {
      for (var key in o)
        this.trans[key] = { from: this.target.trans[key], to: o[key] };
      
      return this;
    },
    // Add animatable move
    move: function(x, y) {
      var box = this.target.bbox();
      
      this._move = {
        x: { from: box.x, to: x },
        y: { from: box.y, to: y }
      };
      
      return this;
    },
    // Add animatable size
    size: function(width, height) {
      var box = this.target.bbox();
      
      this._size = {
        width:  { from: box.width,  to: width  },
        height: { from: box.height, to: height }
      };
      
      return this;
    },
    // Add animatable center
    center: function(x, y) {
      var box = this.target.bbox();
      
      this._move = {
        x: { from: box.cx, to: x },
        y: { from: box.cy, to: y }
      };
      
      return this;
    },
    // Callback after animation
    after: function(after) {
      this._after = after;
      
      return this;
    },
    // Stop running animation
    stop: function() {
      /* stop current animation */
      clearInterval(this.interval);
      
      /* reset storage for properties that need animation */
      this.attrs  = {};
      this.trans  = {};
      this._move  = null;
      this._size  = null;
      this._after = null;
      
      return this;
    },
    // Private: at position according to from and to
    _at: function(o, pos) {
      /* if a number, recalculate pos */
      return typeof o.from == 'number' ?
        o.from + (o.to - o.from) * pos :
      
      /* if animating to a color */
      o.to.r || /^#/.test(o.to) ?
        this._color(o, pos) :
      
      /* for all other values wait until pos has reached 1 to return the final value */
      pos < 1 ? o.from : o.to;
    },
    // Private: tween color
    _color: function(o, pos) {
      var from, to;
      
      /* convert FROM hex to rgb */
      from = this._h2r(o.from || '#000');
      
      /* convert TO hex to rgb */
      to = this._h2r(o.to);
      
      /* tween color and return hex */
      return this._r2h({
        r: ~~(from.r + (to.r - from.r) * pos),
        g: ~~(from.g + (to.g - from.g) * pos),
        b: ~~(from.b + (to.b - from.b) * pos)
      });
    },
    // Private: convert hex to rgb object
    _h2r: function(hex) {
      /* parse full hex */
      var match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this._fh(hex));
      
      /* if the hex is successfully parsed, return it in rgb, otherwise return black */
      return match ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16)
      } : { r: 0, g: 0, b: 0 };
    },
    // Private: convert rgb object to hex string
    _r2h: function(rgb) {
      return '#' + this._c2h(rgb.r) + this._c2h(rgb.g) + this._c2h(rgb.b);
    },
    // Private: convert component to hex
    _c2h: function(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    },
    // Private: force potential 3-based hex to 6-based 
    _fh: function(hex) {
      return hex.length == 4 ?
        [ '#',
          hex.substring(1, 2), hex.substring(1, 2),
          hex.substring(2, 3), hex.substring(2, 3),
          hex.substring(3, 4), hex.substring(3, 4)
        ].join('') : hex;
    }
    
  });
  //
  SVG.extend(SVG.Element, {
    // Get fx module or create a new one, then animate with given duration and ease
    animate: function(duration, ease) {
      return (this.fx || (this.fx = new SVG.FX(this))).stop().animate(duration, ease);
    },
    // Stop current animation; this is an alias to the fx instance
    stop: function() {
      this.fx.stop();
      
      return this;
    }
    
  });
  // Usage:
  
  //     rect.animate(1500, '>').move(200, 300).after(function() {
  //       this.fill({ color: '#f06' });
  //     });


  [ 'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    'mouseenter',
    'mouseleave',
    'touchstart',
    'touchend',
    'touchmove',
    'touchcancel' ].forEach(function(event) {
    
    /* add event to SVG.Element */
    SVG.Element.prototype[event] = function(f) {
      var self = this;
      
      /* bind event to element rather than element node */
      this.node['on' + event] = typeof f == 'function'
        ? function() { return f.apply(self, arguments); }
        : null;
      
      return this;
    };
    
  });
  
  // Add event binder in the SVG namespace
  SVG.on = function(node, event, listener) {
    if (node.addEventListener)
      node.addEventListener(event, listener, false);
    else
      node.attachEvent('on' + event, listener);
  };
  
  // Add event unbinder in the SVG namespace
  SVG.off = function(node, event, listener) {
    if (node.removeEventListener)
      node.removeEventListener(event, listener, false);
    else
      node.detachEvent('on' + event, listener);
  };
  
  //
  SVG.extend(SVG.Element, {
    // Bind given event to listener
    on: function(event, listener) {
      SVG.on(this.node, event, listener);
      
      return this;
    },
    // Unbind event from listener
    off: function(event, listener) {
      SVG.off(this.node, event, listener);
      
      return this;
    }
  });

  SVG.G = function G() {
    this.constructor.call(this, SVG.create('g'));
  };
  
  // Inherit from SVG.Container
  SVG.G.prototype = new SVG.Container();
  
  SVG.extend(SVG.G, {
    // Get defs
    defs: function() {
      return this.doc().defs();
    }
    
  });

  SVG.extend(SVG.Element, {
    // Get all siblings, including myself
    siblings: function() {
      return this.parent.children();
    },
    // Get the curent position siblings
    position: function() {
      return this.siblings().indexOf(this);
    },
    // Get the next element (will return null if there is none)
    next: function() {
      return this.siblings()[this.position() + 1];
    },
    // Get the next element (will return null if there is none)
    previous: function() {
      return this.siblings()[this.position() - 1];
    },
    // Send given element one step forward
    forward: function() {
      return this.parent.remove(this).put(this, this.position() + 1);
    },
    // Send given element one step backward
    backward: function() {
      var i;
      
      this.parent.level();
      
      i = this.position();
      
      if (i > 1)
        this.parent.remove(this).add(this, i - 1);
      
      return this;
    },
    // Send given element all the way to the front
    front: function() {
      return this.parent.remove(this).put(this);
    },
    // Send given element all the way to the back
    back: function() {
      this.parent.level();
      
      if (this.position() > 1)
        this.parent.remove(this).add(this, 0);
      
      return this;
    }
    
  });

  SVG.Defs = function Defs() {
    this.constructor.call(this, SVG.create('defs'));
  };
  
  // Inherits from SVG.Container
  SVG.Defs.prototype = new SVG.Container();

  SVG.Mask = function Mask() {
    this.constructor.call(this, SVG.create('mask'));
    
    /* set unique id */
    this.attr('id', (this.id = 'svgjs_element_' + (SVG.did++)));
  };
  
  // Inherit from SVG.Container
  SVG.Mask.prototype = new SVG.Container();
  
  SVG.extend(SVG.Element, {
    
    // Distribute mask to svg element
    maskWith: function(element) {
      /* use given mask or create a new one */
      this.mask = element instanceof SVG.Mask ? element : this.parent.mask().add(element);
      
      return this.attr('mask', 'url(#' + this.mask.id + ')');
    }
    
  });

  SVG.Pattern = function Pattern(type) {
    this.constructor.call(this, SVG.create('pattern'));
    
    /* set unique id */
    this.attr('id', (this.id = 'svgjs_element_' + (SVG.did++)));
  };
  
  // Inherit from SVG.Container
  SVG.Pattern.prototype = new SVG.Container();
  
  //
  SVG.extend(SVG.Pattern, {
    // Return the fill id
    fill: function() {
      return 'url(#' + this.id + ')';
    }
    
  });
  
  //
  SVG.extend(SVG.Defs, {
    
    /* define gradient */
    pattern: function(width, height, block) {
      var element = this.put(new SVG.Pattern());
      
      /* invoke passed block */
      block(element);
      
      return element.attr({
        x:            0,
        y:            0,
        width:        width,
        height:       height,
        patternUnits: 'userSpaceOnUse'
      });
    }
    
  });

  SVG.Gradient = function Gradient(type) {
    this.constructor.call(this, SVG.create(type + 'Gradient'));
    
    /* set unique id */
    this.attr('id', (this.id = 'svgjs_element_' + (SVG.did++)));
    
    /* store type */
    this.type = type;
  };
  
  // Inherit from SVG.Container
  SVG.Gradient.prototype = new SVG.Container();
  
  //
  SVG.extend(SVG.Gradient, {
    // From position
    from: function(x, y) {
      return this.type == 'radial' ?
        this.attr({ fx: x + '%', fy: y + '%' }) :
        this.attr({ x1: x + '%', y1: y + '%' });
    },
    // To position
    to: function(x, y) {
      return this.type == 'radial' ?
        this.attr({ cx: x + '%', cy: y + '%' }) :
        this.attr({ x2: x + '%', y2: y + '%' });
    },
    // Radius for radial gradient
    radius: function(radius) {
      return this.type == 'radial' ?
        this.attr({ r: radius + '%' }) :
        this;
    },
    // Add a color stop
    at: function(stop) {
      return this.put(new SVG.Stop(stop));
    },
    // Update gradient
    update: function(block) {
      /* remove all stops */
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      /* invoke passed block */
      block(this);
      
      return this;
    },
    // Return the fill id
    fill: function() {
      return 'url(#' + this.id + ')';
    }
    
  });
  
  //
  SVG.extend(SVG.Defs, {
    
    /* define gradient */
    gradient: function(type, block) {
      var element = this.put(new SVG.Gradient(type));
      
      /* invoke passed block */
      block(element);
      
      return element;
    }
    
  });
  
  
  SVG.Stop = function Stop(stop) {
    this.constructor.call(this, SVG.create('stop'));
    
    /* immediatelly build stop */
    this.update(stop);
  };
  
  // Inherit from SVG.Element
  SVG.Stop.prototype = new SVG.Element();
  
  //
  SVG.extend(SVG.Stop, {
    
    /* add color stops */
    update: function(o) {
      var index,
          style = '',
          attr  = ['opacity', 'color'];
      
      /* build style attribute */
      for (index = attr.length - 1; index >= 0; index--)
        if (o[attr[index]] != null)
          style += 'stop-' + attr[index] + ':' + o[attr[index]] + ';';
      
      /* set attributes */
      return this.attr({
        offset: (o.offset != null ? o.offset : this.attrs.offset || 0) + '%',
        style:  style
      });
    }
    
  });
  


  SVG.Doc = function Doc(element) {
    this.constructor.call(this, SVG.create('svg'));
    
    /* ensure the presence of a html element */
    this.parent = typeof element == 'string' ?
      document.getElementById(element) :
      element;
    
    /* set svg element attributes and create the <defs> node */
    this.
      attr({ xmlns: SVG.ns, version: '1.1', width: '100%', height: '100%' }).
      attr('xlink', SVG.xlink, SVG.ns).
      defs();
    
    /* ensure correct rendering for safari */
    this.stage(); 
  };
  
  // Inherits from SVG.Container
  SVG.Doc.prototype = new SVG.Container();
  
  // Hack for safari preventing text to be rendered in one line.
  // Basically it sets the position of the svg node to absolute
  // when the dom is loaded, and resets it to relative a few milliseconds later.
  SVG.Doc.prototype.stage = function() {
    var check,
        element = this,
        wrapper = document.createElement('div');
    
    /* set temp wrapper to position relative */
    wrapper.style.cssText = 'position:relative;height:100%;';
    
    /* put element into wrapper */
    element.parent.appendChild(wrapper);
    wrapper.appendChild(element.node);
    
    /* check for dom:ready */
    check = function() {
      if (document.readyState === 'complete') {
        element.attr('style', 'position:absolute;');
        setTimeout(function() {
          /* set position back to relative */
          element.attr('style', 'position:relative;');
          
          /* remove temp wrapper */
          element.parent.removeChild(element.node.parentNode);
          element.node.parentNode.removeChild(element.node);
          element.parent.appendChild(element.node);
          
        }, 5);
      } else {
        setTimeout(check, 10);
      }
    };
    
    check();
    
    return this;
  };

  SVG.Shape = function Shape(element) {
    this.constructor.call(this, element);
  };
  
  // Inherit from SVG.Element
  SVG.Shape.prototype = new SVG.Element();

  SVG.Wrap = function Wrap(element) {
    this.constructor.call(this, SVG.create('g'));
    
    /* insert and store child */
    this.node.insertBefore(element.node, null);
    this.child = element;
    this.type = element.node.nodeName;
  };
  
  // inherit from SVG.Shape
  SVG.Wrap.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Wrap, {
    // Move wrapper around
    move: function(x, y) {
      return this.transform({
        x: x,
        y: y
      });
    },
    // Set the actual size in pixels
    size: function(width, height) {
      var scale = width / this._b.width;
      
      this.child.transform({
        scaleX: scale,
        scaleY: height != null ? height / this._b.height : scale
      });
  
      return this;
    },
    // Move by center
    center: function(x, y) {
      return this.move(
        x + (this._b.width  * this.child.trans.scaleX) / -2,
        y + (this._b.height * this.child.trans.scaleY) / -2
      );
    },
    // Create distributed attr
    attr: function(a, v, n) {
      /* call individual attributes if an object is given */
      if (typeof a == 'object') {
        for (v in a) this.attr(v, a[v]);
      
      /* act as a getter if only one argument is given */
      } else if (arguments.length < 2) {
        return a == 'transform' ? this.attrs[a] : this.child.attrs[a];
      
      /* apply locally for certain attributes */
      } else if (a == 'transform') {
        this.attrs[a] = v;
        
        n != null ?
          this.node.setAttributeNS(n, a, v) :
          this.node.setAttribute(a, v);
      
      /* apply attributes to child */
      } else {
        this.child.attr(a, v, n);
      }
      
      return this;
    },
    // Distribute plot method to child
    plot: function(data) {
      /* plot new shape */
      this.child.plot(data);
      
      /* get and store new bbox */
      this._b = this.child.bbox();
      
      /* reposition element withing wrapper */
      this.child.transform({
        x: -this._b.x,
        y: -this._b.y
      });
      
      return this;
    }
    
  });

  SVG.Rect = function Rect() {
    this.constructor.call(this, SVG.create('rect'));
  };
  
  // Inherit from SVG.Shape
  SVG.Rect.prototype = new SVG.Shape();

  SVG.Ellipse = function Ellipse() {
    this.constructor.call(this, SVG.create('ellipse'));
  };
  
  // Inherit from SVG.Shape
  SVG.Ellipse.prototype = new SVG.Shape();
  
  //
  SVG.extend(SVG.Ellipse, {
    // Custom move function
    move: function(x, y) {
      this.attrs.x = x;
      this.attrs.y = y;
      
      return this.center();
    },
    // Custom size function
    size: function(width, height) {
      return this.
        attr({ rx: width / 2, ry: (height != null ? height : width) / 2 }).
        center();
    },
    // Custom center function
    center: function(x, y) {
      return this.attr({
        cx: x || (this.attrs.x || 0) + (this.attrs.rx || 0),
        cy: y || (this.attrs.y || 0) + (this.attrs.ry || 0)
      });
    }
    
  });
  
  // Usage:
  
  //     draw.ellipse(200, 100);

  SVG.Line = function Line() {
    this.constructor.call(this, SVG.create('line'));
  };
  
  // Inherit from SVG.Shape
  SVG.Line.prototype = new SVG.Shape();
  
  // Add required methods
  SVG.extend(SVG.Line, {
    // Move line
    move: function(x, y) {
      var bbox = this.bbox();
      
      return this.attr({
        x1: this.attr('x1') - bbox.x + x,
        y1: this.attr('y1') - bbox.y + y,
        x2: this.attr('x2') - bbox.x + x,
        y2: this.attr('y2') - bbox.y + y
      });
    },
    // Move element by its center
    center: function(x, y) {
      var bbox = this.bbox();
      
      return this.move(x - bbox.width / 2, y - bbox.height / 2);
    },
    // Set line size by width and height
    size: function(width, height) {
      var bbox = this.bbox();
      
      this.attr(this.attr('x1') < this.attr('x2') ? 'x2' : 'x1', bbox.x + width);
      return this.attr(this.attr('y1') < this.attr('y2') ? 'y2' : 'y1', bbox.y + height);
    }
  });
  
  // Extend all container modules
  SVG.extend(SVG.Container, {
    line: function(x1, y1, x2, y2) {
      return this.put(new SVG.Line().attr({
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      }));
    }
  });

  SVG.Poly = {
    // Set polygon data with default zero point if no data is passed
    plot: function(points) {
      this.attr('points', points || '0,0');
      
      return this;
    }
  };
  
  SVG.Polyline = function Polyline() {
    this.constructor.call(this, SVG.create('polyline'));
  };
  
  // Inherit from SVG.Shape
  SVG.Polyline.prototype = new SVG.Shape();
  
  // Add polygon-specific functions
  SVG.extend(SVG.Polyline, SVG.Poly);
  
  SVG.Polygon = function Polygon() {
    this.constructor.call(this, SVG.create('polygon'));
  };
  
  // Inherit from SVG.Shape
  SVG.Polygon.prototype = new SVG.Shape();
  
  // Add polygon-specific functions
  SVG.extend(SVG.Polygon, SVG.Poly);

  SVG.Path = function Path() {
    this.constructor.call(this, SVG.create('path'));
  };
  
  // Inherit from SVG.Shape
  SVG.Path.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Path, {
    
    /* move using transform */
    move: function(x, y) {
      this.transform({
        x: x,
        y: y
      });
    },
    
    /* set path data */
    plot: function(data) {
      return this.attr('d', data || 'M0,0');
    }
    
  });

  SVG.Image = function Image() {
    this.constructor.call(this, SVG.create('image'));
  };
  
  // Inherit from SVG.Element
  SVG.Image.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Image, {
    
    /* (re)load image */
    load: function(url) {
      this.src = url;
      return (url ? this.attr('xlink:href', url, SVG.xlink) : this);
    }
    
  });

  var _styleAttr = ['size', 'family', 'weight', 'stretch', 'variant', 'style'];
  
  SVG.Text = function Text() {
    this.constructor.call(this, SVG.create('text'));
    
    /* define default style */
    this.style = { 'font-size':  16, 'font-family': 'Helvetica', 'text-anchor': 'start' };
    this.leading = 1.2;
  };
  
  // Inherit from SVG.Element
  SVG.Text.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Text, {
    // Set the text content
    text: function(text) {
      /* update the content */
      this.content = text = text || 'text';
      this.lines = [];
      
      var index, length, tspan,
          style   = this._style(),
          parent  = this.doc(),
          lines   = text.split("\n"),
          size    = this.style['font-size'];
      
      /* remove existing child nodes */
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      /* build new lines */
      for (index = 0, length = lines.length; index < length; index++) {
        /* create new tspan and set attributes */
        tspan = new TSpan().
          text(lines[index]).
          attr({
            dy:     size * this.leading - (index == 0 ? size * 0.3 : 0),
            x:      (this.attrs.x || 0),
            style:  style
          });
        
        /* add new tspan */
        this.node.appendChild(tspan.node);
        this.lines.push(tspan);
      };
      
      /* set style */
      return this.attr('style', style);
    },
    
    // Build style based on _styleAttr
    _style: function() {
      var index, style = '';
      
      for (index = _styleAttr.length - 1; index >= 0; index--)
        if (this.style['font-' + _styleAttr[index]] != null)
          style += 'font-' + _styleAttr[index] + ':' + this.style['font-' + _styleAttr[index]] + ';';
      
      style += 'text-anchor:' + this.style['text-anchor'] + ';';
        
      return style;
    }
    
  });
  
  
  function TSpan() {
    this.constructor.call(this, SVG.create('tspan'));
  };
  
  // Inherit from SVG.Shape
  TSpan.prototype = new SVG.Shape();
  
  // Include the container object
  SVG.extend(TSpan, {
    // Set text content
    text: function(text) {
      this.node.appendChild(document.createTextNode(text));
      
      return this;
    }
    
  });

  SVG.Nested = function Nested() {
    this.constructor.call(this, SVG.create('svg'));
    this.attr('overflow', 'visible');
  };
  
  // Inherit from SVG.Container
  SVG.Nested.prototype = new SVG.Container();

  SVG._stroke = ['color', 'width', 'opacity', 'linecap', 'linejoin', 'miterlimit', 'dasharray', 'dashoffset'];
  SVG._fill   = ['color', 'opacity', 'rule'];
  
  
  // Prepend correct color prefix
  var _colorPrefix = function(type, attr) {
    return attr == 'color' ? type : type + '-' + attr;
  };
  
  /* Add sugar for fill and stroke */
  ['fill', 'stroke'].forEach(function(method) {
    
    // Set fill color and opacity
    SVG.Shape.prototype[method] = function(o) {
      var index;
      
      if (typeof o == 'string')
        this.attr(method, o);
      
      else
        /* set all attributes from _fillAttr and _strokeAttr list */
        for (index = SVG['_' + method].length - 1; index >= 0; index--)
          if (o[SVG['_' + method][index]] != null)
            this.attr(_colorPrefix(method, SVG['_' + method][index]), o[SVG['_' + method][index]]);
      
      return this;
    };
    
  });
  
  [SVG.Element, SVG.FX].forEach(function(module) {
    if (module) {
      SVG.extend(module, {
        // Rotation
        rotate: function(angle) {
          return this.transform({
            rotation: angle || 0
          });
        },
        // Skew
        skew: function(x, y) {
          return this.transform({
            skewX: x || 0,
            skewY: y || 0
          });
        },
        // Scale
        scale: function(x, y) {
          return this.transform({
            scaleX: x,
            scaleY: y == null ? x : y
          });
        },
        // Opacity
        opacity: function(value) {
          return this.attr('opacity', value);
        }
  
      });
    }
  });
  
  if (SVG.G) {
    SVG.extend(SVG.G, {
      // Move using translate
      move: function(x, y) {
        return this.transform({
          x: x,
          y: y
        });
      }
  
    });
  }
  
  if (SVG.Text) {
    SVG.extend(SVG.Text, {
      // Set font 
      font: function(o) {
        var key, attr = {};
  
        for (key in o)
          key == 'leading' ?
            attr[key] = o[key] :
          key == 'anchor' ?
            attr['text-anchor'] = o[key] :
          _styleAttr.indexOf(key) > -1 ?
            attr['font-'+ key] = o[key] :
            void 0;
  
        return this.attr(attr).text(this.content);
      }
  
    });
  }
  


return svg; }));

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('svg'));
    } else if (typeof define === 'function' && define.amd) {
        define(['svg'],factory);
    } else {
        root.SyncIcon = factory(root.svg);
    }
}(this, function (svg) {

var icon = function(element, options) {
    var me = this;

    var defaults = {
        size: 294,
        disabled_color: '#ccc',
        mouseover_color: '#eee',
        online_color: '#090',
        sync_color: '#050',
        offline_color: '#900',
        state: 'disabled'
    };

    if (!options) options = defaults;
    if (!options.size) options.size = defaults.size;
    if (!options.disabled_color) options.disabled_color = defaults.disabled_color;
    if (!options.mouseover_color) options.mouseover_color = defaults.mouseover_color;
    if (!options.online_color) options.online_color = defaults.online_color;
    if (!options.offline_color) options.offline_color = defaults.offline_color;
    if (!options.state) options.state = defaults.state;


    this.options = options;
    this.callback = false;
    this.animating = false;

    var orginal_height = 256;
    var original_width = 294;

    me.options.height =  ( orginal_height/original_width ) * me.options.size;

    this.paper = svg(element).size(me.options.size, me.options.size);
    this.main_path = this.paper.path(main_icon);
    this.main_path.size(me.options.size  , me.options.height);
    this.main_path.attr({ fill: this.options.disabled_color });


    var rotate_on = function(callback){
        me.animating = true;
        me.main_path.animate(1000, '<>').rotate(0).after(function(){
            me.animating = false;
            if (callback) callback();
        });
    };

    var rotate_off = function(callback) {
        me.animating = true;
        me.main_path.animate(1000, '<>').rotate(-90).after(function(){
            me.animating = false;
            if (callback) callback();
        });
    };

    var online_state = function(){
        me.main_path.rotate(0);
        me.main_path.attr({fill: me.options.online_color});
        me.options.state = 'online';
    };

    var offline_state = function() {
        me.main_path.rotate(0);
        me.main_path.attr({fill: me.options.offline_color});
        me.options.state = 'offline';
    };

    var syncing_state = function() {
        me.main_path.rotate(0);
        var gradient = me.paper.gradient('linear', function(stop) {
          stop.at({ offset: 0, color: me.options.sync_color, opacity: 1 });
          stop.at({ offset: 100, color: me.options.online_color, opacity: 1 });
        });

        var count = 0;
        me.sync_interval = setInterval(function(){

            gradient.update(function(stop) {
              stop.at({ offset: count, color: me.options.online_color, opacity: 1 });
              stop.at({ offset: 100, color: me.options.sync_color, opacity: 1 });
              count+=10;
              if (count > 100) count = 0;
            });

        }, 100);

        me.main_path.attr({ fill: gradient.fill() });
        me.options.state = 'syncing';
    };

    var disabled_state = function(){
        me.main_path.rotate(-90);
        me.main_path.attr({fill: me.options.disabled_color});
        me.options.state = 'disabled';
    };

    this.state_change = function(to_state) {
        if (me.sync_interval && to_state !== 'syncing') {
            clearInterval(me.sync_interval);
            me.sync_interval = null;
        }
        // animation between transitions
        if (me.options.state === 'disabled' && to_state ==='online') {
            return rotate_on(online_state);
        }
        if (me.options.state === 'disabled' && to_state ==='offline') {
            return rotate_on(offline_state);
        }
        if (me.options.state ==='disabled'  && to_state === 'syncing') {
            return rotate_on(syncing_state);
        }
        if (me.options.state === 'online' && to_state ==='disabled') {
            return rotate_off(disabled_state);
        }
        if (me.options.state === 'offline' && to_state ==='disabled') {
            return rotate_off(disabled_state);
        }
        if (to_state === 'online') return online_state();
        if (to_state === 'offline') return offline_state();
        if (to_state === 'syncing') return syncing_state();
        if (to_state === 'disabled') return disabled_state();
    };

    this.paper.on('mouseover', function(){
        if (me.animating) return;
        //me.main_path.animate(500, '>').attr({ fill: me.options.mouseover_color });
    });
    this.paper.on('mouseout', function(){
        if (me.animating) return;
        //me.state_change(me.options.state);
    });


    this.clicked = function() {
        if (me.callback) me.callback('click');
    };

    me.paper.touchstart(function(){
        me.clicked();
    });

    me.paper.click(function(){
        me.clicked();
    });

    me.state_change(me.options.state);
};

icon.prototype.disabled = function() {
    this.state_change('disabled');
};

icon.prototype.offline = function() {
    this.state_change('offline');
};

icon.prototype.online = function(){
    this.state_change('online');
};


icon.prototype.syncing = function() {
    this.state_change('syncing');
};

icon.prototype.click = function(callback) {
    this.callback = callback;
};

icon.prototype.getState = function() {
    return this.options.state;
};

var main_icon = "M294.1,79.0H246.3C226.7,31.9,180.0,0,128.1,0C57.5,0,0,57.4,0,128.1C0,198.8,57.5,256.3,128.1,256.3c51.9,0,98.5-31.8,118.2-79.0h47.7V79.0zM256.1,139.2H128.1c-6.1,0-11.1-4.9-11.1-11.1c0-6.1,4.9-11.1,11.1-11.1h127.9V139.2zM128.1,218.3c-49.7,0-90.1-40.4-90.1-90.1c0-49.7,40.4-90.1,90.1-90.1c30.8,0,59.1,16.0,75.5,41.0h-75.5c-27.0,0-49.1,22.0-49.1,49.1c0,27.0,22.0,49.1,49.1,49.1h75.5C187.3,202.3,159.0,218.3,128.1,218.3z";

var online_icon ="M-7.2727275,54.781471C-7.2727275,54.781471,-8.8503233,54.781471,-8.8503233,54.781471C-8.8503233,54.781471,-8.8503233,52.267212,-8.8503233,52.267212C-8.8503233,52.267212,-7.272727499999999,52.267212,-7.272727499999999,52.267212C-7.272727499999999,52.267212,-7.2727275,54.781471,-7.2727275,54.781471 M-9.6861906,54.780155C-9.6861906,54.780155,-11.263786,54.780155,-11.263786,54.780155C-11.263786,54.780155,-11.263786,52.265896,-11.263786,52.265896C-11.263786,52.265896,-9.6861906,52.265896,-9.6861906,52.265896C-9.6861906,52.265896,-9.6861906,54.780155,-9.6861906,54.780155 M-12.035547,54.779095C-12.035547,54.779095,-13.613142999999999,54.779095,-13.613142999999999,54.779095C-13.613142999999999,54.779095,-13.613142999999999,52.264835,-13.613142999999999,52.264835C-13.613142999999999,52.264835,-12.035547,52.264835,-12.035547,52.264835C-12.035547,52.264835,-12.035547,54.779095,-12.035547,54.779095";


return icon;
}));
/*!
  * Bowser - a browser detector
  * https://github.com/ded/bowser
  * MIT License | (c) Dustin Diaz 2011
  */
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( );
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.bowser = factory();
    }
}(this, function () {
  /**
    * navigator.userAgent =>
    * Chrome:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24"
    * Opera:   "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; en) Presto/2.7.62 Version/11.01"
    * Safari:  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
    * IE:      "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)"
    * Firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0) Gecko/20100101 Firefox/4.0"
    * iPhone:  "Mozilla/5.0 (iPhone Simulator; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5"
    * iPad:    "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
    * Android: "Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; T-Mobile G2 Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
    * Touchpad: "Mozilla/5.0 (hp-tabled;Linux;hpwOS/3.0.5; U; en-US)) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.83 Safari/534.6 TouchPad/1.0"
    * PhantomJS: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.5.0 Safari/534.34"
    */

  var ua = navigator.userAgent
    , t = true
    , ie = /msie/i.test(ua)
    , chrome = /chrome/i.test(ua)
    , phantom = /phantom/i.test(ua)
    , safari = /safari/i.test(ua) && !chrome && !phantom
    , iphone = /iphone/i.test(ua)
    , ipad = /ipad/i.test(ua)
    , touchpad = /touchpad/i.test(ua)
    , android = /android/i.test(ua)
    , opera = /opera/i.test(ua)
    , firefox = /firefox/i.test(ua)
    , gecko = /gecko\//i.test(ua)
    , seamonkey = /seamonkey\//i.test(ua)
    , webkitVersion = /version\/(\d+(\.\d+)?)/i
    , o

  function detect() {

    if (ie) return {
        msie: t
      , version: ua.match(/msie (\d+(\.\d+)?);/i)[1]
    }
    if (chrome) return {
        webkit: t
      , chrome: t
      , version: ua.match(/chrome\/(\d+(\.\d+)?)/i)[1]
    }
    if (phantom) return {
        webkit: t
      , phantom: t
      , version: ua.match(/phantomjs\/(\d+(\.\d+)+)/i)[1]
    }
    if (touchpad) return {
        webkit: t
      , touchpad: t
      , version : ua.match(/touchpad\/(\d+(\.\d+)?)/i)[1]
    }
    if (iphone || ipad) {
      o = {
          webkit: t
        , mobile: t
        , ios: t
        , iphone: iphone
        , ipad: ipad
      }
      // WTF: version is not part of user agent in web apps
      if (webkitVersion.test(ua)) {
        o.version = ua.match(webkitVersion)[1]
      }
      return o
    }
    if (android) return {
        webkit: t
      , android: t
      , mobile: t
      , version: ua.match(webkitVersion)[1]
    }
    if (safari) return {
        webkit: t
      , safari: t
      , version: ua.match(webkitVersion)[1]
    }
    if (opera) return {
        opera: t
      , version: ua.match(webkitVersion)[1]
    }
    if (gecko) {
      o = {
          gecko: t
        , mozilla: t
        , version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1]
      }
      if (firefox) o.firefox = t
      return o
    }
    if (seamonkey) return {
        seamonkey: t
      , version: ua.match(/seamonkey\/(\d+(\.\d+)?)/i)[1]
    }
  }

  var bowser = detect()

  // Graded Browser Support
  // http://developer.yahoo.com/yui/articles/gbs
  if ((bowser.msie && bowser.version >= 7) ||
      (bowser.chrome && bowser.version >= 10) ||
      (bowser.firefox && bowser.version >= 4.0) ||
      (bowser.safari && bowser.version >= 5) ||
      (bowser.opera && bowser.version >= 10.0)) {
    bowser.a = t;
  }

  else if ((bowser.msie && bowser.version < 7) ||
      (bowser.chrome && bowser.version < 10) ||
      (bowser.firefox && bowser.version < 4.0) ||
      (bowser.safari && bowser.version < 5) ||
      (bowser.opera && bowser.version < 10.0)) {
    bowser.c = t
  } else bowser.x = t

  return bowser
}));

/*PouchDB*/


(function() {


// BEGIN Math.uuid.js

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
(function() {
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  Math.uuid = function (len, radix) {
    var chars = CHARS, uuid = [];
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

  // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
  // by minimizing calls to random()
  Math.uuidFast = function() {
    var chars = CHARS, uuid = new Array(36), rnd=0, r;
    for (var i = 0; i < 36; i++) {
      if (i==8 || i==13 ||  i==18 || i==23) {
        uuid[i] = '-';
      } else if (i==14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');
  };

  // A more compact, but less performant, RFC4122v4 solution:
  Math.uuidCompact = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
  };
})();

// END Math.uuid.js

/**
*
*  MD5 (Message-Digest Algorithm)
*
*  For original source see http://www.webtoolkit.info/
*  Download: 15.02.2009 from http://www.webtoolkit.info/javascript-md5.html
*
*  Licensed under CC-BY 2.0 License
*  (http://creativecommons.org/licenses/by/2.0/uk/)
*
**/

var Crypto = {};
(function() {
  Crypto.MD5 = function(string) {

    function RotateLeft(lValue, iShiftBits) {
      return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }

    function AddUnsigned(lX,lY) {
      var lX4,lY4,lX8,lY8,lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    }

    function F(x,y,z) { return (x & y) | ((~x) & z); }
    function G(x,y,z) { return (x & z) | (y & (~z)); }
    function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }

    function FF(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function GG(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function HH(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function II(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function ConvertToWordArray(string) {
      var lWordCount;
      var lMessageLength = string.length;
      var lNumberOfWords_temp1=lMessageLength + 8;
      var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
      var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
      var lWordArray=Array(lNumberOfWords-1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while ( lByteCount < lMessageLength ) {
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount-(lByteCount % 4))/4;
      lBytePosition = (lByteCount % 4)*8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
      lWordArray[lNumberOfWords-2] = lMessageLength<<3;
      lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
      return lWordArray;
    };

    function WordToHex(lValue) {
      var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
      for (lCount = 0;lCount<=3;lCount++) {
        lByte = (lValue>>>(lCount*8)) & 255;
        WordToHexValue_temp = "0" + lByte.toString(16);
        WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
      }
      return WordToHexValue;
    };

    //**	function Utf8Encode(string) removed. Aready defined in pidcrypt_utils.js

    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    //	string = Utf8Encode(string); #function call removed

    x = ConvertToWordArray(string);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
      AA=a; BB=b; CC=c; DD=d;
      a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
      d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
      c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
      b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
      a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
      d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
      c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
      b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
      a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
      d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
      c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
      b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
      a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
      d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
      c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
      b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
      a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
      d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
      c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
      b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
      a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
      d=GG(d,a,b,c,x[k+10],S22,0x2441453);
      c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
      b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
      a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
      d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
      c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
      b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
      a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
      d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
      c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
      b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
      a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
      d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
      c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
      b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
      a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
      d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
      c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
      b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
      a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
      d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
      c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
      b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
      a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
      d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
      c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
      b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
      a=II(a,b,c,d,x[k+0], S41,0xF4292244);
      d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
      c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
      b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
      a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
      d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
      c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
      b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
      a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
      d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
      c=II(c,d,a,b,x[k+6], S43,0xA3014314);
      b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
      a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
      d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
      c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
      b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
      a=AddUnsigned(a,AA);
      b=AddUnsigned(b,BB);
      c=AddUnsigned(c,CC);
      d=AddUnsigned(d,DD);
    }
    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
    return temp.toLowerCase();
  }
})();

// END Crypto.md5.js

//----------------------------------------------------------------------
//
// ECMAScript 5 Polyfills
//  from www.calocomrmen./polyfill/
//
//----------------------------------------------------------------------

//----------------------------------------------------------------------
// ES5 15.2 Object Objects
//----------------------------------------------------------------------



// ES 15.2.3.6 Object.defineProperty ( O, P, Attributes )
// Partial support for most common case - getters, setters, and values
(function() {
  if (!Object.defineProperty ||
      !(function () { try { Object.defineProperty({}, 'x', {}); return true; } catch (e) { return false; } } ())) {
    var orig = Object.defineProperty;
    Object.defineProperty = function (o, prop, desc) {
      "use strict";

      // In IE8 try built-in implementation for defining properties on DOM prototypes.
      if (orig) { try { return orig(o, prop, desc); } catch (e) {} }

      if (o !== Object(o)) { throw new TypeError("Object.defineProperty called on non-object"); }
      if (Object.prototype.__defineGetter__ && ('get' in desc)) {
        Object.prototype.__defineGetter__.call(o, prop, desc.get);
      }
      if (Object.prototype.__defineSetter__ && ('set' in desc)) {
        Object.prototype.__defineSetter__.call(o, prop, desc.set);
      }
      if ('value' in desc) {
        o[prop] = desc.value;
      }
      return o;
    };
  }
}());



// ES5 15.2.3.14 Object.keys ( O )
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = function (o) {
    if (o !== Object(o)) { throw new TypeError('Object.keys called on non-object'); }
    var ret = [], p;
    for (p in o) {
      if (Object.prototype.hasOwnProperty.call(o, p)) {
        ret.push(p);
      }
    }
    return ret;
  };
}

//----------------------------------------------------------------------
// ES5 15.4 Array Objects
//----------------------------------------------------------------------



// ES5 15.4.4.18 Array.prototype.forEach ( callbackfn [ , thisArg ] )
// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fun /*, thisp */) {
    "use strict";

    if (this === void 0 || this === null) { throw new TypeError(); }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function") { throw new TypeError(); }

    var thisp = arguments[1], i;
    for (i = 0; i < len; i++) {
      if (i in t) {
        fun.call(thisp, t[i], i, t);
      }
    }
  };
}


// ES5 15.4.4.19 Array.prototype.map ( callbackfn [ , thisArg ] )
// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Map
if (!Array.prototype.map) {
  Array.prototype.map = function (fun /*, thisp */) {
    "use strict";

    if (this === void 0 || this === null) { throw new TypeError(); }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function") { throw new TypeError(); }

    var res = []; res.length = len;
    var thisp = arguments[1], i;
    for (i = 0; i < len; i++) {
      if (i in t) {
        res[i] = fun.call(thisp, t[i], i, t);
      }
    }

    return res;
  };
}


"use strict";

var Pouch = function Pouch(name, opts, callback) {

  if (!(this instanceof Pouch)) {
    return new Pouch(name, opts, callback);
  }

  if (typeof opts === 'function' || typeof opts === 'undefined') {
    callback = opts;
    opts = {};
  }

  if (typeof name === 'object') {
    opts = name;
    name = undefined;
  }

  var backend = Pouch.parseAdapter(opts.name || name);
  opts.name = opts.name || backend.name;
  opts.adapter = opts.adapter || backend.adapter;

  if (!Pouch.adapters[opts.adapter]) {
    throw 'Adapter is missing';
  }

  if (!Pouch.adapters[opts.adapter].valid()) {
    throw 'Invalid Adapter';
  }

  var adapter = Pouch.adapters[opts.adapter](opts, function(err, db) {
    if (err) {
      if (callback) callback(err);
      return;
    }
    for (var plugin in Pouch.plugins) {
      // In future these will likely need to be async to allow the plugin
      // to initialise
      var pluginObj = Pouch.plugins[plugin](db);
      for (var api in pluginObj) {
        // We let things like the http adapter use its own implementation
        // as it shares a lot of code
        if (!(api in db)) {
          db[api] = pluginObj[api];
        }
      }
    }
    callback(null, db);
  });
  for (var j in adapter) {
    this[j] = adapter[j];
  }
};

Pouch.DEBUG = false;

Pouch.adapters = {};
Pouch.plugins = {};

Pouch.parseAdapter = function(name) {

  var match = name.match(/([a-z\-]*):\/\/(.*)/);
  if (match) {
    // the http adapter expects the fully qualified name
    name = /http(s?)/.test(match[1]) ? match[1] + '://' + match[2] : match[2];
    var adapter = match[1];
    if (!Pouch.adapters[adapter].valid()) {
      throw 'Invalid adapter';
    }
    return {name: name, adapter: match[1]};
  }

  var rank = {'idb': 1, 'leveldb': 2, 'websql': 3, 'http': 4, 'https': 4};
  var rankedAdapter = Object.keys(Pouch.adapters).sort(function(a, b) {
    return rank[a] - rank[b];
  })[0];

  return {
    name: name,
    adapter: rankedAdapter
  };

  throw 'No Valid Adapter.';
};


Pouch.destroy = function(name, callback) {
  for (var plugin in Pouch.plugins) {
    Pouch.plugins[plugin]._delete(name);
  }
  var opts = Pouch.parseAdapter(name);
  Pouch.adapters[opts.adapter].destroy(opts.name, callback);
};

Pouch.adapter = function (id, obj) {
  if (obj.valid()) {
    Pouch.adapters[id] = obj;
  }
};

Pouch.plugin = function(id, obj) {
  Pouch.plugins[id] = obj;
};

// Enumerate errors, add the status code so we can reflect the HTTP api
// in future
Pouch.Errors = {
  MISSING_BULK_DOCS: {
    status: 400,
    error: 'bad_request',
    reason: "Missing JSON list of 'docs'"
  },
  MISSING_DOC: {
    status: 404,
    error: 'not_found',
    reason: 'missing'
  },
  REV_CONFLICT: {
    status: 409,
    error: 'conflict',
    reason: 'Document update conflict'
  },
  INVALID_ID: {
    status: 400,
    error: 'invalid_id',
    reason: '_id field must contain a string'
  },
  MISSING_ID: {
    status: 412,
    error: 'missing_id',
    reason: '_id is required for puts'
  },
  RESERVED_ID: {
    status: 400,
    error: 'bad_request',
    reason: 'Only reserved document ids may start with underscore.'
  },
  NOT_OPEN: {
    status: 412,
    error: 'precondition_failed',
    reason: 'Database not open so cannot close'
  },
  UNKNOWN_ERROR: {
    status: 500,
    error: 'unknown_error',
    reason: 'Database encountered an unknown error'
  },
  INVALID_REQUEST: {
    status: 400,
    error: 'invalid_request',
    reason: 'Request was invalid'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  global.Pouch = Pouch;
  Pouch.merge = require('./pouch.merge.js').merge;
  Pouch.collate = require('./pouch.collate.js').collate;
  Pouch.replicate = require('./pouch.replicate.js').replicate;
  Pouch.utils = require('./pouch.utils.js');
  module.exports = Pouch;

  // load adapters known to work under node
  var adapters = ['leveldb', 'http'];
  adapters.map(function(adapter) {
    var adapter_path = './adapters/pouch.'+adapter+'.js';
    require(adapter_path);
  });
  require('./plugins/pouchdb.mapreduce.js');
} else {
  this.Pouch = Pouch;
}

(function() {
  // a few hacks to get things in the right place for node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pouch;
  }

  Pouch.collate = function(a, b) {
    var ai = collationIndex(a);
    var bi = collationIndex(b);
    if ((ai - bi) !== 0) {
      return ai - bi;
    }
    if (a === null) {
      return 0;
    }
    if (typeof a === 'number') {
      return a - b;
    }
    if (typeof a === 'boolean') {
      return a < b ? -1 : 1;
    }
    if (typeof a === 'string') {
      return stringCollate(a, b);
    }
    if (Array.isArray(a)) {
      return arrayCollate(a, b)
    }
    if (typeof a === 'object') {
      return objectCollate(a, b);
    }
  }

  var stringCollate = function(a, b) {
    // See: https://github.com/daleharvey/pouchdb/issues/40
    // This is incompatible with the CouchDB implementation, but its the
    // best we can do for now
    return (a === b) ? 0 : ((a > b) ? 1 : -1);
  }

  var objectCollate = function(a, b) {
    var ak = Object.keys(a), bk = Object.keys(b);
    var len = Math.min(ak.length, bk.length);
    for (var i = 0; i < len; i++) {
      // First sort the keys
      var sort = Pouch.collate(ak[i], bk[i]);
      if (sort !== 0) {
        return sort;
      }
      // if the keys are equal sort the values
      sort = Pouch.collate(a[ak[i]], b[bk[i]]);
      if (sort !== 0) {
        return sort;
      }

    }
    return (ak.length === bk.length) ? 0 :
      (ak.length > bk.length) ? 1 : -1;
  }

  var arrayCollate = function(a, b) {
    var len = Math.min(a.length, b.length);
    for (var i = 0; i < len; i++) {
      var sort = Pouch.collate(a[i], b[i]);
      if (sort !== 0) {
        return sort;
      }
    }
    return (a.length === b.length) ? 0 :
      (a.length > b.length) ? 1 : -1;
  }

  // The collation is defined by erlangs ordered terms
  // the atoms null, true, false come first, then numbers, strings,
  // arrays, then objects
  var collationIndex = function(x) {
    var id = ['boolean', 'number', 'string', 'object'];
    if (id.indexOf(typeof x) !== -1) {
      if (x === null) {
        return 1;
      }
      return id.indexOf(typeof x) + 2;
    }
    if (Array.isArray(x)) {
      return 4.5;
    }
  }

}).call(this);

(function() {
  // a few hacks to get things in the right place for node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pouch;
    var utils = require('./pouch.utils.js');
    for (var k in utils) {
      global[k] = utils[k];
    }
  }

  // for a better overview of what this is doing, read:
  // https://github.com/apache/couchdb/blob/master/src/couchdb/couch_key_tree.erl
  //
  // But for a quick intro, CouchDB uses a revision tree to store a documents
  // history, A -> B -> C, when a document has conflicts, that is a branch in the
  // tree, A -> (B1 | B2 -> C), We store these as a nested array in the format
  //
  // KeyTree = [Path ... ]
  // Path = {pos: position_from_root, ids: Tree}
  // Tree = [Key, Tree]

  // Turn a path as a flat array into a tree with a single branch
  function pathToTree(path) {
    var root = [path.shift(), []];
    var leaf = root;
    while (path.length) {
      nleaf = [path.shift(), []];
      leaf[1].push(nleaf);
      leaf = nleaf;
    }
    return root;
  }

  // To ensure we dont grow the revision tree infinitely, we stem old revisions
  function stem(tree, depth) {
    // First we break out the tree into a complete list of root to leaf paths,
    // we cut off the start of the path and generate a new set of flat trees
    var stemmedPaths = rootToLeaf(tree).map(function(path) {
      var stemmed = path.ids.slice(-depth);
      return {
        pos: path.pos + (path.ids.length - stemmed.length),
        ids: pathToTree(stemmed)
      };
    });
    // Then we remerge all those flat trees together, ensuring that we dont
    // connect trees that would go beyond the depth limit
    return stemmedPaths.reduce(function(prev, current, i, arr) {
      return doMerge(prev, current, true).tree;
    }, [stemmedPaths.shift()]);
  }

  // Merge two trees together
  // The roots of tree1 and tree2 must be the same revision

  function mergeTree(in_tree1, in_tree2) {
    var queue = [{tree1: in_tree1, tree2: in_tree2}];
    var conflicts = false;
    while (queue.length > 0) {
      var item = queue.pop();
      var tree1 = item.tree1;
      var tree2 = item.tree2;

      for (var i = 0; i < tree2[1].length; i++) {
        if (!tree1[1][0]) {
          conflicts = 'new_leaf';
          tree1[1][0] = tree2[1][i];
          continue;
        }

        var merged = false;
        for (var j = 0; j < tree1[1].length; j++) {
          if (tree1[1][j][0] == tree2[1][i][0]) {
            queue.push({tree1: tree1[1][j], tree2: tree2[1][i]});
            merged = true;
          }
        }
        if (!merged) {
          conflicts = 'new_branch';
          tree1[1].push(tree2[1][i]);
          tree1[1].sort();
        }
      }
    }
    return {conflicts: conflicts, tree: in_tree1};
  }

  function doMerge(tree, path, dontExpand) {
    var restree = [];
    var conflicts = false;
    var merged = false;
    var res, branch;

    if (!tree.length) {
      return {tree: [path], conflicts: 'new_leaf'};
    }

    tree.forEach(function(branch) {
      if (branch.pos === path.pos && branch.ids[0] === path.ids[0]) {
        // Paths start at the same position and have the same root, so they need
        // merged
        res = mergeTree(branch.ids, path.ids);
        restree.push({pos: branch.pos, ids: res.tree});
        conflicts = conflicts || res.conflicts;
        merged = true;
      } else if (dontExpand !== true) {
        // The paths start at a different position, take the earliest path and
        // traverse up until it as at the same point from root as the path we want to
        // merge.  If the keys match we return the longer path with the other merged
        // After stemming we dont want to expand the trees

        var t1 = branch.pos < path.pos ? branch : path;
        var t2 = branch.pos < path.pos ? path : branch;
        var diff = t2.pos - t1.pos;

        var candidateParents = [];

        var trees = [];
        trees.push({ids: t1.ids, diff: diff, parent: null, parentIdx: null});
        while (trees.length > 0) {
          var item = trees.pop();
          if (item.diff == 0) {
            if (item.ids[0] == t2.ids[0]) {
              candidateParents.push(item);
            }
            continue;
          }
          if (!item.ids) continue;
          item.ids[1].forEach(function(el, idx) {
            trees.push({ids: el, diff: item.diff-1, parent: item.ids, parentIdx: idx});
          });
        }

        var el = candidateParents[0];

        if (!el) {
          restree.push(branch);
        } else {
          res = mergeTree(el.ids, t2.ids);
          el.parent[1][el.parentIdx] = res.tree;
          restree.push({pos: t1.pos, ids: t1.ids});
          conflicts = conflicts || res.conflicts;
          merged = true;
        }
      } else {
        restree.push(branch);
      }
    });

    // We didnt find
    if (!merged) {
      restree.push(path);
    }

    restree.sort(function(a, b) {
      return a.pos - b.pos;
    });

    return {
      tree: restree,
      conflicts: conflicts || 'internal_node'
    };
  }

  Pouch.merge = function(tree, path, depth) {
    // Ugh, nicer way to not modify arguments in place?
    tree = extend(true, [], tree);
    path = extend(true, {}, path);
    var newTree = doMerge(tree, path);
    return {
      tree: stem(newTree.tree, depth),
      conflicts: newTree.conflicts
    };
  };

  // We fetch all leafs of the revision tree, and sort them based on tree length
  // and whether they were deleted, undeleted documents with the longest revision
  // tree (most edits) win
  // The final sort algorithm is slightly documented in a sidebar here:
  // http://guide.couchdb.org/draft/conflicts.html
  Pouch.merge.winningRev = function(metadata) {
    var deletions = metadata.deletions || {};
    var leafs = [];

    traverseRevTree(metadata.rev_tree, function(isLeaf, pos, id) {
      if (isLeaf) leafs.push({pos: pos, id: id});
    });

    leafs.forEach(function(leaf) {
      leaf.deleted = leaf.id in deletions;
    });

    leafs.sort(function(a, b) {
      if (a.deleted !== b.deleted) {
        return a.deleted > b.deleted ? 1 : -1;
      }
      if (a.pos !== b.pos) {
        return b.pos - a.pos;
      }
      return a.id < b.id ? 1 : -1;
    });
    return leafs[0].pos + '-' + leafs[0].id;
  };

}).call(this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pouch;
}

(function() {

  function replicate(src, target, opts, callback, replicateRet) {

    fetchCheckpoint(src, target, opts, function(checkpoint) {
      var results = [];
      var completed = false;
      var pending = 0;
      var last_seq = checkpoint;
      var continuous = opts.continuous || false;
      var result = {
        ok: true,
        start_time: new Date(),
        docs_read: 0,
        docs_written: 0
      };

      function isCompleted() {
        if (completed && pending === 0) {
          result.end_time = new Date();
          writeCheckpoint(src, target, opts, last_seq, function() {
            call(callback, null, result);
          });
        }
      }

      if (replicateRet.cancelled) {
        return;
      }

      var repOpts = {
        continuous: continuous,
        since: checkpoint,
        style: 'all_docs',
        onChange: function(change) {
          last_seq = change.seq;
          results.push(change);
          result.docs_read++;
          pending++;
          var diff = {};
          diff[change.id] = change.changes.map(function(x) { return x.rev; });
          target.revsDiff(diff, function(err, diffs) {
            if (err) {
              if (continuous)
                replicateRet.cancel();
              call(callback, err, null);
              return;
            }
            if (Object.keys(diffs).length === 0) {
              pending--;
              isCompleted();
              return;
            }
            for (var id in diffs) {
              diffs[id].missing.map(function(rev) {
                src.get(id, {revs: true, rev: rev, attachments: true}, function(err, doc) {
                  target.bulkDocs({docs: [doc]}, {new_edits: false}, function() {
                    if (opts.onChange) {
                      opts.onChange.apply(this, [result]);
                    }
                    result.docs_written++;
                    pending--;
                    isCompleted();
                  });
                });
              });
            }
          });
        },
        complete: function(err, res) {
          completed = true;
          isCompleted();
        }
      };

      if (opts.filter) {
        repOpts.filter = opts.filter;
      }

      if (opts.query_params) {
        repOpts.query_params = opts.query_params;
      }

      var changes = src.changes(repOpts);
      if (opts.continuous) {
        replicateRet.cancel = changes.cancel;
      }
    });
  }

  function toPouch(db, callback) {
    if (typeof db === 'string') {
      return new Pouch(db, callback);
    }
    callback(null, db);
  }

  Pouch.replicate = function(src, target, opts, callback) {
    // TODO: This needs some cleaning up, from the replicate call I want
    // to return a promise in which I can cancel continuous replications
    // this will just proxy requests to cancel the changes feed but only
    // after we start actually running the changes feed
    if (opts instanceof Function) {
      callback = opts;
      opts = {}
    }
    if (opts === undefined) {
      opts = {};
    }

    var ret = function() {
      this.cancelled = false;
      this.cancel = function() {
        this.cancelled = true;
      }
    }
    var replicateRet = new ret();
    toPouch(src, function(err, src) {
      if (err) {
        return call(callback, err);
      }
      toPouch(target, function(err, target) {
        if (err) {
          return call(callback, err);
        }
        replicate(src, target, opts, callback, replicateRet);
      });
    });
    return replicateRet;
  };

}).call(this);

// Pretty dumb name for a function, just wraps callback calls so we dont
// to if (callback) callback() everywhere
var call = function(fun) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (typeof fun === typeof Function) {
    fun.apply(this, args);
  }
}

// Wrapper for functions that call the bulkdocs api with a single doc,
// if the first result is an error, return an error
var yankError = function(callback) {
  return function(err, results) {
    if (err || results[0].error) {
      call(callback, err || results[0]);
    } else {
      call(callback, null, results[0]);
    }
  };
};

var isAttachmentId = function(id) {
  return (/\//.test(id)
      && !/^_local/.test(id)
      && !/^_design/.test(id));
}

// Parse document ids: docid[/attachid]
//   - /attachid is optional, and can have slashes in it too
//   - int ids and strings beginning with _design or _local are not split
// returns an object: { docId: docid, attachmentId: attachid }
var parseDocId = function(id) {
  var ids = (typeof id === 'string') && !(/^_(design|local)\//.test(id))
    ? id.split('/')
    : [id]
  return {
    docId: ids[0],
    attachmentId: ids.splice(1).join('/').replace(/^\/+/, '')
  }
}

// check if a specific revision of a doc has been deleted
//  - metadata: the metadata object from the doc store
//  - rev: (optional) the revision to check. defaults to metadata.rev
var isDeleted = function(metadata, rev) {
  if (!metadata || !metadata.deletions) return false;
  if (!rev) {
    rev = Pouch.merge.winningRev(metadata);
  }
  if (rev.indexOf('-') >= 0) {
    rev = rev.split('-')[1];
  }

  return metadata.deletions[rev] === true;
}

// Determine id an ID is valid
//   - invalid IDs begin with an underescore that does not begin '_design' or '_local'
//   - any other string value is a valid id
var isValidId = function(id) {
  if (/^_/.test(id)) {
    return /^_(design|local)/.test(id);
  }
  return true;
}

// Preprocess documents, parse their revisions, assign an id and a
// revision for new writes that are missing them, etc
var parseDoc = function(doc, newEdits) {
  var error = null;

  // check for an attachment id and add attachments as needed
  if (doc._id) {
    var id = parseDocId(doc._id);
    if (id.attachmentId !== '') {
      var attachment = btoa(JSON.stringify(doc));
      doc = {
        _id: id.docId,
      }
      if (!doc._attachments) {
        doc._attachments = {};
      }
      doc._attachments[id.attachmentId] = {
        content_type: 'application/json',
        data: attachment
      }
    }
  }

  if (newEdits) {
    if (!doc._id) {
      doc._id = Math.uuid();
    }
    var newRevId = Math.uuid(32, 16).toLowerCase();
    var nRevNum;
    if (doc._rev) {
      var revInfo = /^(\d+)-(.+)$/.exec(doc._rev);
      if (!revInfo) {
        throw "invalid value for property '_rev'";
      }
      doc._rev_tree = [{
        pos: parseInt(revInfo[1], 10),
        ids: [revInfo[2], [[newRevId, []]]]
      }];
      nRevNum = parseInt(revInfo[1], 10) + 1;
    } else {
      doc._rev_tree = [{
        pos: 1,
        ids : [newRevId, []]
      }];
      nRevNum = 1;
    }
  } else {
    if (doc._revisions) {
      doc._rev_tree = [{
        pos: doc._revisions.start - doc._revisions.ids.length + 1,
        ids: doc._revisions.ids.reduce(function(acc, x) {
          if (acc === null) {
            return [x, []];
          } else {
            return [x, [acc]];
          }
        }, null)
      }];
      nRevNum = doc._revisions.start;
      newRevId = doc._revisions.ids[0];
    }
    if (!doc._rev_tree) {
      var revInfo = /^(\d+)-(.+)$/.exec(doc._rev);
      nRevNum = parseInt(revInfo[1], 10);
      newRevId = revInfo[2];
      doc._rev_tree = [{
        pos: parseInt(revInfo[1], 10),
        ids: [revInfo[2], []]
      }];
    }
  }

  if (typeof doc._id !== 'string') {
    error = Pouch.Errors.INVALID_ID;
  }
  else if (!isValidId(doc._id)) {
    error = Pouch.Errors.RESERVED_ID;
  }

  doc._id = decodeURIComponent(doc._id);
  doc._rev = [nRevNum, newRevId].join('-');

  if (error) {
    return error;
  }

  return Object.keys(doc).reduce(function(acc, key) {
    if (/^_/.test(key) && key !== '_attachments') {
      acc.metadata[key.slice(1)] = doc[key];
    } else {
      acc.data[key] = doc[key];
    }
    return acc;
  }, {metadata : {}, data : {}});
};

var compareRevs = function(a, b) {
  // Sort by id
  if (a.id !== b.id) {
    return (a.id < b.id ? -1 : 1);
  }
  // Then by deleted
  if (a.deleted ^ b.deleted) {
    return (a.deleted ? -1 : 1);
  }
  // Then by rev id
  if (a.rev_tree[0].pos === b.rev_tree[0].pos) {
    return (a.rev_tree[0].ids < b.rev_tree[0].ids ? -1 : 1);
  }
  // Then by depth of edits
  return (a.rev_tree[0].start < b.rev_tree[0].start ? -1 : 1);
};

// Pretty much all below can be combined into a higher order function to
// traverse revisions
// Callback has signature function(isLeaf, pos, id, [context])
// The return value from the callback will be passed as context to all children of that node
var traverseRevTree = function(revs, callback) {
  var toVisit = [];

  revs.forEach(function(tree) {
    toVisit.push({pos: tree.pos, ids: tree.ids});
  });

  while (toVisit.length > 0) {
    var node = toVisit.pop(),
        pos = node.pos,
        tree = node.ids;
    var newCtx = callback(tree[1].length == 0, pos, tree[0], node.ctx);
    tree[1].forEach(function(branch) {
      toVisit.push({pos: pos+1, ids: branch, ctx: newCtx});
    });
  }
}

var collectRevs = function(path) {
  var revs = [];

  traverseRevTree([path], function(isLeaf, pos, id) {
    revs.push({rev: pos + "-" + id, status: 'available'});
  });

  return revs;
}

var collectLeaves = function(revs) {
  var leaves = [];
  traverseRevTree(revs, function(isLeaf, pos, id) {
    if (isLeaf) leaves.unshift({rev: pos + "-" + id, pos: pos});
  });
  leaves.sort(function(a, b) {
    return b.pos-a.pos;
  });
  leaves.map(function(leaf) { delete leaf.pos });
  return leaves;
}

var collectConflicts = function(revs) {
  var leaves = collectLeaves(revs);
  // First is current rev
  leaves.shift();
  return leaves.map(function(x) { return x.rev; });
}

var fetchCheckpoint = function(src, target, opts, callback) {
  var filter_func = '';
  if(typeof opts.filter != "undefined"){
    filter_func = opts.filter.toString();
  }

  var id = Crypto.MD5(src.id() + target.id() + filter_func);
  src.get('_local/' + id, function(err, doc) {
    if (err && err.status === 404) {
      callback(0);
    } else {
      callback(doc.last_seq);
    }
  });
};

var writeCheckpoint = function(src, target, opts, checkpoint, callback) {
  var filter_func = '';
  if(typeof opts.filter != "undefined"){
    filter_func = opts.filter.toString();
  }

  var check = {
    _id: '_local/' + Crypto.MD5(src.id() + target.id() + filter_func),
    last_seq: checkpoint
  };
  src.get(check._id, function(err, doc) {
    if (doc && doc._rev) {
      check._rev = doc._rev;
    }
    src.put(check, function(err, doc) {
      callback();
    });
  });
};

var arrayFirst = function(arr, callback) {
  for (var i = 0; i < arr.length; i++) {
    if (callback(arr[i], i) === true) {
      return arr[i];
    }
  }
  return false;
};

var filterChange = function(opts) {
  return function(change) {
    if (opts.filter && !opts.filter.call(this, change.doc)) {
      return;
    }
    if (!opts.include_docs) {
      delete change.doc;
    }
    call(opts.onChange, change);
  }
};

var rootToLeaf = function(tree) {
  var paths = [];
  traverseRevTree(tree, function(isLeaf, pos, id, history) {
    history = history ? history.slice(0) : [];
    history.push(id);
    if (isLeaf) {
      var rootPos = pos + 1 - history.length;
      paths.unshift({pos: rootPos, ids: history});
    }
    return history;
  });
  return paths;
};

var ajax = function ajax(options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  var defaultOptions = {
    method : "GET",
    headers: {},
    json: true,
    timeout: 10000
  };
  options = extend(true, defaultOptions, options);
  if (options.auth) {
      var token = btoa(options.auth.username + ':' + options.auth.password);
      options.headers.Authorization = 'Basic ' + token;
  }
  var onSuccess = function(obj, resp, cb){
    if (!options.json && typeof obj !== 'string') {
          obj = JSON.stringify(obj);
    } else if (options.json && typeof obj === 'string') {
          obj = JSON.parse(obj);
    }
    call(cb, null, obj, resp);
  };
  var onError = function(err, cb){
    var errParsed;
    var errObj = err.responseText ? {status: err.status} : err; //this seems too clever
         try{
          errParsed = JSON.parse(err.responseText); //would prefer not to have a try/catch clause
          errObj = extend(true, {}, errObj, errParsed);
         } catch(e){}
         call(cb, errObj);
  };
  if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    var timer,timedout  = false;
    var xhr = new XMLHttpRequest();
    xhr.open(options.method, options.url);
    if (options.json) {
      options.headers.Accept = 'application/json';
      options.headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body !== "string") {
        options.body = JSON.stringify(options.body);
      }
    }
    for (var key in options.headers){
      xhr.setRequestHeader(key, options.headers[key]);
    }
    if (!("body" in options)) {
      options.body = null;
    }

    var abortReq = function() {
        timedout=true;
        xhr.abort();
        call(onError, xhr, callback);
      }
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4 || timedout) return;
      clearTimeout(timer);
      if (xhr.status >= 200 && xhr.status < 300){
        call(onSuccess, xhr.responseText, xhr, callback);
      } else {
         call(onError, xhr, callback);
      }
    };
    if (options.timeout > 0) {
      timer = setTimeout(abortReq, options.timeout);
    }
    xhr.send(options.body);
    return {abort:abortReq};
  } else {
    if (options.json) {
      options.headers.Accept = 'application/json';
      options.headers['Content-Type'] = 'application/json';
    }
    return request(options, function(err, response, body) {
      if (err) {
        err.status = response ? response.statusCode : 400;
        return call(onError, err, callback);
      }

      var content_type = response.headers['content-type']
        , data = (body || '');

      // CouchDB doesn't always return the right content-type for JSON data, so
      // we check for ^{ and }$ (ignoring leading/trailing whitespace)
      if (options.json && typeof data !== 'object' && (/json/.test(content_type)
          || (/^[\s]*{/.test(data) && /}[\s]*$/.test(data)))) {
        data = JSON.parse(data);
      }

      if (data.error) {
        data.status = response.statusCode;
        call(onError, data, callback);
      }
      else {
        call(onSuccess, data, response, callback);
      }
    });
  }
};

// Extends method
// (taken from http://code.jquery.com/jquery-1.9.0.js)
// Populate the class2type map
var class2type = {};

var types = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object", "Error"];
for (var i = 0; i < types.length; i++) {
  var typename = types[i];
  class2type[ "[object " + typename + "]" ] = typename.toLowerCase();
}

var core_toString = class2type.toString;
var core_hasOwn = class2type.hasOwnProperty;

var type = function(obj) {
  if (obj === null) {
    return String( obj );
  }
  return typeof obj === "object" || typeof obj === "function" ?
    class2type[core_toString.call(obj)] || "object" :
    typeof obj;
};

var isPlainObject = function( obj ) {
  // Must be an Object.
  // Because of IE, we also have to check the presence of the constructor property.
  // Make sure that DOM nodes and window objects don't pass through, as well
  if ( !obj || type(obj) !== "object" || obj.nodeType || isWindow( obj ) ) {
    return false;
  }

  try {
    // Not own constructor property must be Object
    if ( obj.constructor &&
      !core_hasOwn.call(obj, "constructor") &&
      !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
      return false;
    }
  } catch ( e ) {
    // IE8,9 Will throw exceptions on certain host objects #9897
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.

  var key;
  for ( key in obj ) {}

  return key === undefined || core_hasOwn.call( obj, key );
};

var isFunction = function(obj) {
  return type(obj) === "function";
};

var isWindow = function(obj) {
  return obj != null && obj == obj.window;
};

var isArray = Array.isArray || function(obj) {
  return type(obj) === "array";
};

var extend = function() {
  var options, name, src, copy, copyIsArray, clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !isFunction(target) ) {
    target = {};
  }

  // extend jQuery itself if only one argument is passed
  if ( length === i ) {
    target = this;
    --i;
  }

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ((options = arguments[ i ]) != null) {
      // Extend the base object
      for ( name in options ) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = isArray(copy)) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && isArray(src) ? src : [];

          } else {
            clone = src && isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = extend( deep, clone, copy );

        // Don't bring in undefined values
        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};

// Basic wrapper for localStorage
var win = this;
var localJSON = (function(){
  if (!win.localStorage) {
    return false;
  }
  return {
    set: function(prop, val) {
      localStorage.setItem(prop, JSON.stringify(val));
    },
    get: function(prop, def) {
      try {
        if (localStorage.getItem(prop) === null) {
          return def;
        }
        return JSON.parse((localStorage.getItem(prop) || 'false'));
      } catch(err) {
        return def;
      }
    },
    remove: function(prop) {
      localStorage.removeItem(prop);
    }
  };
})();

// btoa and atob don't exist in node. see https://developer.mozilla.org/en-US/docs/DOM/window.btoa
if (typeof btoa === 'undefined') {
  btoa = function(str) {
    return new Buffer(unescape(encodeURIComponent(str)), 'binary').toString('base64');
  }
}
if (typeof atob === 'undefined') {
  atob = function(str) {
    return decodeURIComponent(escape(new Buffer(str, 'base64').toString('binary')));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  // use node.js's crypto library instead of the Crypto object created by deps/uuid.js
  var crypto = require('crypto');
  var Crypto = {
    MD5: function(str) {
      return crypto.createHash('md5').update(str).digest('hex');
    }
  }
  request = require('request');
  _ = require('underscore');
  $ = _;

  module.exports = {
    Crypto: Crypto,
    call: call,
    yankError: yankError,
    isAttachmentId: isAttachmentId,
    parseDocId: parseDocId,
    parseDoc: parseDoc,
    isDeleted: isDeleted,
    compareRevs: compareRevs,
    collectRevs: collectRevs,
    collectLeaves: collectLeaves,
    collectConflicts: collectConflicts,
    fetchCheckpoint: fetchCheckpoint,
    writeCheckpoint: writeCheckpoint,
    arrayFirst: arrayFirst,
    filterChange: filterChange,
    ajax: ajax,
    atob: atob,
    btoa: btoa,
    extend: extend,
    traverseRevTree: traverseRevTree,
    rootToLeaf: rootToLeaf,
    isPlainObject: isPlainObject,
    isArray: isArray
  }
}

var Changes = function() {

  var api = {};
  var listeners = {};

  window.addEventListener("storage", function(e) {
    api.notify(e.key);
  });

  api.addListener = function(db_name, id, db, opts) {
    if (!listeners[db_name]) {
      listeners[db_name] = {};
    }
    listeners[db_name][id] = {
      db: db,
      opts: opts
    };
  }

  api.removeListener = function(db_name, id) {
    delete listeners[db_name][id];
  }

  api.clearListeners = function(db_name) {
    delete listeners[db_name];
  }

  api.notify = function(db_name) {
    if (!listeners[db_name]) { return; }
    for (var i in listeners[db_name]) {
      var opts = listeners[db_name][i].opts;
      listeners[db_name][i].db.changes({
        include_docs: opts.include_docs,
        conflicts: opts.conflicts,
        continuous: false,
        filter: opts.filter,
        since: opts.since,
        onChange: function(c) {
          if (c.seq > opts.since) {
            opts.since = c.seq;
            call(opts.onChange, c);
          }
        }
      });
    }
  }

  return api;
};


"use strict";

var HTTP_TIMEOUT = 10000;

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri (str) {
  var o = parseUri.options;
  var m = o.parser[o.strictMode ? "strict" : "loose"].exec(str);
  var uri = {};
  var i = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
}

parseUri.options = {
  strictMode: false,
  key: ["source","protocol","authority","userInfo","user","password","host",
        "port","relative","path","directory","file","query","anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

// Get all the information you possibly can about the URI given by name and
// return it as a suitable object.
function getHost(name) {
  // If the given name contains "http:"
  if (/http(s?):/.test(name)) {
    // Prase the URI into all its little bits
    var uri = parseUri(name);

    // Store the fact that it is a remote URI
    uri.remote = true;

    // Store the user and password as a separate auth object
    if (uri.user || uri.password) {
      uri.auth = {username: uri.user, password: uri.password};
    }

    // Split the path part of the URI into parts using '/' as the delimiter
    // after removing any leading '/' and any trailing '/'
    var parts = uri.path.replace(/(^\/|\/$)/g, '').split('/');

    // Store the first part as the database name and remove it from the parts
    // array
    uri.db = parts.pop();

    // Restore the path by joining all the remaining parts (all the parts
    // except for the database name) with '/'s
    uri.path = parts.join('/');

    return uri;
  }

  // If the given name does not contain 'http:' then return a very basic object
  // with no host, the current path, the given name as the database name and no
  // username/password
  return {host: '', path: '/', db: name, auth: false};
}

// Generate a URL with the host data given by opts and the given path
function genDBUrl(opts, path) {
  // If the host is remote
  if (opts.remote) {
    // If the host already has a path, then we need to have a path delimiter
    // Otherwise, the path delimiter is the empty string
    var pathDel = !opts.path ? '' : '/';

    // Return the URL made up of all the host's information and the given path
    return opts.protocol + '://' + opts.host + ':' + opts.port + '/' +
      opts.path + pathDel + opts.db + '/' + path;
  }

  // If the host is not remote, then return the URL made up of just the
  // database name and the given path
  return '/' + opts.db + '/' + path;
}

// Generate a URL with the host data given by opts and the given path
function genUrl(opts, path) {
  if (opts.remote) {
    return opts.protocol + '://' + opts.host + ':' + opts.port + '/' + path;
  }
  return '/' + path;
}

// Implements the PouchDB API for dealing with CouchDB instances over HTTP
var HttpPouch = function(opts, callback) {

  // Parse the URI given by opts.name into an easy-to-use object
  var host = getHost(opts.name);
  if (opts.auth) host.auth = opts.auth;

  // Generate the database URL based on the host
  var db_url = genDBUrl(host, '');

  // The functions that will be publically available for HttpPouch
  var api = {};

  var uuids = {
    list: [],
    get: function(opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {count: 10};
      }
      var cb = function(err, body) {
        if (err || !('uuids' in body)) {
          call(callback, err || Pouch.Errors.UNKNOWN_ERROR);
        } else {
          uuids.list = uuids.list.concat(body.uuids);
          call(callback, null, "OK");
        }
      };
      var params = '?count=' + opts.count;
      ajax({
        auth: host.auth,
        method: 'GET',
        url: genUrl(host, '_uuids') + params
      }, cb);
    }
  };

  // Create a new CouchDB database based on the given opts
  var createDB = function(){
    ajax({auth: host.auth, method: 'PUT', url: db_url}, function(err, ret) {
      // If we get an "Unauthorized" error
      if (err && err.status === 401) {
        // Test if the database already exists
        ajax({auth: host.auth, method: 'HEAD', url: db_url}, function (err, ret) {
          // If there is still an error
          if (err) {
            // Give the error to the callback to deal with
            call(callback, err);
          } else {
            // Continue as if there had been no errors
            call(callback, null, api);
          }
        });
        // If there were no errros or if the only error is "Precondition Failed"
        // (note: "Precondition Failed" occurs when we try to create a database
        // that already exists)
      } else if (!err || err.status === 412) {
        // Continue as if there had been no errors
        call(callback, null, api);
      } else {
        call(callback, Pouch.Errors.UNKNOWN_ERROR);
      }
    });
  };

  // ajax({auth: host.auth, method: 'GET', url: db_url}, function(err, ret) {
  //   //check if the db exists
  //   if (err) {
  //     if (err.status === 404) {
  //       //if it doesn't, create it
  //       createDB();
  //     } else {
  //       call(callback, err);
  //     }
  //   } else {
  //     //go do stuff with the db
  //     call(callback, null, api);
  //     }
  // });

  api.type = function() {
    return 'http';
  };

  // The HttpPouch's ID is its URL
  api.id = function() {
    return genDBUrl(host, '');
  };

  api.request = function(options, callback) {
    options.auth = host.auth;
    options.url = genDBUrl(host, options.url);
    ajax(options, callback);
  };

  // Sends a POST request to the host calling the couchdb _compact function
  //    version: The version of CouchDB it is running
  api.compact = function(callback) {
    ajax({
      auth: host.auth,
      url: genDBUrl(host, '_compact'),
      method: 'POST'
    }, callback)
  }

  // Calls GET on the host, which gets back a JSON string containing
  //    couchdb: A welcome string
  //    version: The version of CouchDB it is running
  api.info = function(callback) {
    ajax({
      auth: host.auth,
      method:'GET',
      url: genDBUrl(host, ''),
    }, callback);
  };

  // Get the document with the given id from the database given by host.
  // The id could be solely the _id in the database, or it may be a
  // _design/ID or _local/ID path
  api.get = function(id, opts, callback) {
    // If no options were given, set the callback to the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // List of parameters to add to the GET request
    var params = [];

    // If it exists, add the opts.revs value to the list of parameters.
    // If revs=true then the resulting JSON will include a field
    // _revisions containing an array of the revision IDs.
    if (opts.revs) {
      params.push('revs=true');
    }

    // If it exists, add the opts.revs_info value to the list of parameters.
    // If revs_info=true then the resulting JSON will include the field
    // _revs_info containing an array of objects in which each object
    // representing an available revision.
    if (opts.revs_info) {
      params.push('revs_info=true');
    }

    // If it exists, add the opts.attachments value to the list of parameters.
    // If attachments=true the resulting JSON will include the base64-encoded
    // contents in the "data" property of each attachment.
    if (opts.attachments) {
      params.push('attachments=true');
    }

    // If it exists, add the opts.rev value to the list of parameters.
    // If rev is given a revision number then get the specified revision.
    if (opts.rev) {
      params.push('rev=' + opts.rev);
    }

    // If it exists, add the opts.conflicts value to the list of parameters.
    // If conflicts=true then the resulting JSON will include the field
    // _conflicts containing all the conflicting revisions.
    if (opts.conflicts) {
      params.push('conflicts=' + opts.conflicts);
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    params = params === '' ? '' : '?' + params;

    // Set the options for the ajax call
    var options = {
      auth: host.auth,
      method: 'GET',
      url: genDBUrl(host, id + params)
    };

    // If the given id contains at least one '/' and the part before the '/'
    // is NOT "_design" and is NOT "_local"
    // OR
    // If the given id contains at least two '/' and the part before the first
    // '/' is "_design".
    // TODO This second condition seems strange since if parts[0] === '_design'
    // then we already know that parts[0] !== '_local'.
    var parts = id.split('/');
    if ((parts.length > 1 && parts[0] !== '_design' && parts[0] !== '_local') ||
        (parts.length > 2 && parts[0] === '_design' && parts[0] !== '_local')) {
      // Nothing is expected back from the server
      options.json = false;
    }

    // Get the document
    ajax(options, function(err, doc, xhr) {
      // If the document does not exist, send an error to the callback
      if (err) {
        return call(callback, Pouch.Errors.MISSING_DOC);
      }

      // Send the document to the callback
      call(callback, null, doc, xhr);
    });
  };

  // Delete the document given by doc from the database given by host.
  api.remove = function(doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // Delete the document
    ajax({
      auth: host.auth,
      method:'DELETE',
      url: genDBUrl(host, doc._id) + '?rev=' + doc._rev
    }, callback);
  };

  // Remove the attachment given by the id and rev
  api.removeAttachment = function idb_removeAttachment(id, rev, callback) {
    ajax({
      auth: host.auth,
      method: 'DELETE',
      url: genDBUrl(host, id) + '?rev=' + rev,
    }, callback);
  };

  // Add the attachment given by doc and the content type given by type
  // to the document with the given id, the revision given by rev, and
  // add it to the database given by host.
  api.putAttachment = function(id, rev, doc, type, callback) {
    // Add the attachment
    ajax({
      auth: host.auth,
      method:'PUT',
      url: genDBUrl(host, id) + '?rev=' + rev,
      headers: {'Content-Type': type},
      body: doc
    }, callback);
  };

  // Add the document given by doc (in JSON string format) to the database
  // given by host. This fails if the doc has no _id field.
  api.put = function(doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (!doc || !('_id' in doc)) {
      return call(callback, Pouch.Errors.MISSING_ID);
    }

    // List of parameter to add to the PUT request
    var params = [];

    // If it exists, add the opts.new_edits value to the list of parameters.
    // If new_edits = false then the database will NOT assign this document a
    // new revision number
    if (opts && typeof opts.new_edits !== 'undefined') {
      params.push('new_edits=' + opts.new_edits);
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    if (params !== '') {
      params = '?' + params;
    }

    // Add the document
    ajax({
      auth: host.auth,
      method: 'PUT',
      url: genDBUrl(host, doc._id) + params,
      body: doc
    }, callback);
  };

  // Add the document given by doc (in JSON string format) to the database
  // given by host. This does not assume that doc is a new document (i.e. does not
  // have a _id or a _rev field.
  api.post = function(doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (! ("_id" in doc)) {
      if (uuids.list.length > 0) {
        doc._id = uuids.list.pop();
        api.put(doc, opts, callback);
      }else {
        uuids.get(function(err, resp) {
          if (err) {
            return call(callback, Pouch.Errors.UNKNOWN_ERROR);
          }
          doc._id = uuids.list.pop();
          api.put(doc, opts, callback);
        });
      }
    } else {
      api.put(doc, opts, callback);
    }
  };

  // Update/create multiple documents given by req in the database
  // given by host.
  api.bulkDocs = function(req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!opts) {
      opts = {}
    }

    // If opts.new_edits exists add it to the document data to be
    // send to the database.
    // If new_edits=false then it prevents the database from creating
    // new revision numbers for the documents. Instead it just uses
    // the old ones. This is used in database replication.
    if (typeof opts.new_edits !== 'undefined') {
      req.new_edits = opts.new_edits;
    }

    // Update/create the documents
    ajax({
      auth: host.auth,
      method:'POST',
      url: genDBUrl(host, '_bulk_docs'),
      body: req
    }, callback);
  };

  // Get a listing of the documents in the database given
  // by host and ordered by increasing id.
  api.allDocs = function(opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // List of parameters to add to the GET request
    var params = [];
    var body = undefined;
    var method = 'GET';

    // TODO I don't see conflicts as a valid parameter for a
    // _all_docs request (see http://wiki.apache.org/couchdb/HTTP_Document_API#all_docs)
    if (opts.conflicts) {
      params.push('conflicts=true');
    }

    // If opts.include_docs exists, add the include_docs value to the
    // list of parameters.
    // If include_docs=true then include the associated document with each
    // result.
    if (opts.include_docs) {
      params.push('include_docs=true');
    }

    // If opts.startkey exists, add the startkey value to the list of
    // parameters.
    // If startkey is given then the returned list of documents will
    // start with the document whose id is startkey.
    if (opts.startkey) {
      params.push('startkey=' +
                  encodeURIComponent(JSON.stringify(opts.startkey)));
    }

    // If opts.endkey exists, add the endkey value to the list of parameters.
    // If endkey is given then the returned list of docuemnts will
    // end with the document whose id is endkey.
    if (opts.endkey) {
      params.push('endkey=' + encodeURIComponent(JSON.stringify(opts.endkey)));
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    if (params !== '') {
      params = '?' + params;
    }

    // If keys are supplied, issue a POST request to circumvent GET query string limits
    // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
    if (typeof opts.keys !== 'undefined') {
      method = 'POST';
      body = JSON.stringify({keys:opts.keys});
    }

    // Get the document listing
    ajax({
      auth: host.auth,
      method: method,
      url: genDBUrl(host, '_all_docs' + params),
      body: body
    }, callback);
  };
  // Get a list of changes made to documents in the database given by host.
  // TODO According to the README, there should be two other methods here,
  // api.changes.addListener and api.changes.removeListener.
  api.changes = function(opts) {

    if (Pouch.DEBUG)
      console.log(db_url + ': Start Changes Feed: continuous=' + opts.continuous);

    // Query string of all the parameters to add to the GET request
    var params = [],
        paramsStr;

    if (opts.style) {
      params.push('style='+opts.style);
    }

    // If opts.include_docs exists, opts.filter exists, and opts.filter is a
    // function, add the include_docs value to the query string.
    // If include_docs=true then include the associated document with each
    // result.
    if (opts.include_docs || opts.filter && typeof opts.filter === 'function') {
      params.push('include_docs=true');
    }

    // If opts.continuous exists, add the feed value to the query string.
    // If feed=longpoll then it waits for either a timeout or a change to
    // occur before returning.
    if (opts.continuous) {
      params.push('feed=longpoll');
    }

    // If opts.conflicts exists, add the conflicts value to the query string.
    // TODO I can't find documentation of what conflicts=true does. See
    // http://wiki.apache.org/couchdb/HTTP_database_API#Changes
    if (opts.conflicts) {
      params.push('conflicts=true');
    }

    // If opts.descending exists, add the descending value to the query string.
    // if descending=true then the change results are returned in
    // descending order (most recent change first).
    if (opts.descending) {
      params.push('descending=true');
    }

    // If opts.filter exists and is a string then add the filter value
    // to the query string.
    // If filter is given a string containing the name of a filter in
    // the design, then only documents passing through the filter will
    // be returned.
    if (opts.filter && typeof opts.filter === 'string') {
      params.push('filter=' + opts.filter);
    }

    // If opts.query_params exists, pass it through to the changes request.
    // These parameters may be used by the filter on the source database.
    if (opts.query_params && typeof opts.query_params === 'object') {
      for (var param_name in opts.query_params) {
        if (opts.query_params.hasOwnProperty(param_name)) {
          params.push(param_name+'='+opts.query_params[param_name]);
        }
      }
    }

    paramsStr = '?';

    if (params.length > 0) {
      paramsStr += params.join('&');
    }

    var xhr;
    var last_seq;

    // Get all the changes starting wtih the one immediately after the
    // sequence number given by since.
    var fetch = function(since, callback) {
      // Set the options for the ajax call
      var xhrOpts = {
        auth: host.auth, method:'GET',
        url: genDBUrl(host, '_changes' + paramsStr + '&since=' + since),
        timeout: null          // _changes can take a long time to generate, especially when filtered
      };
      last_seq = since;

      if (opts.aborted) {
        return;
      }

      // Get the changes
      xhr = ajax(xhrOpts, callback);
    };

    // If opts.since exists, get all the changes from the sequence
    // number given by opts.since. Otherwise, get all the changes
    // from the sequence number 0.
    var fetchTimeout = 10;
    var fetchRetryCount = 0;
    var fetched = function(err, res) {
      // If the result of the ajax call (res) contains changes (res.results)
      if (res && res.results) {
        // For each change
        res.results.forEach(function(c) {
          var hasFilter = opts.filter && typeof opts.filter === 'function';
          if (opts.aborted || hasFilter && !opts.filter.apply(this, [c.doc])) {
            return;
          }

          // Process the change
          call(opts.onChange, c);
        });
      }
      // The changes feed may have timed out with no results
      // if so reuse last update sequence
      if (res && res.last_seq) {
        last_seq = res.last_seq;
      }

      if (opts.continuous) {
        // Increase retry delay exponentially as long as errors persist
        if (err) fetchRetryCount += 1;
        else fetchRetryCount = 0;
        var timeoutMultiplier = 1 << fetchRetryCount;       // i.e. Math.pow(2, fetchRetryCount)

        var retryWait = fetchTimeout * timeoutMultiplier;
        var maximumWait = opts.maximumWait || 30000;
        if (retryWait > maximumWait) {
          call(opts.complete, err || Pouch.Errors.UNKNOWN_ERROR, null);
        }

        // Queue a call to fetch again with the newest sequence number
        setTimeout(function () {
          fetch(last_seq, fetched);
        }, retryWait);
      } else {
        // We're done, call the callback
        call(opts.complete, null, res);
      }
    };

    fetch(opts.since || 0, fetched);

    // Return a method to cancel this method from processing any more
    return {
      cancel: function() {
        if (Pouch.DEBUG)
          console.log(db_url + ': Cancel Changes Feed');
        opts.aborted = true;
        xhr.abort();
      }
    };
  };

  // Given a set of document/revision IDs (given by req), tets the subset of
  // those that do NOT correspond to revisions stored in the database.
  // See http://wiki.apache.org/couchdb/HttpPostRevsDiff
  api.revsDiff = function(req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // Get the missing document/revision IDs
    ajax({
      auth: host.auth,
      method:'POST',
      url: genDBUrl(host, '_revs_diff'),
      body: req
    }, function(err, res) {
      call(callback, null, res);
    });
  };

  api.replicate = {};

  // Replicate from the database given by url to this HttpPouch
  api.replicate.from = function(url, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(url, api, opts, callback);
  };

  // Replicate to the database given by dbName from this HttpPouch
  api.replicate.to = function(dbName, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(api, dbName, opts, callback);
  };

  api.close = function(callback) {
    call(callback, null);
  };

  call(callback, null, api);
  return api;
};

// Delete the HttpPouch specified by the given name.
HttpPouch.destroy = function(name, callback) {
  var host = getHost(name);
  ajax({auth: host.auth, method: 'DELETE', url: genDBUrl(host, '')}, callback);
};

// HttpPouch is a valid adapter.
HttpPouch.valid = function() {
  return true;
};

if (typeof module !== 'undefined' && module.exports) {
  // running in node
  var pouchdir = '../';
  this.Pouch = require(pouchdir + 'pouch.js')
  this.ajax = Pouch.utils.ajax;
}

// Set HttpPouch to be the adapter used with the http scheme.
Pouch.adapter('http', HttpPouch);
Pouch.adapter('https', HttpPouch);

// While most of the IDB behaviors match between implementations a
// lot of the names still differ. This section tries to normalize the
// different objects & methods.
window.indexedDB = window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB;

// still needed for R/W transactions in Android Chrome. follow MDN example:
// https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#transaction
// note though that Chrome Canary fails on undefined READ_WRITE constants
// on the native IDBTransaction object
window.IDBTransaction = (window.IDBTransaction && window.IDBTransaction.READ_WRITE)
  ? window.IDBTransaction
  : (window.webkitIDBTransaction && window.webkitIDBTransaction.READ_WRITE)
    ? window.webkitIDBTransaction
    : { READ_WRITE: 'readwrite' };

window.IDBKeyRange = window.IDBKeyRange ||
  window.webkitIDBKeyRange;

window.storageInfo = window.storageInfo ||
  window.webkitStorageInfo;

window.requestFileSystem = window.requestFileSystem ||
    window.webkitRequestFileSystem;

var idbError = function(callback) {
  return function(event) {
    call(callback, {
      status: 500,
      error: event.type,
      reason: event.target
    });
  };
};

var IdbPouch = function(opts, callback) {

  // IndexedDB requires a versioned database structure, this is going to make
  // it hard to dynamically create object stores if we needed to for things
  // like views
  var POUCH_VERSION = 1;

  // The object stores created for each database
  // DOC_STORE stores the document meta data, its revision history and state
  var DOC_STORE = 'document-store';
  // BY_SEQ_STORE stores a particular version of a document, keyed by its
  // sequence id
  var BY_SEQ_STORE = 'by-sequence';
  // Where we store attachments
  var ATTACH_STORE = 'attach-store';
  // Where we store meta data
  var META_STORE = 'meta-store';


  var name = opts.name;
  var req = indexedDB.open(name, POUCH_VERSION);
  var meta = {
    id: 'meta-store',
    updateSeq: 0,
  };

  var instanceId = null;

  // var storeAttachmentsInIDB = !(window.storageInfo && window.requestFileSystem);
  // We cant store attachments on the filesystem due to a limitation in the
  // indexeddb api, it will close a transaction when we yield to the event loop
  var storeAttachmentsInIDB = true;

  var api = {};
  var idb = null;

  if (Pouch.DEBUG)
    console.log(name + ': Open Database');

  // TODO: before we release, make sure we write upgrade needed
  // in a way that supports a future upgrade path
  req.onupgradeneeded = function(e) {
    var db = e.target.result;
    db.createObjectStore(DOC_STORE, {keyPath : 'id'})
      .createIndex('seq', 'seq', {unique: true});
    db.createObjectStore(BY_SEQ_STORE, {autoIncrement : true})
      .createIndex('_rev', '_rev', {unique: true});
    db.createObjectStore(ATTACH_STORE, {keyPath: 'digest'});
    db.createObjectStore(META_STORE, {keyPath: 'id', autoIncrement: false});
  };

  req.onsuccess = function(e) {

    idb = e.target.result;

    var txn = idb.transaction([META_STORE], IDBTransaction.READ_WRITE);

    idb.onversionchange = function() {
      idb.close();
    };

    // polyfill the new onupgradeneeded api for chrome. can get rid of when
    // saucelabs moves to chrome 23
    if (idb.setVersion && Number(idb.version) !== POUCH_VERSION) {
      var versionReq = idb.setVersion(POUCH_VERSION);
      versionReq.onsuccess = function(evt) {
        function setVersionComplete() {
          req.onsuccess(e);
        }
        evt.target.result.oncomplete = setVersionComplete;
        req.onupgradeneeded(e);
      };
      return;
    }

    var req = txn.objectStore(META_STORE).get('meta-store');

    req.onsuccess = function(e) {
      var reqDBId,
          result;

      if (e.target.result) {
        meta = e.target.result;
      }

      if (name + '_id' in meta) {
        instanceId = meta[name + '_id'];
      } else {
        instanceId = Math.uuid();

        meta[name + '_id'] = instanceId;
        reqDBId = txn.objectStore(META_STORE).put(meta);
      }
      call(callback, null, api);
    }
  };

  req.onerror = idbError(callback);

  api.type = function() {
    return 'idb';
  };

  // Each database needs a unique id so that we can store the sequence
  // checkpoint without having other databases confuse itself.
  api.id = function idb_id() {
    return instanceId;
  };

  api.bulkDocs = function idb_bulkDocs(req, opts, callback) {

    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!opts) {
      opts = {};
    }

    if (!req.docs) {
      return call(callback, Pouch.Errors.MISSING_BULK_DOCS);
    }

    var newEdits = 'new_edits' in opts ? opts.new_edits : true;
    var userDocs = extend(true, [], req.docs);

    // Parse the docs, give them a sequence number for the result
    var docInfos = userDocs.map(function(doc, i) {
      var newDoc = parseDoc(doc, newEdits);
      newDoc._bulk_seq = i;
      if (doc._deleted) {
        if (!newDoc.metadata.deletions) {
          newDoc.metadata.deletions = {};
        }
        newDoc.metadata.deletions[doc._rev.split('-')[1]] = true;
      }
      return newDoc;
    });

    var results = [];
    var docs = [];

    // Group multiple edits to the same document
    docInfos.forEach(function(docInfo) {
      if (docInfo.error) {
        return results.push(docInfo);
      }
      if (!docs.length || docInfo.metadata.id !== docs[0].metadata.id) {
        return docs.unshift(docInfo);
      }
      // We mark subsequent bulk docs with a duplicate id as conflicts
      results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
    });

    function processDocs() {
      if (!docs.length) {
        return;
      }
      var currentDoc = docs.shift();
      var req = txn.objectStore(DOC_STORE).get(currentDoc.metadata.id);
      req.onsuccess = function process_docRead(event) {
        var oldDoc = event.target.result;
        if (!oldDoc) {
          insertDoc(currentDoc);
        } else {
          updateDoc(oldDoc, currentDoc);
        }
      };
    }

    function complete(event) {
      var aresults = [];
      results.sort(sortByBulkSeq);
      results.forEach(function(result) {
        delete result._bulk_seq;
        if (result.error) {
          aresults.push(result);
          return;
        }
        var metadata = result.metadata;
        var rev = Pouch.merge.winningRev(metadata);

        aresults.push({
          ok: true,
          id: metadata.id,
          rev: rev
        });

        if (/_local/.test(metadata.id)) {
          return;
        }

        IdbPouch.Changes.notify(name);
        localStorage[name] = (localStorage[name] === "a") ? "b" : "a";
      });
      call(callback, null, aresults);
    }

    function writeDoc(docInfo, callback) {
      var err = null;
      var recv = 0;

      docInfo.data._id = docInfo.metadata.id;
      docInfo.data._rev = docInfo.metadata.rev;

      meta.updateSeq++;
      var req = txn.objectStore(META_STORE).put(meta);

      if (isDeleted(docInfo.metadata, docInfo.metadata.rev)) {
        docInfo.data._deleted = true;
      }

      var attachments = docInfo.data._attachments ?
        Object.keys(docInfo.data._attachments) : [];

      for (var key in docInfo.data._attachments) {
        if (!docInfo.data._attachments[key].stub) {
          var data = docInfo.data._attachments[key].data;
          var digest = 'md5-' + Crypto.MD5(data);
          delete docInfo.data._attachments[key].data;
          docInfo.data._attachments[key].digest = digest;
          saveAttachment(docInfo, digest, data, function(err) {
            recv++;
            collectResults(err);
          });
        } else {
          recv++;
          collectResults();
        }
      }

      if (!attachments.length) {
        finish();
      }

      function collectResults(attachmentErr) {
        if (!err) {
          if (attachmentErr) {
            err = attachmentErr;
            call(callback, err);
          } else if (recv == attachments.length) {
            finish();
          }
        }
      }

      function finish() {
        var dataReq = txn.objectStore(BY_SEQ_STORE).put(docInfo.data);
        dataReq.onsuccess = function(e) {
          if (Pouch.DEBUG)
            console.log(name + ': Wrote Document ', docInfo.metadata.id);
          docInfo.metadata.seq = e.target.result;
          // Current _rev is calculated from _rev_tree on read
          delete docInfo.metadata.rev;
          var metaDataReq = txn.objectStore(DOC_STORE).put(docInfo.metadata);
          metaDataReq.onsuccess = function() {
            results.push(docInfo);
            call(callback);
          };
        };
      }
    }

    function updateDoc(oldDoc, docInfo) {
      var merged = Pouch.merge(oldDoc.rev_tree, docInfo.metadata.rev_tree[0], 1000);

      var inConflict = (isDeleted(oldDoc) && isDeleted(docInfo.metadata)) ||
        (!isDeleted(oldDoc) && newEdits && merged.conflicts !== 'new_leaf');

      if (inConflict) {
        results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
        return processDocs();
      }

      docInfo.metadata.rev_tree = merged.tree;
      writeDoc(docInfo, processDocs);
    }

    function insertDoc(docInfo) {
      // Cant insert new deleted documents
      if ('was_delete' in opts && isDeleted(docInfo.metadata)) {
        results.push(Pouch.Errors.MISSING_DOC);
        return processDocs();
      }
      writeDoc(docInfo, processDocs);
    }

    // Insert sequence number into the error so we can sort later
    function makeErr(err, seq) {
      err._bulk_seq = seq;
      return err;
    }

    function saveAttachment(docInfo, digest, data, callback) {
      if (storeAttachmentsInIDB) {
        var objectStore = txn.objectStore(ATTACH_STORE);
        var getReq = objectStore.get(digest).onsuccess = function(e) {
          var ref = [docInfo.metadata.id, docInfo.metadata.rev].join('@');
          var newAtt = {digest: digest, body: data};

          if (e.target.result) {
            if (e.target.result.refs) {
              // only update references if this attachment already has them
              // since we cannot migrate old style attachments here without
              // doing a full db scan for references
              newAtt.refs = e.target.result.refs;
              newAtt.refs[ref] = true;
            }
          } else {
            newAtt.refs = {};
            newAtt.refs[ref] = true;
          }

          var putReq = objectStore.put(newAtt).onsuccess = function(e) {
            call(callback);
          };
          putReq.onerror = putReq.ontimeout = idbError(callback);
        };
        getReq.onerror = getReq.ontimeout = idbError(callback);
      } else {
        // right now fire and forget, needs cleaned
        writeAttachmentToFile(digest,data);
        call(callback);
      }
    }

    var txn = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE, META_STORE], IDBTransaction.READ_WRITE);
    txn.onerror = idbError(callback);
    txn.ontimeout = idbError(callback);
    txn.oncomplete = complete;

    processDocs();

  };

  function sortByBulkSeq(a, b) {
    return a._bulk_seq - b._bulk_seq;
  }

  // First we look up the metadata in the ids database, then we fetch the
  // current revision(s) from the by sequence store
  api.get = function idb_get(id, opts, callback) {

    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    id = parseDocId(id);
    if (id.attachmentId !== '') {
      return api.getAttachment(id, {decode: true}, callback);
    }

    var result;
    var txn = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
    txn.oncomplete = function() {
      if ('error' in result) {
        call(callback, result);
      } else {
        call(callback, null, result);
      }
    };

    txn.objectStore(DOC_STORE).get(id.docId).onsuccess = function(e) {
      var metadata = e.target.result;
      if (!e.target.result || (isDeleted(metadata, opts.rev) && !opts.rev)) {
        result = Pouch.Errors.MISSING_DOC;
        return;
      }

      var rev = Pouch.merge.winningRev(metadata);
      var key = opts.rev ? opts.rev : rev;
      var index = txn.objectStore(BY_SEQ_STORE).index('_rev');

      index.get(key).onsuccess = function(e) {
        var doc = e.target.result;
        if (opts.revs) {
          var path = arrayFirst(rootToLeaf(metadata.rev_tree), function(arr) {
            return arr.ids.indexOf(doc._rev.split('-')[1]) !== -1;
          });
          path.ids.reverse();
          doc._revisions = {
            start: (path.pos + path.ids.length) - 1,
            ids: path.ids
          };
        }
        if (opts.revs_info) {
          doc._revs_info = metadata.rev_tree.reduce(function(prev, current) {
            return prev.concat(collectRevs(current));
          }, []);
        }
        if (opts.conflicts) {
          var conflicts = collectConflicts(metadata.rev_tree);
          if (conflicts.length) {
            doc._conflicts = conflicts;
          }
        }

        if (opts.attachments && doc._attachments) {
          var attachments = Object.keys(doc._attachments);
          var recv = 0;

          attachments.forEach(function(key) {
            api.getAttachment(doc._id + '/' + key, {txn: txn}, function(err, data) {
              doc._attachments[key].data = data;

              if (++recv === attachments.length) {
                result = doc;
              }
            });
          });
        } else {
          if (doc._attachments){
            for (var key in doc._attachments) {
              doc._attachments[key].stub = true;
            }
          }
          result = doc;
        }
      };
    };
  };

  api.getAttachment = function(id, opts, callback) {
    if (opts instanceof Function) {
      callback = opts;
      opts = {};
    }
    if (typeof id === 'string') {
      id = parseDocId(id);
    }

    var result;
    var txn;

    // This can be called while we are in a current transaction, pass the context
    // along and dont wait for the transaction to complete here.
    if ('txn' in opts) {
      txn = opts.txn;
    } else {
      txn = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
      txn.oncomplete = function() { call(callback, null, result); }
    }

    txn.objectStore(DOC_STORE).get(id.docId).onsuccess = function(e) {
      var metadata = e.target.result;
      var bySeq = txn.objectStore(BY_SEQ_STORE);
      bySeq.get(metadata.seq).onsuccess = function(e) {
        var attachment = e.target.result._attachments[id.attachmentId];
        var digest = attachment.digest;
        var type = attachment.content_type

        function postProcessDoc(data) {
          if (opts.decode) {
            data = atob(data);
          }
          return data;
        }

        if (storeAttachmentsInIDB) {
          txn.objectStore(ATTACH_STORE).get(digest).onsuccess = function(e) {
            var data = e.target.result.body;
            result = postProcessDoc(data);
            if ('txn' in opts) {
              call(callback, null, result);
            }
          }
        } else {
          // This will be buggy, it will cause the transaction to be closed
          // as we will be returning to the event loop waiting on the file to
          // read, switch back to idb asap
          readAttachmentFromFile(digest, function(data) {
            result = postProcessDoc(data);
            if ('txn' in opts) {
              call(callback, null, result);
            }
          });
        }
      };
    }
    return;
  }

  api.put = function(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (!doc || !('_id' in doc)) {
      return call(callback, Pouch.Errors.MISSING_ID);
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  }

  api.post = function idb_put(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  };

  api.putAttachment = function idb_putAttachment(id, rev, doc, type, callback) {
    id = parseDocId(id);
    api.get(id.docId, {attachments: true}, function(err, obj) {
      obj._attachments || (obj._attachments = {});
      obj._attachments[id.attachmentId] = {
        content_type: type,
        data: btoa(doc)
      }
      api.put(obj, callback);
    });
  };

  api.remove = function idb_remove(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts.was_delete = true;
    var newDoc = extend(true, {}, doc);
    newDoc._deleted = true;
    return api.bulkDocs({docs: [newDoc]}, opts, yankError(callback));
  };

  api.removeAttachment = function idb_removeAttachment(id, rev, callback) {
    id = parseDocId(id);
    api.get(id.docId, function(err, obj) {
      if (err) {
        call(callback, err);
        return;
      }

      if (obj._rev != rev) {
        call(callback, Pouch.Errors.REV_CONFLICT);
        return;
      }

      obj._attachments || (obj._attachments = {});
      delete obj._attachments[id.attachmentId];
      api.put(obj, callback);
    });
  };

  api.allDocs = function idb_allDocs(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;

    var descending = 'descending' in opts ? opts.descending : false;
    descending = descending ? 'prev' : null;

    var keyRange = start && end ? IDBKeyRange.bound(start, end, false, false)
      : start ? IDBKeyRange.lowerBound(start, true)
      : end ? IDBKeyRange.upperBound(end) : null;

    var result;
    var transaction = idb.transaction([DOC_STORE, BY_SEQ_STORE], 'readonly');
    transaction.oncomplete = function() { callback(null, result); };

    var oStore = transaction.objectStore(DOC_STORE);
    var oCursor = descending ? oStore.openCursor(keyRange, descending)
      : oStore.openCursor(keyRange);
    var results = [];
    oCursor.onsuccess = function(e) {
      if (!e.target.result) {
        result = {
          total_rows: results.length,
          rows: results
        };
        return;
      }
      var cursor = e.target.result;
      function allDocsInner(metadata, data) {
        if (/_local/.test(metadata.id)) {
          return cursor['continue']();
        }
        if (!isDeleted(metadata)) {
          var doc = {
            id: metadata.id,
            key: metadata.id,
            value: {
              rev: Pouch.merge.winningRev(metadata)
            }
          };
          if (opts.include_docs) {
            doc.doc = data;
            doc.doc._rev = Pouch.merge.winningRev(metadata);
            if (opts.conflicts) {
              doc.doc._conflicts = collectConflicts(metadata.rev_tree);
            }
          }
          results.push(doc);
        }
        cursor['continue']();
      }

      if (!opts.include_docs) {
        allDocsInner(cursor.value);
      } else {
        var index = transaction.objectStore(BY_SEQ_STORE);
        index.get(cursor.value.seq).onsuccess = function(event) {
          allDocsInner(cursor.value, event.target.result);
        };
      }
    }
  };

  // Looping through all the documents in the database is a terrible idea
  // easiest to implement though, should probably keep a counter
  api.info = function idb_info(callback) {
    var count = 0;
    var result;
    var txn = idb.transaction([DOC_STORE], 'readonly');

    txn.oncomplete = function() {
      callback(null, result);
    };

    txn.objectStore(DOC_STORE).openCursor().onsuccess = function(e) {
        var cursor = e.target.result;
        if (!cursor) {
          result = {
            db_name: name,
            doc_count: count,
            update_seq: meta.updateSeq
          };
          return;
        }
        if (cursor.value.deleted !== true) {
          count++;
        }
        cursor['continue']();
      };
  };

  api.revsDiff = function idb_revsDiff(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var ids = Object.keys(req);
    var count = 0;
    var missing = {};

    function readDoc(err, doc, id) {
      req[id].map(function(revId) {
        var matches = function(x) { return x.rev !== revId; };
        if (!doc || doc._revs_info.every(matches)) {
          if (!missing[id]) {
            missing[id] = {missing: []};
          }
          missing[id].missing.push(revId);
        }
      });

      if (++count === ids.length) {
        return call(callback, null, missing);
      }
    }

    ids.map(function(id) {
      api.get(id, {revs_info: true}, function(err, doc) {
        readDoc(err, doc, id);
      });
    });
  };

  api.changes = function idb_changes(opts) {

    if (!opts.since) {
      opts.since = 0;
    }

    if (Pouch.DEBUG)
      console.log(name + ': Start Changes Feed: continuous=' + opts.continuous);

    var descending = 'descending' in opts ? opts.descending : false;
    descending = descending ? 'prev' : null;

    var results = [], resultIndices = {}, dedupResults = [];
    var id = name + ':' + Math.uuid();
    var txn;

    if (opts.filter && typeof opts.filter === 'string') {
      var filterName = opts.filter.split('/');
      api.get('_design/' + filterName[0], function(err, ddoc) {
        var filter = eval('(function() { return ' +
                          ddoc.filters[filterName[1]] + ' })()');
        opts.filter = filter;
        fetchChanges();
      });
    } else {
      fetchChanges();
    }

    function fetchChanges() {
      txn = idb.transaction([DOC_STORE, BY_SEQ_STORE]);
      txn.oncomplete = onTxnComplete;
      var req = descending
        ? txn.objectStore(BY_SEQ_STORE)
          .openCursor(IDBKeyRange.lowerBound(opts.since, true), descending)
        : txn.objectStore(BY_SEQ_STORE)
          .openCursor(IDBKeyRange.lowerBound(opts.since, true));
      req.onsuccess = onsuccess;
      req.onerror = onerror;
    }

    function onsuccess(event) {
      if (!event.target.result) {
        if (opts.continuous && !opts.cancelled) {
          IdbPouch.Changes.addListener(name, id, api, opts);
        }

        // Filter out null results casued by deduping
        for (var i = 0, l = results.length; i < l; i++ ) {
          var result = results[i];
          if (result) dedupResults.push(result);
        }
        return false;
      }

      var cursor = event.target.result;

      // Try to pre-emptively dedup to save us a bunch of idb calls
      var changeId = cursor.value._id, changeIdIndex = resultIndices[changeId];
      if (changeIdIndex !== undefined) {
        results[changeIdIndex].seq = cursor.key; // update so it has the later sequence number
        results.push(results[changeIdIndex]);
        results[changeIdIndex] = null;
        resultIndices[changeId] = results.length - 1;
        return cursor['continue']();
      }

      var index = txn.objectStore(DOC_STORE);
      index.get(cursor.value._id).onsuccess = function(event) {
        var metadata = event.target.result;
        if (/_local/.test(metadata.id)) {
          return cursor['continue']();
        }

        var mainRev = Pouch.merge.winningRev(metadata);
        var index = txn.objectStore(BY_SEQ_STORE).index('_rev');
        index.get(mainRev).onsuccess = function(docevent) {
          var doc = docevent.target.result;
          var changeList = [{rev: mainRev}]
          if (opts.style === 'all_docs') {
          //  console.log('all docs', changeList, collectLeaves(metadata.rev_tree));
            changeList = collectLeaves(metadata.rev_tree);
          }
          var change = {
            id: metadata.id,
            seq: cursor.key,
            changes: changeList,
            doc: doc,
          };
          if (isDeleted(metadata, mainRev)) {
            change.deleted = true;
          }
          if (opts.conflicts) {
            change.doc._conflicts = collectConflicts(metadata.rev_tree);
          }

          // Dedupe the changes feed
          var changeId = change.id, changeIdIndex = resultIndices[changeId];
          if (changeIdIndex !== undefined) {
            results[changeIdIndex] = null;
          }
          results.push(change);
          resultIndices[changeId] = results.length - 1;
          cursor['continue']();
        }
      };
    };

    function onTxnComplete() {
      dedupResults.map(function(c) {
        if (opts.filter && !opts.filter.apply(this, [c.doc])) {
          return;
        }
        if (!opts.include_docs) {
          delete c.doc;
        }
        if (c.seq > opts.since) {
          opts.since = c.seq;
          call(opts.onChange, c);
        }
      });
      if (!opts.continuous || (opts.continuous && !opts.cancelled)) {
        call(opts.complete, null, {results: dedupResults});
      }
    };

    function onerror(error) {
      if (opts.continuous && !opts.cancelled) {
        IdbPouch.Changes.addListener(name, id, opts);
      }
      else {
        call(opts.complete);
      }
    };

    if (opts.continuous) {
      return {
        cancel: function() {
          if (Pouch.DEBUG)
            console.log(name + ': Cancel Changes Feed');
          opts.cancelled = true;
          IdbPouch.Changes.removeListener(name, id);
        }
      }
    }
  };

  api.replicate = {};

  api.replicate.from = function idb_replicate_from(url, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(url, api, opts, callback);
  };

  api.replicate.to = function idb_replicate_to(dbName, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(api, dbName, opts, callback);
  };

  // Functions for reading and writing an attachment in the html5 file system
  // instead of idb
  function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
  }
  function fileErrorHandler(e) {
    console.error('File system error',e);
  }

  //Delete attachments that are no longer referenced by any existing documents
  function deleteOrphanedFiles(currentQuota){
    api.allDocs({include_docs:true},function(err, response) {
      window.requestFileSystem(window.PERSISTENT, currentQuota, function(fs){
      var dirReader = fs.root.createReader();
      var entries = [];
      var docRows = response.rows;

      // Call the reader.readEntries() until no more results are returned.
      var readEntries = function() {
        dirReader.readEntries (function(results) {
          if (!results.length) {
            for (var i in entries){
              var entryIsReferenced = false;
              for (var k in docRows){
                if (docRows[k].doc){
                  var aDoc = docRows[k].doc;
                  if (aDoc._attachments) {
                    for (var j in aDoc._attachments) {
                      if (aDoc._attachments[j].digest==entries[i].name) {
                        entryIsReferenced = true;
                      }
                    };
                  }
                  if (entryIsReferenced) break;
                }
              };
              if (!entryIsReferenced){
                entries[i].remove(function() {
                  if (Pouch.DEBUG)
                    console.log("Removed orphaned attachment: "+entries[i].name);
                }, fileErrorHandler);
              }
            };
          } else {
            entries = entries.concat(toArray(results));
            readEntries();
          }
        }, fileErrorHandler);
      };

      readEntries(); // Start reading dirs.

      }, fileErrorHandler);
    });
  }

  function writeAttachmentToFile(digest, data, type){
    //Check the current file quota and increase it if necessary
    window.storageInfo.queryUsageAndQuota(window.PERSISTENT, function(currentUsage, currentQuota) {
      var newQuota = currentQuota;
      if (currentQuota == 0){
        newQuota = 1000*1024*1024; //start with 1GB
      }else if ((currentUsage/currentQuota) > 0.8){
        deleteOrphanedFiles(currentQuota); //delete old attachments when we hit 80% usage
      }else if ((currentUsage/currentQuota) > 0.9){
        newQuota=2*currentQuota; //double the quota when we hit 90% usage
      }

      if (Pouch.DEBUG)
        console.log("Current file quota: "+currentQuota+", current usage:"+currentUsage+", new quota will be: "+newQuota);

      //Ask for file quota. This does nothing if the proper quota size has already been granted.
      window.storageInfo.requestQuota(window.PERSISTENT, newQuota, function(grantedBytes) {
        window.storageInfo.queryUsageAndQuota(window.PERSISTENT, function(currentUsage, currentQuota) {
          window.requestFileSystem(window.PERSISTENT, currentQuota, function(fs){
            fs.root.getFile(digest, {create: true}, function(fileEntry) {
              fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                  if (Pouch.DEBUG)
                    console.log('Wrote attachment');
                };
                fileWriter.onerror = function(e) {
                  console.error('File write failed: ' + e.toString());
                };
                var blob = new Blob([data], {type: type});
                fileWriter.write(blob);
              }, fileErrorHandler);
            }, fileErrorHandler);
          }, fileErrorHandler);
        }, fileErrorHandler);
      }, fileErrorHandler);
    },fileErrorHandler);
  }

  function readAttachmentFromFile(digest, callback){
    window.storageInfo.queryUsageAndQuota(window.PERSISTENT, function(currentUsage, currentQuota) {
      window.requestFileSystem(window.PERSISTENT, currentQuota, function(fs){
        fs.root.getFile(digest, {}, function(fileEntry) {
          fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
              data = this.result;
              if (Pouch.DEBUG)
                console.log("Read attachment");
              callback(data);
            };
            reader.readAsBinaryString(file);
          }, fileErrorHandler);
        }, fileErrorHandler);
      }, fileErrorHandler);
    }, fileErrorHandler);
  }

  api.close = function(callback) {
    if (idb === null) {
      return call(callback, Pouch.Errors.NOT_OPEN);
    }

    // https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#close
    // "Returns immediately and closes the connection in a separate thread..."
    idb.close();
    call(callback, null);
  };

  return api;
};

IdbPouch.valid = function idb_valid() {
  if (!document.location.host) {
    console.error('indexedDB cannot be used in pages served from the filesystem');
  }
  return !!window.indexedDB && !!document.location.host;
};

IdbPouch.destroy = function idb_destroy(name, callback) {
  if (Pouch.DEBUG)
    console.log(name + ': Delete Database');
  IdbPouch.Changes.clearListeners(name);
  var req = indexedDB.deleteDatabase(name);

  req.onsuccess = function() {
    call(callback, null);
  };

  req.onerror = idbError(callback);
};

IdbPouch.Changes = Changes();

Pouch.adapter('idb', IdbPouch);

"use strict";

function quote(str) {
  return "'" + str + "'";
}

var POUCH_VERSION = 1;
var POUCH_SIZE = 5 * 1024 * 1024;

// The object stores created for each database
// DOC_STORE stores the document meta data, its revision history and state
var DOC_STORE = quote('document-store');
// BY_SEQ_STORE stores a particular version of a document, keyed by its
// sequence id
var BY_SEQ_STORE = quote('by-sequence');
// Where we store attachments
var ATTACH_STORE = quote('attach-store');
var META_STORE = quote('metadata-store');

var unknownError = function(callback) {
  return function(event) {
    call(callback, {
      status: 500,
      error: event.type,
      reason: event.target
    });
  };
};

var webSqlPouch = function(opts, callback) {

  var api = {};
  var update_seq = 0;
  var name = opts.name;

  var db = openDatabase(name, POUCH_VERSION, name, POUCH_SIZE);
  if (!db) {
    return call(callback, Pouch.Errors.UNKNOWN_ERROR);
  }

  function dbCreated() {
    callback(null, api);
  }

  db.transaction(function (tx) {
    var meta = 'CREATE TABLE IF NOT EXISTS ' + META_STORE +
      ' (update_seq)';
    var attach = 'CREATE TABLE IF NOT EXISTS ' + ATTACH_STORE +
      ' (digest, json)';
    var doc = 'CREATE TABLE IF NOT EXISTS ' + DOC_STORE +
      ' (id unique, seq, json, winningseq)';
    var seq = 'CREATE TABLE IF NOT EXISTS ' + BY_SEQ_STORE +
      ' (seq INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, rev UNIQUE, json)';

    tx.executeSql(attach);
    tx.executeSql(doc);
    tx.executeSql(seq);
    tx.executeSql(meta);

    var sql = 'SELECT update_seq FROM ' + META_STORE;
    tx.executeSql(sql, [], function(tx, result) {
      if (!result.rows.length) {
        var initSeq = 'INSERT INTO ' + META_STORE + ' (update_seq) VALUES (?)';
        tx.executeSql(initSeq, [0]);
        return;
      }
      update_seq = result.rows.item(0).update_seq;
    });
  }, unknownError(callback), dbCreated);

  api.type = function() {
    return 'websql';
  };

  api.id = function() {
    var id = localJSON.get(name + '_id', null);
    if (id === null) {
      id = Math.uuid();
      localJSON.set(name + '_id', id);
    }
    return id;
  };

  api.info = function(callback) {
    db.transaction(function(tx) {
      var sql = 'SELECT COUNT(id) AS count FROM ' + DOC_STORE;
      tx.executeSql(sql, [], function(tx, result) {
        callback(null, {
          db_name: name,
          doc_count: result.rows.item(0).count,
          update_seq: update_seq
        });
      });
    });
  };

  api.bulkDocs = function idb_bulkDocs(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!opts) {
      opts = {};
    }

    if (!req.docs) {
      return call(callback, Pouch.Errors.MISSING_BULK_DOCS);
    }

    var newEdits = 'new_edits' in opts ? opts.new_edits : true;
    var userDocs = extend(true, [], req.docs);

    // Parse the docs, give them a sequence number for the result
    var docInfos = userDocs.map(function(doc, i) {
      var newDoc = parseDoc(doc, newEdits);
      newDoc._bulk_seq = i;
      if (doc._deleted) {
        if (!newDoc.metadata.deletions) {
          newDoc.metadata.deletions = {};
        }
        newDoc.metadata.deletions[doc._rev.split('-')[1]] = true;
      }
      return newDoc;
    });

    var tx;
    var results = [];
    var docs = [];
    var fetchedDocs = {};

    // Group multiple edits to the same document
    docInfos.forEach(function(docInfo) {
      if (docInfo.error) {
        return results.push(docInfo);
      }
      if (!docs.length || docInfo.metadata.id !== docs[0].metadata.id) {
        return docs.unshift(docInfo);
      }
      // We mark subsequent bulk docs with a duplicate id as conflicts
      results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
    });

    function sortByBulkSeq(a, b) {
      return a._bulk_seq - b._bulk_seq;
    }

    function complete(event) {
      var aresults = [];
      results.sort(sortByBulkSeq);
      results.forEach(function(result) {
        delete result._bulk_seq;
        if (result.error) {
          aresults.push(result);
          return;
        }
        var metadata = result.metadata;
        var rev = Pouch.merge.winningRev(metadata);

        aresults.push({
          ok: true,
          id: metadata.id,
          rev: rev
        });

        if (/_local/.test(metadata.id)) {
          return;
        }

        update_seq++;
        var sql = 'UPDATE ' + META_STORE + ' SET update_seq=?';
        tx.executeSql(sql, [update_seq], function() {
          webSqlPouch.Changes.notify(name);
          localStorage[name] = (localStorage[name] === "a") ? "b" : "a";
        });
      });
      call(callback, null, aresults);
    }

    function writeDoc(docInfo, callback, isUpdate) {
      var err = null;
      var recv = 0;

      docInfo.data._id = docInfo.metadata.id;
      docInfo.data._rev = docInfo.metadata.rev;

      if (isDeleted(docInfo.metadata, docInfo.metadata.rev)) {
        docInfo.data._deleted = true;
      }

      var attachments = docInfo.data._attachments ?
        Object.keys(docInfo.data._attachments) : [];

      for (var key in docInfo.data._attachments) {
        if (!docInfo.data._attachments[key].stub) {
          var data = docInfo.data._attachments[key].data;
          var digest = 'md5-' + Crypto.MD5(data);
          delete docInfo.data._attachments[key].data;
          docInfo.data._attachments[key].digest = digest;
          saveAttachment(docInfo, digest, data, function(err) {
            recv++;
            collectResults(err);
          });
        } else {
          recv++;
          collectResults();
        }
      }

      if (!attachments.length) {
        finish();
      }

      function collectResults(attachmentErr) {
        if (!err) {
          if (attachmentErr) {
            err = attachmentErr;
            call(callback, err);
          } else if (recv == attachments.length) {
            finish();
          }
        }
      }

      function dataWritten(tx, result) {
        var seq = docInfo.metadata.seq = result.insertId;
        delete docInfo.metadata.rev;

        var mainRev = Pouch.merge.winningRev(docInfo.metadata);

        var sql = isUpdate ?
          'UPDATE ' + DOC_STORE + ' SET seq=?, json=?, winningseq=(SELECT seq FROM ' + BY_SEQ_STORE + ' WHERE rev=?) WHERE id=?' :
          'INSERT INTO ' + DOC_STORE + ' (id, seq, winningseq, json) VALUES (?, ?, ?, ?);';
        var params = isUpdate ?
          [seq, JSON.stringify(docInfo.metadata), mainRev, docInfo.metadata.id] :
          [docInfo.metadata.id, seq, seq, JSON.stringify(docInfo.metadata)];
        tx.executeSql(sql, params, function(tx, result) {
          results.push(docInfo);
          call(callback, null);
        });
      }

      function finish() {
        var data = docInfo.data;
        var sql = 'INSERT INTO ' + BY_SEQ_STORE + ' (rev, json) VALUES (?, ?);';
        tx.executeSql(sql, [data._rev, JSON.stringify(data)], dataWritten);
      }
    }

    function updateDoc(oldDoc, docInfo) {
      var merged = Pouch.merge(oldDoc.rev_tree, docInfo.metadata.rev_tree[0], 1000);
      var inConflict = (isDeleted(oldDoc) && isDeleted(docInfo.metadata)) ||
        (!isDeleted(oldDoc) && newEdits && merged.conflicts !== 'new_leaf');

      if (inConflict) {
        results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
        return processDocs();
      }

      docInfo.metadata.rev_tree = merged.tree;
      writeDoc(docInfo, processDocs, true);
    }

    function insertDoc(docInfo) {
      // Cant insert new deleted documents
      if ('was_delete' in opts && isDeleted(docInfo.metadata)) {
        results.push(Pouch.Errors.MISSING_DOC);
        return processDocs();
      }
      writeDoc(docInfo, processDocs, false);
    }

    function processDocs() {
      if (!docs.length) {
        return complete();
      }
      var currentDoc = docs.shift();
      var id = currentDoc.metadata.id;
      if (id in fetchedDocs) {
        updateDoc(fetchedDocs[id], currentDoc);
      } else {
        insertDoc(currentDoc);
      }
    }

    // Insert sequence number into the error so we can sort later
    function makeErr(err, seq) {
      err._bulk_seq = seq;
      return err;
    }

    function saveAttachment(docInfo, digest, data, callback) {
      var ref = [docInfo.metadata.id, docInfo.metadata.rev].join('@');
      var newAtt = {digest: digest, body: data};
      var sql = 'SELECT * FROM ' + ATTACH_STORE + ' WHERE digest=?';
      tx.executeSql(sql, [digest], function(tx, result) {
        if (!result.rows.length) {
          newAtt.refs = {};
          newAtt.refs[ref] = true;
          sql = 'INSERT INTO ' + ATTACH_STORE + '(digest, json) VALUES (?, ?)';
          tx.executeSql(sql, [digest, JSON.stringify(newAtt)], function() {
            call(callback, null);
          });
        } else {
          newAtt.refs = JSON.parse(result.rows.item(0).json).refs;
          sql = 'UPDATE ' + ATTACH_STORE + ' SET json=? WHERE digest=?';
          tx.executeSql(sql, [JSON.stringify(newAtt), digest], function() {
            call(callback, null);
          });
        }
      });
    }

    function metadataFetched(tx, results) {
      for (var j=0; j<results.rows.length; j++) {
        var row = results.rows.item(j);
        fetchedDocs[row.id] = JSON.parse(row.json);
      }
      processDocs();
    }

    db.transaction(function(txn) {
      tx = txn;
      var ids = '(' + docs.map(function(d) {
        return quote(d.metadata.id);
      }).join(',') + ')';
      var sql = 'SELECT * FROM ' + DOC_STORE + ' WHERE id IN ' + ids;
      tx.executeSql(sql, [], metadataFetched);
    }, unknownError(callback));
  };

  api.put = function(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!doc || !('_id' in doc)) {
      return call(callback, Pouch.Errors.MISSING_ID);
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  };

  api.post = function idb_put(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  };

  api.revsDiff = function idb_revsDiff(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var ids = Object.keys(req);
    var count = 0;
    var missing = {};

    function readDoc(err, doc, id) {
      req[id].map(function(revId) {
        var matches = function(x) { return x.rev !== revId; };
        if (!doc || doc._revs_info.every(matches)) {
          if (!missing[id]) {
            missing[id] = {missing: []};
          }
          missing[id].missing.push(revId);
        }
      });

      if (++count === ids.length) {
        return call(callback, null, missing);
      }
    }

    ids.map(function(id) {
      api.get(id, {revs_info: true}, function(err, doc) {
        readDoc(err, doc, id);
      });
    });
  };

  api.remove = function idb_remove(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts.was_delete = true;
    var newDoc = extend(true, {}, doc);
    newDoc._deleted = true;
    return api.bulkDocs({docs: [newDoc]}, opts, yankError(callback));
  };

  api.get = function(id, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    id = parseDocId(id);
    if (id.attachmentId !== '') {
      return api.getAttachment(id, {decode: true}, callback);
    }

    var result;
    db.transaction(function(tx) {
      var sql = 'SELECT * FROM ' + DOC_STORE + ' WHERE id=?';
      tx.executeSql(sql, [id.docId], function(tx, results) {
        if (!results.rows.length) {
          result = Pouch.Errors.MISSING_DOC;
          return;
        }
        var metadata = JSON.parse(results.rows.item(0).json);
        if (isDeleted(metadata, opts.rev) && !opts.rev) {
          result = Pouch.Errors.MISSING_DOC;
          return;
        }

        var rev = Pouch.merge.winningRev(metadata);
        var key = opts.rev ? opts.rev : rev;
        var sql = 'SELECT * FROM ' + BY_SEQ_STORE + ' WHERE rev=?';
        tx.executeSql(sql, [key], function(tx, results) {
          var doc = JSON.parse(results.rows.item(0).json);

          if (opts.revs) {
            var path = arrayFirst(rootToLeaf(metadata.rev_tree), function(arr) {
              return arr.ids.indexOf(doc._rev.split('-')[1]) !== -1;
            });
            path.ids.reverse();
            doc._revisions = {
              start: (path.pos + path.ids.length) - 1,
              ids: path.ids
            };
          }
          if (opts.revs_info) {
            doc._revs_info = metadata.rev_tree.reduce(function(prev, current) {
              return prev.concat(collectRevs(current));
            }, []);
          }
          if (opts.conflicts) {
            var conflicts = collectConflicts(metadata.rev_tree);
            if (conflicts.length) {
              doc._conflicts = conflicts;
            }
          }

          if (opts.attachments && doc._attachments) {
            var attachments = Object.keys(doc._attachments);
            var recv = 0;
            attachments.forEach(function(key) {
              api.getAttachment(doc._id + '/' + key, {txn: tx}, function(err, data) {
                doc._attachments[key].data = data;
                if (++recv === attachments.length) {
                  result = doc;
                }
              });
            });
          } else {
            if (doc._attachments){
              for (var key in doc._attachments) {
                doc._attachments[key].stub = true;
              }
            }
            result = doc;
          }
        });
      });
    }, unknownError(callback), function() {
      if ('error' in result) {
        call(callback, result);
      } else {
        call(callback, null, result);
      }
    });
  };

  api.allDocs = function(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    var results = [];
    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;
    var descending = 'descending' in opts ? opts.descending : false;
    var sql = 'SELECT ' + DOC_STORE + '.id, ' + BY_SEQ_STORE + '.seq, ' +
      BY_SEQ_STORE + '.json AS data, ' + DOC_STORE + '.json AS metadata FROM ' +
      BY_SEQ_STORE + ' JOIN ' + DOC_STORE + ' ON ' + BY_SEQ_STORE + '.seq = ' +
      DOC_STORE + '.winningseq';

    if (start) {
      sql += ' WHERE ' + DOC_STORE + '.id >= "' + start + '"';
    }
    if (end) {
      sql += (start ? ' AND ' : ' WHERE ') + DOC_STORE + '.id <= "' + end + '"';
    }

    sql += ' ORDER BY ' + DOC_STORE + '.id ' + (descending ? 'DESC' : 'ASC');

    db.transaction(function(tx) {
      tx.executeSql(sql, [], function(tx, result) {
        for (var i = 0, l = result.rows.length; i < l; i++ ) {
          var doc = result.rows.item(i);
          var metadata = JSON.parse(doc.metadata);
          var data = JSON.parse(doc.data);
          if (!(/_local/.test(metadata.id) || isDeleted(metadata))) {
            var doc = {
              id: metadata.id,
              key: metadata.id,
              value: {rev: Pouch.merge.winningRev(metadata)}
            };
            if (opts.include_docs) {
              doc.doc = data;
              doc.doc._rev = Pouch.merge.winningRev(metadata);
              if (opts.conflicts) {
                doc.doc._conflicts = collectConflicts(metadata.rev_tree);
              }
            }
            results.push(doc);
          }
        }
      });
    }, unknownError(callback), function() {
      call(callback, null, {
        total_rows: results.length,
        rows: results
      });
    });
  }

  api.changes = function idb_changes(opts) {

    if (!opts.since) {
      opts.since = 0;
    }

    if (Pouch.DEBUG)
      console.log(name + ': Start Changes Feed: continuous=' + opts.continuous);

    var descending = 'descending' in opts ? opts.descending : false;
    descending = descending ? 'prev' : null;

    var results = [], resultIndices = {}, dedupResults = [];
    var id = name + ':' + Math.uuid();
    var txn;

    if (opts.filter && typeof opts.filter === 'string') {
      var filterName = opts.filter.split('/');
      api.get('_design/' + filterName[0], function(err, ddoc) {
        var filter = eval('(function() { return ' +
                          ddoc.filters[filterName[1]] + ' })()');
        opts.filter = filter;
        fetchChanges();
      });
    } else {
      fetchChanges();
    }

    function fetchChanges() {
      var sql = 'SELECT ' + DOC_STORE + '.id, ' + BY_SEQ_STORE + '.seq, ' +
        BY_SEQ_STORE + '.json AS data, ' + DOC_STORE + '.json AS metadata FROM ' +
        BY_SEQ_STORE + ' JOIN ' + DOC_STORE + ' ON ' + BY_SEQ_STORE + '.seq = ' +
        DOC_STORE + '.winningseq WHERE ' + DOC_STORE + '.seq > ' + opts.since +
        ' ORDER BY ' + DOC_STORE + '.seq ' + (descending ? 'DESC' : 'ASC');

      db.transaction(function(tx) {
        tx.executeSql(sql, [], function(tx, result) {
          for (var i = 0, l = result.rows.length; i < l; i++ ) {
            var doc = result.rows.item(i);
            var metadata = JSON.parse(doc.metadata);
            if (!/_local/.test(metadata.id)) {
              var change = {
                id: metadata.id,
                seq: doc.seq,
                changes: collectLeaves(metadata.rev_tree),
                doc: JSON.parse(doc.data),
              };
              change.doc._rev = Pouch.merge.winningRev(metadata);
              if (isDeleted(metadata, change.doc._rev)) {
                change.deleted = true;
              }
              if (opts.conflicts) {
                change.doc._conflicts = collectConflicts(metadata.rev_tree);
              }
              results.push(change);
            }
          }
          for (var i = 0, l = results.length; i < l; i++ ) {
            var result = results[i];
            if (result) dedupResults.push(result);
          }
          dedupResults.map(function(c) {
            if (opts.filter && !opts.filter.apply(this, [c.doc])) {
              return;
            }
            if (!opts.include_docs) {
              delete c.doc;
            }
            if (c.seq > opts.since) {
              opts.since = c.seq;
              call(opts.onChange, c);
            }
          });

          if (opts.continuous && !opts.cancelled) {
            webSqlPouch.Changes.addListener(name, id, api, opts);
          }
          else {
              call(opts.complete, null, {results: dedupResults});
          }
        });
      });
    }

    if (opts.continuous) {
      return {
        cancel: function() {
          if (Pouch.DEBUG)
            console.log(name + ': Cancel Changes Feed');
          opts.cancelled = true;
          webSqlPouch.Changes.removeListener(name, id);
        }
      }
    }
  };

  api.getAttachment = function(id, opts, callback) {
    if (opts instanceof Function) {
      callback = opts;
      opts = {};
    }
    if (typeof id === 'string') {
      id = parseDocId(id);
    }

    var res;
    // This can be called while we are in a current transaction, pass the context
    // along and dont wait for the transaction to complete here.
    if ('txn' in opts) {
      fetchAttachment(opts.txn);
    } else {
      db.transaction(fetchAttachment, unknownError(callback), function() {
        call(callback, null, res);
      });
    }

    function postProcessDoc(data) {
      if (opts.decode) {
        return atob(data);
      }
      return data;
    }

    function fetchAttachment(tx) {
      var sql = 'SELECT ' + BY_SEQ_STORE + '.json AS data FROM ' + DOC_STORE +
        ' JOIN ' + BY_SEQ_STORE + ' ON ' + BY_SEQ_STORE + '.seq = ' + DOC_STORE +
        '.seq WHERE ' + DOC_STORE + '.id = "' + id.docId + '"' ;
      tx.executeSql(sql, [], function(tx, result) {
        var doc = JSON.parse(result.rows.item(0).data);
        var attachment = doc._attachments[id.attachmentId];
        var digest = attachment.digest;
        var type = attachment.content_type;
        var sql = 'SELECT * FROM ' + ATTACH_STORE + ' WHERE digest=?';
        tx.executeSql(sql, [digest], function(tx, result) {
          var data = JSON.parse(result.rows.item(0).json).body;
          res = postProcessDoc(data);
          if ('txn' in opts) {
            call(callback, null, res);
          }
        });
      });
    }
  }

  // Everything below this are not dependant on the storage implementation
  // and can be shared between the adapters instead of reimplemented in each
  api.putAttachment = function idb_putAttachment(id, rev, doc, type, callback) {
    id = parseDocId(id);
    api.get(id.docId, {attachments: true}, function(err, obj) {
      obj._attachments || (obj._attachments = {});
      obj._attachments[id.attachmentId] = {
        content_type: type,
        data: btoa(doc)
      }
      api.put(obj, callback);
    });
  };

  api.removeAttachment = function idb_removeAttachment(id, rev, callback) {
    id = parseDocId(id);
    api.get(id.docId, function(err, obj) {
      if (err) {
        call(callback, err);
        return;
      }

      if (obj._rev != rev) {
        call(callback, Pouch.Errors.REV_CONFLICT);
        return;
      }

      obj._attachments || (obj._attachments = {});
      delete obj._attachments[id.attachmentId];
      api.put(obj, callback);
    });
  };

  api.replicate = {};

  api.replicate.from = function idb_replicate_from(url, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(url, api, opts, callback);
  };

  api.replicate.to = function idb_replicate_to(dbName, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(api, dbName, opts, callback);
  };
}

webSqlPouch.valid = function() {
  return !!window.openDatabase;
};

webSqlPouch.destroy = function(name, callback) {
  var db = openDatabase(name, POUCH_VERSION, name, POUCH_SIZE);
  localJSON.set(name + '_id', null);
  db.transaction(function (tx) {
    tx.executeSql('DROP TABLE IF EXISTS ' + DOC_STORE, []);
    tx.executeSql('DROP TABLE IF EXISTS ' + BY_SEQ_STORE, []);
    tx.executeSql('DROP TABLE IF EXISTS ' + ATTACH_STORE, []);
    tx.executeSql('DROP TABLE IF EXISTS ' + META_STORE, []);
  }, unknownError(callback), function() {
    call(callback, null);
  });
};

webSqlPouch.Changes = Changes();

Pouch.adapter('websql', webSqlPouch);

/*global Pouch: true */

"use strict";

// This is the first implementation of a basic plugin, we register the
// plugin object with pouch and it is mixin'd to each database created
// (regardless of adapter), adapters can override plugins by providing
// their own implementation. functions on the plugin object that start
// with _ are reserved function that are called by pouchdb for special
// notifications.

// If we wanted to store incremental views we can do it here by listening
// to the changes feed (keeping track of our last update_seq between page loads)
// and storing the result of the map function (possibly using the upcoming
// extracted adapter functions)

var MapReduce = function(db) {

  function viewQuery(fun, options) {
    if (!options.complete) {
      return;
    }

    function sum(values) {
      return values.reduce(function(a, b) { return a + b; }, 0);
    }

    var results = [];
    var current = null;
    var num_started= 0;
    var completed= false;

    var emit = function(key, val) {
      var viewRow = {
        id: current.doc._id,
        key: key,
        value: val
      };

      if (options.startkey && Pouch.collate(key, options.startkey) < 0) return;
      if (options.endkey && Pouch.collate(key, options.endkey) > 0) return;
      if (options.key && Pouch.collate(key, options.key) !== 0) return;
      num_started++;
      if (options.include_docs) {
        //in this special case, join on _id (issue #106)
        if (val && typeof val === 'object' && val._id){
          db.get(val._id,
              function(_, joined_doc){
                if (joined_doc) {
                  viewRow.doc = joined_doc;
                }
                results.push(viewRow);
                checkComplete();
              });
          return;
        } else {
          viewRow.doc = current.doc;
        }
      }
      results.push(viewRow);
    };

    // ugly way to make sure references to 'emit' in map/reduce bind to the
    // above emit
    eval('fun.map = ' + fun.map.toString() + ';');
    if (fun.reduce) {
      eval('fun.reduce = ' + fun.reduce.toString() + ';');
    }

    // exclude  _conflicts key by default
    // or to use options.conflicts if it's set when called by db.query
    var conflicts = ('conflicts' in options ? options.conflicts : false);

    //only proceed once all documents are mapped and joined
    var checkComplete= function(){
      if (completed && results.length == num_started){
        results.sort(function(a, b) {
          return Pouch.collate(a.key, b.key);
        });
        if (options.descending) {
          results.reverse();
        }
        if (options.reduce === false) {
          return options.complete(null, {rows: results});
        }

        var groups = [];
        results.forEach(function(e) {
          var last = groups[groups.length-1] || null;
          if (last && Pouch.collate(last.key[0][0], e.key) === 0) {
            last.key.push([e.key, e.id]);
            last.value.push(e.value);
            return;
          }
          groups.push({key: [[e.key, e.id]], value: [e.value]});
        });
        groups.forEach(function(e) {
          e.value = fun.reduce(e.key, e.value) || null;
          e.key = e.key[0][0];
        });
        options.complete(null, {rows: groups});
      }
    }

    db.changes({
      conflicts: conflicts,
      include_docs: true,
      onChange: function(doc) {
        if (!('deleted' in doc)) {
          current = {doc: doc.doc};
          fun.map.call(this, doc.doc);
        }
      },
      complete: function() {
        completed= true;
        checkComplete();
      }
    });
  }

  function httpQuery(fun, opts, callback) {

    // List of parameters to add to the PUT request
    var params = [];
    var body = undefined;
    var method = 'GET';

    // If opts.reduce exists and is defined, then add it to the list
    // of parameters.
    // If reduce=false then the results are that of only the map function
    // not the final result of map and reduce.
    if (typeof opts.reduce !== 'undefined') {
      params.push('reduce=' + opts.reduce);
    }
    if (typeof opts.include_docs !== 'undefined') {
      params.push('include_docs=' + opts.include_docs);
    }
    if (typeof opts.limit !== 'undefined') {
      params.push('limit=' + opts.limit);
    }
    if (typeof opts.descending !== 'undefined') {
      params.push('descending=' + opts.descending);
    }
    if (typeof opts.startkey !== 'undefined') {
      params.push('startkey=' + encodeURIComponent(JSON.stringify(opts.startkey)));
    }
    if (typeof opts.endkey !== 'undefined') {
      params.push('endkey=' + encodeURIComponent(JSON.stringify(opts.endkey)));
    }
    if (typeof opts.key !== 'undefined') {
      params.push('key=' + encodeURIComponent(JSON.stringify(opts.key)));
    }

    // If keys are supplied, issue a POST request to circumvent GET query string limits
    // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
    if (typeof opts.keys !== 'undefined') {
      method = 'POST';
      body = JSON.stringify({keys:opts.keys});
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    params = params === '' ? '' : '?' + params;

    // We are referencing a query defined in the design doc
    if (typeof fun === 'string') {
      var parts = fun.split('/');
      db.request({
        method: method,
        url: '_design/' + parts[0] + '/_view/' + parts[1] + params,
        body: body
      }, callback);
      return;
    }

    // We are using a temporary view, terrible for performance but good for testing
    var queryObject = JSON.parse(JSON.stringify(fun, function(key, val) {
      if (typeof val === 'function') {
        return val + ''; // implicitly `toString` it
      }
      return val;
    }));

    db.request({
      method:'POST',
      url: '_temp_view' + params,
      body: queryObject
    }, callback);
  }

  function query(fun, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (callback) {
      opts.complete = callback;
    }

    if (db.type() === 'http') {
      return httpQuery(fun, opts, callback);
    }

    if (typeof fun === 'object') {
      return viewQuery(fun, opts);
    }

    var parts = fun.split('/');
    db.get('_design/' + parts[0], function(err, doc) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      viewQuery({
        map: doc.views[parts[1]].map,
        reduce: doc.views[parts[1]].reduce
      }, opts);
    });
  }

  return {'query': query};
};

// Deletion is a noop since we dont store the results of the view
MapReduce._delete = function() { };

Pouch.plugin('mapreduce', MapReduce);


 })(this);

/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-applicationcache-indexeddb-localstorage-websqldatabase-testprop-testallprops-domprefixes
 */
;



window.Modernizr = (function( window, document, undefined ) {

    var version = '2.6.2',

    Modernizr = {},


    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  ,


    toString = {}.toString,    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),


    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName,



    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) {
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }

    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }

    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

            if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

            } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }

    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };
    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };
    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }



     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
                                              return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr;
     };


    setCss('');
    modElem = inputElem = null;


    Modernizr._version      = version;

    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;



    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };

    Modernizr.testAllProps  = testPropsAll;


    return Modernizr;

})(this, this.document);
;
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_views = factory();
    }
}(this, function () {


var views = {};

views.by_active_install =  {
     map: function (doc) {
        if (!doc.type || doc.type !== 'install' ) return;
        if (doc.removed) return;
        emit(doc.dashboard_title, null);
     }
};

views.dashboard_assets = {
    map : function(doc) {

        var order;

        if (doc._id == 'settings') {
            emit([0], doc);
        }
        if (!doc.type) return; // safety first
        if (doc.type === 'install' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order, doc.dashboard_title, 'install'], { db : doc.installed.db });

        }
        if (doc.type === 'link' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order, doc.dashboard_title, 'link'], { url : doc.url });

        }
        if (doc.type === 'theme' && doc.selectedTheme) {
            emit([2], null);
        }
        if (doc.type === 'script') {
            emit([3], doc._rev);
        }
    }
};

views.cache_manifest = {
    map : function(doc) {

        var order;

        if (doc._id == 'settings') {
            emit([0], doc);
        }
        if (!doc.type) return; // safety first
        if (doc.type === 'install' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order], doc._rev);

        }
        if (doc.type === 'link' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order], doc._rev);

        }
        if (doc.type === 'theme' && doc.selectedTheme) {
            emit([2], doc._rev);
        }
        if (doc.type === 'script') {
            emit([3], doc._rev);
        }
    }
};


views.app_version_by_market = {
    map : function(doc) {
        if (!doc.type || doc.type !== 'install' ) return;
        if (doc.removed) return;

        var end = 'details/' + doc.doc_id;
        var src = doc.src.substring(0, doc.src.indexOf(end));

        var meta = doc.couchapp || doc.kanso;
        emit(src, {
            dashboard_title: doc.dashboard_title,
            app: doc.doc_id,
            version: meta.config.version
        });

    }
};



views.get_markets =  {
     map: function (doc) {
        if (doc.type && doc.type === 'market' ) {
            emit(doc.name, doc.url);
        }
     }
};

views.get_roles = {
    map : function(doc) {
        if (doc.type && doc.type === 'role' ) {
            emit(doc.name, doc.url);
        }
    }
};

views.get_syncs = {
    map : function(doc) {
        if (doc.type && doc.type === 'sync') {
            emit(doc.name, null);
        }
    }
};

return views;


}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('async'), require('pouchdb'), require('garden-views'), require('url'), require('stately.js'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async','pouchdb', 'garden-views', 'url'],factory);
    } else {
        root.garden_dashboard_core = factory(root.async, root.Pouch, root.garden_views, root.url, root.Stately);
    }
}(this, function (async, Pouch, garden_views, url, Stately) {

var app = function(dashboard_db_url, options) {
    var core = this;
    core.dashboard_db_url = dashboard_db_url;
    core.options = options;
    core.pouchName = app.getPouchName(dashboard_db_url);
    core.cached_session = null;

    /*------   Private Methods ------------------*/
    // any methods that start with t_ transition the state machine


    var initState = function() {
        core.states = Stately({
            "INIT": {
                start : t_determine_state
            },
            "FIRST_VISIT" : {
                // couch available, pouch supported, never synced
                poll: t_poll_connectivity_no_pouch,
                sync: t_first_sync,
                topbar: topbar_remote,
                allAssets: allAssets_remote,
                settings: settings_remote
            },
            "OFFLINE_NO_HOPE" : {
                // no couch available, pouch supported, never synced
            },
            "READY_LOCAL_DB_UNSUPPORTED": {
                // couch available, pouch not supported
                poll: t_poll_connectivity_no_pouch,
                topbar: topbar_remote,
                allAssets: allAssets_remote,
                settings: settings_remote
            },
            "OFFLINE_WITH_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                online: t_online,

                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "OFFLINE_WITHOUT_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                online: t_online,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "ONLINE_WITH_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                offline: t_offline,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "ONLINE_WITHOUT_USER": {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                offline: t_offline,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            }
        });
    };

    var t_determine_state = function() {
        var self = this;

        async.parallel({
            remote_dashboard : remote_dashboard,
            pouched_dashboard : function(cb) {

                if (core.options.disablePouch) {
                    return cb(null, {unsupported: true});
                }
                try {
                    pouched_dashboard(function(err, results){
                        if (err) return cb(null, {unsupported: true});
                        cb (null, results);
                    });
                } catch(e) {
                    cb(null, {unsupported: true});
                }
            },
            pouched_extra : function(cb) {

                if (core.options.disablePouch) {
                    return cb(null, {unsupported: true});
                }
                try {
                    pouched_extra(function(err, results){
                        if (err) return cb(null, {unsupported: true});
                        cb (null, results);
                    });
                } catch(e) {
                    cb(null, {unsupported: true});
                }
            }


        }, function(err, info){
            if (err || info.pouched_dashboard.unsupported) {
                return self.setMachineState(self.READY_LOCAL_DB_UNSUPPORTED);
            }
            if (info.remote_dashboard.available) {

                if (!info.pouched_dashboard.synced) {
                    return self.setMachineState(self.FIRST_VISIT);
                }
                else {

                    get_stored_session(function(err, session){
                        if (is_session_logged_in(session)) {
                            return self.setMachineState(self.ONLINE_WITH_USER);
                        }
                        return self.setMachineState(self.ONLINE_WITHOUT_USER);
                    });
                }
            }
            if (!info.remote_dashboard.available && info.pouched_dashboard.synced) {

                get_stored_session(function(err, session){

                    if (err || !session) self.setMachineState(self.OFFLINE_WITHOUT_USER);
                    if (is_session_logged_in(session))  return self.setMachineState(self.OFFLINE_WITH_USER);
                    return self.setMachineState(self.OFFLINE_WITHOUT_USER);
                });

            }
            if (!info.remote_dashboard.available && !info.pouched_dashboard.synced) {
                return self.states.setMachineState(self.OFFLINE_NO_HOPE);
            }
        });
    };



    var get_remote_session = function(callback) {
        core.remote_db.request({
            url: '../_session'
        }, callback);
    };

    var is_session_logged_in = function(session) {
        if (!session) return false;
        if (!session.userCtx) return false;
        if (!session.userCtx.name) return false;
        return true;
    };

    var store_session = function(session, callback) {
        if (!session) session = {userCtx: null};
        get_stored_session(function(err, stored_session){
            var update = true;
            if (err || !stored_session) stored_session = session;
            else {
                if (stored_session.userCtx.name === session.userCtx.name) {
                    update = false;
                }
                stored_session.userCtx = session.userCtx;
            }
            stored_session._id = 'session';
            if (update) {
                core.extra_db.put(stored_session, callback);
                core.cached_session = stored_session;
            }
            else callback(null, stored_session);
        });

    };

    var get_stored_session = function(callback) {
        core.extra_db.get('session', function(err, session){
            callback(err, session);
        });
    };


    var remote_dashboard = function(callback) {
        Pouch(core.dashboard_db_url, function(err, db){
            core.remote_db = db;
            // we swallow errors
            var results = {
                db: db,
                available: false,
                session: null
            };
            if (err) return callback(null, results);
            get_remote_session(function(err2, session){
                if (err2) return callback(null, results);
                core.cached_session = session;
                results.session = session;
                results.available = true;
                callback(null, results);
            });

        });

    };

    var pouched_dashboard = function(callback) {
        // return pouch, and if it has been synced with a dashbaord


        try {
            Pouch(core.pouchName, function(err, db){
                if (err) return callback(err);
                core.local_db = db;
                db.info(function(err, info) {
                    if (err) return callback(err);
                    var results = {
                        db : db,
                        synced : false
                    };
                    if (info.doc_count > 0) results.synced = true;
                    callback(null, results);
                });
            });
        } catch (e) {
            return callback(null, {unsupported: true});
        }
    };

    var pouched_extra = function(callback) {
        // return pouch, and if it has been synced with a dashbaord
        Pouch('dashbaord_extra', function(err, db){
            if (err) return callback(err);
            core.extra_db = db;
            callback(null, db);
        });
    };


    var t_poll_connectivity = function() {
        var self = this;

        get_remote_session(function(err, session){
            if (err) {
                // offline
                get_stored_session(function(err, session){
                    if (is_session_logged_in(session)) return self.setMachineState(self.OFFLINE_WITH_USER);
                    else return self.setMachineState(self.OFFLINE_WITHOUT_USER);
                });
            } else {
                // online
                store_session(session, function(err2) {
                    if (is_session_logged_in(session)) return self.setMachineState(self.ONLINE_WITH_USER);
                    else return self.setMachineState(self.ONLINE_WITHOUT_USER);
                });
            }
        });
    };

    var t_poll_connectivity_no_pouch = function() {
        var self = this;
        get_remote_session(function(err, session){
            if (err) return;
            core.cached_session = session;
            //trigger an update
            var state = self.getMachineState();
            self.setMachineState(self[state]);
        });
    };


    var t_first_sync = function() {
        var self = this;
        sync(function(err){
            if (err) return self.setMachineState(self.READY_LOCAL_DB_UNSUPPORTED);

            get_stored_session(function(err, session){
                if (err || !session) self.setMachineState(self.ONLINE_WITHOUT_USER);
                if (is_session_logged_in(session))  return self.setMachineState(self.ONLINE_WITH_USER);
                return self.setMachineState(self.ONLINE_WITHOUT_USER);
            });

        });
    };

    var sync = function(callback) {
        Pouch.replicate(core.remote_db, core.local_db, { filter: 'dashboard/docs_only' }, callback);
    };


    var t_login = function(user, password, callback) {
        // body...
    };

    var t_logout = function(callback) {

    };

    var t_online = function(callback) {

    };

    var t_offline = function(callback) {

    };

    var topbar_local = function(callback) {
        core.local_db.query(garden_views.dashboard_assets, {reduce: false, include_docs: true}, function(err, resp){
            topbar_process(err, resp, callback);
        });
    };

    var topbar_remote = function(callback) {
        core.remote_db.query('dashboard/dashboard_assets', {reduce: false, include_docs: true}, function(err, resp){
            topbar_process(err, resp, callback);
        });
    };

    var topbar_process = function(err, resp, callback) {
        var results = {
            settingsDoc : {},
            selectedThemeDoc : null,
            apps: [],
            scripts: []
        };
        if (err && err.status === 404 && err.reason === 'no_db_file') return topbar_empty(results, callback);
        if (err) return callback(err);
        async.forEach(resp.rows, function(row, cb){
            if (row.key[0] === 0) results.settingsDoc = row.value;
            if (row.key[0] === 1) {
                if (row.key[3] == 'install') {
                    results.apps.push({
                        title : row.key[2],
                        db :row.value.db,
                        doc : row.doc
                    });
                }
                if (row.key[3] == 'link') {
                    results.apps.push({
                        title : row.key[2],
                        link :row.value.url,
                        doc  : row.doc,
                        external : true
                    });
                }
            }
            if (row.key[0] === 2) results.selectedThemeDoc = row.doc;
            if (row.key[0] === 3) results.scripts.push(row.doc.src);
            cb();
        }, function(err){
            callback(err, results);
        });
    };

    var topbar_empty = function(results, callback) {
        results.no_db_file = true;
        callback(null, results);
    };

    var allAssets_local = function(callback) {
        core.local_db.allDocs(callback);
    };

    var allAssets_remote = function(callback) {
        core.remote_db.allDocs(callback);
    };

    var settings_local = function(callback) {
        core.local_db.get('settings', function(err, data){
            if (err && err.status === 404) return callback(null, {});
            callback(err, data);
        });
    };

    var settings_remote = function(callback) {
        core.remote_db.get('settings', function(err, data){
            if (err && err.status === 404) return callback(null, {});
            callback(err, data);
        });
    };

    initState();
};


/* --------- Public API  -------------------*/
// all proxy to the statemachine for the right action
// based on online/offline

app.prototype.start = function(callback) {
    var self = this;

    var onState = function(event, oldState, newState) {
        if (newState === 'INIT') return;
        self.states.unbind(onState);
        callback(null, newState);
    };
    self.states.bind(onState);
    self.states.start();
};

app.prototype.sync = function(callback) {
    this.states.sync(callback);
};

app.prototype.topbar = function(callback) {
    this.states.topbar(callback);
};

app.prototype.allAssets = function(callback) {
    this.states.allAssets(callback);
};

app.prototype.settings = function(callback) {
    this.states.settings(callback);
};

app.prototype.poll = function() {
    this.states.poll();
};

app.prototype.login = function(user, password, callback) {
    this.states.login(user, password, callback);
};

app.prototype.logout = function() {
    this.states.logout();
};

app.prototype.go_online = function() {
    this.states.online();
};

app.prototype.go_offline = function() {
    this.states.offline();
};

app.prototype.getState = function() {
    return this.states.getMachineState();
};

app.prototype.bind = function(func) {
    this.states.bind(func);
};

app.prototype.getCachedSession = function(callback) {
    var core = this;
    if (core.cached_session) {
        return callback(null, core.cached_session);
    }

    this.extra_db.get('session', function(err, session){
        if (err && err.status === 404) {
            // a special condition for the first time
            return callback(null, core.cached_session);
        }
        return callback(err, session);
    });
};

app.getPouchName = function(dashboard_db_url) {

  var parsed = url.parse(dashboard_db_url),
      namespace = parsed.hostname + parsed.port;

  if (parsed.pathname) {
     var clean = parsed.pathname.replace(/\//g, '_');
     namespace += clean;
  }
  return namespace;
};




return app;

}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_default_settings = factory();
    }
}(this, function () {

return {
    frontpage : {
        use_markdown : true,
        use_html : false,
        show_activity_feed : false,
        markdown : "## Welcome to your Garden\n\nHere are some things you might want to do:\n\n- [Configure](./settings#/frontpage) this front page.\n- [Install](./install) some apps.\n- [Sync](./settings#/sync) with another garden.\n\n\n\n"
    },
    host_options : {
        short_urls : false,
        hostnames : 'http://localhost:5984,http://0.0.0.0:5985',
        short_app_urls : true,
        rootDashboard : false,
        hosted : false,
        login_type : 'local'

    },
    top_nav_bar : {
        bg_color : '#1D1D1D',
        link_color : '#BFBFBF',
        active_link_color : '#FFFFFF',
        active_link_bg_color : '#000000',
        active_bar_color : '#bd0000',
        show_brand : false,
        icon_name : null,
        brand_link : null,
        show_gravatar : true,
        show_username : true,
        notification_theme: 'libnotify',
        show_futon : true
    },
    sessions : {
        type : 'internal',
        internal : {
            login_type: 'local',
            redirect_frontpage_on_anon : false
        },
        other : {
            login_url : '/users/_design/users-default/_rewrite/#/login',
            login_url_next : '/users/_design/users-default/_rewrite/#/login/{next}',
            signup_url : '/users/_design/users-default/_rewrite/#/signup',
            profile_url : '/users/_design/users-default/_rewrite/#/profile/{username}'
        }
    }
};



}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('underscore'), require('garden-dashboard-core'), require('garden-default-settings'), require('url'));
    } else if (typeof define === 'function' && define.amd) {
        define(['underscore','garden-dashboard-core', 'garden-default-settings', 'url'],factory);
    } else {
        root.garden_menu = factory(root._, root.garden_dashboard_core, root.garden_default_settings, root.url);
    }
}(this, function (_, DashboardCore, default_settings, url) {

var app = function(dashboard_db_url, options) {
    this.dashboard_db_url = dashboard_db_url;
    this.options = options;
    this.dashboard_core = new DashboardCore(dashboard_db_url, options);

    // in case things are called out of order, fallback to default settings.
    this.settings = default_settings;

};

app.prototype.init = function(callback) {
    var menu = this;

    // some inital values
    var results = {
        core : menu.dashboard_core,
        state: 'OFFLINE_NO_HOPE',
        settings: null
    };

    menu.dashboard_core.start(function(err, state) {
        if (state === 'OFFLINE_NO_HOPE') return callback('OFFLINE_NO_HOPE', results);
        results.state = state;
        callback(null, results);
    });
};

app.prototype.getAppLinks = function(options, callback) {
    var menu = this;

    if (!callback) {
        callback = options;
        options = {};
    }

    menu.dashboard_core.topbar(function(err, results) {
        if (err) return callback(err);

        menu.settings = _.defaults(results.settingsDoc, default_settings);
        var settings = results.settingsDoc;

        results.dashboard_url = menu.dashboard_ui_url(),
        results.home_url = results.dashboard_url,
        results.settings_url  = results.dashboard_url + "settings";
        results.login_url = menu.login_url(results.dashboard_url);


        if (settings.frontpage.use_link) {
            results.home_url = settings.frontpage.link_url;
        }

        results.apps = _.map(results.apps, function(app) {
            if (app.db) {
                app.link = menu.app_url_ui(app.doc);
            }
            if (app.doc.remote_user && options.username && app.doc.remote_user !== username) {
                app.remote_user_warning = true;
                app.remote_user = app.doc.remote_user;
            }
            if (app.doc.kanso || app.doc.couchapp) {
                var meta = app.doc.couchapp || app.doc.kanso;
                app.desc = meta.config.description;
            }
            return app;
        });

        results.grouped_apps = _.groupBy(results.apps, function(app) {
            if (app.doc.onDropdownMenu) return "more_apps";
            else return "apps";
        });
        callback(null, results);
   });
};


app.prototype.login_url = function(dashboard_url) {
    var login_url = dashboard_url + 'login';

    if (this.settings.sessions.type == 'other') {
        login_url = this.settings.sessions.other.login_url;
    }
    return login_url;
};

app.prototype.dashboard_ui_url = function() {

    if (this.settings.host_options.rootDashboard) {
        // only if the current host matches one of the specified hosts
        var use_short = false;
        // dermine if we are on the server or browser
        if (typeof window !== 'undefined') {
            var host = window.location.host;
            var hostnames = this.settings.host_options.hostnames.split(',');
            _.each(hostnames, function(hostname){
                var p = url.parse(hostname);
                var to_bind = p.hostname;
                if (p.port != '80' && (_.isString(p.port) || _.isNumber(p.port)) ) {
                    to_bind += ':' + p.port;
                }
                if (to_bind == host) use_short = true;
            });
            if (use_short) return '/';
        }
    }
    return  '/dashboard/_design/dashboard/_rewrite/';
};


app.prototype.app_url_ui = function(app_install_doc) {
    var meta = app_install_doc.couchapp || app_install_doc.kanso;
    try {
        if (meta.config.legacy_mode) {
            return '/' + app_install_doc.installed.db + '/_design/' + app_install_doc.doc_id  + app_install_doc.open_path;
        }
    } catch(ignore){}

    if (typeof window !== 'undefined' && this.settings.host_options.short_urls && this.settings.host_options.short_app_urls) {

        // only if the current host matches one of the specified hosts
        var use_short = false;

        // dermine if we are on the server or browser
        var host = window.location.host;

        var hostnames = this.settings.host_options.hostnames.split(',');
        _.each(hostnames, function(hostname){
            var p = url.parse(hostname);
            var to_bind = p.hostname;
            if (p.port != '80' && (_.isString(p.port) || _.isNumber(p.port)) ) {
                to_bind += ':' + p.port;
            }
            if (to_bind == host) use_short = true;
        });
        if (use_short) return '/' + app_install_doc.installed.db + '/';
    }
    return '/' + app_install_doc.installed.db + '/_design/' + app_install_doc.doc_id  + app_install_doc.open_path;
};

app.prototype.app_settings_ui = function(app_install_doc) {
    if (this.settings.host_options.rootDashboard) {
        return '/settings#/apps/' + app_install_doc._id;
    }
    return '/dashboard/_design/dashboard/_rewrite/settings#/apps/' + app_install_doc._id;
};


return app;

}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.jscss = factory();
    }
}(this, function () {

  var
    id = 0
  , indent = function(level){
      var out = "";
      for (var i = 0; i < level; i++){
        out += "  ";
      }
      return out
    }
  , jscss = {
      compile: function(obj){
        var
          selectors = {}
          // Build nested rules into single rules
        , _buildSelectors = function(hash, selector){
            var curr, type, selector, key;
            for (key in hash){
              type = typeof (curr = hash[key]);
              if (type == "string"){
                if (!selectors[selector]) selectors[selector] = {};
                selectors[selector][key] = curr;
              }else if (type == "object"){
                // Media query or animation or something
                if (key[0] == "@"){
                  selectors[key] = curr;
                }else{
                  _buildSelectors(curr, (selector ? (selector + " ") : "") + key);
                }
              }
            }
          }
          // Take a flat css object and turn it into a string
        , _compile = function(hash, level){
            var spaces = "  ", out = "", level = level || 0, curr;
            for (var key in hash){
              curr = hash[key];
              out += indent(level) + key;
              if (typeof curr == "object"){
                out += " {\n" + _compile(curr, level + 1) + indent(level) + "}\n";
              }else{
                out += ": " + curr + ";\n";
              }
            }
            return out;
          }
        ;
        _buildSelectors(obj, "");
        return _compile(selectors, 0);
      }
      // Embeds a
    , embed: function(styles, styleId){
        styleId || (styleId = "jscss-" + (id++));
        var el = document.createElement('style');
        el.type = "text/css";
        el.rel = "stylesheet";
        el.id = styleId;
        el.innerHTML = "\n" + styles;
        document.head.appendChild(el);
      }
    }
  ;

  return jscss;

}));
/*! jQuery v1.8.3 jquery.com | jquery.org/license */
(function(e,t){function _(e){var t=M[e]={};return v.each(e.split(y),function(e,n){t[n]=!0}),t}function H(e,n,r){if(r===t&&e.nodeType===1){var i="data-"+n.replace(P,"-$1").toLowerCase();r=e.getAttribute(i);if(typeof r=="string"){try{r=r==="true"?!0:r==="false"?!1:r==="null"?null:+r+""===r?+r:D.test(r)?v.parseJSON(r):r}catch(s){}v.data(e,n,r)}else r=t}return r}function B(e){var t;for(t in e){if(t==="data"&&v.isEmptyObject(e[t]))continue;if(t!=="toJSON")return!1}return!0}function et(){return!1}function tt(){return!0}function ut(e){return!e||!e.parentNode||e.parentNode.nodeType===11}function at(e,t){do e=e[t];while(e&&e.nodeType!==1);return e}function ft(e,t,n){t=t||0;if(v.isFunction(t))return v.grep(e,function(e,r){var i=!!t.call(e,r,e);return i===n});if(t.nodeType)return v.grep(e,function(e,r){return e===t===n});if(typeof t=="string"){var r=v.grep(e,function(e){return e.nodeType===1});if(it.test(t))return v.filter(t,r,!n);t=v.filter(t,r)}return v.grep(e,function(e,r){return v.inArray(e,t)>=0===n})}function lt(e){var t=ct.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}function Lt(e,t){return e.getElementsByTagName(t)[0]||e.appendChild(e.ownerDocument.createElement(t))}function At(e,t){if(t.nodeType!==1||!v.hasData(e))return;var n,r,i,s=v._data(e),o=v._data(t,s),u=s.events;if(u){delete o.handle,o.events={};for(n in u)for(r=0,i=u[n].length;r<i;r++)v.event.add(t,n,u[n][r])}o.data&&(o.data=v.extend({},o.data))}function Ot(e,t){var n;if(t.nodeType!==1)return;t.clearAttributes&&t.clearAttributes(),t.mergeAttributes&&t.mergeAttributes(e),n=t.nodeName.toLowerCase(),n==="object"?(t.parentNode&&(t.outerHTML=e.outerHTML),v.support.html5Clone&&e.innerHTML&&!v.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):n==="input"&&Et.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):n==="option"?t.selected=e.defaultSelected:n==="input"||n==="textarea"?t.defaultValue=e.defaultValue:n==="script"&&t.text!==e.text&&(t.text=e.text),t.removeAttribute(v.expando)}function Mt(e){return typeof e.getElementsByTagName!="undefined"?e.getElementsByTagName("*"):typeof e.querySelectorAll!="undefined"?e.querySelectorAll("*"):[]}function _t(e){Et.test(e.type)&&(e.defaultChecked=e.checked)}function Qt(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=Jt.length;while(i--){t=Jt[i]+n;if(t in e)return t}return r}function Gt(e,t){return e=t||e,v.css(e,"display")==="none"||!v.contains(e.ownerDocument,e)}function Yt(e,t){var n,r,i=[],s=0,o=e.length;for(;s<o;s++){n=e[s];if(!n.style)continue;i[s]=v._data(n,"olddisplay"),t?(!i[s]&&n.style.display==="none"&&(n.style.display=""),n.style.display===""&&Gt(n)&&(i[s]=v._data(n,"olddisplay",nn(n.nodeName)))):(r=Dt(n,"display"),!i[s]&&r!=="none"&&v._data(n,"olddisplay",r))}for(s=0;s<o;s++){n=e[s];if(!n.style)continue;if(!t||n.style.display==="none"||n.style.display==="")n.style.display=t?i[s]||"":"none"}return e}function Zt(e,t,n){var r=Rt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function en(e,t,n,r){var i=n===(r?"border":"content")?4:t==="width"?1:0,s=0;for(;i<4;i+=2)n==="margin"&&(s+=v.css(e,n+$t[i],!0)),r?(n==="content"&&(s-=parseFloat(Dt(e,"padding"+$t[i]))||0),n!=="margin"&&(s-=parseFloat(Dt(e,"border"+$t[i]+"Width"))||0)):(s+=parseFloat(Dt(e,"padding"+$t[i]))||0,n!=="padding"&&(s+=parseFloat(Dt(e,"border"+$t[i]+"Width"))||0));return s}function tn(e,t,n){var r=t==="width"?e.offsetWidth:e.offsetHeight,i=!0,s=v.support.boxSizing&&v.css(e,"boxSizing")==="border-box";if(r<=0||r==null){r=Dt(e,t);if(r<0||r==null)r=e.style[t];if(Ut.test(r))return r;i=s&&(v.support.boxSizingReliable||r===e.style[t]),r=parseFloat(r)||0}return r+en(e,t,n||(s?"border":"content"),i)+"px"}function nn(e){if(Wt[e])return Wt[e];var t=v("<"+e+">").appendTo(i.body),n=t.css("display");t.remove();if(n==="none"||n===""){Pt=i.body.appendChild(Pt||v.extend(i.createElement("iframe"),{frameBorder:0,width:0,height:0}));if(!Ht||!Pt.createElement)Ht=(Pt.contentWindow||Pt.contentDocument).document,Ht.write("<!doctype html><html><body>"),Ht.close();t=Ht.body.appendChild(Ht.createElement(e)),n=Dt(t,"display"),i.body.removeChild(Pt)}return Wt[e]=n,n}function fn(e,t,n,r){var i;if(v.isArray(t))v.each(t,function(t,i){n||sn.test(e)?r(e,i):fn(e+"["+(typeof i=="object"?t:"")+"]",i,n,r)});else if(!n&&v.type(t)==="object")for(i in t)fn(e+"["+i+"]",t[i],n,r);else r(e,t)}function Cn(e){return function(t,n){typeof t!="string"&&(n=t,t="*");var r,i,s,o=t.toLowerCase().split(y),u=0,a=o.length;if(v.isFunction(n))for(;u<a;u++)r=o[u],s=/^\+/.test(r),s&&(r=r.substr(1)||"*"),i=e[r]=e[r]||[],i[s?"unshift":"push"](n)}}function kn(e,n,r,i,s,o){s=s||n.dataTypes[0],o=o||{},o[s]=!0;var u,a=e[s],f=0,l=a?a.length:0,c=e===Sn;for(;f<l&&(c||!u);f++)u=a[f](n,r,i),typeof u=="string"&&(!c||o[u]?u=t:(n.dataTypes.unshift(u),u=kn(e,n,r,i,u,o)));return(c||!u)&&!o["*"]&&(u=kn(e,n,r,i,"*",o)),u}function Ln(e,n){var r,i,s=v.ajaxSettings.flatOptions||{};for(r in n)n[r]!==t&&((s[r]?e:i||(i={}))[r]=n[r]);i&&v.extend(!0,e,i)}function An(e,n,r){var i,s,o,u,a=e.contents,f=e.dataTypes,l=e.responseFields;for(s in l)s in r&&(n[l[s]]=r[s]);while(f[0]==="*")f.shift(),i===t&&(i=e.mimeType||n.getResponseHeader("content-type"));if(i)for(s in a)if(a[s]&&a[s].test(i)){f.unshift(s);break}if(f[0]in r)o=f[0];else{for(s in r){if(!f[0]||e.converters[s+" "+f[0]]){o=s;break}u||(u=s)}o=o||u}if(o)return o!==f[0]&&f.unshift(o),r[o]}function On(e,t){var n,r,i,s,o=e.dataTypes.slice(),u=o[0],a={},f=0;e.dataFilter&&(t=e.dataFilter(t,e.dataType));if(o[1])for(n in e.converters)a[n.toLowerCase()]=e.converters[n];for(;i=o[++f];)if(i!=="*"){if(u!=="*"&&u!==i){n=a[u+" "+i]||a["* "+i];if(!n)for(r in a){s=r.split(" ");if(s[1]===i){n=a[u+" "+s[0]]||a["* "+s[0]];if(n){n===!0?n=a[r]:a[r]!==!0&&(i=s[0],o.splice(f--,0,i));break}}}if(n!==!0)if(n&&e["throws"])t=n(t);else try{t=n(t)}catch(l){return{state:"parsererror",error:n?l:"No conversion from "+u+" to "+i}}}u=i}return{state:"success",data:t}}function Fn(){try{return new e.XMLHttpRequest}catch(t){}}function In(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}function $n(){return setTimeout(function(){qn=t},0),qn=v.now()}function Jn(e,t){v.each(t,function(t,n){var r=(Vn[t]||[]).concat(Vn["*"]),i=0,s=r.length;for(;i<s;i++)if(r[i].call(e,t,n))return})}function Kn(e,t,n){var r,i=0,s=0,o=Xn.length,u=v.Deferred().always(function(){delete a.elem}),a=function(){var t=qn||$n(),n=Math.max(0,f.startTime+f.duration-t),r=n/f.duration||0,i=1-r,s=0,o=f.tweens.length;for(;s<o;s++)f.tweens[s].run(i);return u.notifyWith(e,[f,i,n]),i<1&&o?n:(u.resolveWith(e,[f]),!1)},f=u.promise({elem:e,props:v.extend({},t),opts:v.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:qn||$n(),duration:n.duration,tweens:[],createTween:function(t,n,r){var i=v.Tween(e,f.opts,t,n,f.opts.specialEasing[t]||f.opts.easing);return f.tweens.push(i),i},stop:function(t){var n=0,r=t?f.tweens.length:0;for(;n<r;n++)f.tweens[n].run(1);return t?u.resolveWith(e,[f,t]):u.rejectWith(e,[f,t]),this}}),l=f.props;Qn(l,f.opts.specialEasing);for(;i<o;i++){r=Xn[i].call(f,e,l,f.opts);if(r)return r}return Jn(f,l),v.isFunction(f.opts.start)&&f.opts.start.call(e,f),v.fx.timer(v.extend(a,{anim:f,queue:f.opts.queue,elem:e})),f.progress(f.opts.progress).done(f.opts.done,f.opts.complete).fail(f.opts.fail).always(f.opts.always)}function Qn(e,t){var n,r,i,s,o;for(n in e){r=v.camelCase(n),i=t[r],s=e[n],v.isArray(s)&&(i=s[1],s=e[n]=s[0]),n!==r&&(e[r]=s,delete e[n]),o=v.cssHooks[r];if(o&&"expand"in o){s=o.expand(s),delete e[r];for(n in s)n in e||(e[n]=s[n],t[n]=i)}else t[r]=i}}function Gn(e,t,n){var r,i,s,o,u,a,f,l,c,h=this,p=e.style,d={},m=[],g=e.nodeType&&Gt(e);n.queue||(l=v._queueHooks(e,"fx"),l.unqueued==null&&(l.unqueued=0,c=l.empty.fire,l.empty.fire=function(){l.unqueued||c()}),l.unqueued++,h.always(function(){h.always(function(){l.unqueued--,v.queue(e,"fx").length||l.empty.fire()})})),e.nodeType===1&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],v.css(e,"display")==="inline"&&v.css(e,"float")==="none"&&(!v.support.inlineBlockNeedsLayout||nn(e.nodeName)==="inline"?p.display="inline-block":p.zoom=1)),n.overflow&&(p.overflow="hidden",v.support.shrinkWrapBlocks||h.done(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t){s=t[r];if(Un.exec(s)){delete t[r],a=a||s==="toggle";if(s===(g?"hide":"show"))continue;m.push(r)}}o=m.length;if(o){u=v._data(e,"fxshow")||v._data(e,"fxshow",{}),"hidden"in u&&(g=u.hidden),a&&(u.hidden=!g),g?v(e).show():h.done(function(){v(e).hide()}),h.done(function(){var t;v.removeData(e,"fxshow",!0);for(t in d)v.style(e,t,d[t])});for(r=0;r<o;r++)i=m[r],f=h.createTween(i,g?u[i]:0),d[i]=u[i]||v.style(e,i),i in u||(u[i]=f.start,g&&(f.end=f.start,f.start=i==="width"||i==="height"?1:0))}}function Yn(e,t,n,r,i){return new Yn.prototype.init(e,t,n,r,i)}function Zn(e,t){var n,r={height:e},i=0;t=t?1:0;for(;i<4;i+=2-t)n=$t[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}function tr(e){return v.isWindow(e)?e:e.nodeType===9?e.defaultView||e.parentWindow:!1}var n,r,i=e.document,s=e.location,o=e.navigator,u=e.jQuery,a=e.$,f=Array.prototype.push,l=Array.prototype.slice,c=Array.prototype.indexOf,h=Object.prototype.toString,p=Object.prototype.hasOwnProperty,d=String.prototype.trim,v=function(e,t){return new v.fn.init(e,t,n)},m=/[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,g=/\S/,y=/\s+/,b=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,w=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,E=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,S=/^[\],:{}\s]*$/,x=/(?:^|:|,)(?:\s*\[)+/g,T=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,N=/"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,C=/^-ms-/,k=/-([\da-z])/gi,L=function(e,t){return(t+"").toUpperCase()},A=function(){i.addEventListener?(i.removeEventListener("DOMContentLoaded",A,!1),v.ready()):i.readyState==="complete"&&(i.detachEvent("onreadystatechange",A),v.ready())},O={};v.fn=v.prototype={constructor:v,init:function(e,n,r){var s,o,u,a;if(!e)return this;if(e.nodeType)return this.context=this[0]=e,this.length=1,this;if(typeof e=="string"){e.charAt(0)==="<"&&e.charAt(e.length-1)===">"&&e.length>=3?s=[null,e,null]:s=w.exec(e);if(s&&(s[1]||!n)){if(s[1])return n=n instanceof v?n[0]:n,a=n&&n.nodeType?n.ownerDocument||n:i,e=v.parseHTML(s[1],a,!0),E.test(s[1])&&v.isPlainObject(n)&&this.attr.call(e,n,!0),v.merge(this,e);o=i.getElementById(s[2]);if(o&&o.parentNode){if(o.id!==s[2])return r.find(e);this.length=1,this[0]=o}return this.context=i,this.selector=e,this}return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e)}return v.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),v.makeArray(e,this))},selector:"",jquery:"1.8.3",length:0,size:function(){return this.length},toArray:function(){return l.call(this)},get:function(e){return e==null?this.toArray():e<0?this[this.length+e]:this[e]},pushStack:function(e,t,n){var r=v.merge(this.constructor(),e);return r.prevObject=this,r.context=this.context,t==="find"?r.selector=this.selector+(this.selector?" ":"")+n:t&&(r.selector=this.selector+"."+t+"("+n+")"),r},each:function(e,t){return v.each(this,e,t)},ready:function(e){return v.ready.promise().done(e),this},eq:function(e){return e=+e,e===-1?this.slice(e):this.slice(e,e+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(l.apply(this,arguments),"slice",l.call(arguments).join(","))},map:function(e){return this.pushStack(v.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:[].sort,splice:[].splice},v.fn.init.prototype=v.fn,v.extend=v.fn.extend=function(){var e,n,r,i,s,o,u=arguments[0]||{},a=1,f=arguments.length,l=!1;typeof u=="boolean"&&(l=u,u=arguments[1]||{},a=2),typeof u!="object"&&!v.isFunction(u)&&(u={}),f===a&&(u=this,--a);for(;a<f;a++)if((e=arguments[a])!=null)for(n in e){r=u[n],i=e[n];if(u===i)continue;l&&i&&(v.isPlainObject(i)||(s=v.isArray(i)))?(s?(s=!1,o=r&&v.isArray(r)?r:[]):o=r&&v.isPlainObject(r)?r:{},u[n]=v.extend(l,o,i)):i!==t&&(u[n]=i)}return u},v.extend({noConflict:function(t){return e.$===v&&(e.$=a),t&&e.jQuery===v&&(e.jQuery=u),v},isReady:!1,readyWait:1,holdReady:function(e){e?v.readyWait++:v.ready(!0)},ready:function(e){if(e===!0?--v.readyWait:v.isReady)return;if(!i.body)return setTimeout(v.ready,1);v.isReady=!0;if(e!==!0&&--v.readyWait>0)return;r.resolveWith(i,[v]),v.fn.trigger&&v(i).trigger("ready").off("ready")},isFunction:function(e){return v.type(e)==="function"},isArray:Array.isArray||function(e){return v.type(e)==="array"},isWindow:function(e){return e!=null&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return e==null?String(e):O[h.call(e)]||"object"},isPlainObject:function(e){if(!e||v.type(e)!=="object"||e.nodeType||v.isWindow(e))return!1;try{if(e.constructor&&!p.call(e,"constructor")&&!p.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(n){return!1}var r;for(r in e);return r===t||p.call(e,r)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw new Error(e)},parseHTML:function(e,t,n){var r;return!e||typeof e!="string"?null:(typeof t=="boolean"&&(n=t,t=0),t=t||i,(r=E.exec(e))?[t.createElement(r[1])]:(r=v.buildFragment([e],t,n?null:[]),v.merge([],(r.cacheable?v.clone(r.fragment):r.fragment).childNodes)))},parseJSON:function(t){if(!t||typeof t!="string")return null;t=v.trim(t);if(e.JSON&&e.JSON.parse)return e.JSON.parse(t);if(S.test(t.replace(T,"@").replace(N,"]").replace(x,"")))return(new Function("return "+t))();v.error("Invalid JSON: "+t)},parseXML:function(n){var r,i;if(!n||typeof n!="string")return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(s){r=t}return(!r||!r.documentElement||r.getElementsByTagName("parsererror").length)&&v.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&g.test(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(C,"ms-").replace(k,L)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,n,r){var i,s=0,o=e.length,u=o===t||v.isFunction(e);if(r){if(u){for(i in e)if(n.apply(e[i],r)===!1)break}else for(;s<o;)if(n.apply(e[s++],r)===!1)break}else if(u){for(i in e)if(n.call(e[i],i,e[i])===!1)break}else for(;s<o;)if(n.call(e[s],s,e[s++])===!1)break;return e},trim:d&&!d.call("\ufeff\u00a0")?function(e){return e==null?"":d.call(e)}:function(e){return e==null?"":(e+"").replace(b,"")},makeArray:function(e,t){var n,r=t||[];return e!=null&&(n=v.type(e),e.length==null||n==="string"||n==="function"||n==="regexp"||v.isWindow(e)?f.call(r,e):v.merge(r,e)),r},inArray:function(e,t,n){var r;if(t){if(c)return c.call(t,e,n);r=t.length,n=n?n<0?Math.max(0,r+n):n:0;for(;n<r;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,s=0;if(typeof r=="number")for(;s<r;s++)e[i++]=n[s];else while(n[s]!==t)e[i++]=n[s++];return e.length=i,e},grep:function(e,t,n){var r,i=[],s=0,o=e.length;n=!!n;for(;s<o;s++)r=!!t(e[s],s),n!==r&&i.push(e[s]);return i},map:function(e,n,r){var i,s,o=[],u=0,a=e.length,f=e instanceof v||a!==t&&typeof a=="number"&&(a>0&&e[0]&&e[a-1]||a===0||v.isArray(e));if(f)for(;u<a;u++)i=n(e[u],u,r),i!=null&&(o[o.length]=i);else for(s in e)i=n(e[s],s,r),i!=null&&(o[o.length]=i);return o.concat.apply([],o)},guid:1,proxy:function(e,n){var r,i,s;return typeof n=="string"&&(r=e[n],n=e,e=r),v.isFunction(e)?(i=l.call(arguments,2),s=function(){return e.apply(n,i.concat(l.call(arguments)))},s.guid=e.guid=e.guid||v.guid++,s):t},access:function(e,n,r,i,s,o,u){var a,f=r==null,l=0,c=e.length;if(r&&typeof r=="object"){for(l in r)v.access(e,n,l,r[l],1,o,i);s=1}else if(i!==t){a=u===t&&v.isFunction(i),f&&(a?(a=n,n=function(e,t,n){return a.call(v(e),n)}):(n.call(e,i),n=null));if(n)for(;l<c;l++)n(e[l],r,a?i.call(e[l],l,n(e[l],r)):i,u);s=1}return s?e:f?n.call(e):c?n(e[0],r):o},now:function(){return(new Date).getTime()}}),v.ready.promise=function(t){if(!r){r=v.Deferred();if(i.readyState==="complete")setTimeout(v.ready,1);else if(i.addEventListener)i.addEventListener("DOMContentLoaded",A,!1),e.addEventListener("load",v.ready,!1);else{i.attachEvent("onreadystatechange",A),e.attachEvent("onload",v.ready);var n=!1;try{n=e.frameElement==null&&i.documentElement}catch(s){}n&&n.doScroll&&function o(){if(!v.isReady){try{n.doScroll("left")}catch(e){return setTimeout(o,50)}v.ready()}}()}}return r.promise(t)},v.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(e,t){O["[object "+t+"]"]=t.toLowerCase()}),n=v(i);var M={};v.Callbacks=function(e){e=typeof e=="string"?M[e]||_(e):v.extend({},e);var n,r,i,s,o,u,a=[],f=!e.once&&[],l=function(t){n=e.memory&&t,r=!0,u=s||0,s=0,o=a.length,i=!0;for(;a&&u<o;u++)if(a[u].apply(t[0],t[1])===!1&&e.stopOnFalse){n=!1;break}i=!1,a&&(f?f.length&&l(f.shift()):n?a=[]:c.disable())},c={add:function(){if(a){var t=a.length;(function r(t){v.each(t,function(t,n){var i=v.type(n);i==="function"?(!e.unique||!c.has(n))&&a.push(n):n&&n.length&&i!=="string"&&r(n)})})(arguments),i?o=a.length:n&&(s=t,l(n))}return this},remove:function(){return a&&v.each(arguments,function(e,t){var n;while((n=v.inArray(t,a,n))>-1)a.splice(n,1),i&&(n<=o&&o--,n<=u&&u--)}),this},has:function(e){return v.inArray(e,a)>-1},empty:function(){return a=[],this},disable:function(){return a=f=n=t,this},disabled:function(){return!a},lock:function(){return f=t,n||c.disable(),this},locked:function(){return!f},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],a&&(!r||f)&&(i?f.push(t):l(t)),this},fire:function(){return c.fireWith(this,arguments),this},fired:function(){return!!r}};return c},v.extend({Deferred:function(e){var t=[["resolve","done",v.Callbacks("once memory"),"resolved"],["reject","fail",v.Callbacks("once memory"),"rejected"],["notify","progress",v.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return v.Deferred(function(n){v.each(t,function(t,r){var s=r[0],o=e[t];i[r[1]](v.isFunction(o)?function(){var e=o.apply(this,arguments);e&&v.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[s+"With"](this===i?n:this,[e])}:n[s])}),e=null}).promise()},promise:function(e){return e!=null?v.extend(e,r):r}},i={};return r.pipe=r.then,v.each(t,function(e,s){var o=s[2],u=s[3];r[s[1]]=o.add,u&&o.add(function(){n=u},t[e^1][2].disable,t[2][2].lock),i[s[0]]=o.fire,i[s[0]+"With"]=o.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=l.call(arguments),r=n.length,i=r!==1||e&&v.isFunction(e.promise)?r:0,s=i===1?e:v.Deferred(),o=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?l.call(arguments):r,n===u?s.notifyWith(t,n):--i||s.resolveWith(t,n)}},u,a,f;if(r>1){u=new Array(r),a=new Array(r),f=new Array(r);for(;t<r;t++)n[t]&&v.isFunction(n[t].promise)?n[t].promise().done(o(t,f,n)).fail(s.reject).progress(o(t,a,u)):--i}return i||s.resolveWith(f,n),s.promise()}}),v.support=function(){var t,n,r,s,o,u,a,f,l,c,h,p=i.createElement("div");p.setAttribute("className","t"),p.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=p.getElementsByTagName("*"),r=p.getElementsByTagName("a")[0];if(!n||!r||!n.length)return{};s=i.createElement("select"),o=s.appendChild(i.createElement("option")),u=p.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t={leadingWhitespace:p.firstChild.nodeType===3,tbody:!p.getElementsByTagName("tbody").length,htmlSerialize:!!p.getElementsByTagName("link").length,style:/top/.test(r.getAttribute("style")),hrefNormalized:r.getAttribute("href")==="/a",opacity:/^0.5/.test(r.style.opacity),cssFloat:!!r.style.cssFloat,checkOn:u.value==="on",optSelected:o.selected,getSetAttribute:p.className!=="t",enctype:!!i.createElement("form").enctype,html5Clone:i.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",boxModel:i.compatMode==="CSS1Compat",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},u.checked=!0,t.noCloneChecked=u.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!o.disabled;try{delete p.test}catch(d){t.deleteExpando=!1}!p.addEventListener&&p.attachEvent&&p.fireEvent&&(p.attachEvent("onclick",h=function(){t.noCloneEvent=!1}),p.cloneNode(!0).fireEvent("onclick"),p.detachEvent("onclick",h)),u=i.createElement("input"),u.value="t",u.setAttribute("type","radio"),t.radioValue=u.value==="t",u.setAttribute("checked","checked"),u.setAttribute("name","t"),p.appendChild(u),a=i.createDocumentFragment(),a.appendChild(p.lastChild),t.checkClone=a.cloneNode(!0).cloneNode(!0).lastChild.checked,t.appendChecked=u.checked,a.removeChild(u),a.appendChild(p);if(p.attachEvent)for(l in{submit:!0,change:!0,focusin:!0})f="on"+l,c=f in p,c||(p.setAttribute(f,"return;"),c=typeof p[f]=="function"),t[l+"Bubbles"]=c;return v(function(){var n,r,s,o,u="padding:0;margin:0;border:0;display:block;overflow:hidden;",a=i.getElementsByTagName("body")[0];if(!a)return;n=i.createElement("div"),n.style.cssText="visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px",a.insertBefore(n,a.firstChild),r=i.createElement("div"),n.appendChild(r),r.innerHTML="<table><tr><td></td><td>t</td></tr></table>",s=r.getElementsByTagName("td"),s[0].style.cssText="padding:0;margin:0;border:0;display:none",c=s[0].offsetHeight===0,s[0].style.display="",s[1].style.display="none",t.reliableHiddenOffsets=c&&s[0].offsetHeight===0,r.innerHTML="",r.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",t.boxSizing=r.offsetWidth===4,t.doesNotIncludeMarginInBodyOffset=a.offsetTop!==1,e.getComputedStyle&&(t.pixelPosition=(e.getComputedStyle(r,null)||{}).top!=="1%",t.boxSizingReliable=(e.getComputedStyle(r,null)||{width:"4px"}).width==="4px",o=i.createElement("div"),o.style.cssText=r.style.cssText=u,o.style.marginRight=o.style.width="0",r.style.width="1px",r.appendChild(o),t.reliableMarginRight=!parseFloat((e.getComputedStyle(o,null)||{}).marginRight)),typeof r.style.zoom!="undefined"&&(r.innerHTML="",r.style.cssText=u+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=r.offsetWidth===3,r.style.display="block",r.style.overflow="visible",r.innerHTML="<div></div>",r.firstChild.style.width="5px",t.shrinkWrapBlocks=r.offsetWidth!==3,n.style.zoom=1),a.removeChild(n),n=r=s=o=null}),a.removeChild(p),n=r=s=o=u=a=p=null,t}();var D=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,P=/([A-Z])/g;v.extend({cache:{},deletedIds:[],uuid:0,expando:"jQuery"+(v.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(e){return e=e.nodeType?v.cache[e[v.expando]]:e[v.expando],!!e&&!B(e)},data:function(e,n,r,i){if(!v.acceptData(e))return;var s,o,u=v.expando,a=typeof n=="string",f=e.nodeType,l=f?v.cache:e,c=f?e[u]:e[u]&&u;if((!c||!l[c]||!i&&!l[c].data)&&a&&r===t)return;c||(f?e[u]=c=v.deletedIds.pop()||v.guid++:c=u),l[c]||(l[c]={},f||(l[c].toJSON=v.noop));if(typeof n=="object"||typeof n=="function")i?l[c]=v.extend(l[c],n):l[c].data=v.extend(l[c].data,n);return s=l[c],i||(s.data||(s.data={}),s=s.data),r!==t&&(s[v.camelCase(n)]=r),a?(o=s[n],o==null&&(o=s[v.camelCase(n)])):o=s,o},removeData:function(e,t,n){if(!v.acceptData(e))return;var r,i,s,o=e.nodeType,u=o?v.cache:e,a=o?e[v.expando]:v.expando;if(!u[a])return;if(t){r=n?u[a]:u[a].data;if(r){v.isArray(t)||(t in r?t=[t]:(t=v.camelCase(t),t in r?t=[t]:t=t.split(" ")));for(i=0,s=t.length;i<s;i++)delete r[t[i]];if(!(n?B:v.isEmptyObject)(r))return}}if(!n){delete u[a].data;if(!B(u[a]))return}o?v.cleanData([e],!0):v.support.deleteExpando||u!=u.window?delete u[a]:u[a]=null},_data:function(e,t,n){return v.data(e,t,n,!0)},acceptData:function(e){var t=e.nodeName&&v.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),v.fn.extend({data:function(e,n){var r,i,s,o,u,a=this[0],f=0,l=null;if(e===t){if(this.length){l=v.data(a);if(a.nodeType===1&&!v._data(a,"parsedAttrs")){s=a.attributes;for(u=s.length;f<u;f++)o=s[f].name,o.indexOf("data-")||(o=v.camelCase(o.substring(5)),H(a,o,l[o]));v._data(a,"parsedAttrs",!0)}}return l}return typeof e=="object"?this.each(function(){v.data(this,e)}):(r=e.split(".",2),r[1]=r[1]?"."+r[1]:"",i=r[1]+"!",v.access(this,function(n){if(n===t)return l=this.triggerHandler("getData"+i,[r[0]]),l===t&&a&&(l=v.data(a,e),l=H(a,e,l)),l===t&&r[1]?this.data(r[0]):l;r[1]=n,this.each(function(){var t=v(this);t.triggerHandler("setData"+i,r),v.data(this,e,n),t.triggerHandler("changeData"+i,r)})},null,n,arguments.length>1,null,!1))},removeData:function(e){return this.each(function(){v.removeData(this,e)})}}),v.extend({queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=v._data(e,t),n&&(!r||v.isArray(n)?r=v._data(e,t,v.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=v.queue(e,t),r=n.length,i=n.shift(),s=v._queueHooks(e,t),o=function(){v.dequeue(e,t)};i==="inprogress"&&(i=n.shift(),r--),i&&(t==="fx"&&n.unshift("inprogress"),delete s.stop,i.call(e,o,s)),!r&&s&&s.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return v._data(e,n)||v._data(e,n,{empty:v.Callbacks("once memory").add(function(){v.removeData(e,t+"queue",!0),v.removeData(e,n,!0)})})}}),v.fn.extend({queue:function(e,n){var r=2;return typeof e!="string"&&(n=e,e="fx",r--),arguments.length<r?v.queue(this[0],e):n===t?this:this.each(function(){var t=v.queue(this,e,n);v._queueHooks(this,e),e==="fx"&&t[0]!=="inprogress"&&v.dequeue(this,e)})},dequeue:function(e){return this.each(function(){v.dequeue(this,e)})},delay:function(e,t){return e=v.fx?v.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,s=v.Deferred(),o=this,u=this.length,a=function(){--i||s.resolveWith(o,[o])};typeof e!="string"&&(n=e,e=t),e=e||"fx";while(u--)r=v._data(o[u],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(a));return a(),s.promise(n)}});var j,F,I,q=/[\t\r\n]/g,R=/\r/g,U=/^(?:button|input)$/i,z=/^(?:button|input|object|select|textarea)$/i,W=/^a(?:rea|)$/i,X=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,V=v.support.getSetAttribute;v.fn.extend({attr:function(e,t){return v.access(this,v.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){v.removeAttr(this,e)})},prop:function(e,t){return v.access(this,v.prop,e,t,arguments.length>1)},removeProp:function(e){return e=v.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,s,o,u;if(v.isFunction(e))return this.each(function(t){v(this).addClass(e.call(this,t,this.className))});if(e&&typeof e=="string"){t=e.split(y);for(n=0,r=this.length;n<r;n++){i=this[n];if(i.nodeType===1)if(!i.className&&t.length===1)i.className=e;else{s=" "+i.className+" ";for(o=0,u=t.length;o<u;o++)s.indexOf(" "+t[o]+" ")<0&&(s+=t[o]+" ");i.className=v.trim(s)}}}return this},removeClass:function(e){var n,r,i,s,o,u,a;if(v.isFunction(e))return this.each(function(t){v(this).removeClass(e.call(this,t,this.className))});if(e&&typeof e=="string"||e===t){n=(e||"").split(y);for(u=0,a=this.length;u<a;u++){i=this[u];if(i.nodeType===1&&i.className){r=(" "+i.className+" ").replace(q," ");for(s=0,o=n.length;s<o;s++)while(r.indexOf(" "+n[s]+" ")>=0)r=r.replace(" "+n[s]+" "," ");i.className=e?v.trim(r):""}}}return this},toggleClass:function(e,t){var n=typeof e,r=typeof t=="boolean";return v.isFunction(e)?this.each(function(n){v(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if(n==="string"){var i,s=0,o=v(this),u=t,a=e.split(y);while(i=a[s++])u=r?u:!o.hasClass(i),o[u?"addClass":"removeClass"](i)}else if(n==="undefined"||n==="boolean")this.className&&v._data(this,"__className__",this.className),this.className=this.className||e===!1?"":v._data(this,"__className__")||""})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;n<r;n++)if(this[n].nodeType===1&&(" "+this[n].className+" ").replace(q," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,s=this[0];if(!arguments.length){if(s)return n=v.valHooks[s.type]||v.valHooks[s.nodeName.toLowerCase()],n&&"get"in n&&(r=n.get(s,"value"))!==t?r:(r=s.value,typeof r=="string"?r.replace(R,""):r==null?"":r);return}return i=v.isFunction(e),this.each(function(r){var s,o=v(this);if(this.nodeType!==1)return;i?s=e.call(this,r,o.val()):s=e,s==null?s="":typeof s=="number"?s+="":v.isArray(s)&&(s=v.map(s,function(e){return e==null?"":e+""})),n=v.valHooks[this.type]||v.valHooks[this.nodeName.toLowerCase()];if(!n||!("set"in n)||n.set(this,s,"value")===t)this.value=s})}}),v.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,s=e.type==="select-one"||i<0,o=s?null:[],u=s?i+1:r.length,a=i<0?u:s?i:0;for(;a<u;a++){n=r[a];if((n.selected||a===i)&&(v.support.optDisabled?!n.disabled:n.getAttribute("disabled")===null)&&(!n.parentNode.disabled||!v.nodeName(n.parentNode,"optgroup"))){t=v(n).val();if(s)return t;o.push(t)}}return o},set:function(e,t){var n=v.makeArray(t);return v(e).find("option").each(function(){this.selected=v.inArray(v(this).val(),n)>=0}),n.length||(e.selectedIndex=-1),n}}},attrFn:{},attr:function(e,n,r,i){var s,o,u,a=e.nodeType;if(!e||a===3||a===8||a===2)return;if(i&&v.isFunction(v.fn[n]))return v(e)[n](r);if(typeof e.getAttribute=="undefined")return v.prop(e,n,r);u=a!==1||!v.isXMLDoc(e),u&&(n=n.toLowerCase(),o=v.attrHooks[n]||(X.test(n)?F:j));if(r!==t){if(r===null){v.removeAttr(e,n);return}return o&&"set"in o&&u&&(s=o.set(e,r,n))!==t?s:(e.setAttribute(n,r+""),r)}return o&&"get"in o&&u&&(s=o.get(e,n))!==null?s:(s=e.getAttribute(n),s===null?t:s)},removeAttr:function(e,t){var n,r,i,s,o=0;if(t&&e.nodeType===1){r=t.split(y);for(;o<r.length;o++)i=r[o],i&&(n=v.propFix[i]||i,s=X.test(i),s||v.attr(e,i,""),e.removeAttribute(V?i:n),s&&n in e&&(e[n]=!1))}},attrHooks:{type:{set:function(e,t){if(U.test(e.nodeName)&&e.parentNode)v.error("type property can't be changed");else if(!v.support.radioValue&&t==="radio"&&v.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}},value:{get:function(e,t){return j&&v.nodeName(e,"button")?j.get(e,t):t in e?e.value:null},set:function(e,t,n){if(j&&v.nodeName(e,"button"))return j.set(e,t,n);e.value=t}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(e,n,r){var i,s,o,u=e.nodeType;if(!e||u===3||u===8||u===2)return;return o=u!==1||!v.isXMLDoc(e),o&&(n=v.propFix[n]||n,s=v.propHooks[n]),r!==t?s&&"set"in s&&(i=s.set(e,r,n))!==t?i:e[n]=r:s&&"get"in s&&(i=s.get(e,n))!==null?i:e[n]},propHooks:{tabIndex:{get:function(e){var n=e.getAttributeNode("tabindex");return n&&n.specified?parseInt(n.value,10):z.test(e.nodeName)||W.test(e.nodeName)&&e.href?0:t}}}}),F={get:function(e,n){var r,i=v.prop(e,n);return i===!0||typeof i!="boolean"&&(r=e.getAttributeNode(n))&&r.nodeValue!==!1?n.toLowerCase():t},set:function(e,t,n){var r;return t===!1?v.removeAttr(e,n):(r=v.propFix[n]||n,r in e&&(e[r]=!0),e.setAttribute(n,n.toLowerCase())),n}},V||(I={name:!0,id:!0,coords:!0},j=v.valHooks.button={get:function(e,n){var r;return r=e.getAttributeNode(n),r&&(I[n]?r.value!=="":r.specified)?r.value:t},set:function(e,t,n){var r=e.getAttributeNode(n);return r||(r=i.createAttribute(n),e.setAttributeNode(r)),r.value=t+""}},v.each(["width","height"],function(e,t){v.attrHooks[t]=v.extend(v.attrHooks[t],{set:function(e,n){if(n==="")return e.setAttribute(t,"auto"),n}})}),v.attrHooks.contenteditable={get:j.get,set:function(e,t,n){t===""&&(t="false"),j.set(e,t,n)}}),v.support.hrefNormalized||v.each(["href","src","width","height"],function(e,n){v.attrHooks[n]=v.extend(v.attrHooks[n],{get:function(e){var r=e.getAttribute(n,2);return r===null?t:r}})}),v.support.style||(v.attrHooks.style={get:function(e){return e.style.cssText.toLowerCase()||t},set:function(e,t){return e.style.cssText=t+""}}),v.support.optSelected||(v.propHooks.selected=v.extend(v.propHooks.selected,{get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}})),v.support.enctype||(v.propFix.enctype="encoding"),v.support.checkOn||v.each(["radio","checkbox"],function(){v.valHooks[this]={get:function(e){return e.getAttribute("value")===null?"on":e.value}}}),v.each(["radio","checkbox"],function(){v.valHooks[this]=v.extend(v.valHooks[this],{set:function(e,t){if(v.isArray(t))return e.checked=v.inArray(v(e).val(),t)>=0}})});var $=/^(?:textarea|input|select)$/i,J=/^([^\.]*|)(?:\.(.+)|)$/,K=/(?:^|\s)hover(\.\S+|)\b/,Q=/^key/,G=/^(?:mouse|contextmenu)|click/,Y=/^(?:focusinfocus|focusoutblur)$/,Z=function(e){return v.event.special.hover?e:e.replace(K,"mouseenter$1 mouseleave$1")};v.event={add:function(e,n,r,i,s){var o,u,a,f,l,c,h,p,d,m,g;if(e.nodeType===3||e.nodeType===8||!n||!r||!(o=v._data(e)))return;r.handler&&(d=r,r=d.handler,s=d.selector),r.guid||(r.guid=v.guid++),a=o.events,a||(o.events=a={}),u=o.handle,u||(o.handle=u=function(e){return typeof v=="undefined"||!!e&&v.event.triggered===e.type?t:v.event.dispatch.apply(u.elem,arguments)},u.elem=e),n=v.trim(Z(n)).split(" ");for(f=0;f<n.length;f++){l=J.exec(n[f])||[],c=l[1],h=(l[2]||"").split(".").sort(),g=v.event.special[c]||{},c=(s?g.delegateType:g.bindType)||c,g=v.event.special[c]||{},p=v.extend({type:c,origType:l[1],data:i,handler:r,guid:r.guid,selector:s,needsContext:s&&v.expr.match.needsContext.test(s),namespace:h.join(".")},d),m=a[c];if(!m){m=a[c]=[],m.delegateCount=0;if(!g.setup||g.setup.call(e,i,h,u)===!1)e.addEventListener?e.addEventListener(c,u,!1):e.attachEvent&&e.attachEvent("on"+c,u)}g.add&&(g.add.call(e,p),p.handler.guid||(p.handler.guid=r.guid)),s?m.splice(m.delegateCount++,0,p):m.push(p),v.event.global[c]=!0}e=null},global:{},remove:function(e,t,n,r,i){var s,o,u,a,f,l,c,h,p,d,m,g=v.hasData(e)&&v._data(e);if(!g||!(h=g.events))return;t=v.trim(Z(t||"")).split(" ");for(s=0;s<t.length;s++){o=J.exec(t[s])||[],u=a=o[1],f=o[2];if(!u){for(u in h)v.event.remove(e,u+t[s],n,r,!0);continue}p=v.event.special[u]||{},u=(r?p.delegateType:p.bindType)||u,d=h[u]||[],l=d.length,f=f?new RegExp("(^|\\.)"+f.split(".").sort().join("\\.(?:.*\\.|)")+"(\\.|$)"):null;for(c=0;c<d.length;c++)m=d[c],(i||a===m.origType)&&(!n||n.guid===m.guid)&&(!f||f.test(m.namespace))&&(!r||r===m.selector||r==="**"&&m.selector)&&(d.splice(c--,1),m.selector&&d.delegateCount--,p.remove&&p.remove.call(e,m));d.length===0&&l!==d.length&&((!p.teardown||p.teardown.call(e,f,g.handle)===!1)&&v.removeEvent(e,u,g.handle),delete h[u])}v.isEmptyObject(h)&&(delete g.handle,v.removeData(e,"events",!0))},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(n,r,s,o){if(!s||s.nodeType!==3&&s.nodeType!==8){var u,a,f,l,c,h,p,d,m,g,y=n.type||n,b=[];if(Y.test(y+v.event.triggered))return;y.indexOf("!")>=0&&(y=y.slice(0,-1),a=!0),y.indexOf(".")>=0&&(b=y.split("."),y=b.shift(),b.sort());if((!s||v.event.customEvent[y])&&!v.event.global[y])return;n=typeof n=="object"?n[v.expando]?n:new v.Event(y,n):new v.Event(y),n.type=y,n.isTrigger=!0,n.exclusive=a,n.namespace=b.join("."),n.namespace_re=n.namespace?new RegExp("(^|\\.)"+b.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,h=y.indexOf(":")<0?"on"+y:"";if(!s){u=v.cache;for(f in u)u[f].events&&u[f].events[y]&&v.event.trigger(n,r,u[f].handle.elem,!0);return}n.result=t,n.target||(n.target=s),r=r!=null?v.makeArray(r):[],r.unshift(n),p=v.event.special[y]||{};if(p.trigger&&p.trigger.apply(s,r)===!1)return;m=[[s,p.bindType||y]];if(!o&&!p.noBubble&&!v.isWindow(s)){g=p.delegateType||y,l=Y.test(g+y)?s:s.parentNode;for(c=s;l;l=l.parentNode)m.push([l,g]),c=l;c===(s.ownerDocument||i)&&m.push([c.defaultView||c.parentWindow||e,g])}for(f=0;f<m.length&&!n.isPropagationStopped();f++)l=m[f][0],n.type=m[f][1],d=(v._data(l,"events")||{})[n.type]&&v._data(l,"handle"),d&&d.apply(l,r),d=h&&l[h],d&&v.acceptData(l)&&d.apply&&d.apply(l,r)===!1&&n.preventDefault();return n.type=y,!o&&!n.isDefaultPrevented()&&(!p._default||p._default.apply(s.ownerDocument,r)===!1)&&(y!=="click"||!v.nodeName(s,"a"))&&v.acceptData(s)&&h&&s[y]&&(y!=="focus"&&y!=="blur"||n.target.offsetWidth!==0)&&!v.isWindow(s)&&(c=s[h],c&&(s[h]=null),v.event.triggered=y,s[y](),v.event.triggered=t,c&&(s[h]=c)),n.result}return},dispatch:function(n){n=v.event.fix(n||e.event);var r,i,s,o,u,a,f,c,h,p,d=(v._data(this,"events")||{})[n.type]||[],m=d.delegateCount,g=l.call(arguments),y=!n.exclusive&&!n.namespace,b=v.event.special[n.type]||{},w=[];g[0]=n,n.delegateTarget=this;if(b.preDispatch&&b.preDispatch.call(this,n)===!1)return;if(m&&(!n.button||n.type!=="click"))for(s=n.target;s!=this;s=s.parentNode||this)if(s.disabled!==!0||n.type!=="click"){u={},f=[];for(r=0;r<m;r++)c=d[r],h=c.selector,u[h]===t&&(u[h]=c.needsContext?v(h,this).index(s)>=0:v.find(h,this,null,[s]).length),u[h]&&f.push(c);f.length&&w.push({elem:s,matches:f})}d.length>m&&w.push({elem:this,matches:d.slice(m)});for(r=0;r<w.length&&!n.isPropagationStopped();r++){a=w[r],n.currentTarget=a.elem;for(i=0;i<a.matches.length&&!n.isImmediatePropagationStopped();i++){c=a.matches[i];if(y||!n.namespace&&!c.namespace||n.namespace_re&&n.namespace_re.test(c.namespace))n.data=c.data,n.handleObj=c,o=((v.event.special[c.origType]||{}).handle||c.handler).apply(a.elem,g),o!==t&&(n.result=o,o===!1&&(n.preventDefault(),n.stopPropagation()))}}return b.postDispatch&&b.postDispatch.call(this,n),n.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return e.which==null&&(e.which=t.charCode!=null?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,s,o,u=n.button,a=n.fromElement;return e.pageX==null&&n.clientX!=null&&(r=e.target.ownerDocument||i,s=r.documentElement,o=r.body,e.pageX=n.clientX+(s&&s.scrollLeft||o&&o.scrollLeft||0)-(s&&s.clientLeft||o&&o.clientLeft||0),e.pageY=n.clientY+(s&&s.scrollTop||o&&o.scrollTop||0)-(s&&s.clientTop||o&&o.clientTop||0)),!e.relatedTarget&&a&&(e.relatedTarget=a===e.target?n.toElement:a),!e.which&&u!==t&&(e.which=u&1?1:u&2?3:u&4?2:0),e}},fix:function(e){if(e[v.expando])return e;var t,n,r=e,s=v.event.fixHooks[e.type]||{},o=s.props?this.props.concat(s.props):this.props;e=v.Event(r);for(t=o.length;t;)n=o[--t],e[n]=r[n];return e.target||(e.target=r.srcElement||i),e.target.nodeType===3&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,r):e},special:{load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(e,t,n){v.isWindow(this)&&(this.onbeforeunload=n)},teardown:function(e,t){this.onbeforeunload===t&&(this.onbeforeunload=null)}}},simulate:function(e,t,n,r){var i=v.extend(new v.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?v.event.trigger(i,null,t):v.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},v.event.handle=v.event.dispatch,v.removeEvent=i.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]=="undefined"&&(e[r]=null),e.detachEvent(r,n))},v.Event=function(e,t){if(!(this instanceof v.Event))return new v.Event(e,t);e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?tt:et):this.type=e,t&&v.extend(this,t),this.timeStamp=e&&e.timeStamp||v.now(),this[v.expando]=!0},v.Event.prototype={preventDefault:function(){this.isDefaultPrevented=tt;var e=this.originalEvent;if(!e)return;e.preventDefault?e.preventDefault():e.returnValue=!1},stopPropagation:function(){this.isPropagationStopped=tt;var e=this.originalEvent;if(!e)return;e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=tt,this.stopPropagation()},isDefaultPrevented:et,isPropagationStopped:et,isImmediatePropagationStopped:et},v.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){v.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,s=e.handleObj,o=s.selector;if(!i||i!==r&&!v.contains(r,i))e.type=s.origType,n=s.handler.apply(this,arguments),e.type=t;return n}}}),v.support.submitBubbles||(v.event.special.submit={setup:function(){if(v.nodeName(this,"form"))return!1;v.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=v.nodeName(n,"input")||v.nodeName(n,"button")?n.form:t;r&&!v._data(r,"_submit_attached")&&(v.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),v._data(r,"_submit_attached",!0))})},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&v.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){if(v.nodeName(this,"form"))return!1;v.event.remove(this,"._submit")}}),v.support.changeBubbles||(v.event.special.change={setup:function(){if($.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")v.event.add(this,"propertychange._change",function(e){e.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),v.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),v.event.simulate("change",this,e,!0)});return!1}v.event.add(this,"beforeactivate._change",function(e){var t=e.target;$.test(t.nodeName)&&!v._data(t,"_change_attached")&&(v.event.add(t,"change._change",function(e){this.parentNode&&!e.isSimulated&&!e.isTrigger&&v.event.simulate("change",this.parentNode,e,!0)}),v._data(t,"_change_attached",!0))})},handle:function(e){var t=e.target;if(this!==t||e.isSimulated||e.isTrigger||t.type!=="radio"&&t.type!=="checkbox")return e.handleObj.handler.apply(this,arguments)},teardown:function(){return v.event.remove(this,"._change"),!$.test(this.nodeName)}}),v.support.focusinBubbles||v.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){v.event.simulate(t,e.target,v.event.fix(e),!0)};v.event.special[t]={setup:function(){n++===0&&i.addEventListener(e,r,!0)},teardown:function(){--n===0&&i.removeEventListener(e,r,!0)}}}),v.fn.extend({on:function(e,n,r,i,s){var o,u;if(typeof e=="object"){typeof n!="string"&&(r=r||n,n=t);for(u in e)this.on(u,n,r,e[u],s);return this}r==null&&i==null?(i=n,r=n=t):i==null&&(typeof n=="string"?(i=r,r=t):(i=r,r=n,n=t));if(i===!1)i=et;else if(!i)return this;return s===1&&(o=i,i=function(e){return v().off(e),o.apply(this,arguments)},i.guid=o.guid||(o.guid=v.guid++)),this.each(function(){v.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,s;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,v(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if(typeof e=="object"){for(s in e)this.off(s,n,e[s]);return this}if(n===!1||typeof n=="function")r=n,n=t;return r===!1&&(r=et),this.each(function(){v.event.remove(this,e,r,n)})},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},live:function(e,t,n){return v(this.context).on(e,this.selector,t,n),this},die:function(e,t){return v(this.context).off(e,this.selector||"**",t),this},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return arguments.length===1?this.off(e,"**"):this.off(t,e||"**",n)},trigger:function(e,t){return this.each(function(){v.event.trigger(e,t,this)})},triggerHandler:function(e,t){if(this[0])return v.event.trigger(e,t,this[0],!0)},toggle:function(e){var t=arguments,n=e.guid||v.guid++,r=0,i=function(n){var i=(v._data(this,"lastToggle"+e.guid)||0)%r;return v._data(this,"lastToggle"+e.guid,i+1),n.preventDefault(),t[i].apply(this,arguments)||!1};i.guid=n;while(r<t.length)t[r++].guid=n;return this.click(i)},hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)}}),v.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){v.fn[t]=function(e,n){return n==null&&(n=e,e=null),arguments.length>0?this.on(t,null,e,n):this.trigger(t)},Q.test(t)&&(v.event.fixHooks[t]=v.event.keyHooks),G.test(t)&&(v.event.fixHooks[t]=v.event.mouseHooks)}),function(e,t){function nt(e,t,n,r){n=n||[],t=t||g;var i,s,a,f,l=t.nodeType;if(!e||typeof e!="string")return n;if(l!==1&&l!==9)return[];a=o(t);if(!a&&!r)if(i=R.exec(e))if(f=i[1]){if(l===9){s=t.getElementById(f);if(!s||!s.parentNode)return n;if(s.id===f)return n.push(s),n}else if(t.ownerDocument&&(s=t.ownerDocument.getElementById(f))&&u(t,s)&&s.id===f)return n.push(s),n}else{if(i[2])return S.apply(n,x.call(t.getElementsByTagName(e),0)),n;if((f=i[3])&&Z&&t.getElementsByClassName)return S.apply(n,x.call(t.getElementsByClassName(f),0)),n}return vt(e.replace(j,"$1"),t,n,r,a)}function rt(e){return function(t){var n=t.nodeName.toLowerCase();return n==="input"&&t.type===e}}function it(e){return function(t){var n=t.nodeName.toLowerCase();return(n==="input"||n==="button")&&t.type===e}}function st(e){return N(function(t){return t=+t,N(function(n,r){var i,s=e([],n.length,t),o=s.length;while(o--)n[i=s[o]]&&(n[i]=!(r[i]=n[i]))})})}function ot(e,t,n){if(e===t)return n;var r=e.nextSibling;while(r){if(r===t)return-1;r=r.nextSibling}return 1}function ut(e,t){var n,r,s,o,u,a,f,l=L[d][e+" "];if(l)return t?0:l.slice(0);u=e,a=[],f=i.preFilter;while(u){if(!n||(r=F.exec(u)))r&&(u=u.slice(r[0].length)||u),a.push(s=[]);n=!1;if(r=I.exec(u))s.push(n=new m(r.shift())),u=u.slice(n.length),n.type=r[0].replace(j," ");for(o in i.filter)(r=J[o].exec(u))&&(!f[o]||(r=f[o](r)))&&(s.push(n=new m(r.shift())),u=u.slice(n.length),n.type=o,n.matches=r);if(!n)break}return t?u.length:u?nt.error(e):L(e,a).slice(0)}function at(e,t,r){var i=t.dir,s=r&&t.dir==="parentNode",o=w++;return t.first?function(t,n,r){while(t=t[i])if(s||t.nodeType===1)return e(t,n,r)}:function(t,r,u){if(!u){var a,f=b+" "+o+" ",l=f+n;while(t=t[i])if(s||t.nodeType===1){if((a=t[d])===l)return t.sizset;if(typeof a=="string"&&a.indexOf(f)===0){if(t.sizset)return t}else{t[d]=l;if(e(t,r,u))return t.sizset=!0,t;t.sizset=!1}}}else while(t=t[i])if(s||t.nodeType===1)if(e(t,r,u))return t}}function ft(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function lt(e,t,n,r,i){var s,o=[],u=0,a=e.length,f=t!=null;for(;u<a;u++)if(s=e[u])if(!n||n(s,r,i))o.push(s),f&&t.push(u);return o}function ct(e,t,n,r,i,s){return r&&!r[d]&&(r=ct(r)),i&&!i[d]&&(i=ct(i,s)),N(function(s,o,u,a){var f,l,c,h=[],p=[],d=o.length,v=s||dt(t||"*",u.nodeType?[u]:u,[]),m=e&&(s||!t)?lt(v,h,e,u,a):v,g=n?i||(s?e:d||r)?[]:o:m;n&&n(m,g,u,a);if(r){f=lt(g,p),r(f,[],u,a),l=f.length;while(l--)if(c=f[l])g[p[l]]=!(m[p[l]]=c)}if(s){if(i||e){if(i){f=[],l=g.length;while(l--)(c=g[l])&&f.push(m[l]=c);i(null,g=[],f,a)}l=g.length;while(l--)(c=g[l])&&(f=i?T.call(s,c):h[l])>-1&&(s[f]=!(o[f]=c))}}else g=lt(g===o?g.splice(d,g.length):g),i?i(null,o,g,a):S.apply(o,g)})}function ht(e){var t,n,r,s=e.length,o=i.relative[e[0].type],u=o||i.relative[" "],a=o?1:0,f=at(function(e){return e===t},u,!0),l=at(function(e){return T.call(t,e)>-1},u,!0),h=[function(e,n,r){return!o&&(r||n!==c)||((t=n).nodeType?f(e,n,r):l(e,n,r))}];for(;a<s;a++)if(n=i.relative[e[a].type])h=[at(ft(h),n)];else{n=i.filter[e[a].type].apply(null,e[a].matches);if(n[d]){r=++a;for(;r<s;r++)if(i.relative[e[r].type])break;return ct(a>1&&ft(h),a>1&&e.slice(0,a-1).join("").replace(j,"$1"),n,a<r&&ht(e.slice(a,r)),r<s&&ht(e=e.slice(r)),r<s&&e.join(""))}h.push(n)}return ft(h)}function pt(e,t){var r=t.length>0,s=e.length>0,o=function(u,a,f,l,h){var p,d,v,m=[],y=0,w="0",x=u&&[],T=h!=null,N=c,C=u||s&&i.find.TAG("*",h&&a.parentNode||a),k=b+=N==null?1:Math.E;T&&(c=a!==g&&a,n=o.el);for(;(p=C[w])!=null;w++){if(s&&p){for(d=0;v=e[d];d++)if(v(p,a,f)){l.push(p);break}T&&(b=k,n=++o.el)}r&&((p=!v&&p)&&y--,u&&x.push(p))}y+=w;if(r&&w!==y){for(d=0;v=t[d];d++)v(x,m,a,f);if(u){if(y>0)while(w--)!x[w]&&!m[w]&&(m[w]=E.call(l));m=lt(m)}S.apply(l,m),T&&!u&&m.length>0&&y+t.length>1&&nt.uniqueSort(l)}return T&&(b=k,c=N),x};return o.el=0,r?N(o):o}function dt(e,t,n){var r=0,i=t.length;for(;r<i;r++)nt(e,t[r],n);return n}function vt(e,t,n,r,s){var o,u,f,l,c,h=ut(e),p=h.length;if(!r&&h.length===1){u=h[0]=h[0].slice(0);if(u.length>2&&(f=u[0]).type==="ID"&&t.nodeType===9&&!s&&i.relative[u[1].type]){t=i.find.ID(f.matches[0].replace($,""),t,s)[0];if(!t)return n;e=e.slice(u.shift().length)}for(o=J.POS.test(e)?-1:u.length-1;o>=0;o--){f=u[o];if(i.relative[l=f.type])break;if(c=i.find[l])if(r=c(f.matches[0].replace($,""),z.test(u[0].type)&&t.parentNode||t,s)){u.splice(o,1),e=r.length&&u.join("");if(!e)return S.apply(n,x.call(r,0)),n;break}}}return a(e,h)(r,t,s,n,z.test(e)),n}function mt(){}var n,r,i,s,o,u,a,f,l,c,h=!0,p="undefined",d=("sizcache"+Math.random()).replace(".",""),m=String,g=e.document,y=g.documentElement,b=0,w=0,E=[].pop,S=[].push,x=[].slice,T=[].indexOf||function(e){var t=0,n=this.length;for(;t<n;t++)if(this[t]===e)return t;return-1},N=function(e,t){return e[d]=t==null||t,e},C=function(){var e={},t=[];return N(function(n,r){return t.push(n)>i.cacheLength&&delete e[t.shift()],e[n+" "]=r},e)},k=C(),L=C(),A=C(),O="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",_=M.replace("w","w#"),D="([*^$|!~]?=)",P="\\["+O+"*("+M+")"+O+"*(?:"+D+O+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+_+")|)|)"+O+"*\\]",H=":("+M+")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:"+P+")|[^:]|\\\\.)*|.*))\\)|)",B=":(even|odd|eq|gt|lt|nth|first|last)(?:\\("+O+"*((?:-\\d)?\\d*)"+O+"*\\)|)(?=[^-]|$)",j=new RegExp("^"+O+"+|((?:^|[^\\\\])(?:\\\\.)*)"+O+"+$","g"),F=new RegExp("^"+O+"*,"+O+"*"),I=new RegExp("^"+O+"*([\\x20\\t\\r\\n\\f>+~])"+O+"*"),q=new RegExp(H),R=/^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,U=/^:not/,z=/[\x20\t\r\n\f]*[+~]/,W=/:not\($/,X=/h\d/i,V=/input|select|textarea|button/i,$=/\\(?!\\)/g,J={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),NAME:new RegExp("^\\[name=['\"]?("+M+")['\"]?\\]"),TAG:new RegExp("^("+M.replace("w","w*")+")"),ATTR:new RegExp("^"+P),PSEUDO:new RegExp("^"+H),POS:new RegExp(B,"i"),CHILD:new RegExp("^:(only|nth|first|last)-child(?:\\("+O+"*(even|odd|(([+-]|)(\\d*)n|)"+O+"*(?:([+-]|)"+O+"*(\\d+)|))"+O+"*\\)|)","i"),needsContext:new RegExp("^"+O+"*[>+~]|"+B,"i")},K=function(e){var t=g.createElement("div");try{return e(t)}catch(n){return!1}finally{t=null}},Q=K(function(e){return e.appendChild(g.createComment("")),!e.getElementsByTagName("*").length}),G=K(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==p&&e.firstChild.getAttribute("href")==="#"}),Y=K(function(e){e.innerHTML="<select></select>";var t=typeof e.lastChild.getAttribute("multiple");return t!=="boolean"&&t!=="string"}),Z=K(function(e){return e.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",!e.getElementsByClassName||!e.getElementsByClassName("e").length?!1:(e.lastChild.className="e",e.getElementsByClassName("e").length===2)}),et=K(function(e){e.id=d+0,e.innerHTML="<a name='"+d+"'></a><div name='"+d+"'></div>",y.insertBefore(e,y.firstChild);var t=g.getElementsByName&&g.getElementsByName(d).length===2+g.getElementsByName(d+0).length;return r=!g.getElementById(d),y.removeChild(e),t});try{x.call(y.childNodes,0)[0].nodeType}catch(tt){x=function(e){var t,n=[];for(;t=this[e];e++)n.push(t);return n}}nt.matches=function(e,t){return nt(e,null,null,t)},nt.matchesSelector=function(e,t){return nt(t,null,null,[e]).length>0},s=nt.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(i===1||i===9||i===11){if(typeof e.textContent=="string")return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=s(e)}else if(i===3||i===4)return e.nodeValue}else for(;t=e[r];r++)n+=s(t);return n},o=nt.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?t.nodeName!=="HTML":!1},u=nt.contains=y.contains?function(e,t){var n=e.nodeType===9?e.documentElement:e,r=t&&t.parentNode;return e===r||!!(r&&r.nodeType===1&&n.contains&&n.contains(r))}:y.compareDocumentPosition?function(e,t){return t&&!!(e.compareDocumentPosition(t)&16)}:function(e,t){while(t=t.parentNode)if(t===e)return!0;return!1},nt.attr=function(e,t){var n,r=o(e);return r||(t=t.toLowerCase()),(n=i.attrHandle[t])?n(e):r||Y?e.getAttribute(t):(n=e.getAttributeNode(t),n?typeof e[t]=="boolean"?e[t]?t:null:n.specified?n.value:null:null)},i=nt.selectors={cacheLength:50,createPseudo:N,match:J,attrHandle:G?{}:{href:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},find:{ID:r?function(e,t,n){if(typeof t.getElementById!==p&&!n){var r=t.getElementById(e);return r&&r.parentNode?[r]:[]}}:function(e,n,r){if(typeof n.getElementById!==p&&!r){var i=n.getElementById(e);return i?i.id===e||typeof i.getAttributeNode!==p&&i.getAttributeNode("id").value===e?[i]:t:[]}},TAG:Q?function(e,t){if(typeof t.getElementsByTagName!==p)return t.getElementsByTagName(e)}:function(e,t){var n=t.getElementsByTagName(e);if(e==="*"){var r,i=[],s=0;for(;r=n[s];s++)r.nodeType===1&&i.push(r);return i}return n},NAME:et&&function(e,t){if(typeof t.getElementsByName!==p)return t.getElementsByName(name)},CLASS:Z&&function(e,t,n){if(typeof t.getElementsByClassName!==p&&!n)return t.getElementsByClassName(e)}},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace($,""),e[3]=(e[4]||e[5]||"").replace($,""),e[2]==="~="&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),e[1]==="nth"?(e[2]||nt.error(e[0]),e[3]=+(e[3]?e[4]+(e[5]||1):2*(e[2]==="even"||e[2]==="odd")),e[4]=+(e[6]+e[7]||e[2]==="odd")):e[2]&&nt.error(e[0]),e},PSEUDO:function(e){var t,n;if(J.CHILD.test(e[0]))return null;if(e[3])e[2]=e[3];else if(t=e[4])q.test(t)&&(n=ut(t,!0))&&(n=t.indexOf(")",t.length-n)-t.length)&&(t=t.slice(0,n),e[0]=e[0].slice(0,n)),e[2]=t;return e.slice(0,3)}},filter:{ID:r?function(e){return e=e.replace($,""),function(t){return t.getAttribute("id")===e}}:function(e){return e=e.replace($,""),function(t){var n=typeof t.getAttributeNode!==p&&t.getAttributeNode("id");return n&&n.value===e}},TAG:function(e){return e==="*"?function(){return!0}:(e=e.replace($,"").toLowerCase(),function(t){return t.nodeName&&t.nodeName.toLowerCase()===e})},CLASS:function(e){var t=k[d][e+" "];return t||(t=new RegExp("(^|"+O+")"+e+"("+O+"|$)"))&&k(e,function(e){return t.test(e.className||typeof e.getAttribute!==p&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r,i){var s=nt.attr(r,e);return s==null?t==="!=":t?(s+="",t==="="?s===n:t==="!="?s!==n:t==="^="?n&&s.indexOf(n)===0:t==="*="?n&&s.indexOf(n)>-1:t==="$="?n&&s.substr(s.length-n.length)===n:t==="~="?(" "+s+" ").indexOf(n)>-1:t==="|="?s===n||s.substr(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r){return e==="nth"?function(e){var t,i,s=e.parentNode;if(n===1&&r===0)return!0;if(s){i=0;for(t=s.firstChild;t;t=t.nextSibling)if(t.nodeType===1){i++;if(e===t)break}}return i-=r,i===n||i%n===0&&i/n>=0}:function(t){var n=t;switch(e){case"only":case"first":while(n=n.previousSibling)if(n.nodeType===1)return!1;if(e==="first")return!0;n=t;case"last":while(n=n.nextSibling)if(n.nodeType===1)return!1;return!0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||nt.error("unsupported pseudo: "+e);return r[d]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?N(function(e,n){var i,s=r(e,t),o=s.length;while(o--)i=T.call(e,s[o]),e[i]=!(n[i]=s[o])}):function(e){return r(e,0,n)}):r}},pseudos:{not:N(function(e){var t=[],n=[],r=a(e.replace(j,"$1"));return r[d]?N(function(e,t,n,i){var s,o=r(e,null,i,[]),u=e.length;while(u--)if(s=o[u])e[u]=!(t[u]=s)}):function(e,i,s){return t[0]=e,r(t,null,s,n),!n.pop()}}),has:N(function(e){return function(t){return nt(e,t).length>0}}),contains:N(function(e){return function(t){return(t.textContent||t.innerText||s(t)).indexOf(e)>-1}}),enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return t==="input"&&!!e.checked||t==="option"&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},parent:function(e){return!i.pseudos.empty(e)},empty:function(e){var t;e=e.firstChild;while(e){if(e.nodeName>"@"||(t=e.nodeType)===3||t===4)return!1;e=e.nextSibling}return!0},header:function(e){return X.test(e.nodeName)},text:function(e){var t,n;return e.nodeName.toLowerCase()==="input"&&(t=e.type)==="text"&&((n=e.getAttribute("type"))==null||n.toLowerCase()===t)},radio:rt("radio"),checkbox:rt("checkbox"),file:rt("file"),password:rt("password"),image:rt("image"),submit:it("submit"),reset:it("reset"),button:function(e){var t=e.nodeName.toLowerCase();return t==="input"&&e.type==="button"||t==="button"},input:function(e){return V.test(e.nodeName)},focus:function(e){var t=e.ownerDocument;return e===t.activeElement&&(!t.hasFocus||t.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},active:function(e){return e===e.ownerDocument.activeElement},first:st(function(){return[0]}),last:st(function(e,t){return[t-1]}),eq:st(function(e,t,n){return[n<0?n+t:n]}),even:st(function(e,t){for(var n=0;n<t;n+=2)e.push(n);return e}),odd:st(function(e,t){for(var n=1;n<t;n+=2)e.push(n);return e}),lt:st(function(e,t,n){for(var r=n<0?n+t:n;--r>=0;)e.push(r);return e}),gt:st(function(e,t,n){for(var r=n<0?n+t:n;++r<t;)e.push(r);return e})}},f=y.compareDocumentPosition?function(e,t){return e===t?(l=!0,0):(!e.compareDocumentPosition||!t.compareDocumentPosition?e.compareDocumentPosition:e.compareDocumentPosition(t)&4)?-1:1}:function(e,t){if(e===t)return l=!0,0;if(e.sourceIndex&&t.sourceIndex)return e.sourceIndex-t.sourceIndex;var n,r,i=[],s=[],o=e.parentNode,u=t.parentNode,a=o;if(o===u)return ot(e,t);if(!o)return-1;if(!u)return 1;while(a)i.unshift(a),a=a.parentNode;a=u;while(a)s.unshift(a),a=a.parentNode;n=i.length,r=s.length;for(var f=0;f<n&&f<r;f++)if(i[f]!==s[f])return ot(i[f],s[f]);return f===n?ot(e,s[f],-1):ot(i[f],t,1)},[0,0].sort(f),h=!l,nt.uniqueSort=function(e){var t,n=[],r=1,i=0;l=h,e.sort(f);if(l){for(;t=e[r];r++)t===e[r-1]&&(i=n.push(r));while(i--)e.splice(n[i],1)}return e},nt.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},a=nt.compile=function(e,t){var n,r=[],i=[],s=A[d][e+" "];if(!s){t||(t=ut(e)),n=t.length;while(n--)s=ht(t[n]),s[d]?r.push(s):i.push(s);s=A(e,pt(i,r))}return s},g.querySelectorAll&&function(){var e,t=vt,n=/'|\\/g,r=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,i=[":focus"],s=[":active"],u=y.matchesSelector||y.mozMatchesSelector||y.webkitMatchesSelector||y.oMatchesSelector||y.msMatchesSelector;K(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||i.push("\\["+O+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||i.push(":checked")}),K(function(e){e.innerHTML="<p test=''></p>",e.querySelectorAll("[test^='']").length&&i.push("[*^$]="+O+"*(?:\"\"|'')"),e.innerHTML="<input type='hidden'/>",e.querySelectorAll(":enabled").length||i.push(":enabled",":disabled")}),i=new RegExp(i.join("|")),vt=function(e,r,s,o,u){if(!o&&!u&&!i.test(e)){var a,f,l=!0,c=d,h=r,p=r.nodeType===9&&e;if(r.nodeType===1&&r.nodeName.toLowerCase()!=="object"){a=ut(e),(l=r.getAttribute("id"))?c=l.replace(n,"\\$&"):r.setAttribute("id",c),c="[id='"+c+"'] ",f=a.length;while(f--)a[f]=c+a[f].join("");h=z.test(e)&&r.parentNode||r,p=a.join(",")}if(p)try{return S.apply(s,x.call(h.querySelectorAll(p),0)),s}catch(v){}finally{l||r.removeAttribute("id")}}return t(e,r,s,o,u)},u&&(K(function(t){e=u.call(t,"div");try{u.call(t,"[test!='']:sizzle"),s.push("!=",H)}catch(n){}}),s=new RegExp(s.join("|")),nt.matchesSelector=function(t,n){n=n.replace(r,"='$1']");if(!o(t)&&!s.test(n)&&!i.test(n))try{var a=u.call(t,n);if(a||e||t.document&&t.document.nodeType!==11)return a}catch(f){}return nt(n,null,null,[t]).length>0})}(),i.pseudos.nth=i.pseudos.eq,i.filters=mt.prototype=i.pseudos,i.setFilters=new mt,nt.attr=v.attr,v.find=nt,v.expr=nt.selectors,v.expr[":"]=v.expr.pseudos,v.unique=nt.uniqueSort,v.text=nt.getText,v.isXMLDoc=nt.isXML,v.contains=nt.contains}(e);var nt=/Until$/,rt=/^(?:parents|prev(?:Until|All))/,it=/^.[^:#\[\.,]*$/,st=v.expr.match.needsContext,ot={children:!0,contents:!0,next:!0,prev:!0};v.fn.extend({find:function(e){var t,n,r,i,s,o,u=this;if(typeof e!="string")return v(e).filter(function(){for(t=0,n=u.length;t<n;t++)if(v.contains(u[t],this))return!0});o=this.pushStack("","find",e);for(t=0,n=this.length;t<n;t++){r=o.length,v.find(e,this[t],o);if(t>0)for(i=r;i<o.length;i++)for(s=0;s<r;s++)if(o[s]===o[i]){o.splice(i--,1);break}}return o},has:function(e){var t,n=v(e,this),r=n.length;return this.filter(function(){for(t=0;t<r;t++)if(v.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e,!1),"not",e)},filter:function(e){return this.pushStack(ft(this,e,!0),"filter",e)},is:function(e){return!!e&&(typeof e=="string"?st.test(e)?v(e,this.context).index(this[0])>=0:v.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,s=[],o=st.test(e)||typeof e!="string"?v(e,t||this.context):0;for(;r<i;r++){n=this[r];while(n&&n.ownerDocument&&n!==t&&n.nodeType!==11){if(o?o.index(n)>-1:v.find.matchesSelector(n,e)){s.push(n);break}n=n.parentNode}}return s=s.length>1?v.unique(s):s,this.pushStack(s,"closest",e)},index:function(e){return e?typeof e=="string"?v.inArray(this[0],v(e)):v.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.prevAll().length:-1},add:function(e,t){var n=typeof e=="string"?v(e,t):v.makeArray(e&&e.nodeType?[e]:e),r=v.merge(this.get(),n);return this.pushStack(ut(n[0])||ut(r[0])?r:v.unique(r))},addBack:function(e){return this.add(e==null?this.prevObject:this.prevObject.filter(e))}}),v.fn.andSelf=v.fn.addBack,v.each({parent:function(e){var t=e.parentNode;return t&&t.nodeType!==11?t:null},parents:function(e){return v.dir(e,"parentNode")},parentsUntil:function(e,t,n){return v.dir(e,"parentNode",n)},next:function(e){return at(e,"nextSibling")},prev:function(e){return at(e,"previousSibling")},nextAll:function(e){return v.dir(e,"nextSibling")},prevAll:function(e){return v.dir(e,"previousSibling")},nextUntil:function(e,t,n){return v.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return v.dir(e,"previousSibling",n)},siblings:function(e){return v.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return v.sibling(e.firstChild)},contents:function(e){return v.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:v.merge([],e.childNodes)}},function(e,t){v.fn[e]=function(n,r){var i=v.map(this,t,n);return nt.test(e)||(r=n),r&&typeof r=="string"&&(i=v.filter(r,i)),i=this.length>1&&!ot[e]?v.unique(i):i,this.length>1&&rt.test(e)&&(i=i.reverse()),this.pushStack(i,e,l.call(arguments).join(","))}}),v.extend({filter:function(e,t,n){return n&&(e=":not("+e+")"),t.length===1?v.find.matchesSelector(t[0],e)?[t[0]]:[]:v.find.matches(e,t)},dir:function(e,n,r){var i=[],s=e[n];while(s&&s.nodeType!==9&&(r===t||s.nodeType!==1||!v(s).is(r)))s.nodeType===1&&i.push(s),s=s[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)e.nodeType===1&&e!==t&&n.push(e);return n}});var ct="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",ht=/ jQuery\d+="(?:null|\d+)"/g,pt=/^\s+/,dt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,vt=/<([\w:]+)/,mt=/<tbody/i,gt=/<|&#?\w+;/,yt=/<(?:script|style|link)/i,bt=/<(?:script|object|embed|option|style)/i,wt=new RegExp("<(?:"+ct+")[\\s/>]","i"),Et=/^(?:checkbox|radio)$/,St=/checked\s*(?:[^=]|=\s*.checked.)/i,xt=/\/(java|ecma)script/i,Tt=/^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,Nt={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},Ct=lt(i),kt=Ct.appendChild(i.createElement("div"));Nt.optgroup=Nt.option,Nt.tbody=Nt.tfoot=Nt.colgroup=Nt.caption=Nt.thead,Nt.th=Nt.td,v.support.htmlSerialize||(Nt._default=[1,"X<div>","</div>"]),v.fn.extend({text:function(e){return v.access(this,function(e){return e===t?v.text(this):this.empty().append((this[0]&&this[0].ownerDocument||i).createTextNode(e))},null,e,arguments.length)},wrapAll:function(e){if(v.isFunction(e))return this.each(function(t){v(this).wrapAll(e.call(this,t))});if(this[0]){var t=v(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&e.firstChild.nodeType===1)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return v.isFunction(e)?this.each(function(t){v(this).wrapInner(e.call(this,t))}):this.each(function(){var t=v(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=v.isFunction(e);return this.each(function(n){v(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){v.nodeName(this,"body")||v(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(e){(this.nodeType===1||this.nodeType===11)&&this.appendChild(e)})},prepend:function(){return this.domManip(arguments,!0,function(e){(this.nodeType===1||this.nodeType===11)&&this.insertBefore(e,this.firstChild)})},before:function(){if(!ut(this[0]))return this.domManip(arguments,!1,function(e){this.parentNode.insertBefore(e,this)});if(arguments.length){var e=v.clean(arguments);return this.pushStack(v.merge(e,this),"before",this.selector)}},after:function(){if(!ut(this[0]))return this.domManip(arguments,!1,function(e){this.parentNode.insertBefore(e,this.nextSibling)});if(arguments.length){var e=v.clean(arguments);return this.pushStack(v.merge(this,e),"after",this.selector)}},remove:function(e,t){var n,r=0;for(;(n=this[r])!=null;r++)if(!e||v.filter(e,[n]).length)!t&&n.nodeType===1&&(v.cleanData(n.getElementsByTagName("*")),v.cleanData([n])),n.parentNode&&n.parentNode.removeChild(n);return this},empty:function(){var e,t=0;for(;(e=this[t])!=null;t++){e.nodeType===1&&v.cleanData(e.getElementsByTagName("*"));while(e.firstChild)e.removeChild(e.firstChild)}return this},clone:function(e,t){return e=e==null?!1:e,t=t==null?e:t,this.map(function(){return v.clone(this,e,t)})},html:function(e){return v.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return n.nodeType===1?n.innerHTML.replace(ht,""):t;if(typeof e=="string"&&!yt.test(e)&&(v.support.htmlSerialize||!wt.test(e))&&(v.support.leadingWhitespace||!pt.test(e))&&!Nt[(vt.exec(e)||["",""])[1].toLowerCase()]){e=e.replace(dt,"<$1></$2>");try{for(;r<i;r++)n=this[r]||{},n.nodeType===1&&(v.cleanData(n.getElementsByTagName("*")),n.innerHTML=e);n=0}catch(s){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(e){return ut(this[0])?this.length?this.pushStack(v(v.isFunction(e)?e():e),"replaceWith",e):this:v.isFunction(e)?this.each(function(t){var n=v(this),r=n.html();n.replaceWith(e.call(this,t,r))}):(typeof e!="string"&&(e=v(e).detach()),this.each(function(){var t=this.nextSibling,n=this.parentNode;v(this).remove(),t?v(t).before(e):v(n).append(e)}))},detach:function(e){return this.remove(e,!0)},domManip:function(e,n,r){e=[].concat.apply([],e);var i,s,o,u,a=0,f=e[0],l=[],c=this.length;if(!v.support.checkClone&&c>1&&typeof f=="string"&&St.test(f))return this.each(function(){v(this).domManip(e,n,r)});if(v.isFunction(f))return this.each(function(i){var s=v(this);e[0]=f.call(this,i,n?s.html():t),s.domManip(e,n,r)});if(this[0]){i=v.buildFragment(e,this,l),o=i.fragment,s=o.firstChild,o.childNodes.length===1&&(o=s);if(s){n=n&&v.nodeName(s,"tr");for(u=i.cacheable||c-1;a<c;a++)r.call(n&&v.nodeName(this[a],"table")?Lt(this[a],"tbody"):this[a],a===u?o:v.clone(o,!0,!0))}o=s=null,l.length&&v.each(l,function(e,t){t.src?v.ajax?v.ajax({url:t.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):v.error("no ajax"):v.globalEval((t.text||t.textContent||t.innerHTML||"").replace(Tt,"")),t.parentNode&&t.parentNode.removeChild(t)})}return this}}),v.buildFragment=function(e,n,r){var s,o,u,a=e[0];return n=n||i,n=!n.nodeType&&n[0]||n,n=n.ownerDocument||n,e.length===1&&typeof a=="string"&&a.length<512&&n===i&&a.charAt(0)==="<"&&!bt.test(a)&&(v.support.checkClone||!St.test(a))&&(v.support.html5Clone||!wt.test(a))&&(o=!0,s=v.fragments[a],u=s!==t),s||(s=n.createDocumentFragment(),v.clean(e,n,s,r),o&&(v.fragments[a]=u&&s)),{fragment:s,cacheable:o}},v.fragments={},v.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){v.fn[e]=function(n){var r,i=0,s=[],o=v(n),u=o.length,a=this.length===1&&this[0].parentNode;if((a==null||a&&a.nodeType===11&&a.childNodes.length===1)&&u===1)return o[t](this[0]),this;for(;i<u;i++)r=(i>0?this.clone(!0):this).get(),v(o[i])[t](r),s=s.concat(r);return this.pushStack(s,e,o.selector)}}),v.extend({clone:function(e,t,n){var r,i,s,o;v.support.html5Clone||v.isXMLDoc(e)||!wt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(kt.innerHTML=e.outerHTML,kt.removeChild(o=kt.firstChild));if((!v.support.noCloneEvent||!v.support.noCloneChecked)&&(e.nodeType===1||e.nodeType===11)&&!v.isXMLDoc(e)){Ot(e,o),r=Mt(e),i=Mt(o);for(s=0;r[s];++s)i[s]&&Ot(r[s],i[s])}if(t){At(e,o);if(n){r=Mt(e),i=Mt(o);for(s=0;r[s];++s)At(r[s],i[s])}}return r=i=null,o},clean:function(e,t,n,r){var s,o,u,a,f,l,c,h,p,d,m,g,y=t===i&&Ct,b=[];if(!t||typeof t.createDocumentFragment=="undefined")t=i;for(s=0;(u=e[s])!=null;s++){typeof u=="number"&&(u+="");if(!u)continue;if(typeof u=="string")if(!gt.test(u))u=t.createTextNode(u);else{y=y||lt(t),c=t.createElement("div"),y.appendChild(c),u=u.replace(dt,"<$1></$2>"),a=(vt.exec(u)||["",""])[1].toLowerCase(),f=Nt[a]||Nt._default,l=f[0],c.innerHTML=f[1]+u+f[2];while(l--)c=c.lastChild;if(!v.support.tbody){h=mt.test(u),p=a==="table"&&!h?c.firstChild&&c.firstChild.childNodes:f[1]==="<table>"&&!h?c.childNodes:[];for(o=p.length-1;o>=0;--o)v.nodeName(p[o],"tbody")&&!p[o].childNodes.length&&p[o].parentNode.removeChild(p[o])}!v.support.leadingWhitespace&&pt.test(u)&&c.insertBefore(t.createTextNode(pt.exec(u)[0]),c.firstChild),u=c.childNodes,c.parentNode.removeChild(c)}u.nodeType?b.push(u):v.merge(b,u)}c&&(u=c=y=null);if(!v.support.appendChecked)for(s=0;(u=b[s])!=null;s++)v.nodeName(u,"input")?_t(u):typeof u.getElementsByTagName!="undefined"&&v.grep(u.getElementsByTagName("input"),_t);if(n){m=function(e){if(!e.type||xt.test(e.type))return r?r.push(e.parentNode?e.parentNode.removeChild(e):e):n.appendChild(e)};for(s=0;(u=b[s])!=null;s++)if(!v.nodeName(u,"script")||!m(u))n.appendChild(u),typeof u.getElementsByTagName!="undefined"&&(g=v.grep(v.merge([],u.getElementsByTagName("script")),m),b.splice.apply(b,[s+1,0].concat(g)),s+=g.length)}return b},cleanData:function(e,t){var n,r,i,s,o=0,u=v.expando,a=v.cache,f=v.support.deleteExpando,l=v.event.special;for(;(i=e[o])!=null;o++)if(t||v.acceptData(i)){r=i[u],n=r&&a[r];if(n){if(n.events)for(s in n.events)l[s]?v.event.remove(i,s):v.removeEvent(i,s,n.handle);a[r]&&(delete a[r],f?delete i[u]:i.removeAttribute?i.removeAttribute(u):i[u]=null,v.deletedIds.push(r))}}}}),function(){var e,t;v.uaMatch=function(e){e=e.toLowerCase();var t=/(chrome)[ \/]([\w.]+)/.exec(e)||/(webkit)[ \/]([\w.]+)/.exec(e)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(e)||/(msie) ([\w.]+)/.exec(e)||e.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(e)||[];return{browser:t[1]||"",version:t[2]||"0"}},e=v.uaMatch(o.userAgent),t={},e.browser&&(t[e.browser]=!0,t.version=e.version),t.chrome?t.webkit=!0:t.webkit&&(t.safari=!0),v.browser=t,v.sub=function(){function e(t,n){return new e.fn.init(t,n)}v.extend(!0,e,this),e.superclass=this,e.fn=e.prototype=this(),e.fn.constructor=e,e.sub=this.sub,e.fn.init=function(r,i){return i&&i instanceof v&&!(i instanceof e)&&(i=e(i)),v.fn.init.call(this,r,i,t)},e.fn.init.prototype=e.fn;var t=e(i);return e}}();var Dt,Pt,Ht,Bt=/alpha\([^)]*\)/i,jt=/opacity=([^)]*)/,Ft=/^(top|right|bottom|left)$/,It=/^(none|table(?!-c[ea]).+)/,qt=/^margin/,Rt=new RegExp("^("+m+")(.*)$","i"),Ut=new RegExp("^("+m+")(?!px)[a-z%]+$","i"),zt=new RegExp("^([-+])=("+m+")","i"),Wt={BODY:"block"},Xt={position:"absolute",visibility:"hidden",display:"block"},Vt={letterSpacing:0,fontWeight:400},$t=["Top","Right","Bottom","Left"],Jt=["Webkit","O","Moz","ms"],Kt=v.fn.toggle;v.fn.extend({css:function(e,n){return v.access(this,function(e,n,r){return r!==t?v.style(e,n,r):v.css(e,n)},e,n,arguments.length>1)},show:function(){return Yt(this,!0)},hide:function(){return Yt(this)},toggle:function(e,t){var n=typeof e=="boolean";return v.isFunction(e)&&v.isFunction(t)?Kt.apply(this,arguments):this.each(function(){(n?e:Gt(this))?v(this).show():v(this).hide()})}}),v.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Dt(e,"opacity");return n===""?"1":n}}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":v.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(!e||e.nodeType===3||e.nodeType===8||!e.style)return;var s,o,u,a=v.camelCase(n),f=e.style;n=v.cssProps[a]||(v.cssProps[a]=Qt(f,a)),u=v.cssHooks[n]||v.cssHooks[a];if(r===t)return u&&"get"in u&&(s=u.get(e,!1,i))!==t?s:f[n];o=typeof r,o==="string"&&(s=zt.exec(r))&&(r=(s[1]+1)*s[2]+parseFloat(v.css(e,n)),o="number");if(r==null||o==="number"&&isNaN(r))return;o==="number"&&!v.cssNumber[a]&&(r+="px");if(!u||!("set"in u)||(r=u.set(e,r,i))!==t)try{f[n]=r}catch(l){}},css:function(e,n,r,i){var s,o,u,a=v.camelCase(n);return n=v.cssProps[a]||(v.cssProps[a]=Qt(e.style,a)),u=v.cssHooks[n]||v.cssHooks[a],u&&"get"in u&&(s=u.get(e,!0,i)),s===t&&(s=Dt(e,n)),s==="normal"&&n in Vt&&(s=Vt[n]),r||i!==t?(o=parseFloat(s),r||v.isNumeric(o)?o||0:s):s},swap:function(e,t,n){var r,i,s={};for(i in t)s[i]=e.style[i],e.style[i]=t[i];r=n.call(e);for(i in t)e.style[i]=s[i];return r}}),e.getComputedStyle?Dt=function(t,n){var r,i,s,o,u=e.getComputedStyle(t,null),a=t.style;return u&&(r=u.getPropertyValue(n)||u[n],r===""&&!v.contains(t.ownerDocument,t)&&(r=v.style(t,n)),Ut.test(r)&&qt.test(n)&&(i=a.width,s=a.minWidth,o=a.maxWidth,a.minWidth=a.maxWidth=a.width=r,r=u.width,a.width=i,a.minWidth=s,a.maxWidth=o)),r}:i.documentElement.currentStyle&&(Dt=function(e,t){var n,r,i=e.currentStyle&&e.currentStyle[t],s=e.style;return i==null&&s&&s[t]&&(i=s[t]),Ut.test(i)&&!Ft.test(t)&&(n=s.left,r=e.runtimeStyle&&e.runtimeStyle.left,r&&(e.runtimeStyle.left=e.currentStyle.left),s.left=t==="fontSize"?"1em":i,i=s.pixelLeft+"px",s.left=n,r&&(e.runtimeStyle.left=r)),i===""?"auto":i}),v.each(["height","width"],function(e,t){v.cssHooks[t]={get:function(e,n,r){if(n)return e.offsetWidth===0&&It.test(Dt(e,"display"))?v.swap(e,Xt,function(){return tn(e,t,r)}):tn(e,t,r)},set:function(e,n,r){return Zt(e,n,r?en(e,t,r,v.support.boxSizing&&v.css(e,"boxSizing")==="border-box"):0)}}}),v.support.opacity||(v.cssHooks.opacity={get:function(e,t){return jt.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=v.isNumeric(t)?"alpha(opacity="+t*100+")":"",s=r&&r.filter||n.filter||"";n.zoom=1;if(t>=1&&v.trim(s.replace(Bt,""))===""&&n.removeAttribute){n.removeAttribute("filter");if(r&&!r.filter)return}n.filter=Bt.test(s)?s.replace(Bt,i):s+" "+i}}),v(function(){v.support.reliableMarginRight||(v.cssHooks.marginRight={get:function(e,t){return v.swap(e,{display:"inline-block"},function(){if(t)return Dt(e,"marginRight")})}}),!v.support.pixelPosition&&v.fn.position&&v.each(["top","left"],function(e,t){v.cssHooks[t]={get:function(e,n){if(n){var r=Dt(e,t);return Ut.test(r)?v(e).position()[t]+"px":r}}}})}),v.expr&&v.expr.filters&&(v.expr.filters.hidden=function(e){return e.offsetWidth===0&&e.offsetHeight===0||!v.support.reliableHiddenOffsets&&(e.style&&e.style.display||Dt(e,"display"))==="none"},v.expr.filters.visible=function(e){return!v.expr.filters.hidden(e)}),v.each({margin:"",padding:"",border:"Width"},function(e,t){v.cssHooks[e+t]={expand:function(n){var r,i=typeof n=="string"?n.split(" "):[n],s={};for(r=0;r<4;r++)s[e+$t[r]+t]=i[r]||i[r-2]||i[0];return s}},qt.test(e)||(v.cssHooks[e+t].set=Zt)});var rn=/%20/g,sn=/\[\]$/,on=/\r?\n/g,un=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,an=/^(?:select|textarea)/i;v.fn.extend({serialize:function(){return v.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?v.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||an.test(this.nodeName)||un.test(this.type))}).map(function(e,t){var n=v(this).val();return n==null?null:v.isArray(n)?v.map(n,function(e,n){return{name:t.name,value:e.replace(on,"\r\n")}}):{name:t.name,value:n.replace(on,"\r\n")}}).get()}}),v.param=function(e,n){var r,i=[],s=function(e,t){t=v.isFunction(t)?t():t==null?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};n===t&&(n=v.ajaxSettings&&v.ajaxSettings.traditional);if(v.isArray(e)||e.jquery&&!v.isPlainObject(e))v.each(e,function(){s(this.name,this.value)});else for(r in e)fn(r,e[r],n,s);return i.join("&").replace(rn,"+")};var ln,cn,hn=/#.*$/,pn=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,dn=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,vn=/^(?:GET|HEAD)$/,mn=/^\/\//,gn=/\?/,yn=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bn=/([?&])_=[^&]*/,wn=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,En=v.fn.load,Sn={},xn={},Tn=["*/"]+["*"];try{cn=s.href}catch(Nn){cn=i.createElement("a"),cn.href="",cn=cn.href}ln=wn.exec(cn.toLowerCase())||[],v.fn.load=function(e,n,r){if(typeof e!="string"&&En)return En.apply(this,arguments);if(!this.length)return this;var i,s,o,u=this,a=e.indexOf(" ");return a>=0&&(i=e.slice(a,e.length),e=e.slice(0,a)),v.isFunction(n)?(r=n,n=t):n&&typeof n=="object"&&(s="POST"),v.ajax({url:e,type:s,dataType:"html",data:n,complete:function(e,t){r&&u.each(r,o||[e.responseText,t,e])}}).done(function(e){o=arguments,u.html(i?v("<div>").append(e.replace(yn,"")).find(i):e)}),this},v.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(e,t){v.fn[t]=function(e){return this.on(t,e)}}),v.each(["get","post"],function(e,n){v[n]=function(e,r,i,s){return v.isFunction(r)&&(s=s||i,i=r,r=t),v.ajax({type:n,url:e,data:r,success:i,dataType:s})}}),v.extend({getScript:function(e,n){return v.get(e,t,n,"script")},getJSON:function(e,t,n){return v.get(e,t,n,"json")},ajaxSetup:function(e,t){return t?Ln(e,v.ajaxSettings):(t=e,e=v.ajaxSettings),Ln(e,t),e},ajaxSettings:{url:cn,isLocal:dn.test(ln[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":Tn},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":e.String,"text html":!0,"text json":v.parseJSON,"text xml":v.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:Cn(Sn),ajaxTransport:Cn(xn),ajax:function(e,n){function T(e,n,s,a){var l,y,b,w,S,T=n;if(E===2)return;E=2,u&&clearTimeout(u),o=t,i=a||"",x.readyState=e>0?4:0,s&&(w=An(c,x,s));if(e>=200&&e<300||e===304)c.ifModified&&(S=x.getResponseHeader("Last-Modified"),S&&(v.lastModified[r]=S),S=x.getResponseHeader("Etag"),S&&(v.etag[r]=S)),e===304?(T="notmodified",l=!0):(l=On(c,w),T=l.state,y=l.data,b=l.error,l=!b);else{b=T;if(!T||e)T="error",e<0&&(e=0)}x.status=e,x.statusText=(n||T)+"",l?d.resolveWith(h,[y,T,x]):d.rejectWith(h,[x,T,b]),x.statusCode(g),g=t,f&&p.trigger("ajax"+(l?"Success":"Error"),[x,c,l?y:b]),m.fireWith(h,[x,T]),f&&(p.trigger("ajaxComplete",[x,c]),--v.active||v.event.trigger("ajaxStop"))}typeof e=="object"&&(n=e,e=t),n=n||{};var r,i,s,o,u,a,f,l,c=v.ajaxSetup({},n),h=c.context||c,p=h!==c&&(h.nodeType||h instanceof v)?v(h):v.event,d=v.Deferred(),m=v.Callbacks("once memory"),g=c.statusCode||{},b={},w={},E=0,S="canceled",x={readyState:0,setRequestHeader:function(e,t){if(!E){var n=e.toLowerCase();e=w[n]=w[n]||e,b[e]=t}return this},getAllResponseHeaders:function(){return E===2?i:null},getResponseHeader:function(e){var n;if(E===2){if(!s){s={};while(n=pn.exec(i))s[n[1].toLowerCase()]=n[2]}n=s[e.toLowerCase()]}return n===t?null:n},overrideMimeType:function(e){return E||(c.mimeType=e),this},abort:function(e){return e=e||S,o&&o.abort(e),T(0,e),this}};d.promise(x),x.success=x.done,x.error=x.fail,x.complete=m.add,x.statusCode=function(e){if(e){var t;if(E<2)for(t in e)g[t]=[g[t],e[t]];else t=e[x.status],x.always(t)}return this},c.url=((e||c.url)+"").replace(hn,"").replace(mn,ln[1]+"//"),c.dataTypes=v.trim(c.dataType||"*").toLowerCase().split(y),c.crossDomain==null&&(a=wn.exec(c.url.toLowerCase()),c.crossDomain=!(!a||a[1]===ln[1]&&a[2]===ln[2]&&(a[3]||(a[1]==="http:"?80:443))==(ln[3]||(ln[1]==="http:"?80:443)))),c.data&&c.processData&&typeof c.data!="string"&&(c.data=v.param(c.data,c.traditional)),kn(Sn,c,n,x);if(E===2)return x;f=c.global,c.type=c.type.toUpperCase(),c.hasContent=!vn.test(c.type),f&&v.active++===0&&v.event.trigger("ajaxStart");if(!c.hasContent){c.data&&(c.url+=(gn.test(c.url)?"&":"?")+c.data,delete c.data),r=c.url;if(c.cache===!1){var N=v.now(),C=c.url.replace(bn,"$1_="+N);c.url=C+(C===c.url?(gn.test(c.url)?"&":"?")+"_="+N:"")}}(c.data&&c.hasContent&&c.contentType!==!1||n.contentType)&&x.setRequestHeader("Content-Type",c.contentType),c.ifModified&&(r=r||c.url,v.lastModified[r]&&x.setRequestHeader("If-Modified-Since",v.lastModified[r]),v.etag[r]&&x.setRequestHeader("If-None-Match",v.etag[r])),x.setRequestHeader("Accept",c.dataTypes[0]&&c.accepts[c.dataTypes[0]]?c.accepts[c.dataTypes[0]]+(c.dataTypes[0]!=="*"?", "+Tn+"; q=0.01":""):c.accepts["*"]);for(l in c.headers)x.setRequestHeader(l,c.headers[l]);if(!c.beforeSend||c.beforeSend.call(h,x,c)!==!1&&E!==2){S="abort";for(l in{success:1,error:1,complete:1})x[l](c[l]);o=kn(xn,c,n,x);if(!o)T(-1,"No Transport");else{x.readyState=1,f&&p.trigger("ajaxSend",[x,c]),c.async&&c.timeout>0&&(u=setTimeout(function(){x.abort("timeout")},c.timeout));try{E=1,o.send(b,T)}catch(k){if(!(E<2))throw k;T(-1,k)}}return x}return x.abort()},active:0,lastModified:{},etag:{}});var Mn=[],_n=/\?/,Dn=/(=)\?(?=&|$)|\?\?/,Pn=v.now();v.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Mn.pop()||v.expando+"_"+Pn++;return this[e]=!0,e}}),v.ajaxPrefilter("json jsonp",function(n,r,i){var s,o,u,a=n.data,f=n.url,l=n.jsonp!==!1,c=l&&Dn.test(f),h=l&&!c&&typeof a=="string"&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Dn.test(a);if(n.dataTypes[0]==="jsonp"||c||h)return s=n.jsonpCallback=v.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,o=e[s],c?n.url=f.replace(Dn,"$1"+s):h?n.data=a.replace(Dn,"$1"+s):l&&(n.url+=(_n.test(f)?"&":"?")+n.jsonp+"="+s),n.converters["script json"]=function(){return u||v.error(s+" was not called"),u[0]},n.dataTypes[0]="json",e[s]=function(){u=arguments},i.always(function(){e[s]=o,n[s]&&(n.jsonpCallback=r.jsonpCallback,Mn.push(s)),u&&v.isFunction(o)&&o(u[0]),u=o=t}),"script"}),v.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(e){return v.globalEval(e),e}}}),v.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),v.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=i.head||i.getElementsByTagName("head")[0]||i.documentElement;return{send:function(s,o){n=i.createElement("script"),n.async="async",e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,i){if(i||!n.readyState||/loaded|complete/.test(n.readyState))n.onload=n.onreadystatechange=null,r&&n.parentNode&&r.removeChild(n),n=t,i||o(200,"success")},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(0,1)}}}});var Hn,Bn=e.ActiveXObject?function(){for(var e in Hn)Hn[e](0,1)}:!1,jn=0;v.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&Fn()||In()}:Fn,function(e){v.extend(v.support,{ajax:!!e,cors:!!e&&"withCredentials"in e})}(v.ajaxSettings.xhr()),v.support.ajax&&v.ajaxTransport(function(n){if(!n.crossDomain||v.support.cors){var r;return{send:function(i,s){var o,u,a=n.xhr();n.username?a.open(n.type,n.url,n.async,n.username,n.password):a.open(n.type,n.url,n.async);if(n.xhrFields)for(u in n.xhrFields)a[u]=n.xhrFields[u];n.mimeType&&a.overrideMimeType&&a.overrideMimeType(n.mimeType),!n.crossDomain&&!i["X-Requested-With"]&&(i["X-Requested-With"]="XMLHttpRequest");try{for(u in i)a.setRequestHeader(u,i[u])}catch(f){}a.send(n.hasContent&&n.data||null),r=function(e,i){var u,f,l,c,h;try{if(r&&(i||a.readyState===4)){r=t,o&&(a.onreadystatechange=v.noop,Bn&&delete Hn[o]);if(i)a.readyState!==4&&a.abort();else{u=a.status,l=a.getAllResponseHeaders(),c={},h=a.responseXML,h&&h.documentElement&&(c.xml=h);try{c.text=a.responseText}catch(p){}try{f=a.statusText}catch(p){f=""}!u&&n.isLocal&&!n.crossDomain?u=c.text?200:404:u===1223&&(u=204)}}}catch(d){i||s(-1,d)}c&&s(u,f,c,l)},n.async?a.readyState===4?setTimeout(r,0):(o=++jn,Bn&&(Hn||(Hn={},v(e).unload(Bn)),Hn[o]=r),a.onreadystatechange=r):r()},abort:function(){r&&r(0,1)}}}});var qn,Rn,Un=/^(?:toggle|show|hide)$/,zn=new RegExp("^(?:([-+])=|)("+m+")([a-z%]*)$","i"),Wn=/queueHooks$/,Xn=[Gn],Vn={"*":[function(e,t){var n,r,i=this.createTween(e,t),s=zn.exec(t),o=i.cur(),u=+o||0,a=1,f=20;if(s){n=+s[2],r=s[3]||(v.cssNumber[e]?"":"px");if(r!=="px"&&u){u=v.css(i.elem,e,!0)||n||1;do a=a||".5",u/=a,v.style(i.elem,e,u+r);while(a!==(a=i.cur()/o)&&a!==1&&--f)}i.unit=r,i.start=u,i.end=s[1]?u+(s[1]+1)*n:n}return i}]};v.Animation=v.extend(Kn,{tweener:function(e,t){v.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;r<i;r++)n=e[r],Vn[n]=Vn[n]||[],Vn[n].unshift(t)},prefilter:function(e,t){t?Xn.unshift(e):Xn.push(e)}}),v.Tween=Yn,Yn.prototype={constructor:Yn,init:function(e,t,n,r,i,s){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=s||(v.cssNumber[n]?"":"px")},cur:function(){var e=Yn.propHooks[this.prop];return e&&e.get?e.get(this):Yn.propHooks._default.get(this)},run:function(e){var t,n=Yn.propHooks[this.prop];return this.options.duration?this.pos=t=v.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):this.pos=t=e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):Yn.propHooks._default.set(this),this}},Yn.prototype.init.prototype=Yn.prototype,Yn.propHooks={_default:{get:function(e){var t;return e.elem[e.prop]==null||!!e.elem.style&&e.elem.style[e.prop]!=null?(t=v.css(e.elem,e.prop,!1,""),!t||t==="auto"?0:t):e.elem[e.prop]},set:function(e){v.fx.step[e.prop]?v.fx.step[e.prop](e):e.elem.style&&(e.elem.style[v.cssProps[e.prop]]!=null||v.cssHooks[e.prop])?v.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},Yn.propHooks.scrollTop=Yn.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},v.each(["toggle","show","hide"],function(e,t){var n=v.fn[t];v.fn[t]=function(r,i,s){return r==null||typeof r=="boolean"||!e&&v.isFunction(r)&&v.isFunction(i)?n.apply(this,arguments):this.animate(Zn(t,!0),r,i,s)}}),v.fn.extend({fadeTo:function(e,t,n,r){return this.filter(Gt).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=v.isEmptyObject(e),s=v.speed(t,n,r),o=function(){var t=Kn(this,v.extend({},e),s);i&&t.stop(!0)};return i||s.queue===!1?this.each(o):this.queue(s.queue,o)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return typeof e!="string"&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=e!=null&&e+"queueHooks",s=v.timers,o=v._data(this);if(n)o[n]&&o[n].stop&&i(o[n]);else for(n in o)o[n]&&o[n].stop&&Wn.test(n)&&i(o[n]);for(n=s.length;n--;)s[n].elem===this&&(e==null||s[n].queue===e)&&(s[n].anim.stop(r),t=!1,s.splice(n,1));(t||!r)&&v.dequeue(this,e)})}}),v.each({slideDown:Zn("show"),slideUp:Zn("hide"),slideToggle:Zn("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){v.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),v.speed=function(e,t,n){var r=e&&typeof e=="object"?v.extend({},e):{complete:n||!n&&t||v.isFunction(e)&&e,duration:e,easing:n&&t||t&&!v.isFunction(t)&&t};r.duration=v.fx.off?0:typeof r.duration=="number"?r.duration:r.duration in v.fx.speeds?v.fx.speeds[r.duration]:v.fx.speeds._default;if(r.queue==null||r.queue===!0)r.queue="fx";return r.old=r.complete,r.complete=function(){v.isFunction(r.old)&&r.old.call(this),r.queue&&v.dequeue(this,r.queue)},r},v.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},v.timers=[],v.fx=Yn.prototype.init,v.fx.tick=function(){var e,n=v.timers,r=0;qn=v.now();for(;r<n.length;r++)e=n[r],!e()&&n[r]===e&&n.splice(r--,1);n.length||v.fx.stop(),qn=t},v.fx.timer=function(e){e()&&v.timers.push(e)&&!Rn&&(Rn=setInterval(v.fx.tick,v.fx.interval))},v.fx.interval=13,v.fx.stop=function(){clearInterval(Rn),Rn=null},v.fx.speeds={slow:600,fast:200,_default:400},v.fx.step={},v.expr&&v.expr.filters&&(v.expr.filters.animated=function(e){return v.grep(v.timers,function(t){return e===t.elem}).length});var er=/^(?:body|html)$/i;v.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){v.offset.setOffset(this,e,t)});var n,r,i,s,o,u,a,f={top:0,left:0},l=this[0],c=l&&l.ownerDocument;if(!c)return;return(r=c.body)===l?v.offset.bodyOffset(l):(n=c.documentElement,v.contains(n,l)?(typeof l.getBoundingClientRect!="undefined"&&(f=l.getBoundingClientRect()),i=tr(c),s=n.clientTop||r.clientTop||0,o=n.clientLeft||r.clientLeft||0,u=i.pageYOffset||n.scrollTop,a=i.pageXOffset||n.scrollLeft,{top:f.top+u-s,left:f.left+a-o}):f)},v.offset={bodyOffset:function(e){var t=e.offsetTop,n=e.offsetLeft;return v.support.doesNotIncludeMarginInBodyOffset&&(t+=parseFloat(v.css(e,"marginTop"))||0,n+=parseFloat(v.css(e,"marginLeft"))||0),{top:t,left:n}},setOffset:function(e,t,n){var r=v.css(e,"position");r==="static"&&(e.style.position="relative");var i=v(e),s=i.offset(),o=v.css(e,"top"),u=v.css(e,"left"),a=(r==="absolute"||r==="fixed")&&v.inArray("auto",[o,u])>-1,f={},l={},c,h;a?(l=i.position(),c=l.top,h=l.left):(c=parseFloat(o)||0,h=parseFloat(u)||0),v.isFunction(t)&&(t=t.call(e,n,s)),t.top!=null&&(f.top=t.top-s.top+c),t.left!=null&&(f.left=t.left-s.left+h),"using"in t?t.using.call(e,f):i.css(f)}},v.fn.extend({position:function(){if(!this[0])return;var e=this[0],t=this.offsetParent(),n=this.offset(),r=er.test(t[0].nodeName)?{top:0,left:0}:t.offset();return n.top-=parseFloat(v.css(e,"marginTop"))||0,n.left-=parseFloat(v.css(e,"marginLeft"))||0,r.top+=parseFloat(v.css(t[0],"borderTopWidth"))||0,r.left+=parseFloat(v.css(t[0],"borderLeftWidth"))||0,{top:n.top-r.top,left:n.left-r.left}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||i.body;while(e&&!er.test(e.nodeName)&&v.css(e,"position")==="static")e=e.offsetParent;return e||i.body})}}),v.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);v.fn[e]=function(i){return v.access(this,function(e,i,s){var o=tr(e);if(s===t)return o?n in o?o[n]:o.document.documentElement[i]:e[i];o?o.scrollTo(r?v(o).scrollLeft():s,r?s:v(o).scrollTop()):e[i]=s},e,i,arguments.length,null)}}),v.each({Height:"height",Width:"width"},function(e,n){v.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){v.fn[i]=function(i,s){var o=arguments.length&&(r||typeof i!="boolean"),u=r||(i===!0||s===!0?"margin":"border");return v.access(this,function(n,r,i){var s;return v.isWindow(n)?n.document.documentElement["client"+e]:n.nodeType===9?(s=n.documentElement,Math.max(n.body["scroll"+e],s["scroll"+e],n.body["offset"+e],s["offset"+e],s["client"+e])):i===t?v.css(n,r,i,u):v.style(n,r,i,u)},n,o?i:t,o,null)}})}),e.jQuery=e.$=v,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return v})})(window);
/*!
 * qTip2 - Pretty powerful tooltips - v2.0.1-25-
 * http://qtip2.com
 *
 * Copyright (c) 2013 Craig Michael Thompson
 * Released under the MIT, GPL licenses
 * http://jquery.org/license
 *
 * Date: Wed Feb 20 2013 11:04 GMT+0000
 * Plugins: svg ajax tips modal viewport imagemap ie6
 * Styles: basic css3
 */

/*jslint browser: true, onevar: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global window: false, jQuery: false, console: false, define: false */

/* Cache window, document, undefined */
(function( window, document, undefined ) {

// Uses AMD or browser globals to create a jQuery plugin.
(function( factory ) {
	"use strict";
	if(typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	}
	else if(jQuery && !jQuery.fn.qtip) {
		factory(jQuery);
	}
}
(function($) {
	/* This currently causes issues with Safari 6, so for it's disabled */
	//"use strict"; // (Dis)able ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/

	// Munge the primitives - Paul Irish tip
	var TRUE = true,
		FALSE = false,
		NULL = null,

		// Common variables
		X = 'x', Y = 'y',
		WIDTH = 'width',
		HEIGHT = 'height',

		// Positioning sides
		TOP = 'top',
		LEFT = 'left',
		BOTTOM = 'bottom',
		RIGHT = 'right',
		CENTER = 'center',

		// Position adjustment types
		FLIP = 'flip',
		FLIPINVERT = 'flipinvert',
		SHIFT = 'shift',

		// Used by image load detection (see core.js)
		BLANKIMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 

		// Shortcut vars
		QTIP, PLUGINS, MOUSE,
		NAMESPACE = 'qtip',
		HASATTR = 'data-hasqtip',
		usedIDs = {},
		widget = ['ui-widget', 'ui-tooltip'],
		selector = 'div.qtip.'+NAMESPACE,
		defaultClass = NAMESPACE + '-default',
		focusClass = NAMESPACE + '-focus',
		hoverClass = NAMESPACE + '-hover',
		replaceSuffix = '_replacedByqTip',
		oldtitle = 'oldtitle',
		trackingBound;

	// Store mouse coordinates
	function storeMouse(event)
	{
		MOUSE = {
			pageX: event.pageX,
			pageY: event.pageY,
			type: 'mousemove',
			scrollX: window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft,
			scrollY: window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop
		};
	}
// Option object sanitizer
function sanitizeOptions(opts)
{
	var invalid = function(a) { return a === NULL || 'object' !== typeof a; },
		invalidContent = function(c) { return !$.isFunction(c) && ((!c && !c.attr) || c.length < 1 || ('object' === typeof c && !c.jquery && !c.then)); };

	if(!opts || 'object' !== typeof opts) { return FALSE; }

	if(invalid(opts.metadata)) {
		opts.metadata = { type: opts.metadata };
	}

	if('content' in opts) {
		if(invalid(opts.content) || opts.content.jquery) {
			opts.content = { text: opts.content };
		}

		if(invalidContent(opts.content.text || FALSE)) {
			opts.content.text = FALSE;
		}

		if('title' in opts.content) {
			if(invalid(opts.content.title)) {
				opts.content.title = { text: opts.content.title };
			}

			if(invalidContent(opts.content.title.text || FALSE)) {
				opts.content.title.text = FALSE;
			}
		}
	}

	if('position' in opts && invalid(opts.position)) {
		opts.position = { my: opts.position, at: opts.position };
	}

	if('show' in opts && invalid(opts.show)) {
		opts.show = opts.show.jquery ? { target: opts.show } : 
			opts.show === TRUE ? { ready: TRUE } : { event: opts.show };
	}

	if('hide' in opts && invalid(opts.hide)) {
		opts.hide = opts.hide.jquery ? { target: opts.hide } : { event: opts.hide };
	}

	if('style' in opts && invalid(opts.style)) {
		opts.style = { classes: opts.style };
	}

	// Sanitize plugin options
	$.each(PLUGINS, function() {
		if(this.sanitize) { this.sanitize(opts); }
	});

	return opts;
}

/*
* Core plugin implementation
*/
function QTip(target, options, id, attr)
{
	// Declare this reference
	var self = this,
		docBody = document.body,
		tooltipID = NAMESPACE + '-' + id,
		isPositioning = 0,
		isDrawing = 0,
		tooltip = $(),
		namespace = '.qtip-' + id,
		disabledClass = 'qtip-disabled',
		elements, cache;

	// Setup class attributes
	self.id = id;
	self.rendered = FALSE;
	self.destroyed = FALSE;
	self.elements = elements = { target: target };
	self.timers = { img: {} };
	self.options = options;
	self.checks = {};
	self.plugins = {};
	self.cache = cache = {
		event: {},
		target: $(),
		disabled: FALSE,
		attr: attr,
		onTarget: FALSE,
		lastClass: ''
	};

	function convertNotation(notation)
	{
		var i = 0, obj, option = options,

		// Split notation into array
		levels = notation.split('.');

		// Loop through
		while( option = option[ levels[i++] ] ) {
			if(i < levels.length) { obj = option; }
		}

		return [obj || options, levels.pop()];
	}

	function createWidgetClass(cls)
	{
		return widget.concat('').join(cls ? '-'+cls+' ' : ' ');
	}

	function setWidget()
	{
		var on = options.style.widget,
			disabled = tooltip.hasClass(disabledClass);

		tooltip.removeClass(disabledClass);
		disabledClass = on ? 'ui-state-disabled' : 'qtip-disabled';
		tooltip.toggleClass(disabledClass, disabled);

		tooltip.toggleClass('ui-helper-reset '+createWidgetClass(), on).toggleClass(defaultClass, options.style.def && !on);
		
		if(elements.content) {
			elements.content.toggleClass( createWidgetClass('content'), on);
		}
		if(elements.titlebar) {
			elements.titlebar.toggleClass( createWidgetClass('header'), on);
		}
		if(elements.button) {
			elements.button.toggleClass(NAMESPACE+'-icon', !on);
		}
	}

	function removeTitle(reposition)
	{
		if(elements.title) {
			elements.titlebar.remove();
			elements.titlebar = elements.title = elements.button = NULL;

			// Reposition if enabled
			if(reposition !== FALSE) { self.reposition(); }
		}
	}

	function createButton()
	{
		var button = options.content.title.button,
			isString = typeof button === 'string',
			close = isString ? button : 'Close tooltip';

		if(elements.button) { elements.button.remove(); }

		// Use custom button if one was supplied by user, else use default
		if(button.jquery) {
			elements.button = button;
		}
		else {
			elements.button = $('<a />', {
				'class': 'qtip-close ' + (options.style.widget ? '' : NAMESPACE+'-icon'),
				'title': close,
				'aria-label': close
			})
			.prepend(
				$('<span />', {
					'class': 'ui-icon ui-icon-close',
					'html': '&times;'
				})
			);
		}

		// Create button and setup attributes
		elements.button.appendTo(elements.titlebar || tooltip)
			.attr('role', 'button')
			.click(function(event) {
				if(!tooltip.hasClass(disabledClass)) { self.hide(event); }
				return FALSE;
			});
	}

	function createTitle()
	{
		var id = tooltipID+'-title';

		// Destroy previous title element, if present
		if(elements.titlebar) { removeTitle(); }

		// Create title bar and title elements
		elements.titlebar = $('<div />', {
			'class': NAMESPACE + '-titlebar ' + (options.style.widget ? createWidgetClass('header') : '')
		})
		.append(
			elements.title = $('<div />', {
				'id': id,
				'class': NAMESPACE + '-title',
				'aria-atomic': TRUE
			})
		)
		.insertBefore(elements.content)

		// Button-specific events
		.delegate('.qtip-close', 'mousedown keydown mouseup keyup mouseout', function(event) {
			$(this).toggleClass('ui-state-active ui-state-focus', event.type.substr(-4) === 'down');
		})
		.delegate('.qtip-close', 'mouseover mouseout', function(event){
			$(this).toggleClass('ui-state-hover', event.type === 'mouseover');
		});

		// Create button if enabled
		if(options.content.title.button) { createButton(); }
	}

	function updateButton(button)
	{
		var elem = elements.button;

		// Make sure tooltip is rendered and if not, return
		if(!self.rendered) { return FALSE; }

		if(!button) {
			elem.remove();
		}
		else {
			createButton();
		}
	}

	function updateTitle(content, reposition)
	{
		var elem = elements.title;

		// Make sure tooltip is rendered and if not, return
		if(!self.rendered || !content) { return FALSE; }

		// Use function to parse content
		if($.isFunction(content)) {
			content = content.call(target, cache.event, self);
		}

		// Remove title if callback returns false or null/undefined (but not '')
		if(content === FALSE || (!content && content !== '')) { return removeTitle(FALSE); }

		// Append new content if its a DOM array and show it if hidden
		else if(content.jquery && content.length > 0) {
			elem.empty().append(content.css({ display: 'block' }));
		}

		// Content is a regular string, insert the new content
		else { elem.html(content); }

		// Reposition if rnedered
		if(reposition !== FALSE && self.rendered && tooltip[0].offsetWidth > 0) {
			self.reposition(cache.event);
		}
	}

	function deferredContent(deferred)
	{
		if(deferred && $.isFunction(deferred.done)) {
			deferred.done(function(c) {
				updateContent(c, null, FALSE);
			});
		}
	}

	function updateContent(content, reposition, checkDeferred)
	{
		var elem = elements.content;

		// Make sure tooltip is rendered and content is defined. If not return
		if(!self.rendered || !content) { return FALSE; }

		// Use function to parse content
		if($.isFunction(content)) {
			content = content.call(target, cache.event, self) || '';
		}

		// Handle deferred content
		if(checkDeferred !== FALSE) {
			deferredContent(options.content.deferred);
		}

		// Append new content if its a DOM array and show it if hidden
		if(content.jquery && content.length > 0) {
			elem.empty().append(content.css({ display: 'block' }));
		}

		// Content is a regular string, insert the new content
		else { elem.html(content); }

		/* 
		 * New images loaded detection method slimmed down from David DeSandro's plugin
		 *    GitHub: https://github.com/desandro/imagesloaded/
		 */
		function imagesLoaded(next) {
			var elem = $(this),
				images = elem.find('img').add( elem.filter('img') ),
				loaded = [];

			function imgLoaded( img ) {
				// don't proceed if BLANKIMG image, or image is already loaded
				if(img.src === BLANKIMG || $.inArray(img, loaded) !== -1) { return; }

				// store element in loaded images array
				loaded.push(img);

				// cache image and its state for future calls
				$.data(img, 'imagesLoaded', { src: img.src });

				// call doneLoading and clean listeners if all images are loaded
				if(images.length === loaded.length) {
					setTimeout(next);
					images.unbind('.imagesLoaded');
				}
			}

			// No images? Proceed with next
			if(!images.length) { return next(); }

			images.bind('load.imagesLoaded error.imagesLoaded', function() {
				imgLoaded(event.target);
			})
			.each(function(i, el) {
				var src = el.src, cached = $.data(el, 'imagesLoaded');

				/*
				 * Find out if this image has been already checked for status, and
				 * if it was and src has not changed, call imgLoaded on it. Also,
				 * if complete is true and browser supports natural sizes, try to 
				 * check for image status manually
				 */
				if((cached && cached.src === src) || (el.complete && el.naturalWidth)) {
					imgLoaded(el);
				}

				/*
				 * Cached images don't fire load sometimes, so we reset src, but only when
				 * dealing with IE, or image is complete (loaded) and failed manual check
				 * 
				 * Webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
				 */
				else if(el.readyState || el.complete) {
					el.src = BLANKIMG; el.src = src;
				}
			});
		}

		/*
		 * If we're still rendering... insert into 'fx' queue our image dimension
		 * checker which will halt the showing of the tooltip until image dimensions
		 * can be detected properly.
		 */
		if(self.rendered < 0) { tooltip.queue('fx', imagesLoaded); }

		// We're fully rendered, so reset isDrawing flag and proceed without queue delay
		else { isDrawing = 0; imagesLoaded.call(tooltip[0], $.noop); }

		return self;
	}

	function assignEvents()
	{
		var posOptions = options.position,
			targets = {
				show: options.show.target,
				hide: options.hide.target,
				viewport: $(posOptions.viewport),
				document: $(document),
				body: $(document.body),
				window: $(window)
			},
			events = {
				show: $.trim('' + options.show.event).split(' '),
				hide: $.trim('' + options.hide.event).split(' ')
			},
			IE6 = PLUGINS.ie === 6;

		// Define show event method
		function showMethod(event)
		{
			if(tooltip.hasClass(disabledClass)) { return FALSE; }

			// Clear hide timers
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Start show timer
			var callback = function(){ self.toggle(TRUE, event); };
			if(options.show.delay > 0) {
				self.timers.show = setTimeout(callback, options.show.delay);
			}
			else{ callback(); }
		}

		// Define hide method
		function hideMethod(event)
		{
			if(tooltip.hasClass(disabledClass) || isPositioning || isDrawing) { return FALSE; }

			// Check if new target was actually the tooltip element
			var relatedTarget = $(event.relatedTarget),
				ontoTooltip = relatedTarget.closest(selector)[0] === tooltip[0],
				ontoTarget = relatedTarget[0] === targets.show[0];

			// Clear timers and stop animation queue
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Prevent hiding if tooltip is fixed and event target is the tooltip. Or if mouse positioning is enabled and cursor momentarily overlaps
			if(this !== relatedTarget[0] && 
				(posOptions.target === 'mouse' && ontoTooltip) || 
				(options.hide.fixed && (
					(/mouse(out|leave|move)/).test(event.type) && (ontoTooltip || ontoTarget))
				)) {
				try { event.preventDefault(); event.stopImmediatePropagation(); } catch(e) {} return;
			}

			// If tooltip has displayed, start hide timer
			if(options.hide.delay > 0) {
				self.timers.hide = setTimeout(function(){ self.hide(event); }, options.hide.delay);
			}
			else{ self.hide(event); }
		}

		// Define inactive method
		function inactiveMethod(event)
		{
			if(tooltip.hasClass(disabledClass)) { return FALSE; }

			// Clear timer
			clearTimeout(self.timers.inactive);
			self.timers.inactive = setTimeout(function(){ self.hide(event); }, options.hide.inactive);
		}

		function repositionMethod(event) {
			if(self.rendered && tooltip[0].offsetWidth > 0) { self.reposition(event); }
		}

		// On mouseenter/mouseleave...
		tooltip.bind('mouseenter'+namespace+' mouseleave'+namespace, function(event) {
			var state = event.type === 'mouseenter';

			// Focus the tooltip on mouseenter (z-index stacking)
			if(state) { self.focus(event); }

			// Add hover class
			tooltip.toggleClass(hoverClass, state);
		});

		// If using mouseout/mouseleave as a hide event...
		if(/mouse(out|leave)/i.test(options.hide.event)) {
			// Hide tooltips when leaving current window/frame (but not select/option elements)
			if(options.hide.leave === 'window') {
				targets.document.bind('mouseout'+namespace+' blur'+namespace, function(event) {
					if(!/select|option/.test(event.target.nodeName) && !event.relatedTarget) {
						self.hide(event);
					}
				});
			}
		}

		// Enable hide.fixed
		if(options.hide.fixed) {
			// Add tooltip as a hide target
			targets.hide = targets.hide.add(tooltip);

			// Clear hide timer on tooltip hover to prevent it from closing
			tooltip.bind('mouseover'+namespace, function() {
				if(!tooltip.hasClass(disabledClass)) { clearTimeout(self.timers.hide); }
			});
		}

		/*
		 * Make sure hoverIntent functions properly by using mouseleave to clear show timer if
		 * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
		 */
		else if(/mouse(over|enter)/i.test(options.show.event)) {
			targets.hide.bind('mouseleave'+namespace, function(event) {
				clearTimeout(self.timers.show);
			});
		}

		// Hide tooltip on document mousedown if unfocus events are enabled
		if(('' + options.hide.event).indexOf('unfocus') > -1) {
			posOptions.container.closest('html').bind('mousedown'+namespace+' touchstart'+namespace, function(event) {
				var elem = $(event.target),
					enabled = self.rendered && !tooltip.hasClass(disabledClass) && tooltip[0].offsetWidth > 0,
					isAncestor = elem.parents(selector).filter(tooltip[0]).length > 0;

				if(elem[0] !== target[0] && elem[0] !== tooltip[0] && !isAncestor &&
					!target.has(elem[0]).length && enabled
				) {
					self.hide(event);
				}
			});
		}

		// Check if the tooltip hides when inactive
		if('number' === typeof options.hide.inactive) {
			// Bind inactive method to target as a custom event
			targets.show.bind('qtip-'+id+'-inactive', inactiveMethod);

			// Define events which reset the 'inactive' event handler
			$.each(QTIP.inactiveEvents, function(index, type){
				targets.hide.add(elements.tooltip).bind(type+namespace+'-inactive', inactiveMethod);
			});
		}

		// Apply hide events
		$.each(events.hide, function(index, type) {
			var showIndex = $.inArray(type, events.show),
					targetHide = $(targets.hide);

			// Both events and targets are identical, apply events using a toggle
			if((showIndex > -1 && targetHide.add(targets.show).length === targetHide.length) || type === 'unfocus')
			{
				targets.show.bind(type+namespace, function(event) {
					if(tooltip[0].offsetWidth > 0) { hideMethod(event); }
					else { showMethod(event); }
				});

				// Don't bind the event again
				delete events.show[ showIndex ];
			}

			// Events are not identical, bind normally
			else { targets.hide.bind(type+namespace, hideMethod); }
		});

		// Apply show events
		$.each(events.show, function(index, type) {
			targets.show.bind(type+namespace, showMethod);
		});

		// Check if the tooltip hides when mouse is moved a certain distance
		if('number' === typeof options.hide.distance) {
			// Bind mousemove to target to detect distance difference
			targets.show.add(tooltip).bind('mousemove'+namespace, function(event) {
				var origin = cache.origin || {},
					limit = options.hide.distance,
					abs = Math.abs;

				// Check if the movement has gone beyond the limit, and hide it if so
				if(abs(event.pageX - origin.pageX) >= limit || abs(event.pageY - origin.pageY) >= limit) {
					self.hide(event);
				}
			});
		}

		// Mouse positioning events
		if(posOptions.target === 'mouse') {
			// Cache mousemove coords on show targets
			targets.show.bind('mousemove'+namespace, storeMouse);

			// If mouse adjustment is on...
			if(posOptions.adjust.mouse) {
				// Apply a mouseleave event so we don't get problems with overlapping
				if(options.hide.event) {
					// Hide when we leave the tooltip and not onto the show target
					tooltip.bind('mouseleave'+namespace, function(event) {
						if((event.relatedTarget || event.target) !== targets.show[0]) { self.hide(event); }
					});

					// Track if we're on the target or not
					elements.target.bind('mouseenter'+namespace+' mouseleave'+namespace, function(event) {
						cache.onTarget = event.type === 'mouseenter';
					});
				}

				// Update tooltip position on mousemove
				targets.document.bind('mousemove'+namespace, function(event) {
					// Update the tooltip position only if the tooltip is visible and adjustment is enabled
					if(self.rendered && cache.onTarget && !tooltip.hasClass(disabledClass) && tooltip[0].offsetWidth > 0) {
						self.reposition(event || MOUSE);
					}
				});
			}
		}

		// Adjust positions of the tooltip on window resize if enabled
		if(posOptions.adjust.resize || targets.viewport.length) {
			($.event.special.resize ? targets.viewport : targets.window).bind('resize'+namespace, repositionMethod);
		}

		// Adjust tooltip position on scroll of the window or viewport element if present
		if(posOptions.adjust.scroll) {
			targets.window.add(posOptions.container).bind('scroll'+namespace, repositionMethod);
		}
	}

	function unassignEvents()
	{
		var targets = [
			options.show.target[0],
			options.hide.target[0],
			self.rendered && elements.tooltip[0],
			options.position.container[0],
			options.position.viewport[0],
			options.position.container.closest('html')[0], // unfocus
			window,
			document
		];

		// Check if tooltip is rendered
		if(self.rendered) {
			$([]).pushStack( $.grep(targets, function(i){ return typeof i === 'object'; }) ).unbind(namespace);
		}

		// Tooltip isn't yet rendered, remove render event
		else { options.show.target.unbind(namespace+'-create'); }
	}

	// Setup builtin .set() option checks
	self.checks.builtin = {
		// Core checks
		'^id$': function(obj, o, v) {
			var id = v === TRUE ? QTIP.nextid : v,
				tooltipID = NAMESPACE + '-' + id;

			if(id !== FALSE && id.length > 0 && !$('#'+tooltipID).length) {
				tooltip[0].id = tooltipID;
				elements.content[0].id = tooltipID + '-content';
				elements.title[0].id = tooltipID + '-title';
			}
		},

		// Content checks
		'^content.text$': function(obj, o, v) { updateContent(options.content.text); },
		'^content.deferred$': function(obj, o, v) { deferredContent(options.content.deferred); },
		'^content.title.text$': function(obj, o, v) {
			// Remove title if content is null
			if(!v) { return removeTitle(); }

			// If title isn't already created, create it now and update
			if(!elements.title && v) { createTitle(); }
			updateTitle(v);
		},
		'^content.title.button$': function(obj, o, v){ updateButton(v); },

		// Position checks
		'^position.(my|at)$': function(obj, o, v){
			// Parse new corner value into Corner objecct
			if('string' === typeof v) {
				obj[o] = new PLUGINS.Corner(v);
			}
		},
		'^position.container$': function(obj, o, v){
			if(self.rendered) { tooltip.appendTo(v); }
		},

		// Show checks
		'^show.ready$': function() {
			if(!self.rendered) { self.render(1); }
			else { self.toggle(TRUE); }
		},

		// Style checks
		'^style.classes$': function(obj, o, v) {
			tooltip.attr('class', NAMESPACE + ' qtip ' + v);
		},
		'^style.width|height': function(obj, o, v) {
			tooltip.css(o, v);
		},
		'^style.widget|content.title': setWidget,

		// Events check
		'^events.(render|show|move|hide|focus|blur)$': function(obj, o, v) {
			tooltip[($.isFunction(v) ? '' : 'un') + 'bind']('tooltip'+o, v);
		},

		// Properties which require event reassignment
		'^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)': function() {
			var posOptions = options.position;

			// Set tracking flag
			tooltip.attr('tracking', posOptions.target === 'mouse' && posOptions.adjust.mouse);

			// Reassign events
			unassignEvents(); assignEvents();
		}
	};

	$.extend(self, {
		/*
		 * Psuedo-private API methods
		 */
		_triggerEvent: function(type, args, event)
		{
			var callback = $.Event('tooltip'+type);
			callback.originalEvent = (event ? $.extend({}, event) : NULL) || cache.event || NULL;
			tooltip.trigger(callback, [self].concat(args || []));

			return !callback.isDefaultPrevented();
		},

		/*
		 * Public API methods
		 */
		render: function(show)
		{
			if(self.rendered) { return self; } // If tooltip has already been rendered, exit

			var text = options.content.text,
				title = options.content.title,
				posOptions = options.position;

			// Add ARIA attributes to target
			$.attr(target[0], 'aria-describedby', tooltipID);

			// Create tooltip element
			tooltip = elements.tooltip = $('<div/>', {
					'id': tooltipID,
					'class': [ NAMESPACE, defaultClass, options.style.classes, NAMESPACE + '-pos-' + options.position.my.abbrev() ].join(' '),
					'width': options.style.width || '',
					'height': options.style.height || '',
					'tracking': posOptions.target === 'mouse' && posOptions.adjust.mouse,

					/* ARIA specific attributes */
					'role': 'alert',
					'aria-live': 'polite',
					'aria-atomic': FALSE,
					'aria-describedby': tooltipID + '-content',
					'aria-hidden': TRUE
				})
				.toggleClass(disabledClass, cache.disabled)
				.data('qtip', self)
				.appendTo(options.position.container)
				.append(
					// Create content element
					elements.content = $('<div />', {
						'class': NAMESPACE + '-content',
						'id': tooltipID + '-content',
						'aria-atomic': TRUE
					})
				);

			// Set rendered flag and prevent redundant reposition calls for now
			self.rendered = -1;
			isPositioning = 1;

			// Create title...
			if(title.text) {
				createTitle();

				// Update title only if its not a callback (called in toggle if so)
				if(!$.isFunction(title.text)) { updateTitle(title.text, FALSE); }
			}

			// Create button
			else if(title.button) { createButton(); }

			// Set proper rendered flag and update content if not a callback function (called in toggle)
			if(!$.isFunction(text) || text.then) { updateContent(text, FALSE); }
			self.rendered = TRUE;

			// Setup widget classes
			setWidget();

			// Assign passed event callbacks (before plugins!)
			$.each(options.events, function(name, callback) {
				if($.isFunction(callback)) {
					tooltip.bind(name === 'toggle' ? 'tooltipshow tooltiphide' : 'tooltip'+name, callback);
				}
			});

			// Initialize 'render' plugins
			$.each(PLUGINS, function() {
				if(this.initialize === 'render') { this(self); }
			});

			// Assign events
			assignEvents();

			/* Queue this part of the render process in our fx queue so we can
			 * load images before the tooltip renders fully.
			 *
			 * See: updateContent method
			 */
			tooltip.queue('fx', function(next) {
				// tooltiprender event
				self._triggerEvent('render');

				// Reset flags
				isPositioning = 0;

				// Show tooltip if needed
				if(options.show.ready || show) {
					self.toggle(TRUE, cache.event, FALSE);
				}

				next(); // Move on to next method in queue
			});

			return self;
		},

		get: function(notation)
		{
			var result, o;

			switch(notation.toLowerCase())
			{
				case 'dimensions':
					result = {
						height: tooltip.outerHeight(FALSE),
						width: tooltip.outerWidth(FALSE)
					};
				break;

				case 'offset':
					result = PLUGINS.offset(tooltip, options.position.container);
				break;

				default:
					o = convertNotation(notation.toLowerCase());
					result = o[0][ o[1] ];
					result = result.precedance ? result.string() : result;
				break;
			}

			return result;
		},

		set: function(option, value)
		{
			var rmove = /^position\.(my|at|adjust|target|container)|style|content|show\.ready/i,
				rdraw = /^content\.(title|attr)|style/i,
				reposition = FALSE,
				checks = self.checks,
				name;

			function callback(notation, args) {
				var category, rule, match;

				for(category in checks) {
					for(rule in checks[category]) {
						if(match = (new RegExp(rule, 'i')).exec(notation)) {
							args.push(match);
							checks[category][rule].apply(self, args);
						}
					}
				}
			}

			// Convert singular option/value pair into object form
			if('string' === typeof option) {
				name = option; option = {}; option[name] = value;
			}
			else { option = $.extend(TRUE, {}, option); }

			// Set all of the defined options to their new values
			$.each(option, function(notation, value) {
				var obj = convertNotation( notation.toLowerCase() ), previous;

				// Set new obj value
				previous = obj[0][ obj[1] ];
				obj[0][ obj[1] ] = 'object' === typeof value && value.nodeType ? $(value) : value;

				// Set the new params for the callback
				option[notation] = [obj[0], obj[1], value, previous];

				// Also check if we need to reposition
				reposition = rmove.test(notation) || reposition;
			});

			// Re-sanitize options
			sanitizeOptions(options);

			/*
			 * Execute any valid callbacks for the set options
			 * Also set isPositioning/isDrawing so we don't get loads of redundant repositioning calls.
			 */
			isPositioning = 1; $.each(option, callback); isPositioning = 0;

			// Update position if needed
			if(self.rendered && tooltip[0].offsetWidth > 0 && reposition) {
				self.reposition( options.position.target === 'mouse' ? NULL : cache.event );
			}

			return self;
		},

		toggle: function(state, event)
		{
			// Try to prevent flickering when tooltip overlaps show element
			if(event) {
				if((/over|enter/).test(event.type) && (/out|leave/).test(cache.event.type) &&
					options.show.target.add(event.target).length === options.show.target.length &&
					tooltip.has(event.relatedTarget).length) {
					return self;
				}

				// Cache event
				cache.event = $.extend({}, event);
			}
	
			// Render the tooltip if showing and it isn't already
			if(!self.rendered) { return state ? self.render(1) : self; }

			var type = state ? 'show' : 'hide',
				opts = options[type],
				otherOpts = options[ !state ? 'show' : 'hide' ],
				posOptions = options.position,
				contentOptions = options.content,
				width = tooltip.css('width'),
				visible = tooltip[0].offsetWidth > 0,
				animate = state || opts.target.length === 1,
				sameTarget = !event || opts.target.length < 2 || cache.target[0] === event.target,
				showEvent, delay;

			// Detect state if valid one isn't provided
			if((typeof state).search('boolean|number')) { state = !visible; }

			// Return if element is already in correct state
			if(!tooltip.is(':animated') && visible === state && sameTarget) { return self; }

			// tooltipshow/tooltiphide events
			if(!self._triggerEvent(type, [90])) { return self; }

			// Set ARIA hidden status attribute
			$.attr(tooltip[0], 'aria-hidden', !!!state);

			// Execute state specific properties
			if(state) {
				// Store show origin coordinates
				cache.origin = $.extend({}, MOUSE);

				// Focus the tooltip
				self.focus(event);

				// Update tooltip content & title if it's a dynamic function
				if($.isFunction(contentOptions.text)) { updateContent(contentOptions.text, FALSE); }
				if($.isFunction(contentOptions.title.text)) { updateTitle(contentOptions.title.text, FALSE); }

				// Cache mousemove events for positioning purposes (if not already tracking)
				if(!trackingBound && posOptions.target === 'mouse' && posOptions.adjust.mouse) {
					$(document).bind('mousemove.qtip', storeMouse);
					trackingBound = TRUE;
				}

				// Update the tooltip position (set width first to prevent viewport/max-width issues)
				if(!width) { tooltip.css('width', tooltip.outerWidth()); }
				self.reposition(event, arguments[2]);
				if(!width) { tooltip.css('width', ''); }

				// Hide other tooltips if tooltip is solo
				if(!!opts.solo) {
					(typeof opts.solo === 'string' ? $(opts.solo) : $(selector, opts.solo))
						.not(tooltip).not(opts.target).qtip('hide', $.Event('tooltipsolo'));
				}
			}
			else {
				// Clear show timer if we're hiding
				clearTimeout(self.timers.show);

				// Remove cached origin on hide
				delete cache.origin;

				// Remove mouse tracking event if not needed (all tracking qTips are hidden)
				if(trackingBound && !$(selector+'[tracking="true"]:visible', opts.solo).not(tooltip).length) {
					$(document).unbind('mousemove.qtip');
					trackingBound = FALSE;
				}

				// Blur the tooltip
				self.blur(event);
			}

			// Define post-animation, state specific properties
			function after() {
				if(state) {
					// Prevent antialias from disappearing in IE by removing filter
					if(PLUGINS.ie) { tooltip[0].style.removeAttribute('filter'); }

					// Remove overflow setting to prevent tip bugs
					tooltip.css('overflow', '');

					// Autofocus elements if enabled
					if('string' === typeof opts.autofocus) {
						$(opts.autofocus, tooltip).focus();
					}

					// If set, hide tooltip when inactive for delay period
					opts.target.trigger('qtip-'+id+'-inactive');
				}
				else {
					// Reset CSS states
					tooltip.css({
						display: '',
						visibility: '',
						opacity: '',
						left: '',
						top: ''
					});
				}

				// tooltipvisible/tooltiphidden events
				self._triggerEvent(state ? 'visible' : 'hidden');
			}

			// If no effect type is supplied, use a simple toggle
			if(opts.effect === FALSE || animate === FALSE) {
				tooltip[ type ]();
				after.call(tooltip);
			}

			// Use custom function if provided
			else if($.isFunction(opts.effect)) {
				tooltip.stop(1, 1);
				opts.effect.call(tooltip, self);
				tooltip.queue('fx', function(n){ after(); n(); });
			}

			// Use basic fade function by default
			else { tooltip.fadeTo(90, state ? 1 : 0, after); }

			// If inactive hide method is set, active it
			if(state) { opts.target.trigger('qtip-'+id+'-inactive'); }

			return self;
		},

		show: function(event){ return self.toggle(TRUE, event); },

		hide: function(event){ return self.toggle(FALSE, event); },

		focus: function(event)
		{
			if(!self.rendered) { return self; }

			var qtips = $(selector),
				curIndex = parseInt(tooltip[0].style.zIndex, 10),
				newIndex = QTIP.zindex + qtips.length,
				cachedEvent = $.extend({}, event),
				focusedElem;

			// Only update the z-index if it has changed and tooltip is not already focused
			if(!tooltip.hasClass(focusClass))
			{
				// tooltipfocus event
				if(self._triggerEvent('focus', [newIndex], cachedEvent)) {
					// Only update z-index's if they've changed
					if(curIndex !== newIndex) {
						// Reduce our z-index's and keep them properly ordered
						qtips.each(function() {
							if(this.style.zIndex > curIndex) {
								this.style.zIndex = this.style.zIndex - 1;
							}
						});

						// Fire blur event for focused tooltip
						qtips.filter('.' + focusClass).qtip('blur', cachedEvent);
					}

					// Set the new z-index
					tooltip.addClass(focusClass)[0].style.zIndex = newIndex;
				}
			}

			return self;
		},

		blur: function(event) {
			// Set focused status to FALSE
			tooltip.removeClass(focusClass);

			// tooltipblur event
			self._triggerEvent('blur', [tooltip.css('zIndex')], event);

			return self;
		},

		reposition: function(event, effect)
		{
			if(!self.rendered || isPositioning) { return self; }

			// Set positioning flag
			isPositioning = 1;

			var target = options.position.target,
				posOptions = options.position,
				my = posOptions.my,
				at = posOptions.at,
				adjust = posOptions.adjust,
				method = adjust.method.split(' '),
				elemWidth = tooltip.outerWidth(FALSE),
				elemHeight = tooltip.outerHeight(FALSE),
				targetWidth = 0,
				targetHeight = 0,
				type = tooltip.css('position'),
				viewport = posOptions.viewport,
				position = { left: 0, top: 0 },
				container = posOptions.container,
				visible = tooltip[0].offsetWidth > 0,
				isScroll = event && event.type === 'scroll',
				win = $(window),
				adjusted, offset;

			// Check if absolute position was passed
			if($.isArray(target) && target.length === 2) {
				// Force left top and set position
				at = { x: LEFT, y: TOP };
				position = { left: target[0], top: target[1] };
			}

			// Check if mouse was the target
			else if(target === 'mouse' && ((event && event.pageX) || cache.event.pageX)) {
				// Force left top to allow flipping
				at = { x: LEFT, y: TOP };

				// Use cached event if one isn't available for positioning
				event = MOUSE && MOUSE.pageX && (adjust.mouse || !event || !event.pageX) ? { pageX: MOUSE.pageX, pageY: MOUSE.pageY } :
					(event && (event.type === 'resize' || event.type === 'scroll') ? cache.event :
					event && event.pageX && event.type === 'mousemove' ? event :
					(!adjust.mouse || options.show.distance) && cache.origin && cache.origin.pageX ? cache.origin :
					event) || event || cache.event || MOUSE || {};

				// Use event coordinates for position
				if(type !== 'static') { position = container.offset(); }
				position = { left: event.pageX - position.left, top: event.pageY - position.top };

				// Scroll events are a pain, some browsers
				if(adjust.mouse && isScroll) {
					position.left -= MOUSE.scrollX - win.scrollLeft();
					position.top -= MOUSE.scrollY - win.scrollTop();
				}
			}

			// Target wasn't mouse or absolute...
			else {
				// Check if event targetting is being used
				if(target === 'event' && event && event.target && event.type !== 'scroll' && event.type !== 'resize') {
					cache.target = $(event.target);
				}
				else if(target !== 'event'){
					cache.target = $(target.jquery ? target : elements.target);
				}
				target = cache.target;

				// Parse the target into a jQuery object and make sure there's an element present
				target = $(target).eq(0);
				if(target.length === 0) { return self; }

				// Check if window or document is the target
				else if(target[0] === document || target[0] === window) {
					targetWidth = PLUGINS.iOS ? window.innerWidth : target.width();
					targetHeight = PLUGINS.iOS ? window.innerHeight : target.height();

					if(target[0] === window) {
						position = {
							top: (viewport || target).scrollTop(),
							left: (viewport || target).scrollLeft()
						};
					}
				}

				// Use Imagemap/SVG plugins if needed
				else if(PLUGINS.imagemap && target.is('area')) {
					adjusted = PLUGINS.imagemap(self, target, at, PLUGINS.viewport ? method : FALSE);
				}
				else if(PLUGINS.svg && target[0].ownerSVGElement) {
					adjusted = PLUGINS.svg(self, target, at, PLUGINS.viewport ? method : FALSE);
				}

				else {
					targetWidth = target.outerWidth(FALSE);
					targetHeight = target.outerHeight(FALSE);

					position = PLUGINS.offset(target, container);
				}

				// Parse returned plugin values into proper variables
				if(adjusted) {
					targetWidth = adjusted.width;
					targetHeight = adjusted.height;
					offset = adjusted.offset;
					position = adjusted.position;
				}

				// Adjust for position.fixed tooltips (and also iOS scroll bug in v3.2-4.0 & v4.3-4.3.2)
				if((PLUGINS.iOS > 3.1 && PLUGINS.iOS < 4.1) || 
					(PLUGINS.iOS >= 4.3 && PLUGINS.iOS < 4.33) || 
					(!PLUGINS.iOS && type === 'fixed')
				){
					position.left -= win.scrollLeft();
					position.top -= win.scrollTop();
				}

				// Adjust position relative to target
				position.left += at.x === RIGHT ? targetWidth : at.x === CENTER ? targetWidth / 2 : 0;
				position.top += at.y === BOTTOM ? targetHeight : at.y === CENTER ? targetHeight / 2 : 0;
			}

			// Adjust position relative to tooltip
			position.left += adjust.x + (my.x === RIGHT ? -elemWidth : my.x === CENTER ? -elemWidth / 2 : 0);
			position.top += adjust.y + (my.y === BOTTOM ? -elemHeight : my.y === CENTER ? -elemHeight / 2 : 0);

			// Use viewport adjustment plugin if enabled
			if(PLUGINS.viewport) {
				position.adjusted = PLUGINS.viewport(
					self, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight
				);

				// Apply offsets supplied by positioning plugin (if used)
				if(offset && position.adjusted.left) { position.left += offset.left; }
				if(offset && position.adjusted.top) {  position.top += offset.top; }
			}

			// Viewport adjustment is disabled, set values to zero
			else { position.adjusted = { left: 0, top: 0 }; }

			// tooltipmove event
			if(!self._triggerEvent('move', [position, viewport.elem || viewport], event)) { return self; }
			delete position.adjusted;

			// If effect is disabled, target it mouse, no animation is defined or positioning gives NaN out, set CSS directly
			if(effect === FALSE || !visible || isNaN(position.left) || isNaN(position.top) || target === 'mouse' || !$.isFunction(posOptions.effect)) {
				tooltip.css(position);
			}

			// Use custom function if provided
			else if($.isFunction(posOptions.effect)) {
				posOptions.effect.call(tooltip, self, $.extend({}, position));
				tooltip.queue(function(next) {
					// Reset attributes to avoid cross-browser rendering bugs
					$(this).css({ opacity: '', height: '' });
					if(PLUGINS.ie) { this.style.removeAttribute('filter'); }

					next();
				});
			}

			// Set positioning flagwtf
			isPositioning = 0;

			return self;
		},

		disable: function(state)
		{
			if('boolean' !== typeof state) {
				state = !(tooltip.hasClass(disabledClass) || cache.disabled);
			}

			if(self.rendered) {
				tooltip.toggleClass(disabledClass, state);
				$.attr(tooltip[0], 'aria-disabled', state);
			}
			else {
				cache.disabled = !!state;
			}

			return self;
		},

		enable: function() { return self.disable(FALSE); },

		destroy: function(immediate)
		{
			// Set flag the signify destroy is taking place to plugins
			// and ensure it only gets destroyed once!
			if(self.destroyed) { return; }
			self.destroyed = !(self.rendered = FALSE);

			function process() {
				var t = target[0],
					title = $.attr(t, oldtitle),
					elemAPI = target.data('qtip');

				// Destroy tooltip and  any associated plugins if rendered
				if(self.rendered) {
					// Destroy all plugins
					$.each(self.plugins, function(name) {
						if(this.destroy) { this.destroy(); }
						delete self.plugins[name];
					});

					// Remove all descendants and tooltip element
					tooltip.stop(1,0).find('*').remove().end().remove();
				}

				// Clear timers and remove bound events
				clearTimeout(self.timers.show);
				clearTimeout(self.timers.hide);
				unassignEvents();

				// If the API if actually this qTip API...
				if(!elemAPI || self === elemAPI) {
					// Remove api object
					target.removeData('qtip').removeAttr(HASATTR);

					// Reset old title attribute if removed
					if(options.suppress && title) {
						target.attr('title', title);
						target.removeAttr(oldtitle);
					}

					// Remove ARIA attributes
					target.removeAttr('aria-describedby');
				}

				// Remove qTip events associated with this API
				target.unbind('.qtip-'+id);

				// Remove ID from used id objects, and delete object references
				// for better garbage collection and leak protection
				delete usedIDs[self.id];
				delete self.options; delete self.elements;
				delete self.cache; delete self.timers;
				delete self.checks;
			}

			// Destroy after hide if no immediate
			if(immediate === TRUE) { process(); }
			else {
				tooltip.bind('tooltiphidden', process);
				self.hide();
			}

			return target;
		}
	});
}

// Initialization method
function init(elem, id, opts)
{
	var obj, posOptions, attr, config, title,

	// Setup element references
	docBody = $(document.body),

	// Use document body instead of document element if needed
	newTarget = elem[0] === document ? docBody : elem,

	// Grab metadata from element if plugin is present
	metadata = (elem.metadata) ? elem.metadata(opts.metadata) : NULL,

	// If metadata type if HTML5, grab 'name' from the object instead, or use the regular data object otherwise
	metadata5 = opts.metadata.type === 'html5' && metadata ? metadata[opts.metadata.name] : NULL,

	// Grab data from metadata.name (or data-qtipopts as fallback) using .data() method,
	html5 = elem.data(opts.metadata.name || 'qtipopts');

	// If we don't get an object returned attempt to parse it manualyl without parseJSON
	try { html5 = typeof html5 === 'string' ? $.parseJSON(html5) : html5; } catch(e) {}

	// Merge in and sanitize metadata
	config = $.extend(TRUE, {}, QTIP.defaults, opts,
		typeof html5 === 'object' ? sanitizeOptions(html5) : NULL,
		sanitizeOptions(metadata5 || metadata));

	// Re-grab our positioning options now we've merged our metadata and set id to passed value
	posOptions = config.position;
	config.id = id;

	// Setup missing content if none is detected
	if('boolean' === typeof config.content.text) {
		attr = elem.attr(config.content.attr);

		// Grab from supplied attribute if available
		if(config.content.attr !== FALSE && attr) { config.content.text = attr; }

		// No valid content was found, abort render
		else { return FALSE; }
	}

	// Setup target options
	if(!posOptions.container.length) { posOptions.container = docBody; }
	if(posOptions.target === FALSE) { posOptions.target = newTarget; }
	if(config.show.target === FALSE) { config.show.target = newTarget; }
	if(config.show.solo === TRUE) { config.show.solo = posOptions.container.closest('body'); }
	if(config.hide.target === FALSE) { config.hide.target = newTarget; }
	if(config.position.viewport === TRUE) { config.position.viewport = posOptions.container; }

	// Ensure we only use a single container
	posOptions.container = posOptions.container.eq(0);

	// Convert position corner values into x and y strings
	posOptions.at = new PLUGINS.Corner(posOptions.at);
	posOptions.my = new PLUGINS.Corner(posOptions.my);

	// Destroy previous tooltip if overwrite is enabled, or skip element if not
	if(elem.data('qtip')) {
		if(config.overwrite) {
			elem.qtip('destroy');
		}
		else if(config.overwrite === FALSE) {
			return FALSE;
		}
	}

	// Add has-qtip attribute
	elem.attr(HASATTR, true);

	// Remove title attribute and store it if present
	if(config.suppress && (title = elem.attr('title'))) {
		// Final attr call fixes event delegatiom and IE default tooltip showing problem
		elem.removeAttr('title').attr(oldtitle, title).attr('title', '');
	}

	// Initialize the tooltip and add API reference
	obj = new QTip(elem, config, id, !!attr);
	elem.data('qtip', obj);

	// Catch remove/removeqtip events on target element to destroy redundant tooltip
	elem.one('remove.qtip-'+id+' removeqtip.qtip-'+id, function() { 
		var api; if((api = $(this).data('qtip'))) { api.destroy(); }
	});

	return obj;
}

// jQuery $.fn extension method
QTIP = $.fn.qtip = function(options, notation, newValue)
{
	var command = ('' + options).toLowerCase(), // Parse command
		returned = NULL,
		args = $.makeArray(arguments).slice(1),
		event = args[args.length - 1],
		opts = this[0] ? $.data(this[0], 'qtip') : NULL;

	// Check for API request
	if((!arguments.length && opts) || command === 'api') {
		return opts;
	}

	// Execute API command if present
	else if('string' === typeof options)
	{
		this.each(function()
		{
			var api = $.data(this, 'qtip');
			if(!api) { return TRUE; }

			// Cache the event if possible
			if(event && event.timeStamp) { api.cache.event = event; }

			// Check for specific API commands
			if((command === 'option' || command === 'options') && notation) {
				if($.isPlainObject(notation) || newValue !== undefined) {
					api.set(notation, newValue);
				}
				else {
					returned = api.get(notation);
					return FALSE;
				}
			}

			// Execute API command
			else if(api[command]) {
				api[command].apply(api[command], args);
			}
		});

		return returned !== NULL ? returned : this;
	}

	// No API commands. validate provided options and setup qTips
	else if('object' === typeof options || !arguments.length)
	{
		opts = sanitizeOptions($.extend(TRUE, {}, options));

		// Bind the qTips
		return QTIP.bind.call(this, opts, event);
	}
};

// $.fn.qtip Bind method
QTIP.bind = function(opts, event)
{
	return this.each(function(i) {
		var options, targets, events, namespace, api, id;

		// Find next available ID, or use custom ID if provided
		id = $.isArray(opts.id) ? opts.id[i] : opts.id;
		id = !id || id === FALSE || id.length < 1 || usedIDs[id] ? QTIP.nextid++ : (usedIDs[id] = id);

		// Setup events namespace
		namespace = '.qtip-'+id+'-create';

		// Initialize the qTip and re-grab newly sanitized options
		api = init($(this), id, opts);
		if(api === FALSE) { return TRUE; }
		options = api.options;

		// Initialize plugins
		$.each(PLUGINS, function() {
			if(this.initialize === 'initialize') { this(api); }
		});

		// Determine hide and show targets
		targets = { show: options.show.target, hide: options.hide.target };
		events = {
			show: $.trim('' + options.show.event).replace(/ /g, namespace+' ') + namespace,
			hide: $.trim('' + options.hide.event).replace(/ /g, namespace+' ') + namespace
		};

		/*
		 * Make sure hoverIntent functions properly by using mouseleave as a hide event if
		 * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
		 */
		if(/mouse(over|enter)/i.test(events.show) && !/mouse(out|leave)/i.test(events.hide)) {
			events.hide += ' mouseleave' + namespace;
		}

		/*
		 * Also make sure initial mouse targetting works correctly by caching mousemove coords
		 * on show targets before the tooltip has rendered.
		 *
		 * Also set onTarget when triggered to keep mouse tracking working
		 */
		targets.show.bind('mousemove'+namespace, function(event) {
			storeMouse(event);
			api.cache.onTarget = TRUE;
		});

		// Define hoverIntent function
		function hoverIntent(event) {
			function render() {
				// Cache mouse coords,render and render the tooltip
				api.render(typeof event === 'object' || options.show.ready);

				// Unbind show and hide events
				targets.show.add(targets.hide).unbind(namespace);
			}

			// Only continue if tooltip isn't disabled
			if(api.cache.disabled) { return FALSE; }

			// Cache the event data
			api.cache.event = $.extend({}, event);
			api.cache.target = event ? $(event.target) : [undefined];

			// Start the event sequence
			if(options.show.delay > 0) {
				clearTimeout(api.timers.show);
				api.timers.show = setTimeout(render, options.show.delay);
				if(events.show !== events.hide) {
					targets.hide.bind(events.hide, function() { clearTimeout(api.timers.show); });
				}
			}
			else { render(); }
		}

		// Bind show events to target
		targets.show.bind(events.show, hoverIntent);

		// Prerendering is enabled, create tooltip now
		if(options.show.ready || options.prerender) { hoverIntent(event); }
	});
};

// Setup base plugins
PLUGINS = QTIP.plugins = {
	// Corner object parser
	Corner: function(corner) {
		corner = ('' + corner).replace(/([A-Z])/, ' $1').replace(/middle/gi, CENTER).toLowerCase();
		this.x = (corner.match(/left|right/i) || corner.match(/center/) || ['inherit'])[0].toLowerCase();
		this.y = (corner.match(/top|bottom|center/i) || ['inherit'])[0].toLowerCase();

		var f = corner.charAt(0); this.precedance = (f === 't' || f === 'b' ? Y : X);

		this.string = function() { return this.precedance === Y ? this.y+this.x : this.x+this.y; };
		this.abbrev = function() {
			var x = this.x.substr(0,1), y = this.y.substr(0,1);
			return x === y ? x : this.precedance === Y ? y + x : x + y;
		};

		this.invertx = function(center) { this.x = this.x === LEFT ? RIGHT : this.x === RIGHT ? LEFT : center || this.x; };
		this.inverty = function(center) { this.y = this.y === TOP ? BOTTOM : this.y === BOTTOM ? TOP : center || this.y; };

		this.clone = function() {
			return {
				x: this.x, y: this.y, precedance: this.precedance,
				string: this.string, abbrev: this.abbrev, clone: this.clone,
				invertx: this.invertx, inverty: this.inverty
			};
		};
	},

	// Custom (more correct for qTip!) offset calculator
	offset: function(elem, container) {
		var pos = elem.offset(),
			docBody = elem.closest('body'),
			quirks = PLUGINS.ie && document.compatMode !== 'CSS1Compat',
			parent = container, scrolled,
			coffset, overflow;

		function scroll(e, i) {
			pos.left += i * e.scrollLeft();
			pos.top += i * e.scrollTop();
		}

		if(parent) {
			// Compensate for non-static containers offset
			do {
				if(parent.css('position') !== 'static') {
					coffset = parent.position();

					// Account for element positioning, borders and margins
					pos.left -= coffset.left + (parseInt(parent.css('borderLeftWidth'), 10) || 0) + (parseInt(parent.css('marginLeft'), 10) || 0);
					pos.top -= coffset.top + (parseInt(parent.css('borderTopWidth'), 10) || 0) + (parseInt(parent.css('marginTop'), 10) || 0);

					// If this is the first parent element with an overflow of "scroll" or "auto", store it
					if(!scrolled && (overflow = parent.css('overflow')) !== 'hidden' && overflow !== 'visible') { scrolled = parent; }
				}
			}
			while((parent = $(parent[0].offsetParent)).length);

			// Compensate for containers scroll if it also has an offsetParent (or in IE quirks mode)
			if(scrolled && scrolled[0] !== docBody[0] || quirks) {
				scroll( scrolled || docBody, 1 );
			}
		}

		return pos;
	},

	/*
	 * IE version detection
	 *
	 * Adapted from: http://ajaxian.com/archives/attack-of-the-ie-conditional-comment
	 * Credit to James Padolsey for the original implemntation!
	 */
	ie: (function(){
		var v = 3, div = document.createElement('div');
		while ((div.innerHTML = '<!--[if gt IE '+(++v)+']><i></i><![endif]-->')) {
			if(!div.getElementsByTagName('i')[0]) { break; }
		}
		return v > 4 ? v : FALSE;
	}()),
 
	/*
	 * iOS version detection
	 */
	iOS: parseFloat( 
		('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0,''])[1])
		.replace('undefined', '3_2').replace('_', '.').replace('_', '')
	) || FALSE,

	/*
	 * jQuery-specific $.fn overrides
	 */
	fn: {
		/* Allow other plugins to successfully retrieve the title of an element with a qTip applied */
		attr: function(attr, val) {
			if(this.length) {
				var self = this[0],
					title = 'title',
					api = $.data(self, 'qtip');

				if(attr === title && api && 'object' === typeof api && api.options.suppress) {
					if(arguments.length < 2) {
						return $.attr(self, oldtitle);
					}

					// If qTip is rendered and title was originally used as content, update it
					if(api && api.options.content.attr === title && api.cache.attr) {
						api.set('content.text', val);
					}

					// Use the regular attr method to set, then cache the result
					return this.attr(oldtitle, val);
				}
			}

			return $.fn['attr'+replaceSuffix].apply(this, arguments);
		},

		/* Allow clone to correctly retrieve cached title attributes */
		clone: function(keepData) {
			var titles = $([]), title = 'title',

			// Clone our element using the real clone method
			elems = $.fn['clone'+replaceSuffix].apply(this, arguments);

			// Grab all elements with an oldtitle set, and change it to regular title attribute, if keepData is false
			if(!keepData) {
				elems.filter('['+oldtitle+']').attr('title', function() {
					return $.attr(this, oldtitle);
				})
				.removeAttr(oldtitle);
			}

			return elems;
		}
	}
};

// Apply the fn overrides above
$.each(PLUGINS.fn, function(name, func) {
	if(!func || $.fn[name+replaceSuffix]) { return TRUE; }

	var old = $.fn[name+replaceSuffix] = $.fn[name];
	$.fn[name] = function() {
		return func.apply(this, arguments) || old.apply(this, arguments);
	};
});

/* Fire off 'removeqtip' handler in $.cleanData if jQuery UI not present (it already does similar).
 * This snippet is taken directly from jQuery UI source code found here:
 *     http://code.jquery.com/ui/jquery-ui-git.js
 */
if(!$.ui) {
	$['cleanData'+replaceSuffix] = $.cleanData;
	$.cleanData = function( elems ) {
		for(var i = 0, elem; (elem = elems[i]) !== undefined && elem.getAttribute(HASATTR); i++) {
			try { $( elem ).triggerHandler('removeqtip');}
			catch( e ) {}
		}
		$['cleanData'+replaceSuffix]( elems );
	};
}

// Set global qTip properties
QTIP.version = '2.0.1-25-';
QTIP.nextid = 0;
QTIP.inactiveEvents = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' ');
QTIP.zindex = 15000;

// Define configuration defaults
QTIP.defaults = {
	prerender: FALSE,
	id: FALSE,
	overwrite: TRUE,
	suppress: TRUE,
	content: {
		text: TRUE,
		attr: 'title',
		deferred: FALSE,
		title: {
			text: FALSE,
			button: FALSE
		}
	},
	position: {
		my: 'top left',
		at: 'bottom right',
		target: FALSE,
		container: FALSE,
		viewport: FALSE,
		adjust: {
			x: 0, y: 0,
			mouse: TRUE,
			scroll: TRUE,
			resize: TRUE,
			method: 'flipinvert flipinvert'
		},
		effect: function(api, pos, viewport) {
			$(this).animate(pos, {
				duration: 200,
				queue: FALSE
			});
		}
	},
	show: {
		target: FALSE,
		event: 'mouseenter',
		effect: TRUE,
		delay: 90,
		solo: FALSE,
		ready: FALSE,
		autofocus: FALSE
	},
	hide: {
		target: FALSE,
		event: 'mouseleave',
		effect: TRUE,
		delay: 0,
		fixed: FALSE,
		inactive: FALSE,
		leave: 'window',
		distance: FALSE
	},
	style: {
		classes: '',
		widget: FALSE,
		width: FALSE,
		height: FALSE,
		def: TRUE
	},
	events: {
		render: NULL,
		move: NULL,
		show: NULL,
		hide: NULL,
		toggle: NULL,
		visible: NULL,
		hidden: NULL,
		focus: NULL,
		blur: NULL
	}
};


PLUGINS.svg = function(api, svg, corner, adjustMethod)
{
	var doc = $(document),
		elem = svg[0],
		result = {
			width: 0, height: 0,
			position: { top: 1e10, left: 1e10 }
		},
		box, mtx, root, point, tPoint;

	// Ascend the parentNode chain until we find an element with getBBox()
	while(!elem.getBBox) { elem = elem.parentNode; }

	// Check for a valid bounding box method
	if (elem.getBBox && elem.parentNode) {
		box = elem.getBBox();
		mtx = elem.getScreenCTM();
		root = elem.farthestViewportElement || elem;

		// Return if no method is found
		if(!root.createSVGPoint) { return result; }

		// Create our point var
		point = root.createSVGPoint();

		// Adjust top and left
		point.x = box.x;
		point.y = box.y;
		tPoint = point.matrixTransform(mtx);
		result.position.left = tPoint.x;
		result.position.top = tPoint.y;

		// Adjust width and height
		point.x += box.width;
		point.y += box.height;
		tPoint = point.matrixTransform(mtx);
		result.width = tPoint.x - result.position.left;
		result.height = tPoint.y - result.position.top;

		// Adjust by scroll offset
		result.position.left += doc.scrollLeft();
		result.position.top += doc.scrollTop();
	}

	return result;
};


var AJAX,
	AJAXNS = '.qtip-ajax',
	RSCRIPT = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

function Ajax(api)
{
	var self = this,
		tooltip = api.elements.tooltip,
		opts = api.options.content.ajax,
		defaults = QTIP.defaults.content.ajax,
		first = TRUE,
		stop = FALSE,
		xhr;

	api.checks.ajax = {
		'^content.ajax': function(obj, name, v) {
			// If content.ajax object was reset, set our local var
			if(name === 'ajax') { opts = v; }

			if(name === 'once') {
				self.init();
			}
			else if(opts && opts.url) {
				self.load();
			}
			else {
				tooltip.unbind(AJAXNS);
			}
		}
	};

	$.extend(self, {
		init: function() {
			// Make sure ajax options are enabled and bind event
			if(opts && opts.url) {
				tooltip.unbind(AJAXNS)[ opts.once ? 'one' : 'bind' ]('tooltipshow'+AJAXNS, self.load);
			}

			return self;
		},

		load: function(event) {
			if(stop) {stop = FALSE; return; }

			var hasSelector = opts.url.lastIndexOf(' '),
				url = opts.url,
				selector,
				hideFirst = !opts.loading && first;

			// If loading option is disabled, prevent the tooltip showing until we've completed the request
			if(hideFirst) { try{ event.preventDefault(); } catch(e) {} }

			// Make sure default event hasn't been prevented
			else if(event && event.isDefaultPrevented()) { return self; }

			// Cancel old request
			if(xhr && xhr.abort) { xhr.abort(); }
			
			// Check if user delcared a content selector like in .load()
			if(hasSelector > -1) {
				selector = url.substr(hasSelector);
				url = url.substr(0, hasSelector);
			}

			// Define common after callback for both success/error handlers
			function after() {
				var complete;

				// Don't proceed if tooltip is destroyed
				if(api.destroyed) { return; }

				// Set first flag to false
				first = FALSE;

				// Re-display tip if loading and first time, and reset first flag
				if(hideFirst) { stop = TRUE; api.show(event.originalEvent); }

				// Call users complete method if it was defined
				if((complete = defaults.complete || opts.complete) && $.isFunction(complete)) {
					complete.apply(opts.context || api, arguments);
				}
			}

			// Define success handler
			function successHandler(content, status, jqXHR) {
				var success;

				// Don't proceed if tooltip is destroyed
				if(api.destroyed) { return; }

				// If URL contains a selector
				if(selector && 'string' === typeof content) {
					// Create a dummy div to hold the results and grab the selector element
					content = $('<div/>')
						// inject the contents of the document in, removing the scripts
						// to avoid any 'Permission Denied' errors in IE
						.append(content.replace(RSCRIPT, ""))
						
						// Locate the specified elements
						.find(selector);
				}

				// Call the success function if one is defined
				if((success = defaults.success || opts.success) && $.isFunction(success)) {
					success.call(opts.context || api, content, status, jqXHR);
				}

				// Otherwise set the content
				else { api.set('content.text', content); }
			}

			// Error handler
			function errorHandler(xhr, status, error) {
				if(api.destroyed || xhr.status === 0) { return; }
				api.set('content.text', status + ': ' + error);
			}

			// Setup $.ajax option object and process the request
			xhr = $.ajax(
				$.extend({
					error: defaults.error || errorHandler,
					context: api
				},
				opts, { url: url, success: successHandler, complete: after })
			);
		},

		destroy: function() {
			// Cancel ajax request if possible
			if(xhr && xhr.abort) { xhr.abort(); }

			// Set api.destroyed flag
			api.destroyed = TRUE;
		}
	});

	self.init();
}

AJAX = PLUGINS.ajax = function(api)
{
	var self = api.plugins.ajax;
	
	return 'object' === typeof self ? self : (api.plugins.ajax = new Ajax(api));
};

AJAX.initialize = 'render';

// Setup plugin sanitization
AJAX.sanitize = function(options)
{
	var content = options.content, opts;
	if(content && 'ajax' in content) {
		opts = content.ajax;
		if(typeof opts !== 'object') { opts = options.content.ajax = { url: opts }; }
		if('boolean' !== typeof opts.once && opts.once) { opts.once = !!opts.once; }
	}
};

// Extend original api defaults
$.extend(TRUE, QTIP.defaults, {
	content: {
		ajax: {
			loading: TRUE,
			once: TRUE
		}
	}
});


var TIP,
	TIPNS = '.qtip-tip',
	HASCANVAS = !!document.createElement('canvas').getContext;

// Tip coordinates calculator
function calculateTip(corner, width, height)
{	
	var width2 = Math.ceil(width / 2), height2 = Math.ceil(height / 2),

	// Define tip coordinates in terms of height and width values
	tips = {
		bottomright:	[[0,0],				[width,height],		[width,0]],
		bottomleft:		[[0,0],				[width,0],				[0,height]],
		topright:		[[0,height],		[width,0],				[width,height]],
		topleft:			[[0,0],				[0,height],				[width,height]],
		topcenter:		[[0,height],		[width2,0],				[width,height]],
		bottomcenter:	[[0,0],				[width,0],				[width2,height]],
		rightcenter:	[[0,0],				[width,height2],		[0,height]],
		leftcenter:		[[width,0],			[width,height],		[0,height2]]
	};

	// Set common side shapes
	tips.lefttop = tips.bottomright; tips.righttop = tips.bottomleft;
	tips.leftbottom = tips.topright; tips.rightbottom = tips.topleft;

	return tips[ corner.string() ];
}


function Tip(qTip, command)
{
	var self = this,
		opts = qTip.options.style.tip,
		elems = qTip.elements,
		tooltip = elems.tooltip,
		cache = { top: 0, left: 0 },
		size = {
			width: opts.width,
			height: opts.height
		},
		color = { },
		border = opts.border || 0,
		tiphtml;

	self.corner = NULL;
	self.mimic = NULL;
	self.border = border;
	self.offset = opts.offset;
	self.size = size;

	// Add new option checks for the plugin
	qTip.checks.tip = {
		'^position.my|style.tip.(corner|mimic|border)$': function() {
			// Make sure a tip can be drawn
			if(!self.init()) {
				self.destroy();
			}

			// Reposition the tooltip
			qTip.reposition();
		},
		'^style.tip.(height|width)$': function() {
			// Re-set dimensions and redraw the tip
			size = {
				width: opts.width,
				height: opts.height
			};
			self.create();
			self.update();

			// Reposition the tooltip
			qTip.reposition();
		},
		'^content.title.text|style.(classes|widget)$': function() {
			if(elems.tip && elems.tip.length) {
				self.update();
			}
		}
	};

	function whileVisible(callback) {
		var visible = tooltip.is(':visible');
		tooltip.show(); callback(); tooltip.toggle(visible);
	}

	function swapDimensions() {
		size.width = opts.height;
		size.height = opts.width;
	}

	function resetDimensions() {
		size.width = opts.width;
		size.height = opts.height;
	}

	function reposition(event, api, pos, viewport) {
		if(!elems.tip) { return; }

		var newCorner = self.corner.clone(),
			adjust = pos.adjusted,
			method = qTip.options.position.adjust.method.split(' '),
			horizontal = method[0],
			vertical = method[1] || method[0],
			shift = { left: FALSE, top: FALSE, x: 0, y: 0 },
			offset, css = {}, props;

		// If our tip position isn't fixed e.g. doesn't adjust with viewport...
		if(self.corner.fixed !== TRUE) {
			// Horizontal - Shift or flip method
			if(horizontal === SHIFT && newCorner.precedance === X && adjust.left && newCorner.y !== CENTER) {
				newCorner.precedance = newCorner.precedance === X ? Y : X;
			}
			else if(horizontal !== SHIFT && adjust.left){
				newCorner.x = newCorner.x === CENTER ? (adjust.left > 0 ? LEFT : RIGHT) : (newCorner.x === LEFT ? RIGHT : LEFT);
			}

			// Vertical - Shift or flip method
			if(vertical === SHIFT && newCorner.precedance === Y && adjust.top && newCorner.x !== CENTER) {
				newCorner.precedance = newCorner.precedance === Y ? X : Y;
			}
			else if(vertical !== SHIFT && adjust.top) {
				newCorner.y = newCorner.y === CENTER ? (adjust.top > 0 ? TOP : BOTTOM) : (newCorner.y === TOP ? BOTTOM : TOP);
			}

			// Update and redraw the tip if needed (check cached details of last drawn tip)
			if(newCorner.string() !== cache.corner.string() && (cache.top !== adjust.top || cache.left !== adjust.left)) {
				self.update(newCorner, FALSE);
			}
		}

		// Setup tip offset properties
		offset = self.position(newCorner, adjust);
		offset[ newCorner.x ] += parseWidth(newCorner, newCorner.x);
		offset[ newCorner.y ] += parseWidth(newCorner, newCorner.y);

		// Readjust offset object to make it left/top
		if(offset.right !== undefined) { offset.left = -offset.right; }
		if(offset.bottom !== undefined) { offset.top = -offset.bottom; }
		offset.user = Math.max(0, opts.offset);

		// Viewport "shift" specific adjustments
		if(shift.left = (horizontal === SHIFT && !!adjust.left)) {
			if(newCorner.x === CENTER) {
				css['margin-left'] = shift.x = offset['margin-left'] - adjust.left;
			}
			else {
				props = offset.right !== undefined ?
					[ adjust.left, -offset.left ] : [ -adjust.left, offset.left ];

				if( (shift.x = Math.max(props[0], props[1])) > props[0] ) {
					pos.left -= adjust.left;
					shift.left = FALSE;
				}
				
				css[ offset.right !== undefined ? RIGHT : LEFT ] = shift.x;
			}
		}
		if(shift.top = (vertical === SHIFT && !!adjust.top)) {
			if(newCorner.y === CENTER) {
				css['margin-top'] = shift.y = offset['margin-top'] - adjust.top;
			}
			else {
				props = offset.bottom !== undefined ?
					[ adjust.top, -offset.top ] : [ -adjust.top, offset.top ];

				if( (shift.y = Math.max(props[0], props[1])) > props[0] ) {
					pos.top -= adjust.top;
					shift.top = FALSE;
				}

				css[ offset.bottom !== undefined ? BOTTOM : TOP ] = shift.y;
			}
		}

		/*
		* If the tip is adjusted in both dimensions, or in a
		* direction that would cause it to be anywhere but the
		* outer border, hide it!
		*/
		elems.tip.css(css).toggle(
			!((shift.x && shift.y) || (newCorner.x === CENTER && shift.y) || (newCorner.y === CENTER && shift.x))
		);

		// Adjust position to accomodate tip dimensions
		pos.left -= offset.left.charAt ? offset.user : horizontal !== SHIFT || shift.top || !shift.left && !shift.top ? offset.left : 0;
		pos.top -= offset.top.charAt ? offset.user : vertical !== SHIFT || shift.left || !shift.left && !shift.top ? offset.top : 0;

		// Cache details
		cache.left = adjust.left; cache.top = adjust.top;
		cache.corner = newCorner.clone();
	}

	function parseCorner() {
		var corner = opts.corner,
			posOptions = qTip.options.position,
			at = posOptions.at,
			my = posOptions.my.string ? posOptions.my.string() : posOptions.my;

		// Detect corner and mimic properties
		if(corner === FALSE || (my === FALSE && at === FALSE)) {
			return FALSE;
		}
		else {
			if(corner === TRUE) {
				self.corner = new PLUGINS.Corner(my);
			}
			else if(!corner.string) {
				self.corner = new PLUGINS.Corner(corner);
				self.corner.fixed = TRUE;
			}
		}

		// Cache it
		cache.corner = new PLUGINS.Corner( self.corner.string() );

		return self.corner.string() !== 'centercenter';
	}

	/* border width calculator */
	function parseWidth(corner, side, use) {
		side = !side ? corner[corner.precedance] : side;
		
		var isTitleTop = elems.titlebar && corner.y === TOP,
			elem = isTitleTop ? elems.titlebar : tooltip,
			borderSide = 'border-' + side + '-width',
			css = function(elem) { return parseInt(elem.css(borderSide), 10); },
			val;

		// Grab the border-width value (make tooltip visible first)
		whileVisible(function() {
			val = (use ? css(use) : (css(elems.content) || css(elem) || css(tooltip))) || 0;
		});
		return val;
	}

	function parseRadius(corner) {
		var isTitleTop = elems.titlebar && corner.y === TOP,
			elem = isTitleTop ? elems.titlebar : elems.content,
			mozPrefix = '-moz-', webkitPrefix = '-webkit-',
			nonStandard = 'border-radius-' + corner.y + corner.x,
			standard = 'border-' + corner.y + '-' + corner.x + '-radius',
			css = function(c) { return parseInt(elem.css(c), 10) || parseInt(tooltip.css(c), 10); },
			val;

		whileVisible(function() {
			val = css(standard) || css(nonStandard) ||
				css(mozPrefix + standard) || css(mozPrefix + nonStandard) || 
				css(webkitPrefix + standard) || css(webkitPrefix + nonStandard) || 0;
		});
		return val;
	}

	function parseColours(actual) {
		var i, fill, border,
			tip = elems.tip.css('cssText', ''),
			corner = actual || self.corner,
			invalid = /rgba?\(0, 0, 0(, 0)?\)|transparent|#123456/i,
			borderSide = 'border-' + corner[ corner.precedance ] + '-color',
			bgColor = 'background-color',
			transparent = 'transparent',
			important = ' !important',

			titlebar = elems.titlebar,
			useTitle = titlebar && (corner.y === TOP || (corner.y === CENTER && tip.position().top + (size.height / 2) + opts.offset < titlebar.outerHeight(TRUE))),
			colorElem = useTitle ? titlebar : elems.content;

		function css(elem, prop, compare) {
			var val = elem.css(prop) || transparent;
			if(compare && val === elem.css(compare)) { return FALSE; }
			else { return invalid.test(val) ? FALSE : val; }
		}

		// Ensure tooltip is visible then...
		whileVisible(function() {
			// Attempt to detect the background colour from various elements, left-to-right precedance
			color.fill = css(tip, bgColor) || css(colorElem, bgColor) || css(elems.content, bgColor) || 
				css(tooltip, bgColor) || tip.css(bgColor);

			// Attempt to detect the correct border side colour from various elements, left-to-right precedance
			color.border = css(tip, borderSide, 'color') || css(colorElem, borderSide, 'color') || 
				css(elems.content, borderSide, 'color') || css(tooltip, borderSide, 'color') || tooltip.css(borderSide);

			// Reset background and border colours
			$('*', tip).add(tip).css('cssText', bgColor+':'+transparent+important+';border:0'+important+';');
		});
	}

	function calculateSize(corner) {
		var y = corner.precedance === Y,
			width = size [ y ? WIDTH : HEIGHT ],
			height = size [ y ? HEIGHT : WIDTH ],
			isCenter = corner.string().indexOf(CENTER) > -1,
			base = width * (isCenter ? 0.5 : 1),
			pow = Math.pow,
			round = Math.round,
			bigHyp, ratio, result,

		smallHyp = Math.sqrt( pow(base, 2) + pow(height, 2) ),
		
		hyp = [
			(border / base) * smallHyp, (border / height) * smallHyp
		];
		hyp[2] = Math.sqrt( pow(hyp[0], 2) - pow(border, 2) );
		hyp[3] = Math.sqrt( pow(hyp[1], 2) - pow(border, 2) );

		bigHyp = smallHyp + hyp[2] + hyp[3] + (isCenter ? 0 : hyp[0]);
		ratio = bigHyp / smallHyp;

		result = [ round(ratio * height), round(ratio * width) ];
		return { height: result[ y ? 0 : 1 ], width: result[ y ? 1 : 0 ] };
	}

	function createVML(tag, props, style) {
		return '<qvml:'+tag+' xmlns="urn:schemas-microsoft.com:vml" class="qtip-vml" '+(props||'')+
			' style="behavior: url(#default#VML); '+(style||'')+ '" />';
	}

	$.extend(self, {
		init: function()
		{
			var enabled = parseCorner() && (HASCANVAS || PLUGINS.ie);

			// Determine tip corner and type
			if(enabled) {
				// Create a new tip and draw it
				self.create();
				self.update();

				// Bind update events
				tooltip.unbind(TIPNS).bind('tooltipmove'+TIPNS, reposition);
			}
			
			return enabled;
		},

		create: function()
		{
			var width = size.width,
				height = size.height,
				vml;

			// Remove previous tip element if present
			if(elems.tip) { elems.tip.remove(); }

			// Create tip element and prepend to the tooltip
			elems.tip = $('<div />', { 'class': 'qtip-tip' }).css({ width: width, height: height }).prependTo(tooltip);

			// Create tip drawing element(s)
			if(HASCANVAS) {
				// save() as soon as we create the canvas element so FF2 doesn't bork on our first restore()!
				$('<canvas />').appendTo(elems.tip)[0].getContext('2d').save();
			}
			else {
				vml = createVML('shape', 'coordorigin="0,0"', 'position:absolute;');
				elems.tip.html(vml + vml);

				// Prevent mousing down on the tip since it causes problems with .live() handling in IE due to VML
				$('*', elems.tip).bind('click'+TIPNS+' mousedown'+TIPNS, function(event) { event.stopPropagation(); });
			}
		},

		update: function(corner, position)
		{
			var tip = elems.tip,
				inner = tip.children(),
				width = size.width,
				height = size.height,
				mimic = opts.mimic,
				round = Math.round,
				precedance, context, coords, translate, newSize;

			// Re-determine tip if not already set
			if(!corner) { corner = cache.corner || self.corner; }

			// Use corner property if we detect an invalid mimic value
			if(mimic === FALSE) { mimic = corner; }

			// Otherwise inherit mimic properties from the corner object as necessary
			else {
				mimic = new PLUGINS.Corner(mimic);
				mimic.precedance = corner.precedance;

				if(mimic.x === 'inherit') { mimic.x = corner.x; }
				else if(mimic.y === 'inherit') { mimic.y = corner.y; }
				else if(mimic.x === mimic.y) {
					mimic[ corner.precedance ] = corner[ corner.precedance ];
				}
			}
			precedance = mimic.precedance;

			// Ensure the tip width.height are relative to the tip position
			if(corner.precedance === X) { swapDimensions(); }
			else { resetDimensions(); }

			// Set the tip dimensions
			elems.tip.css({
				width: (width = size.width),
				height: (height = size.height)
			});

			// Update our colours
			parseColours(corner);

			// Detect border width, taking into account colours
			if(color.border !== 'transparent') {
				// Grab border width
				border = parseWidth(corner, NULL);

				// If border width isn't zero, use border color as fill (1.0 style tips)
				if(opts.border === 0 && border > 0) { color.fill = color.border; }

				// Set border width (use detected border width if opts.border is true)
				self.border = border = opts.border !== TRUE ? opts.border : border;
			}

			// Border colour was invalid, set border to zero
			else { self.border = border = 0; }

			// Calculate coordinates
			coords = calculateTip(mimic, width , height);

			// Determine tip size
			self.size = newSize = calculateSize(corner);
			tip.css(newSize).css('line-height', newSize.height+'px');

			// Calculate tip translation
			if(corner.precedance === Y) {
				translate = [
					round(mimic.x === LEFT ? border : mimic.x === RIGHT ? newSize.width - width - border : (newSize.width - width) / 2),
					round(mimic.y === TOP ? newSize.height - height : 0)
				];
			}
			else {
				translate = [
					round(mimic.x === LEFT ? newSize.width - width : 0),
					round(mimic.y === TOP ? border : mimic.y === BOTTOM ? newSize.height - height - border : (newSize.height - height) / 2)
				];
			}

			// Canvas drawing implementation
			if(HASCANVAS) {
				// Set the canvas size using calculated size
				inner.attr(newSize);

				// Grab canvas context and clear/save it
				context = inner[0].getContext('2d');
				context.restore(); context.save();
				context.clearRect(0,0,3000,3000);

				// Set properties
				context.fillStyle = color.fill;
				context.strokeStyle = color.border;
				context.lineWidth = border * 2;
				context.lineJoin = 'miter';
				context.miterLimit = 100;

				// Translate origin
				context.translate(translate[0], translate[1]);

				// Draw the tip
				context.beginPath();
				context.moveTo(coords[0][0], coords[0][1]);
				context.lineTo(coords[1][0], coords[1][1]);
				context.lineTo(coords[2][0], coords[2][1]);
				context.closePath();

				// Apply fill and border
				if(border) {
					// Make sure transparent borders are supported by doing a stroke
					// of the background colour before the stroke colour
					if(tooltip.css('background-clip') === 'border-box') {
						context.strokeStyle = color.fill;
						context.stroke();
					}
					context.strokeStyle = color.border;
					context.stroke();
				}
				context.fill();
			}

			// VML (IE Proprietary implementation)
			else {
				// Setup coordinates string
				coords = 'm' + coords[0][0] + ',' + coords[0][1] + ' l' + coords[1][0] +
					',' + coords[1][1] + ' ' + coords[2][0] + ',' + coords[2][1] + ' xe';

				// Setup VML-specific offset for pixel-perfection
				translate[2] = border && /^(r|b)/i.test(corner.string()) ? 
					PLUGINS.ie === 8 ? 2 : 1 : 0;

				// Set initial CSS
				inner.css({
					coordsize: (width+border) + ' ' + (height+border),
					antialias: ''+(mimic.string().indexOf(CENTER) > -1),
					left: translate[0],
					top: translate[1],
					width: width + border,
					height: height + border
				})
				.each(function(i) {
					var $this = $(this);

					// Set shape specific attributes
					$this[ $this.prop ? 'prop' : 'attr' ]({
						coordsize: (width+border) + ' ' + (height+border),
						path: coords,
						fillcolor: color.fill,
						filled: !!i,
						stroked: !i
					})
					.toggle(!!(border || i));

					// Check if border is enabled and add stroke element
					if(!i && $this.html() === '') {
						$this.html(
							createVML('stroke', 'weight="'+(border*2)+'px" color="'+color.border+'" miterlimit="1000" joinstyle="miter"')
						);
					}
				});
			}

			// Opera bug #357 - Incorrect tip position
			// https://github.com/Craga89/qTip2/issues/367
			setTimeout(function() {
				elems.tip.css({
					display: 'inline-block',
					visibility: 'visible'
				});
			}, 1);

			// Position if needed
			if(position !== FALSE) { self.position(corner); }

		},

		// Tip positioning method
		position: function(corner)
		{
			var tip = elems.tip,
				position = {},
				userOffset = Math.max(0, opts.offset),
				precedance, dimensions, corners;

			// Return if tips are disabled or tip is not yet rendered
			if(opts.corner === FALSE || !tip) { return FALSE; }

			// Inherit corner if not provided
			corner = corner || self.corner;
			precedance = corner.precedance;

			// Determine which tip dimension to use for adjustment
			dimensions = calculateSize(corner);

			// Setup corners and offset array
			corners = [ corner.x, corner.y ];
			if(precedance === X) { corners.reverse(); }

			// Calculate tip position
			$.each(corners, function(i, side) {
				var b, bc, br;

				if(side === CENTER) {
					b = precedance === Y ? LEFT : TOP;
					position[ b ] = '50%';
					position['margin-' + b] = -Math.round(dimensions[ precedance === Y ? WIDTH : HEIGHT ] / 2) + userOffset;
				}
				else {
					b = parseWidth(corner, side);
					bc = parseWidth(corner, side, elems.content);
					br = parseRadius(corner);

					position[ side ] = i ? bc : (userOffset + (br > b ? br : -b));
				}
			});

			// Adjust for tip dimensions
			position[ corner[precedance] ] -= dimensions[ precedance === X ? WIDTH : HEIGHT ];

			// Set and return new position
			tip.css({ top: '', bottom: '', left: '', right: '', margin: '' }).css(position);
			return position;
		},
		
		destroy: function()
		{
			// Unbind events
			tooltip.unbind(TIPNS);

			// Remove the tip element(s)
			if(elems.tip) {
				elems.tip.find('*').remove()
					.end().remove();
			}

			// Delete references
			delete self.corner;
			delete self.mimic;
			delete self.size;
		}
	});

	self.init();
}

TIP = PLUGINS.tip = function(api)
{
	var self = api.plugins.tip;
	
	return 'object' === typeof self ? self : (api.plugins.tip = new Tip(api));
};

// Initialize tip on render
TIP.initialize = 'render';

// Setup plugin sanitization options
TIP.sanitize = function(options)
{
	var style = options.style, opts;
	if(style && 'tip' in style) {
		opts = options.style.tip;
		if(typeof opts !== 'object'){ options.style.tip = { corner: opts }; }
		if(!(/string|boolean/i).test(typeof opts.corner)) { opts.corner = TRUE; }
		if(typeof opts.width !== 'number'){ delete opts.width; }
		if(typeof opts.height !== 'number'){ delete opts.height; }
		if(typeof opts.border !== 'number' && opts.border !== TRUE){ delete opts.border; }
		if(typeof opts.offset !== 'number'){ delete opts.offset; }
	}
};

// Extend original qTip defaults
$.extend(TRUE, QTIP.defaults, {
	style: {
		tip: {
			corner: TRUE,
			mimic: FALSE,
			width: 6,
			height: 6,
			border: TRUE,
			offset: 0
		}
	}
});


var MODAL, OVERLAY,
	MODALATTR = 'is-modal-qtip',
	MODALSELECTOR = selector + '['+MODALATTR+']',
	MODALNS = '.qtipmodal';

OVERLAY = function()
{
	var self = this,
		focusableElems = {},
		current, onLast,
		prevState, elem;

	// Modified code from jQuery UI 1.10.0 source
	// http://code.jquery.com/ui/1.10.0/jquery-ui.js
	function focusable(element) {
		// Use the defined focusable checker when possible
		if($.expr[':'].focusable) { return $.expr[':'].focusable; }

		var isTabIndexNotNaN = !isNaN($.attr(element, 'tabindex')),
			nodeName = element.nodeName.toLowerCase(),
			map, mapName, img;

		if('area' === nodeName) {
			map = element.parentNode;
			mapName = map.name;
			if(!element.href || !mapName || map.nodeName.toLowerCase() !== 'map') {
				return false;
			}
			img = $('img[usemap=#' + mapName + ']')[0];
			return !!img && img.is(':visible');
		}
		return (/input|select|textarea|button|object/.test( nodeName ) ?
				!element.disabled :
				'a' === nodeName ? 
					element.href || isTabIndexNotNaN : 
					isTabIndexNotNaN
			);
	}

	// Focus inputs using cached focusable elements (see update())
	function focusInputs(blurElems) {
		// Blurring body element in IE causes window.open windows to unfocus!
		if(focusableElems.length < 1 && blurElems.length) { blurElems.not('body').blur(); }

		// Focus the inputs
		else { focusableElems.first().focus(); }
	}

	// Steal focus from elements outside tooltip
	function stealFocus(event) {
		if(!elem.is(':visible')) { return; }

		var target = $(event.target),
			tooltip = current.elements.tooltip,
			container = target.closest(selector),
			targetOnTop;

		// Determine if input container target is above this
		targetOnTop = container.length < 1 ? FALSE :
			(parseInt(container[0].style.zIndex, 10) > parseInt(tooltip[0].style.zIndex, 10));

		// If we're showing a modal, but focus has landed on an input below
		// this modal, divert focus to the first visible input in this modal
		// or if we can't find one... the tooltip itself
		if(!targetOnTop && target.closest(selector)[0] !== tooltip[0]) {
			focusInputs(target);
		}

		// Detect when we leave the last focusable element...
		onLast = event.target === focusableElems[focusableElems.length - 1];
	}

	$.extend(self, {
		init: function()
		{
			// Create document overlay
			elem = self.elem = $('<div />', {
				id: 'qtip-overlay',
				html: '<div></div>',
				mousedown: function() { return FALSE; }
			})
			.hide();

			// Update position on window resize or scroll
			function resize() {
				var win = $(this);
				elem.css({
					height: win.height(),
					width: win.width()
				});
			}
			$(window).bind('resize'+MODALNS, resize);
			resize(); // Fire it initially too

			// Make sure we can't focus anything outside the tooltip
			$(document.body).bind('focusin'+MODALNS, stealFocus);

			// Apply keyboard "Escape key" close handler
			$(document).bind('keydown'+MODALNS, function(event) {
				if(current && current.options.show.modal.escape && event.keyCode === 27) {
					current.hide(event);
				}
			});

			// Apply click handler for blur option
			elem.bind('click'+MODALNS, function(event) {
				if(current && current.options.show.modal.blur) {
					current.hide(event);
				}
			});

			return self;
		},

		update: function(api) {
			// Update current API reference
			current = api;

			// Update focusable elements if enabled
			if(api.options.show.modal.stealfocus !== FALSE) {
				focusableElems = api.elements.tooltip.find('*').filter(function() {
					return focusable(this);
				});
			}
			else { focusableElems = []; }
		},

		toggle: function(api, state, duration)
		{
			var docBody = $(document.body),
				tooltip = api.elements.tooltip,
				options = api.options.show.modal,
				effect = options.effect,
				type = state ? 'show': 'hide',
				visible = elem.is(':visible'),
				modals = $(MODALSELECTOR).filter(':visible:not(:animated)').not(tooltip),
				zindex;

			// Set active tooltip API reference
			self.update(api);

			// If the modal can steal the focus...
			// Blur the current item and focus anything in the modal we an
			if(state && options.stealfocus !== FALSE) {
				focusInputs( $(':focus') );
			}

			// Toggle backdrop cursor style on show
			elem.toggleClass('blurs', options.blur);

			// Set position and append to body on show
			if(state) {
				elem.css({ left: 0, top: 0 })
					.appendTo(document.body);
			}

			// Prevent modal from conflicting with show.solo, and don't hide backdrop is other modals are visible
			if((elem.is(':animated') && visible === state && prevState !== FALSE) || (!state && modals.length)) {
				return self;
			}

			// Stop all animations
			elem.stop(TRUE, FALSE);

			// Use custom function if provided
			if($.isFunction(effect)) {
				effect.call(elem, state);
			}

			// If no effect type is supplied, use a simple toggle
			else if(effect === FALSE) {
				elem[ type ]();
			}

			// Use basic fade function
			else {
				elem.fadeTo( parseInt(duration, 10) || 90, state ? 1 : 0, function() {
					if(!state) { elem.hide(); }
				});
			}

			// Reset position and detach from body on hide
			if(!state) {
				elem.queue(function(next) {
					elem.css({ left: '', top: '' });
					if(!modals.length) { elem.detach(); }
					next();
				});
			}

			// Cache the state
			prevState = state;

			// If the tooltip is destroyed, set referenceto null
			if(current.destroyed) { current = NULL; }

			return self;
		}
	});	

	self.init();
};
OVERLAY = new OVERLAY();

function Modal(api)
{
	var self = this,
		options = api.options.show.modal,
		elems = api.elements,
		tooltip = elems.tooltip,
		namespace = MODALNS + api.id,
		overlay;

	// Setup option set checks
	api.checks.modal = {
		'^show.modal.(on|blur)$': function() {
			// Initialise
			self.destroy();
			self.init();
			
			// Show the modal if not visible already and tooltip is visible
			overlay.toggle( tooltip.is(':visible') );
		}
	};

	$.extend(self, {
		init: function()
		{
			// If modal is disabled... return
			if(!options.on) { return self; }

			// Set overlay reference
			overlay = elems.overlay = OVERLAY.elem;

			// Add unique attribute so we can grab modal tooltips easily via a selector
			tooltip.attr(MODALATTR, TRUE)

			// Set z-index
			.css('z-index', PLUGINS.modal.zindex + $(MODALSELECTOR).length)
			
			// Apply our show/hide/focus modal events
			.bind('tooltipshow'+namespace+' tooltiphide'+namespace, function(event, api, duration) {
				var oEvent = event.originalEvent;

				// Make sure mouseout doesn't trigger a hide when showing the modal and mousing onto backdrop
				if(event.target === tooltip[0]) {
					if(oEvent && event.type === 'tooltiphide' && /mouse(leave|enter)/.test(oEvent.type) && $(oEvent.relatedTarget).closest(overlay[0]).length) {
						try { event.preventDefault(); } catch(e) {}
					}
					else if(!oEvent || (oEvent && !oEvent.solo)) {
						self.toggle(event, event.type === 'tooltipshow', duration);
					}
				}
			})

			// Adjust modal z-index on tooltip focus
			.bind('tooltipfocus'+namespace, function(event, api) {
				// If focus was cancelled before it reached us, don't do anything
				if(event.isDefaultPrevented() || event.target !== tooltip[0]) { return; }

				var qtips = $(MODALSELECTOR),

				// Keep the modal's lower than other, regular qtips
				newIndex = PLUGINS.modal.zindex + qtips.length,
				curIndex = parseInt(tooltip[0].style.zIndex, 10);

				// Set overlay z-index
				overlay[0].style.zIndex = newIndex - 1;

				// Reduce modal z-index's and keep them properly ordered
				qtips.each(function() {
					if(this.style.zIndex > curIndex) {
						this.style.zIndex -= 1;
					}
				});

				// Fire blur event for focused tooltip
				qtips.filter('.' + focusClass).qtip('blur', event.originalEvent);

				// Set the new z-index
				tooltip.addClass(focusClass)[0].style.zIndex = newIndex;

				// Set current
				OVERLAY.update(api);

				// Prevent default handling
				try { event.preventDefault(); } catch(e) {}
			})

			// Focus any other visible modals when this one hides
			.bind('tooltiphide'+namespace, function(event) {
				if(event.target === tooltip[0]) {
					$(MODALSELECTOR).filter(':visible').not(tooltip).last().qtip('focus', event);
				}
			});

			return self;
		},

		toggle: function(event, state, duration)
		{
			// Make sure default event hasn't been prevented
			if(event && event.isDefaultPrevented()) { return self; }

			// Toggle it
			OVERLAY.toggle(api, !!state, duration);

			return self;
		},

		destroy: function() {
			// Remove bound events
			$([document, tooltip]).removeAttr(MODALATTR).unbind(namespace);

			// Delete element reference
			OVERLAY.toggle(api, FALSE);
			delete elems.overlay;
		}
	});

	self.init();
}

MODAL = PLUGINS.modal = function(api) {
	var self = api.plugins.modal;

	return 'object' === typeof self ? self : (api.plugins.modal = new Modal(api));
};

// Setup sanitiztion rules
MODAL.sanitize = function(opts) {
	if(opts.show) { 
		if(typeof opts.show.modal !== 'object') { opts.show.modal = { on: !!opts.show.modal }; }
		else if(typeof opts.show.modal.on === 'undefined') { opts.show.modal.on = TRUE; }
	}
};

// Base z-index for all modal tooltips (use qTip core z-index as a base)
MODAL.zindex = QTIP.zindex - 200;

// Plugin needs to be initialized on render
MODAL.initialize = 'render';

// Extend original api defaults
$.extend(TRUE, QTIP.defaults, {
	show: {
		modal: {
			on: FALSE,
			effect: TRUE,
			blur: TRUE,
			stealfocus: TRUE,
			escape: TRUE
		}
	}
});


PLUGINS.viewport = function(api, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight)
{
	var target = posOptions.target,
		tooltip = api.elements.tooltip,
		my = posOptions.my,
		at = posOptions.at,
		adjust = posOptions.adjust,
		method = adjust.method.split(' '),
		methodX = method[0],
		methodY = method[1] || method[0],
		viewport = posOptions.viewport,
		container = posOptions.container,
		cache = api.cache,
		tip = api.plugins.tip,
		adjusted = { left: 0, top: 0 },
		fixed, newMy, newClass;

	// If viewport is not a jQuery element, or it's the window/document or no adjustment method is used... return
	if(!viewport.jquery || target[0] === window || target[0] === document.body || adjust.method === 'none') {
		return adjusted;
	}

	// Cache our viewport details
	fixed = tooltip.css('position') === 'fixed';
	viewport = {
		elem: viewport,
		height: viewport[ (viewport[0] === window ? 'h' : 'outerH') + 'eight' ](),
		width: viewport[ (viewport[0] === window ? 'w' : 'outerW') + 'idth' ](),
		scrollleft: fixed ? 0 : viewport.scrollLeft(),
		scrolltop: fixed ? 0 : viewport.scrollTop(),
		offset: viewport.offset() || { left: 0, top: 0 }
	};
	container = {
		elem: container,
		scrollLeft: container.scrollLeft(),
		scrollTop: container.scrollTop(),
		offset: container.offset() || { left: 0, top: 0 }
	};

	// Generic calculation method
	function calculate(side, otherSide, type, adjust, side1, side2, lengthName, targetLength, elemLength) {
		var initialPos = position[side1],
			mySide = my[side], atSide = at[side],
			isShift = type === SHIFT,
			viewportScroll = -container.offset[side1] + viewport.offset[side1] + viewport['scroll'+side1],
			myLength = mySide === side1 ? elemLength : mySide === side2 ? -elemLength : -elemLength / 2,
			atLength = atSide === side1 ? targetLength : atSide === side2 ? -targetLength : -targetLength / 2,
			tipLength = tip && tip.size ? tip.size[lengthName] || 0 : 0,
			tipAdjust = tip && tip.corner && tip.corner.precedance === side && !isShift ? tipLength : 0,
			overflow1 = viewportScroll - initialPos + tipAdjust,
			overflow2 = initialPos + elemLength - viewport[lengthName] - viewportScroll + tipAdjust,
			offset = myLength - (my.precedance === side || mySide === my[otherSide] ? atLength : 0) - (atSide === CENTER ? targetLength / 2 : 0);

		// shift
		if(isShift) {
			tipAdjust = tip && tip.corner && tip.corner.precedance === otherSide ? tipLength : 0;
			offset = (mySide === side1 ? 1 : -1) * myLength - tipAdjust;

			// Adjust position but keep it within viewport dimensions
			position[side1] += overflow1 > 0 ? overflow1 : overflow2 > 0 ? -overflow2 : 0;
			position[side1] = Math.max(
				-container.offset[side1] + viewport.offset[side1] + (tipAdjust && tip.corner[side] === CENTER ? tip.offset : 0),
				initialPos - offset,
				Math.min(
					Math.max(-container.offset[side1] + viewport.offset[side1] + viewport[lengthName], initialPos + offset),
					position[side1]
				)
			);
		}

		// flip/flipinvert
		else {
			// Update adjustment amount depending on if using flipinvert or flip
			adjust *= (type === FLIPINVERT ? 2 : 0);

			// Check for overflow on the left/top
			if(overflow1 > 0 && (mySide !== side1 || overflow2 > 0)) {
				position[side1] -= offset + adjust;
				newMy['invert'+side](side1);
			}

			// Check for overflow on the bottom/right
			else if(overflow2 > 0 && (mySide !== side2 || overflow1 > 0)  ) {
				position[side1] -= (mySide === CENTER ? -offset : offset) + adjust;
				newMy['invert'+side](side2);
			}

			// Make sure we haven't made things worse with the adjustment and reset if so
			if(position[side1] < viewportScroll && -position[side1] > overflow2) {
				position[side1] = initialPos; newMy = my.clone();
			}
		}

		return position[side1] - initialPos;
	}

	// Set newMy if using flip or flipinvert methods
	if(methodX !== 'shift' || methodY !== 'shift') { newMy = my.clone(); }

	// Adjust position based onviewport and adjustment options
	adjusted = {
		left: methodX !== 'none' ? calculate( X, Y, methodX, adjust.x, LEFT, RIGHT, WIDTH, targetWidth, elemWidth ) : 0,
		top: methodY !== 'none' ? calculate( Y, X, methodY, adjust.y, TOP, BOTTOM, HEIGHT, targetHeight, elemHeight ) : 0
	};

	// Set tooltip position class if it's changed
	if(newMy && cache.lastClass !== (newClass = NAMESPACE + '-pos-' + newMy.abbrev())) {
		tooltip.removeClass(api.cache.lastClass).addClass( (api.cache.lastClass = newClass) );
	}

	return adjusted;
};
PLUGINS.imagemap = function(api, area, corner, adjustMethod)
{
	if(!area.jquery) { area = $(area); }

	var cache = (api.cache.areas = {}),
		shape = (area[0].shape || area.attr('shape')).toLowerCase(),
		coordsString = area[0].coords || area.attr('coords'),
		baseCoords = coordsString.split(','),
		coords = [],
		image = $('img[usemap="#'+area.parent('map').attr('name')+'"]'),
		imageOffset = image.offset(),
		result = {
			width: 0, height: 0,
			position: {
				top: 1e10, right: 0,
				bottom: 0, left: 1e10
			}
		},
		i = 0, next = 0, dimensions;

	// POLY area coordinate calculator
	//	Special thanks to Ed Cradock for helping out with this.
	//	Uses a binary search algorithm to find suitable coordinates.
	function polyCoordinates(result, coords, corner)
	{
		var i = 0,
			compareX = 1, compareY = 1,
			realX = 0, realY = 0,
			newWidth = result.width,
			newHeight = result.height;

		// Use a binary search algorithm to locate most suitable coordinate (hopefully)
		while(newWidth > 0 && newHeight > 0 && compareX > 0 && compareY > 0)
		{
			newWidth = Math.floor(newWidth / 2);
			newHeight = Math.floor(newHeight / 2);

			if(corner.x === LEFT){ compareX = newWidth; }
			else if(corner.x === RIGHT){ compareX = result.width - newWidth; }
			else{ compareX += Math.floor(newWidth / 2); }

			if(corner.y === TOP){ compareY = newHeight; }
			else if(corner.y === BOTTOM){ compareY = result.height - newHeight; }
			else{ compareY += Math.floor(newHeight / 2); }

			i = coords.length; while(i--)
			{
				if(coords.length < 2){ break; }

				realX = coords[i][0] - result.position.left;
				realY = coords[i][1] - result.position.top;

				if((corner.x === LEFT && realX >= compareX) ||
				(corner.x === RIGHT && realX <= compareX) ||
				(corner.x === CENTER && (realX < compareX || realX > (result.width - compareX))) ||
				(corner.y === TOP && realY >= compareY) ||
				(corner.y === BOTTOM && realY <= compareY) ||
				(corner.y === CENTER && (realY < compareY || realY > (result.height - compareY)))) {
					coords.splice(i, 1);
				}
			}
		}

		return { left: coords[0][0], top: coords[0][1] };
	}

	// Make sure we account for padding and borders on the image
	imageOffset.left += Math.ceil((image.outerWidth() - image.width()) / 2);
	imageOffset.top += Math.ceil((image.outerHeight() - image.height()) / 2);

	// Parse coordinates into proper array
	if(shape === 'poly') {
		i = baseCoords.length; while(i--)
		{
			next = [ parseInt(baseCoords[--i], 10), parseInt(baseCoords[i+1], 10) ];

			if(next[0] > result.position.right){ result.position.right = next[0]; }
			if(next[0] < result.position.left){ result.position.left = next[0]; }
			if(next[1] > result.position.bottom){ result.position.bottom = next[1]; }
			if(next[1] < result.position.top){ result.position.top = next[1]; }

			coords.push(next);
		}
	}
	else {
		i = -1; while(i++ < baseCoords.length) {
			coords.push( parseInt(baseCoords[i], 10) );
		}
	}

	// Calculate details
	switch(shape)
	{
		case 'rect':
			result = {
				width: Math.abs(coords[2] - coords[0]),
				height: Math.abs(coords[3] - coords[1]),
				position: {
					left: Math.min(coords[0], coords[2]),
					top: Math.min(coords[1], coords[3])
				}
			};
		break;

		case 'circle':
			result = {
				width: coords[2] + 2,
				height: coords[2] + 2,
				position: { left: coords[0], top: coords[1] }
			};
		break;

		case 'poly':
			result.width = Math.abs(result.position.right - result.position.left);
			result.height = Math.abs(result.position.bottom - result.position.top);

			if(corner.abbrev() === 'c') {
				result.position = {
					left: result.position.left + (result.width / 2),
					top: result.position.top + (result.height / 2)
				};
			}
			else {
				// Calculate if we can't find a cached value
				if(!cache[corner+coordsString]) {
					result.position = polyCoordinates(result, coords.slice(), corner);

					// If flip adjustment is enabled, also calculate the closest opposite point
					if(adjustMethod && (adjustMethod[0] === 'flip' || adjustMethod[1] === 'flip')) {
						result.offset = polyCoordinates(result, coords.slice(), {
							x: corner.x === LEFT ? RIGHT : corner.x === RIGHT ? LEFT : CENTER,
							y: corner.y === TOP ? BOTTOM : corner.y === BOTTOM ? TOP : CENTER
						});

						result.offset.left -= result.position.left;
						result.offset.top -= result.position.top;
					}

					// Store the result
					cache[corner+coordsString] = result;
				}

				// Grab the cached result
				result = cache[corner+coordsString];
			}

			result.width = result.height = 0;
		break;
	}

	// Add image position to offset coordinates
	result.position.left += imageOffset.left;
	result.position.top += imageOffset.top;

	return result;
};


var IE6;

/* 
 * BGIFrame adaption (http://plugins.jquery.com/project/bgiframe)
 * Special thanks to Brandon Aaron
 */
function Ie6(api)
{
	var self = this,
		elems = api.elements,
		options = api.options,
		tooltip = elems.tooltip,
		namespace = '.ie6-' + api.id,
		bgiframe = $('select, object').length < 1,
		isDrawing = 0,
		modalProcessed = FALSE,
		redrawContainer;

	api.checks.ie6 = {
		'^content|style$': function(obj, o, v){ redraw(); }
	};

	$.extend(self, {
		init: function()
		{
			var win = $(window), scroll;

			// Create the BGIFrame element if needed
			if(bgiframe) {
				elems.bgiframe = $('<iframe class="qtip-bgiframe" frameborder="0" tabindex="-1" src="javascript:\'\';" ' +
					' style="display:block; position:absolute; z-index:-1; filter:alpha(opacity=0); ' +
						'-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";"></iframe>');

				// Append the new element to the tooltip
				elems.bgiframe.appendTo(tooltip);

				// Update BGIFrame on tooltip move
				tooltip.bind('tooltipmove'+namespace, self.adjustBGIFrame);	
			}

			// redraw() container for width/height calculations
			redrawContainer = $('<div/>', { id: 'qtip-rcontainer' })
				.appendTo(document.body);

			// Set dimensions
			self.redraw();

			// Fixup modal plugin if present too
			if(elems.overlay && !modalProcessed) {
				scroll = function() {
					elems.overlay[0].style.top = win.scrollTop() + 'px';
				};
				win.bind('scroll.qtip-ie6, resize.qtip-ie6', scroll);
				scroll(); // Fire it initially too

				elems.overlay.addClass('qtipmodal-ie6fix'); // Add fix class

				modalProcessed = TRUE; // Set flag
			}
		},

		adjustBGIFrame: function()
		{
			var dimensions = api.get('dimensions'), // Determine current tooltip dimensions
				plugin = api.plugins.tip,
				tip = elems.tip,
				tipAdjust, offset;

			// Adjust border offset
			offset = parseInt(tooltip.css('border-left-width'), 10) || 0;
			offset = { left: -offset, top: -offset };

			// Adjust for tips plugin
			if(plugin && tip) {
				tipAdjust = (plugin.corner.precedance === 'x') ? ['width', 'left'] : ['height', 'top'];
				offset[ tipAdjust[1] ] -= tip[ tipAdjust[0] ]();
			}

			// Update bgiframe
			elems.bgiframe.css(offset).css(dimensions);
		},

		// Max/min width simulator function
		redraw: function()
		{
			if(api.rendered < 1 || isDrawing) { return self; }

			var style = options.style,
				container = options.position.container,
				perc, width, max, min;

			// Set drawing flag
			isDrawing = 1;

			// If tooltip has a set height/width, just set it... like a boss!
			if(style.height) { tooltip.css(HEIGHT, style.height); }
			if(style.width) { tooltip.css(WIDTH, style.width); }

			// Simulate max/min width if not set width present...
			else {
				// Reset width and add fluid class
				tooltip.css(WIDTH, '').appendTo(redrawContainer);

				// Grab our tooltip width (add 1 if odd so we don't get wrapping problems.. huzzah!)
				width = tooltip.width();
				if(width % 2 < 1) { width += 1; }

				// Grab our max/min properties
				max = tooltip.css('max-width') || '';
				min = tooltip.css('min-width') || '';

				// Parse into proper pixel values
				perc = (max + min).indexOf('%') > -1 ? container.width() / 100 : 0;
				max = ((max.indexOf('%') > -1 ? perc : 1) * parseInt(max, 10)) || width;
				min = ((min.indexOf('%') > -1 ? perc : 1) * parseInt(min, 10)) || 0;

				// Determine new dimension size based on max/min/current values
				width = max + min ? Math.min(Math.max(width, min), max) : width;

				// Set the newly calculated width and remvoe fluid class
				tooltip.css(WIDTH, Math.round(width)).appendTo(container);
			}

			// Set drawing flag
			isDrawing = 0;

			return self;
		},

		destroy: function()
		{
			// Remove iframe
			if(bgiframe) { elems.bgiframe.remove(); }

			// Remove bound events
			tooltip.unbind(namespace);
		}
	});

	self.init();
}

IE6 = PLUGINS.ie6 = function(api)
{
	var self = api.plugins.ie6;
	
	// Proceed only if the browser is IE6
	if(PLUGINS.ie !== 6) { return FALSE; }

	return 'object' === typeof self ? self : (api.plugins.ie6 = new Ie6(api));
};

IE6.initialize = 'render';


}));
}( window, document ));
/*
 * Foundation Responsive Library 4.0.0
 * http://foundation.zurb.com
 * Copyright 2013, ZURB
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
*/

/*jslint unparam: true, browser: true, indent: 2 */

(function () {
  // add dusty browser stuff
  if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp */) {
      "use strict";
   
      if (this == null) {
        throw new TypeError();
      }
   
      var t = Object(this),
          len = t.length >>> 0;
      if (typeof fun != "function") {
        try {
          throw new TypeError();
        } catch (e) {
          return;
        }
      }
   
      var res = [],
          thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          var val = t[i]; // in case fun mutates this
          if (fun && fun.call(thisp, val, i, t)) {
            res.push(val);
          }
        }
      }
   
      return res;
    };

    if (!Function.prototype.bind) {
      Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
          // closest thing possible to the ECMAScript 5 internal IsCallable function
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
     
        var aArgs = Array.prototype.slice.call(arguments, 1), 
            fToBind = this, 
            fNOP = function () {},
            fBound = function () {
              return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
               aArgs.concat(Array.prototype.slice.call(arguments)));
            };
     
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
     
        return fBound;
      };
    }
  }

  // fake stop() for zepto.
  $.fn.stop = $.fn.stop || function() {
    return this;
  };
}());

;(function (window, document, undefined) {
  'use strict';

  window.Foundation = {
    name : 'Foundation',

    version : '4.0.0',

    // global Foundation cache object
    cache : {},

    init : function (scope, libraries, method, options, response, /* internal */ nc) {
      var library_arr,
          args = [scope, method, options, response],
          responses = [],
          nc = nc || false;

      // disable library error catching,
      // used for development only
      if (nc) this.nc = nc;

      // set foundation global scope
      this.scope = scope || this.scope;

      if (libraries && typeof libraries === 'string') {
        if (/off/i.test(libraries)) return this.off();

        library_arr = libraries.split(' ');

        if (library_arr.length > 0) {
          for (var i = library_arr.length - 1; i >= 0; i--) {
            responses.push(this.init_lib(library_arr[i], args));
          }
        }
      } else {
        for (var lib in this.libs) {
          responses.push(this.init_lib(lib, args));
        }
      }

      // if first argument is callback, add to args
      if (typeof libraries === 'function') {
        args.unshift(libraries);
      }

      return this.response_obj(responses, args);
    },

    response_obj : function (response_arr, args) {
      for (var callback in args) {
        if (typeof args[callback] === 'function') {
          return args[callback]({
            errors: response_arr.filter(function (s) {
              if (typeof s === 'string') return s;
            })
          });
        }
      }

      return response_arr;
    },

    init_lib : function (lib, args) {
      return this.trap(function () {
        if (this.libs.hasOwnProperty(lib)) {
          this.patch(this.libs[lib]);
          return this.libs[lib].init.apply(this.libs[lib], args);
        }
      }.bind(this), lib);
    },

    trap : function (fun, lib) {
      if (!this.nc) {
        try {
          return fun();
        } catch (e) {
          return this.error({name: lib, message: 'could not be initialized', more: e.name + ' ' + e.message});
        }
      }

      return fun();
    },

    patch : function (lib) {
      this.fix_outer(lib);
    },

    inherit : function (scope, methods) {
      var methods_arr = methods.split(' ');

      for (var i = methods_arr.length - 1; i >= 0; i--) {
        if (this.lib_methods.hasOwnProperty(methods_arr[i])) {
          this.libs[scope.name][methods_arr[i]] = this.lib_methods[methods_arr[i]];
        }
      }
    },

    libs : {},

    // methods that can be inherited in libraries
    lib_methods : {
      set_data : function (node, data) {
        // this.name references the name of the library calling this method
        var id = this.name + (+new Date());

        Foundation.cache[id] = data;
        node.attr('data-' + this.name + '-id', id);
      },

      get_data : function (node) {
        return Foundation.cache[node.attr('data-' + this.name + '-id')];
      },

      remove_data : function (node) {
        if (node) {
          delete Foundation.cache[node.attr('data-' + this.name + '-id')];
          node.attr('data-' + this.name + '-id', '');
        } else {
          $('[data-' + this.name + '-id]').each(function () {
            delete Foundation.cache[$(this).attr('data-' + this.name + '-id')];
            $(this).attr('data-' + this.name + '-id', '');
          });
        }
      },

      throttle : function(fun, delay) {
        var timer = null;
        return function () {
          var context = this, args = arguments;
          clearTimeout(timer);
          timer = setTimeout(function () {
            fun.apply(context, args);
          }, delay);
        };
      },

      // parses dat-options attribute on page nodes and turns
      // them into an object
      data_options : function (el) {
        var opts = {}, ii, p,
            opts_arr = (el.attr('data-options') || ':').split(';'),
            opts_len = opts_arr.length;

        function trim(str) {
          if (typeof str === 'string') return $.trim(str);
          return str;
        }

        // parse options
        for (ii = opts_len - 1; ii >= 0; ii--) {
          p = opts_arr[ii].split(':');

          if (/true/i.test(p[1])) p[1] = true;
          if (/false/i.test(p[1])) p[1] = false;

          if (p.length === 2) {
            opts[trim(p[0])] = trim(p[1]);
          }
        }

        return opts;
      },

      delay : function (fun, delay) {
        return setTimeout(fun, delay);
      },

      // animated scrolling
      scrollTo : function (el, to, duration) {
        if (duration < 0) return;
        var difference = to - $(window).scrollTop();
        var perTick = difference / duration * 10;

        this.scrollToTimerCache = setTimeout(function() {
          if (!isNaN(parseInt(perTick, 10))) {
            window.scrollTo(0, $(window).scrollTop() + perTick);
            this.scrollTo(el, to, duration - 10);
          }
        }.bind(this), 10);
      },

      // not supported in core Zepto
      scrollLeft : function (el) {
        if (!el.length) return;
        return ('scrollLeft' in el[0]) ? el[0].scrollLeft : el[0].pageXOffset;
      },

      // test for empty object or array
      empty : function (obj) {
        if (obj.length && obj.length > 0)    return false;
        if (obj.length && obj.length === 0)  return true;

        for (var key in obj) {
          if (hasOwnProperty.call(obj, key))    return false;
        }

        return true;
      }
    },

    fix_outer : function (lib) {
      lib.outerHeight = function (el, bool) {
        if (typeof Zepto === 'function') {
          return el.height();
        }

        if (typeof bool !== 'undefined') {
          return el.outerHeight(bool);
        }

        return el.outerHeight();
      };

      lib.outerWidth = function (el) {
        if (typeof Zepto === 'function') {
          return el.width();
        }

        if (typeof bool !== 'undefined') {
          return el.outerWidth(bool);
        }

        return el.outerWidth();
      };
    },

    error : function (error) {
      return error.name + ' ' + error.message + '; ' + error.more;
    },

    // remove all foundation events.
    off: function () {
      $(this.scope).off('.fndtn');
      $(window).off('.fndtn');
      return true;
    },

    zj : function () {
      try {
        return Zepto;
      } catch (e) {
        return jQuery;
      }
    }()
  },

  $.fn.foundation = function () {
    var args = Array.prototype.slice.call(arguments, 0);

    return this.each(function () {
      Foundation.init.apply(Foundation, [this].concat(args));
      return this;
    });
  };

}(this, this.document));

/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.topbar = {
    name : 'topbar',

    version : '4.0.2',

    settings : {
      index : 0,
      stickyClass : 'sticky',
      init : false
    },

    init : function (scope, method, options) {
      console.log('doing the init');
      var self = this;
      this.scope = scope || this.scope;

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method != 'string') {

        $('nav.top-bar').each(function () {
          self.settings.$w = $(window);
          self.settings.$topbar = $(this);
          self.settings.$section = self.settings.$topbar.find('section');
          self.settings.$titlebar = self.settings.$topbar.children('ul').first();


          self.settings.$topbar.data('index', 0);

          var breakpoint = $("<div class='top-bar-js-breakpoint'/>").insertAfter(self.settings.$topbar);
          self.settings.breakPoint = breakpoint.width();
          breakpoint.remove();

          self.assemble();

          if (!self.settings.$topbar.data('height')) self.largestUL();

          if (self.settings.$topbar.parent().hasClass('fixed')) {
            $('body').css('padding-top', this.outerHeight(this.settings.$topbar));
          }
        });

        if (!self.settings.init) {
          this.events();
        }

        return this.settings.init;
      } else {
        // fire method
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope)
        .on('click.fndtn.topbar', '.top-bar .toggle-topbar', function (e) {
          var topbar = $(this).closest('.top-bar'),
              section = topbar.find('section, .section'),
              titlebar = topbar.children('ul').first();

          e.preventDefault();

          if (self.breakpoint()) {
            topbar
              .toggleClass('expanded')
              .css('min-height', '');
          }

          if (!topbar.hasClass('expanded')) {
            section.css({left: '0%'});
            section.find('>.name').css({left: '100%'});
            section.find('li.moved').removeClass('moved');
            topbar.data('index', 0);
          }
        })

        .on('click.fndtn.topbar', '.top-bar .has-dropdown>a', function (e) {
          var topbar = $(this).closest('.top-bar'),
              section = topbar.find('section, .section'),
              titlebar = topbar.children('ul').first();

          if (Modernizr.touch || self.breakpoint()) {
            e.preventDefault();
          }

          if (self.breakpoint()) {
            var $this = $(this),
                $selectedLi = $this.closest('li');

            topbar.data('index', topbar.data('index') + 1);
            $selectedLi.addClass('moved');
            section.css({left: -(100 * topbar.data('index')) + '%'});
            section.find('>.name').css({left: 100 * topbar.data('index') + '%'});

            $this.siblings('ul')
              .height(topbar.data('height') + self.outerHeight(titlebar, true));
            topbar
              .css('min-height', topbar.data('height') + self.outerHeight(titlebar, true) * 2)
          }
      });

      $(window).on('resize.fndtn.topbar', function () {
        if (!this.breakpoint()) {
          $('.top-bar').css('min-height', '');
        }
      }.bind(this));

      // Go up a level on Click
      $(this.scope).on('click.fndtn', '.top-bar .has-dropdown .back', function (e) {
        e.preventDefault();

        var $this = $(this),
            topbar = $this.closest('.top-bar'),
            section = topbar.find('section, .section'),
            $movedLi = $this.closest('li.moved'),
            $previousLevelUl = $movedLi.parent();

        topbar.data('index', topbar.data('index') - 1);
        section.css({left: -(100 * topbar.data('index')) + '%'});
        section.find('>.name').css({'left': 100 * topbar.data('index') + '%'});

        if (topbar.data('index') === 0) {
          topbar.css('min-height', 0);
        }

        setTimeout(function () {
          $movedLi.removeClass('moved');
        }, 300);
      });
    },

    breakpoint : function () {
      return $(window).width() <= this.settings.breakPoint || $('html').hasClass('lt-ie9');
    },

    assemble : function () {
      // Pull element out of the DOM for manipulation
      this.settings.$section.detach();

      this.settings.$section.find('.has-dropdown>a').each(function () {
        var $link = $(this),
            $dropdown = $link.siblings('.dropdown'),
            $titleLi = $('<li class="title back js-generated"><h5><a href="#">&laquo; Back</a></h5></li>');
        // Copy link to subnav
        $dropdown.prepend($titleLi);
      });

      // Put element back in the DOM
      this.settings.$section.appendTo(this.settings.$topbar);

      // check for sticky
      this.sticky();
    },

    largestUL : function () {
      var uls = this.settings.$topbar.find('section ul ul'),
          largest = uls.first(),
          total = 0,
          self = this;

      uls.each(function () {
        if ($(this).children('li').length > largest.children('li').length) {
          largest = $(this);
        }
      });

      largest.children('li').each(function () { total += self.outerHeight($(this), true); });

      this.settings.$topbar.data('height', total);
    },

    sticky : function () {
      var klass = '.' + this.settings.stickyClass;
      if ($(klass).length > 0) {
        var distance = $(klass).length ? $(klass).offset().top: 0,
            $window = $(window);
            var offst = this.outerHeight($('nav.top-bar'))+20;

          $window.scroll(function() {
            if ($window.scrollTop() >= (distance)) {
               $(klass).addClass("fixed");
                 $('body').css('padding-top',offst);
            }

           else if ($window.scrollTop() < distance) {
              $(klass).removeClass("fixed");
              $('body').css('padding-top','0');
           }
        });
      }
    },

    off : function () {
      $(this.scope).off('.fndtn.topbar');
      $(window).off('.fndtn.topbar');
    }
  };
}(Foundation.zj, this, this.document));

this["JST"] = this["JST"] || {};

this["JST"]["templates/profile.underscore"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (!is_user) { 
;__p+='\n    <a class="login" href="'+
(login_url)+
'">Login</a>\n';
 } else { 
;__p+='\n    <img src="http://www.gravatar.com/avatar/21232f297a57a5a743894a0e4a801fc3?size=20&amp;default=mm" alt="admin">\n    <h4>'+
( displayName )+
'</h4>\n';
 } 
;__p+='';
}
return __p;
};

this["JST"]["templates/topbar.underscore"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (options.sticky) { 
;__p+='\n<div class="sticky">\n';
 } 
;__p+='\n\n\n<nav class="top-bar">\n\n    <ul class="title-area">\n      <!-- Title Area -->\n      <li class="name">\n        <h1><a href="/">Garden</a></h1>\n      </li>\n      <!-- Remove the class "menu-icon" to get rid of menu icon. Take out "Menu" to just have icon alone -->\n      <li class="toggle-topbar menu-icon"><a href="#"><span>Menu</span></a></li>\n    </ul>\n\n\n    <section class="top-bar-section">\n        <ul class="left kanso-nav">\n            ';
 _.each(data.grouped_apps.apps, function(app) { 
;__p+='\n            <li>\n                <a href="'+
( app.link )+
'"\n\n                ';
 if (app.db) {  
;__p+='\n                    data-db="'+
(app.db)+
'"\n                ';
 } 
;__p+='\n\n                ';
 if (app.desc) {  
;__p+='\n                    title="'+
(app.desc)+
'"\n                ';
 } 
;__p+='\n\n                >'+
( app.title )+
'</a>\n            </li>\n            ';
 }) 
;__p+='\n\n            ';
 if (data.settingsDoc.top_nav_bar.show_futon) {  
;__p+='\n                <li><a href="/_utils/">Futon</a></li>\n            ';
 } 
;__p+='\n        </ul>\n\n        <!-- Right Nav Section -->\n        <ul class="right">\n          <li class="divider"></li>\n          <li><div id="dashboard-topbar-offline-icon"></div></li>\n          <li class="divider"></li>\n          <li id="dashboard-profile"></li>\n        </ul>\n      </section>\n</nav>\n\n';
 if (options.sticky) { 
;__p+='\n</div>\n';
 } 
;__p+='';
}
return __p;
};
(function (root, factory) {if (typeof exports === 'object') {module.exports = factory(); } else if (typeof define === 'function' && define.amd) {define([],factory); } else { root.garden_menu_widget_extra_css = factory();} }(this, function () {  

return '\n.dashboard-topbar *,.dashboard-topbar \n*:before,.dashboard-topbar \n*:after {\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box; }\n\n.dashboard-topbar html,.dashboard-topbar \nbody {\n  font-size: 16px; }\n\n.dashboard-topbar body {\n  background: white;\n  color: #222222;\n  padding: 0;\n  margin: 0;\n  font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif;\n  font-weight: normal;\n  font-style: normal;\n  line-height: 1;\n  position: relative;\n  -webkit-font-smoothing: antialiased; }\n\n.dashboard-topbar img,.dashboard-topbar \nobject,.dashboard-topbar \nembed {\n  max-width: 100%;\n  height: auto; }\n\n.dashboard-topbar object,.dashboard-topbar \nembed {\n  height: 100%; }\n\n.dashboard-topbar img {\n  -ms-interpolation-mode: bicubic; }\n\n.dashboard-topbar #map_canvas img,.dashboard-topbar \n#map_canvas embed,.dashboard-topbar \n#map_canvas object,.dashboard-topbar \n.map_canvas img,.dashboard-topbar \n.map_canvas embed,.dashboard-topbar \n.map_canvas object {\n  max-width: none !important; }\n\n.dashboard-topbar .left {\n  float: left; }\n\n.dashboard-topbar .right {\n  float: right; }\n\n.dashboard-topbar .text-left {\n  text-align: left; }\n\n.dashboard-topbar .text-right {\n  text-align: right; }\n\n.dashboard-topbar .text-center {\n  text-align: center; }\n\n.dashboard-topbar .text-justify {\n  text-align: justify; }\n\n.dashboard-topbar .hide {\n  display: none; }\n\n.dashboard-topbar img {\n  display: block; }\n\n.dashboard-topbar textarea {\n  height: auto;\n  min-height: 50px; }\n\n.dashboard-topbar select {\n  width: 100%; }\n\n/* Wrapped around .top-bar to contain to grid width */\n.dashboard-topbar .contain-to-grid {\n  width: 100%;\n  background: #111111; }\n\n.dashboard-topbar .fixed {\n  width: 100%;\n  left: 0;\n  position: fixed;\n  top: 0;\n  z-index: 99; }\n\n.dashboard-topbar .top-bar {\n  overflow: hidden;\n  height: 45px;\n  line-height: 45px;\n  position: relative;\n  background: #111111; }\n  .dashboard-topbar .top-bar ul {\n    margin-bottom: 0;\n    list-style: none; }\n  .dashboard-topbar .top-bar .row {\n    max-width: none; }\n  .dashboard-topbar .top-bar form,.dashboard-topbar \n  .top-bar input {\n    margin-bottom: 0; }\n  .dashboard-topbar .top-bar input {\n    height: 2.45em; }\n  .dashboard-topbar .top-bar .button {\n    padding-top: .5em;\n    padding-bottom: .5em;\n    margin-bottom: 0; }\n  .dashboard-topbar .top-bar .title-area {\n    position: relative; }\n  .dashboard-topbar .top-bar .name {\n    height: 45px;\n    margin: 0;\n    font-size: 16px; }\n    .dashboard-topbar .top-bar .name h1 {\n      line-height: 45px;\n      font-size: 1.0625em;\n      margin: 0; }\n      .dashboard-topbar .top-bar .name h1 a {\n        font-weight: bold;\n        color: white;\n        width: 50%;\n        display: block;\n        padding: 0 15px; }\n  .dashboard-topbar .top-bar .toggle-topbar {\n    position: absolute;\n    right: 0;\n    top: 0; }\n    .dashboard-topbar .top-bar .toggle-topbar a {\n      color: white;\n      text-transform: uppercase;\n      font-size: 0.8125em;\n      font-weight: bold;\n      position: relative;\n      display: block;\n      padding: 0 15px;\n      height: 45px;\n      line-height: 45px; }\n    .dashboard-topbar .top-bar .toggle-topbar.menu-icon {\n      right: 15px;\n      top: 50%;\n      margin-top: -16px;\n      padding-left: 40px; }\n      .dashboard-topbar .top-bar .toggle-topbar.menu-icon a {\n        text-indent: -48px;\n        width: 34px;\n        height: 34px;\n        line-height: 33px;\n        padding: 0;\n        color: white; }\n        .dashboard-topbar .top-bar .toggle-topbar.menu-icon a span {\n          position: absolute;\n          right: 0;\n          display: block;\n          width: 16px;\n          height: 0;\n          -webkit-box-shadow: 0 10px 0 1px white, 0 16px 0 1px white, 0 22px 0 1px white;\n          box-shadow: 0 10px 0 1px white, 0 16px 0 1px white, 0 22px 0 1px white; }\n  .dashboard-topbar .top-bar.expanded {\n    height: auto;\n    background: transparent; }\n    .dashboard-topbar .top-bar.expanded .title-area {\n      background: #111111; }\n    .dashboard-topbar .top-bar.expanded .toggle-topbar a {\n      color: #888888; }\n      .dashboard-topbar .top-bar.expanded .toggle-topbar a span {\n        -webkit-box-shadow: 0 10px 0 1px #888888, 0 16px 0 1px #888888, 0 22px 0 1px #888888;\n        box-shadow: 0 10px 0 1px #888888, 0 16px 0 1px #888888, 0 22px 0 1px #888888; }\n\n.dashboard-topbar .top-bar-section {\n  left: 0;\n  position: relative;\n  width: auto;\n  -webkit-transition: left 300ms ease-out;\n  -moz-transition: left 300ms ease-out;\n  transition: left 300ms ease-out; }\n  .dashboard-topbar .top-bar-section ul {\n    width: 100%;\n    height: auto;\n    display: block;\n    background: #333333;\n    font-size: 16px;\n    margin: 0; }\n  .dashboard-topbar .top-bar-section .divider {\n    border-bottom: solid 1px #4d4d4d;\n    border-top: solid 1px #1a1a1a;\n    clear: both;\n    height: 1px;\n    width: 100%; }\n  .dashboard-topbar .top-bar-section ul li > a {\n    display: block;\n    width: 100%;\n    padding: 12px 0 12px 15px;\n    color: white;\n    font-size: 0.8125em;\n    font-weight: bold;\n    background: #333333; }\n    .dashboard-topbar .top-bar-section ul li > a:hover {\n      background: #2b2b2b; }\n    .dashboard-topbar .top-bar-section ul li > a.button {\n      background: #2ba6cb;\n      font-size: 0.8125em; }\n      .dashboard-topbar .top-bar-section ul li > a.button:hover {\n        background: #2284a1; }\n    .dashboard-topbar .top-bar-section ul li > a.button.secondary {\n      background: #e9e9e9; }\n      .dashboard-topbar .top-bar-section ul li > a.button.secondary:hover {\n        background: #d0d0d0; }\n    .dashboard-topbar .top-bar-section ul li > a.button.success {\n      background: #5da423; }\n      .dashboard-topbar .top-bar-section ul li > a.button.success:hover {\n        background: #457a1a; }\n    .dashboard-topbar .top-bar-section ul li > a.button.alert {\n      background: #c60f13; }\n      .dashboard-topbar .top-bar-section ul li > a.button.alert:hover {\n        background: #970b0e; }\n  .dashboard-topbar .top-bar-section ul li.active a {\n    background: #2b2b2b; }\n  .dashboard-topbar .top-bar-section .has-form {\n    padding: 15px; }\n  .dashboard-topbar .top-bar-section .has-dropdown {\n    position: relative; }\n    .dashboard-topbar .top-bar-section .has-dropdown > a:after {\n      content: "";\n      display: block;\n      width: 0;\n      height: 0;\n      border: solid 5px;\n      border-color: transparent transparent transparent rgba(255, 255, 255, 0.5);\n      margin-right: 15px;\n      margin-top: -4.5px;\n      position: absolute;\n      top: 50%;\n      right: 0; }\n    .dashboard-topbar .top-bar-section .has-dropdown.moved {\n      position: static; }\n      .dashboard-topbar .top-bar-section .has-dropdown.moved > .dropdown {\n        visibility: visible; }\n  .dashboard-topbar .top-bar-section .dropdown {\n    position: absolute;\n    left: 100%;\n    top: 0;\n    visibility: hidden;\n    z-index: 99; }\n    .dashboard-topbar .top-bar-section .dropdown li {\n      width: 100%; }\n      .dashboard-topbar .top-bar-section .dropdown li a {\n        font-weight: normal;\n        padding: 8px 15px; }\n    .dashboard-topbar .top-bar-section .dropdown label {\n      padding: 8px 15px 2px;\n      margin-bottom: 0;\n      text-transform: uppercase;\n      color: #555;\n      font-weight: bold;\n      font-size: 0.625em; }\n\n.dashboard-topbar .top-bar-js-breakpoint {\n  width: 58.75em !important;\n  visibility: hidden; }\n\n.dashboard-topbar .js-generated {\n  display: block; }\n\n@media only screen and (min-width: 58.75em) {\n  .dashboard-topbar .top-bar {\n    background: #111111;\n    *zoom: 1;\n    overflow: visible; }.dashboard-topbar \n    .top-bar:before,.dashboard-topbar  .top-bar:after {\n      content: " ";\n      display: table; }.dashboard-topbar \n    .top-bar:after {\n      clear: both; }.dashboard-topbar \n    .top-bar .toggle-topbar {\n      display: none; }.dashboard-topbar \n    .top-bar .title-area {\n      float: left; }.dashboard-topbar \n    .top-bar .name h1 a {\n      width: auto; }.dashboard-topbar \n    .top-bar input,.dashboard-topbar \n    .top-bar .button {\n      line-height: 2em;\n      font-size: 0.875em;\n      height: 2em;\n      padding: 0 10px;\n      position: relative;\n      top: 8px; }.dashboard-topbar \n    .top-bar.expanded {\n      background: #111111; }.dashboard-topbar \n\n  .contain-to-grid .top-bar {\n    max-width: 62.5em;\n    margin: 0 auto; }.dashboard-topbar \n\n  .top-bar-section {\n    -webkit-transition: none 0 0;\n    -moz-transition: none 0 0;\n    transition: none 0 0;\n    left: 0 !important; }.dashboard-topbar \n    .top-bar-section ul {\n      width: auto;\n      height: auto !important;\n      display: inline; }.dashboard-topbar \n      .top-bar-section ul li {\n        float: left; }.dashboard-topbar \n        .top-bar-section ul li .js-generated {\n          display: none; }.dashboard-topbar \n    .top-bar-section li a:not(.button) {\n      padding: 0 15px;\n      line-height: 45px;\n      background: #111111; }.dashboard-topbar \n      .top-bar-section li a:not(.button):hover {\n        background: #2b2b2b; }.dashboard-topbar \n    .top-bar-section .has-dropdown > a {\n      padding-right: 35px !important; }.dashboard-topbar \n      .top-bar-section .has-dropdown > a:after {\n        content: "";\n        display: block;\n        width: 0;\n        height: 0;\n        border: solid 5px;\n        border-color: rgba(255, 255, 255, 0.5) transparent transparent transparent;\n        margin-top: -2.5px; }.dashboard-topbar \n    .top-bar-section .has-dropdown.moved {\n      position: relative; }.dashboard-topbar \n      .top-bar-section .has-dropdown.moved > .dropdown {\n        visibility: hidden; }.dashboard-topbar \n    .top-bar-section .has-dropdown:hover > .dropdown,.dashboard-topbar  .top-bar-section .has-dropdown:active > .dropdown {\n      visibility: visible; }.dashboard-topbar \n    .top-bar-section .has-dropdown .dropdown li.has-dropdown > a:after {\n      border: none;\n      content: "\\00bb";\n      margin-top: -7px;\n      right: 5px; }.dashboard-topbar \n    .top-bar-section .dropdown {\n      left: 0;\n      top: auto;\n      background: transparent; }.dashboard-topbar \n      .top-bar-section .dropdown li a {\n        line-height: 1;\n        white-space: nowrap;\n        padding: 7px 15px;\n        background: #1e1e1e; }.dashboard-topbar \n      .top-bar-section .dropdown li label {\n        white-space: nowrap;\n        background: #1e1e1e; }.dashboard-topbar \n      .top-bar-section .dropdown li .dropdown {\n        left: 100%;\n        top: 0; }.dashboard-topbar \n    .top-bar-section > ul > .divider {\n      border-bottom: none;\n      border-top: none;\n      border-right: solid 1px #2b2b2b;\n      border-left: solid 1px black;\n      clear: none;\n      height: 45px;\n      width: 0px; }.dashboard-topbar \n    .top-bar-section .has-form {\n      background: #111111;\n      padding: 0 15px;\n      height: 45px; }.dashboard-topbar \n    .top-bar-section ul.right li .dropdown {\n      left: auto;\n      right: 0; }.dashboard-topbar \n      .top-bar-section ul.right li .dropdown li .dropdown {\n        right: 100%; } }\n\n/*!\n * qTip2 - Pretty powerful tooltips - v2.0.1-25-\n * http://qtip2.com\n *\n * Copyright (c) 2013 Craig Michael Thompson\n * Released under the MIT, GPL licenses\n * http://jquery.org/license\n *\n * Date: Wed Feb 20 2013 11:04 GMT+0000\n * Plugins: svg ajax tips modal viewport imagemap ie6\n * Styles: basic css3\n */\n\n/* Core qTip styles */\n.qtip, .qtip{\n\tposition: absolute;\n\tleft: -28000px;\n\ttop: -28000px;\n\tdisplay: none;\n\n\tmax-width: 280px;\n\tmin-width: 50px;\n\t\n\tfont-size: 10.5px;\n\tline-height: 12px;\n\n\tdirection: ltr;\n}\n\n\t.qtip-content{\n\t\tposition: relative;\n\t\tpadding: 5px 9px;\n\t\toverflow: hidden;\n\n\t\ttext-align: left;\n\t\tword-wrap: break-word;\n\t}\n\n\t.qtip-titlebar{\n\t\tposition: relative;\n\t\tpadding: 5px 35px 5px 10px;\n\t\toverflow: hidden;\n\n\t\tborder-width: 0 0 1px;\n\t\tfont-weight: bold;\n\t}\n\n\t.qtip-titlebar + .qtip-content{ border-top-width: 0 !important; }\n\n\t/* Default close button class */\n\t.qtip-close{\n\t\tposition: absolute;\n\t\tright: -9px; top: -9px;\n\n\t\tcursor: pointer;\n\t\toutline: medium none;\n\n\t\tborder-width: 1px;\n\t\tborder-style: solid;\n\t\tborder-color: transparent;\n\t}\n\n\t\t.qtip-titlebar .qtip-close{\n\t\t\tright: 4px; top: 50%;\n\t\t\tmargin-top: -9px;\n\t\t}\n\t\n\t\t* html .qtip-titlebar .qtip-close{ top: 16px; } /* IE fix */\n\n\t\t.qtip-titlebar .ui-icon,\n\t\t.qtip-icon .ui-icon{\n\t\t\tdisplay: block;\n\t\t\ttext-indent: -1000em;\n\t\t\tdirection: ltr;\n\t\t\tvertical-align: middle;\n\t\t}\n\n\t\t.qtip-icon, .qtip-icon .ui-icon{\n\t\t\t-moz-border-radius: 3px;\n\t\t\t-webkit-border-radius: 3px;\n\t\t\tborder-radius: 3px;\n\t\t\ttext-decoration: none;\n\t\t}\n\n\t\t\t.qtip-icon .ui-icon{\n\t\t\t\twidth: 18px;\n\t\t\t\theight: 14px;\n\n\t\t\t\ttext-align: center;\n\t\t\t\ttext-indent: 0;\n\t\t\t\tfont: normal bold 10px/13px Tahoma,sans-serif;\n\n\t\t\t\tcolor: inherit;\n\t\t\t\tbackground: transparent none no-repeat -100em -100em;\n\t\t\t}\n\n\n/* Applied to \'focused\' tooltips e.g. most recently displayed/interacted with */\n.qtip-focus{}\n\n/* Applied on hover of tooltips i.e. added/removed on mouseenter/mouseleave respectively */\n.qtip-hover{}\n\n/* Default tooltip style */\n.qtip-default{\n\tborder-width: 1px;\n\tborder-style: solid;\n\tborder-color: #F1D031;\n\n\tbackground-color: #FFFFA3;\n\tcolor: #555;\n}\n\n\t.qtip-default .qtip-titlebar{\n\t\tbackground-color: #FFEF93;\n\t}\n\n\t.qtip-default .qtip-icon{\n\t\tborder-color: #CCC;\n\t\tbackground: #F1F1F1;\n\t\tcolor: #777;\n\t}\n\t\n\t.qtip-default .qtip-titlebar .qtip-close{\n\t\tborder-color: #AAA;\n\t\tcolor: #111;\n\t}\n\n\n/*! Light tooltip style */\n.qtip-light{\n\tbackground-color: white;\n\tborder-color: #E2E2E2;\n\tcolor: #454545;\n}\n\n\t.qtip-light .qtip-titlebar{\n\t\tbackground-color: #f1f1f1;\n\t}\n\n\n/*! Dark tooltip style */\n.qtip-dark{\n\tbackground-color: #505050;\n\tborder-color: #303030;\n\tcolor: #f3f3f3;\n}\n\n\t.qtip-dark .qtip-titlebar{\n\t\tbackground-color: #404040;\n\t}\n\n\t.qtip-dark .qtip-icon{\n\t\tborder-color: #444;\n\t}\n\n\t.qtip-dark .qtip-titlebar .ui-state-hover{\n\t\tborder-color: #303030;\n\t}\n\n\n/*! Cream tooltip style */\n.qtip-cream{\n\tbackground-color: #FBF7AA;\n\tborder-color: #F9E98E;\n\tcolor: #A27D35;\n}\n\n\t.qtip-cream .qtip-titlebar{\n\t\tbackground-color: #F0DE7D;\n\t}\n\n\t.qtip-cream .qtip-close .qtip-icon{\n\t\tbackground-position: -82px 0;\n\t}\n\n\n/*! Red tooltip style */\n.qtip-red{\n\tbackground-color: #F78B83;\n\tborder-color: #D95252;\n\tcolor: #912323;\n}\n\n\t.qtip-red .qtip-titlebar{\n\t\tbackground-color: #F06D65;\n\t}\n\n\t.qtip-red .qtip-close .qtip-icon{\n\t\tbackground-position: -102px 0;\n\t}\n\n\t.qtip-red .qtip-icon{\n\t\tborder-color: #D95252;\n\t}\n\n\t.qtip-red .qtip-titlebar .ui-state-hover{\n\t\tborder-color: #D95252;\n\t}\n\n\n/*! Green tooltip style */\n.qtip-green{\n\tbackground-color: #CAED9E;\n\tborder-color: #90D93F;\n\tcolor: #3F6219;\n}\n\n\t.qtip-green .qtip-titlebar{\n\t\tbackground-color: #B0DE78;\n\t}\n\n\t.qtip-green .qtip-close .qtip-icon{\n\t\tbackground-position: -42px 0;\n\t}\n\n\n/*! Blue tooltip style */\n.qtip-blue{\n\tbackground-color: #E5F6FE;\n\tborder-color: #ADD9ED;\n\tcolor: #5E99BD;\n}\n\n\t.qtip-blue .qtip-titlebar{\n\t\tbackground-color: #D0E9F5;\n\t}\n\n\t.qtip-blue .qtip-close .qtip-icon{\n\t\tbackground-position: -2px 0;\n\t}\n\n\n/* Add shadows to your tooltips in: FF3+, Chrome 2+, Opera 10.6+, IE9+, Safari 2+ */\n.qtip-shadow{\n\t-webkit-box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.15);\n\t-moz-box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.15);\n\tbox-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.15);\n}\n\n/* Add rounded corners to your tooltips in: FF3+, Chrome 2+, Opera 10.6+, IE9+, Safari 2+ */\n.qtip-rounded,\n.qtip-tipsy,\n.qtip-bootstrap{\n\t-moz-border-radius: 5px;\n\t-webkit-border-radius: 5px;\n\tborder-radius: 5px;\n}\n\n.qtip-rounded .qtip-titlebar{\n\t-moz-border-radius: 5px 5px 0 0;\n\t-webkit-border-radius: 5px 5px 0 0;\n\tborder-radius: 5px 5px 0 0;\n}\n\n/* Youtube tooltip style */\n.qtip-youtube{\n\t-moz-border-radius: 2px;\n\t-webkit-border-radius: 2px;\n\tborder-radius: 2px;\n\t\n\t-webkit-box-shadow: 0 0 3px #333;\n\t-moz-box-shadow: 0 0 3px #333;\n\tbox-shadow: 0 0 3px #333;\n\n\tcolor: white;\n\tborder-width: 0;\n\n\tbackground: #4A4A4A;\n\tbackground-image: -webkit-gradient(linear,left top,left bottom,color-stop(0,#4A4A4A),color-stop(100%,black));\n\tbackground-image: -webkit-linear-gradient(top,#4A4A4A 0,black 100%);\n\tbackground-image: -moz-linear-gradient(top,#4A4A4A 0,black 100%);\n\tbackground-image: -ms-linear-gradient(top,#4A4A4A 0,black 100%);\n\tbackground-image: -o-linear-gradient(top,#4A4A4A 0,black 100%);\n}\n\n\t.qtip-youtube .qtip-titlebar{\n\t\tbackground-color: #4A4A4A;\n\t\tbackground-color: rgba(0,0,0,0);\n\t}\n\t\n\t.qtip-youtube .qtip-content{\n\t\tpadding: .75em;\n\t\tfont: 12px arial,sans-serif;\n\t\t\n\t\tfilter: progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr=#4a4a4a,EndColorStr=#000000);\n\t\t-ms-filter: "progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr=#4a4a4a,EndColorStr=#000000);";\n\t}\n\n\t.qtip-youtube .qtip-icon{\n\t\tborder-color: #222;\n\t}\n\n\t.qtip-youtube .qtip-titlebar .ui-state-hover{\n\t\tborder-color: #303030;\n\t}\n\n\n/* jQuery TOOLS Tooltip style */\n.qtip-jtools{\n\tbackground: #232323;\n\tbackground: rgba(0, 0, 0, 0.7);\n\tbackground-image: -webkit-gradient(linear, left top, left bottom, from(#717171), to(#232323));\n\tbackground-image: -moz-linear-gradient(top, #717171, #232323);\n\tbackground-image: -webkit-linear-gradient(top, #717171, #232323);\n\tbackground-image: -ms-linear-gradient(top, #717171, #232323);\n\tbackground-image: -o-linear-gradient(top, #717171, #232323);\n\n\tborder: 2px solid #ddd;\n\tborder: 2px solid rgba(241,241,241,1);\n\n\t-moz-border-radius: 2px;\n\t-webkit-border-radius: 2px;\n\tborder-radius: 2px;\n\n\t-webkit-box-shadow: 0 0 12px #333;\n\t-moz-box-shadow: 0 0 12px #333;\n\tbox-shadow: 0 0 12px #333;\n}\n\n\t/* IE Specific */\n\t.qtip-jtools .qtip-titlebar{\n\t\tbackground-color: transparent;\n\t\tfilter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#717171,endColorstr=#4A4A4A);\n\t\t-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorstr=#717171,endColorstr=#4A4A4A)";\n\t}\n\t.qtip-jtools .qtip-content{\n\t\tfilter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#4A4A4A,endColorstr=#232323);\n\t\t-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorstr=#4A4A4A,endColorstr=#232323)";\n\t}\n\n\t.qtip-jtools .qtip-titlebar,\n\t.qtip-jtools .qtip-content{\n\t\tbackground: transparent;\n\t\tcolor: white;\n\t\tborder: 0 dashed transparent;\n\t}\n\n\t.qtip-jtools .qtip-icon{\n\t\tborder-color: #555;\n\t}\n\n\t.qtip-jtools .qtip-titlebar .ui-state-hover{\n\t\tborder-color: #333;\n\t}\n\n\n/* Cluetip style */\n.qtip-cluetip{\n\t-webkit-box-shadow: 4px 4px 5px rgba(0, 0, 0, 0.4);\n\t-moz-box-shadow: 4px 4px 5px rgba(0, 0, 0, 0.4);\n\tbox-shadow: 4px 4px 5px rgba(0, 0, 0, 0.4);\n\n\tbackground-color: #D9D9C2;\n\tcolor: #111;\n\tborder: 0 dashed transparent;\n}\n\n\t.qtip-cluetip .qtip-titlebar{\n\t\tbackground-color: #87876A;\n\t\tcolor: white;\n\t\tborder: 0 dashed transparent;\n\t}\n\t\n\t.qtip-cluetip .qtip-icon{\n\t\tborder-color: #808064;\n\t}\n\t\n\t.qtip-cluetip .qtip-titlebar .ui-state-hover{\n\t\tborder-color: #696952;\n\t\tcolor: #696952;\n\t}\n\n\n/* Tipsy style */\n.qtip-tipsy{\n\tbackground: black;\n\tbackground: rgba(0, 0, 0, .87);\n\n\tcolor: white;\n\tborder: 0 solid transparent;\n\n\tfont-size: 11px;\n\tfont-family: \'Lucida Grande\', sans-serif;\n\tfont-weight: bold;\n\tline-height: 16px;\n\ttext-shadow: 0 1px black;\n}\n\n\t.qtip-tipsy .qtip-titlebar{\n\t\tpadding: 6px 35px 0 10;\n\t\tbackground-color: transparent;\n\t}\n\n\t.qtip-tipsy .qtip-content{\n\t\tpadding: 6px 10;\n\t}\n\t\n\t.qtip-tipsy .qtip-icon{\n\t\tborder-color: #222;\n\t\ttext-shadow: none;\n\t}\n\n\t.qtip-tipsy .qtip-titlebar .ui-state-hover{\n\t\tborder-color: #303030;\n\t}\n\n\n/* Tipped style */\n.qtip-tipped{\n\tborder: 3px solid #959FA9;\n\n\t-moz-border-radius: 3px;\n\t-webkit-border-radius: 3px;\n\tborder-radius: 3px;\n\n\tbackground-color: #F9F9F9;\n\tcolor: #454545;\n\n\tfont-weight: normal;\n\tfont-family: serif;\n}\n\n\t.qtip-tipped .qtip-titlebar{\n\t\tborder-bottom-width: 0;\n\n\t\tcolor: white;\n\t\tbackground: #3A79B8;\n\t\tbackground-image: -webkit-gradient(linear, left top, left bottom, from(#3A79B8), to(#2E629D));\n\t\tbackground-image: -webkit-linear-gradient(top, #3A79B8, #2E629D);\n\t\tbackground-image: -moz-linear-gradient(top, #3A79B8, #2E629D);\n\t\tbackground-image: -ms-linear-gradient(top, #3A79B8, #2E629D);\n\t\tbackground-image: -o-linear-gradient(top, #3A79B8, #2E629D);\n\t\tfilter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#3A79B8,endColorstr=#2E629D);\n\t\t-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorstr=#3A79B8,endColorstr=#2E629D)";\n\t}\n\n\t.qtip-tipped .qtip-icon{\n\t\tborder: 2px solid #285589;\n\t\tbackground: #285589;\n\t}\n\n\t\t.qtip-tipped .qtip-icon .ui-icon{\n\t\t\tbackground-color: #FBFBFB;\n\t\t\tcolor: #555;\n\t\t}\n\n\n/**\n * Twitter Bootstrap style.\n *\n * Tested with IE 8, IE 9, Chrome 18, Firefox 9, Opera 11.\n * Does not work with IE 7.\n */\n.qtip-bootstrap{\n\t/** Taken from Bootstrap body */\n\tfont-size: 14px;\n\tline-height: 20px;\n\tcolor: #333333;\n\n\t/** Taken from Bootstrap .popover */\n\tpadding: 1px;\n\tbackground-color: #ffffff;\n\tborder: 1px solid #ccc;\n\tborder: 1px solid rgba(0, 0, 0, 0.2);\n\t-webkit-border-radius: 6px;\n\t-moz-border-radius: 6px;\n\tborder-radius: 6px;\n\t-webkit-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\n\t-moz-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\n\tbox-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\n\t-webkit-background-clip: padding-box;\n\t-moz-background-clip: padding;\n\tbackground-clip: padding-box;\n}\n\n\t.qtip-bootstrap .qtip-titlebar{\n\t\t/** Taken from Bootstrap .popover-title */\n\t\tpadding: 8px 14px;\n\t\tmargin: 0;\n\t\tfont-size: 14px;\n\t\tfont-weight: normal;\n\t\tline-height: 18px;\n\t\tbackground-color: #f7f7f7;\n\t\tborder-bottom: 1px solid #ebebeb;\n\t\t-webkit-border-radius: 5px 5px 0 0;\n\t\t-moz-border-radius: 5px 5px 0 0;\n\t\tborder-radius: 5px 5px 0 0;\n\t}\n\n\t\t.qtip-bootstrap .qtip-titlebar .qtip-close{\n\t\t\t/**\n\t\t\t * Overrides qTip2:\n\t\t\t * .qtip-titlebar .qtip-close{\n\t\t\t *   [...]\n\t\t\t *   right: 4px;\n\t\t\t *   top: 50%;\n\t\t\t *   [...]\n\t\t\t *   border-style: solid;\n\t\t\t * }\n\t\t\t */\n\t\t\tright: 11px;\n\t\t\ttop: 45%;\n\t\t\tborder-style: none;\n\t\t}\n\n\t.qtip-bootstrap .qtip-content{\n\t\t/** Taken from Bootstrap .popover-content */\n\t\tpadding: 9px 14px;\n\t}\n\n\t.qtip-bootstrap .qtip-icon{\n\t\t/**\n\t\t * Overrides qTip2:\n\t\t * .qtip-default .qtip-icon {\n\t\t *   border-color: #CCC;\n\t\t *   background: #F1F1F1;\n\t\t *   color: #777;\n\t\t * }\n\t\t */\n\t\tbackground: transparent;\n\t}\n\n\t\t.qtip-bootstrap .qtip-icon .ui-icon{\n\t\t\t/**\n\t\t\t * Overrides qTip2:\n\t\t\t * .qtip-icon .ui-icon{\n\t\t\t *   width: 18px;\n\t\t\t *   height: 14px;\n\t\t\t * }\n\t\t\t */\n\t\t\twidth: auto;\n\t\t\theight: auto;\n\n\t\t\t/* Taken from Bootstrap .close */\n\t\t\tfloat: right;\n\t\t\tfont-size: 20px;\n\t\t\tfont-weight: bold;\n\t\t\tline-height: 18px;\n\t\t\tcolor: #000000;\n\t\t\ttext-shadow: 0 1px 0 #ffffff;\n\t\t\topacity: 0.2;\n\t\t\tfilter: alpha(opacity=20);\n\t\t}\n\n\t\t.qtip-bootstrap .qtip-icon .ui-icon:hover{\n\t\t\t/* Taken from Bootstrap .close:hover */\n\t\t\tcolor: #000000;\n\t\t\ttext-decoration: none;\n\t\t\tcursor: pointer;\n\t\t\topacity: 0.4;\n\t\t\tfilter: alpha(opacity=40);\n\t\t}\n\n\n/* IE9 fix - removes all filters */\n.qtip:not(.ie9haxors) div.qtip-content,\n.qtip:not(.ie9haxors) div.qtip-titlebar{\n\tfilter: none;\n\t-ms-filter: none;\n}\n\n\n/* Tips plugin */\n.qtip .qtip-tip{\n\tmargin: 0 auto;\n\toverflow: hidden;\n\tz-index: 10;\n\t\n}\n\n\t/* Opera bug #357 - Incorrect tip position\n\thttps://github.com/Craga89/qTip2/issues/367 */\n\tx:-o-prefocus, .qtip .qtip-tip{\n\t\tvisibility: hidden;\n\t}\n\n\t.qtip .qtip-tip,\n\t.qtip .qtip-tip .qtip-vml,\n\t.qtip .qtip-tip canvas{\n\t\tposition: absolute;\n\n\t\tcolor: #123456;\n\t\tbackground: transparent;\n\t\tborder: 0 dashed transparent;\n\t}\n\t\n\t.qtip .qtip-tip canvas{ top: 0; left: 0; }\n\n\t.qtip .qtip-tip .qtip-vml{\n\t\tbehavior: url(#default#VML);\n\t\tdisplay: inline-block;\n\t\tvisibility: visible;\n\t}\n/* Modal plugin */\n#qtip-overlay{\n\tposition: fixed;\n\tleft: -10000em;\n\ttop: -10000em;\n}\n\n\t/* Applied to modals with show.modal.blur set to true */\n\t#qtip-overlay.blurs{ cursor: pointer; }\n\n\t/* Change opacity of overlay here */\n\t#qtip-overlay div{\n\t\tposition: absolute;\n\t\tleft: 0; top: 0;\n\t\twidth: 100%; height: 100%;\n\n\t\tbackground-color: black;\n\n\t\topacity: 0.7;\n\t\tfilter:alpha(opacity=70);\n\t\t-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=70)";\n\t}\n\n\n/* IE6 Modal plugin fix */\n.qtipmodal-ie6fix{\n\tposition: absolute !important;\n}'
  }));

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(['bowser'],factory);
    } else {
        root.garden_menu_widget_css = factory(root.bowser);
    }
}(this, function (bowser) {

function getTopbarBackground(from, to) {
    // also check version
    if (bowser.webkit) return '-webkit-linear-gradient('+from+','+to+')';
    if (bowser.opera ) return '-o-linear-gradient('+from+','+to+')';
    if (bowser.mozilla) return '-moz-linear-gradient('+from+','+to+')';
    return 'linear-gradient('+from+','+to+')';
}


var css =  {

// These are missing from the foundation css, but seem to be needed:

'#dashboard-topbar' : {
    'color': '#222222',
    'font-family': '"Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif',
    'font-weight': 'normal',
    'font-style': 'normal',
    'font-size': '16px',
    '-webkit-font-smoothing': 'antialiased',
    'text-shadow': 'none'
},


'.dashboard-topbar div, .dashboard-topbar dl, .dashboard-topbar dt, .dashboard-topbar dd, .dashboard-topbar ul, .dashboard-topbar ol, .dashboard-topbar li, .dashboard-topbar h1, .dashboard-topbar h2, .dashboard-topbar h3, .dashboard-topbar h4, .dashboard-topbar h5, .dashboard-topbar h6' : {
    'margin': '0',
    'padding': '0',
    'direction': 'ltr'
},

'#dashboard-topbar .top-bar-section .right': {
    'background-color': '#111111'
},

'#dashboard-topbar .top-bar.expanded .top-bar-section .right': {
    'background-color': '#333333'
},

'#dashboard-topbar a' : {
  'text-decoration': 'none',
  'text-shadow': 'none'
},
'#dashboard-topbar a img': {
    'border': 'none'
},


'#dashboard-topbar-offline-icon' : {
    'cursor': 'pointer',
    'padding': '0 5px',
    'height': '45px'

},

'#dashboard-topbar-offline-icon:hover' : {

},

'#dashboard-topbar-offline-icon svg' : {
    'margin-top': '12px',
    'shape-rendering': 'auto'
    // 'position': 'relative',
    // 'top': '2px',
    // 'left': '2px'
}


};  // end of css block


return function(options) {
    if (options.position) {
        css['#dashboard-topbar'].position = options.position;
    }
    if (options.position === 'fixed') {
        css['#dashboard-topbar'].top = "0";
        css['#dashboard-topbar'].width = "100%";
        css['#dashboard-topbar']['z-index'] = "1000";
    }
    return css;
};


}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            'jquery',
            'underscore',
            'events',
            'url',
            'garden-menu',
            'jscss',
            './src/garden-menu-widget.css.js',
            './dist/compiled_css.js',
            'modernizer',
            'bowser',
            'svg',
            'sync-status-icon'
        ],factory);
    } else {
        root.garden_menu_widget = factory(
            root.jQuery,
            root._,
            root.events,
            root.url,
            root.garden_menu,
            root.jscss,
            root.garden_menu_widget_css,
            root.garden_menu_widget_extra_css,
            root.Modernizr,
            root.bowser,
            root.svg,
            root.SyncIcon,
            root.JST["templates/topbar.underscore"],
            root.JST["templates/profile.underscore"]
        );
    }
}(this, function ($, _, events, url, GardenMenu, jscss, css, extra_css, Modernizr, bowser, svg, SyncIcon, topbar_t, profile_t) {


var app = function(dashboard_db_url, options) {
    if (!options) options = {};
    this.dashboard_db_url = dashboard_db_url;

    var defaults = {
        disablePouch: true,
        showSession: true,
        divSelector: 'body',
        sticky: false,
        position: 'relative'
    };

    // adjust defaults for pouch based on env
    if (Modernizr.indexeddb || Modernizr.websqldatabase) {
        defaults.disablePouch = false;
    }
    // also check version
    if (bowser.firefox && bowser.version < 12) {
        defaults.disablePouch= true;
    }
    if (bowser.opera && bowser.version < 12) {
        defaults.disablePouch= true;
    }
    if (bowser.chrome && bowser.version < 19) {
        defaults.disablePouch= true;
    }
    if (bowser.safari && bowser.version <= 5) {
        defaults.disablePouch= true;
    }
    if (bowser.iphone && bowser.version <= 5) {
        defaults.disablePouch= true;
    }

    this.options = _.extend(defaults, options);
    this.emitter = new events.EventEmitter();
    this.garden_menu = new GardenMenu(dashboard_db_url, this.options);
};


app.prototype.init = function(callback) {
    var widget = this;
    widget.last_state = null;
    widget.garden_menu.init(function(err, results){


        widget.core = results.core;
        widget.garden_menu.getAppLinks(function(err, links){

            if (err) return callback(err);
            widget.loadTopbar(links, function(err){

                if (widget.options.showSession) {
                    widget.cachedLinks = links;
                    widget.core.getCachedSession(function(err, session){
                        widget.last_user = session.userCtx.name;
                        widget.showSession(session);
                    });

                    widget.poll_interval = setInterval(function() { widget.poll(); }, 10000);
                }

                callback(err);
            });
        });
    });
};


app.prototype.poll = function() {
    this.core.poll();
};

// emitter things..
app.prototype.on = function(event, listener) {
    this.emitter.on(event, listener);
};

app.prototype.once = function(event, listener) {
    this.emitter.once(event, listener);
};

app.prototype.removeListener = function(event, listener) {
    this.emitter.removeListener(event, listener);
};


app.prototype.loadTopbar = function(data, callback) {
    var me = this;



    jscss.embed(extra_css);

    // the computed styles always win
    jscss.embed(jscss.compile(css(me.options)));

    var $topbar = $('#dashboard-topbar');
    if ($topbar.length === 0) {
        $topbar = $('<div id="dashboard-topbar"></div>');
        $(me.options.divSelector).prepend($topbar);
    }

    // for the new foundation prefixed stuff
    $topbar.addClass('dashboard-topbar');

    $topbar.html(topbar_t({data: data, options: me.options } ));

    $(document).foundation();
    var path = window.location.pathname;

    // highlight the best thing
    var dash = $topbar.find('a.home').attr('href');
    if (dash == path)  $topbar.find('a.home').addClass('active');

    var login = $topbar.find('#dashboard-topbar-session a').attr('href');
    if (login == path)  $topbar.find('#dashboard-topbar-session').addClass('active');

    /**
     *  does a head check to the db. before allowing the link to pass.
     * This double checks the user can login to the link.
     * THis is to prevent the dreaded json error.
     * @param link
     */
    var addNotLoggedInHack = function(link) {
        var db = link.data('db');
        if (db) {

            // only if online check the head
            $(link).bind('click', function(){
                var state = me.core.getState();
                if (state.indexOf('OFFLINE') === 0) return true;

               $(this).removeClass('hover');
                var pass;
                $.ajax({
                    url : '/dashboard/_design/dashboard/_rewrite/_couch/' + db,
                     type: 'HEAD',
                     dataType: 'json',
                     cache: "false",
                     async: false,
                     success: function(data, a){
                        pass = true;
                     },
                     error  : function(err, b, c) {
                        pass = false;
                        app.log('Access Denied.', {center:true});
                     }

                 });
                return pass;

            });
        }
    };

    $('#dashboard-topbar ul.kanso-nav li').each(function(i) {
        var link = $(this).find('a');
        var href = link.attr('href');
        if ($(this).hasClass('home')) {
            if (href == path){
                $(this).addClass('active');
                link.addClass('active');
            }
        } else {
            if (path.indexOf(href) === 0) {
                $(this).addClass('active');
                link.addClass('active');
            }
            addNotLoggedInHack(link);
        }
    });

    $('#dashboard-topbar a').each(function(){
        var $a = $(this);
        var href = $a.attr('href');
        if ((path.indexOf(href) === 0 ) && ($a.data('remote_user_warn')) ){
            var remote_user = $a.data('remote_user');
            setTimeout(function(){
                if(confirm('Warning: The recommended user for this db is '+remote_user+'. Do you want to login as that user?')) {
                    window.location = $('#dashboard-topbar-session').data('login') + "?redirect=" + encodeURIComponent(window.location) + '&user=' + encodeURIComponent(remote_user);
                }
            }, 10);
        }
    });

    $('#dashboard-topbar .more-apps').click(function(){
        var me = $(this);
        var menu = $('#dashboard-more-apps');

        var left = me.position().left;
        menu.css('left', left + 'px').toggle(0, function(){
            if (menu.is(':visible')) me.addClass('dashboard-menu-highlight');
            else me.removeClass('dashboard-menu-highlight');
        });
        $(document).one('click', function() {
            me.removeClass('dashboard-menu-highlight');
            $('#dashboard-more-apps').hide();
        });
        return false;
    });


    $('#dashboard-topbar .username').click(function() {
        $('#dashboard-profile').toggle();
        $(document).one('click', function() {
            $('#dashboard-profile').hide();
        });
        return false;
    });

    $('#dashboard-topbar .logout').click(logout);



    // Add a desciption tip
    $('#dashboard-topbar a[title]').qtip({
        show: {
            delay: 2000
        },
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        style: {
            classes: 'qtip-tipsy qtip-shadow'
        }
    });


    if (!me.options.disablePouch && !data.no_db_file) {
        // add a sync icon
        me.sync_icon = new SyncIcon('dashboard-topbar-offline-icon', {
            size: 21,
            state: mapCoreStatesToDisplay(me.core.getState())
        });


        // bind state changes.
        me.core.bind(function(event, old_state, new_state) {
            // filter some chaff
            if ((old_state !== 'FIRST_VISIT' && new_state !=='FIRST_VISIT') && (me.last_state === new_state)) return;


            // show the sync state
            var display_state = mapCoreStatesToDisplay(new_state);
            if (new_state === 'FIRST_VISIT' && me.sync_icon.getState() === 'syncing') {
                // not sure... for now do nothing...
            } else {
                me.sync_icon[display_state]();
            }

            me.core.getCachedSession(function(err, session){
                if (session.userCtx.name === me.last_user) return;
                me.showSession(session);
                me.last_user = session.userCtx.name;
            });
            me.last_state = new_state;
        });

        // on click on sync icon
        $('#dashboard-topbar-offline-icon').click(function(){
            var state = me.core.getState();
            if (state === 'FIRST_VISIT') {
                me.sync_icon.syncing();
                me.core.sync();
            }
        });
    } else {
        $('#dashboard-topbar-offline-icon').hide();
    }

    if (callback) callback(null);
    $topbar.data('ready', true);
    this.emitter.emit('loaded');
};


app.prototype.showSession = function(session) {


    session.is_user = (session.userCtx.name || false);

    session.displayName = session.userCtx.name;
    session.login_url = this.cachedLinks.login_url;

    session.login_url = session.login_url + "?redirect=" + encodeURIComponent(window.location);

    $('#dashboard-profile').html(profile_t(session));
};



function mapCoreStatesToDisplay(core_state) {
        if (core_state === 'FIRST_VISIT') return "disabled";
        if (core_state === 'OFFLINE_NO_HOPE') return "disabled";
        if (core_state === 'READY_LOCAL_DB_UNSUPPORTED') return "disabled";
        if (core_state === 'OFFLINE_WITH_USER') return "offline";
        if (core_state === 'OFFLINE_WITHOUT_USER') return "offline";
        if (core_state === 'ONLINE_WITH_USER') return "online";
        if (core_state === 'ONLINE_WITHOUT_USER') return "online";
}


function logout() {
    // only if online


    $.ajax({
        url : '/dashboard/_design/dashboard/_rewrite/_couch/_session',
        type: 'DELETE',
        dataType: 'json',
        success: function(){
            var isOkToReload = checkLogoutDestination();
            if (isOkToReload) {
                window.location.reload();
            } else {
                window.location = $('#dashboard-topbar-session').data('login');
            }
        },
        error  : function() {
            alert('error loging out.');
        }
     });
    return false;
}


function checkLogoutDestination() {
    var pass;
    $.ajax({
        url : window.location,
        type: 'HEAD',
        async: false,
        success: function(data){
            pass = true;
        },
        error  : function() {
            pass = false;
        }

    });
    return pass;
}





// stuff for notifications
app.log = function(msg, options) {
    if (!options) options = {};
    // Use the last visible jGrowl qtip as our positioning target
    var target = $('.qtip.cluetip:visible:last'),
        my = 'top right',
        at = (target.length ? 'bottom' : 'top') + ' right';

    if (options.center) {
        my = 'center center';
        at = 'center center';
    }

    // Create your jGrowl qTip...
    $(document.body).qtip({
        // Any content config you want here really.... go wild!
        content: {
            text: msg
        },
        position: {
            my: my,
            // Not really important...
            at: at,
            // If target is window use 'top right' instead of 'bottom right'
            target: target.length ? target : $(window),
            // Use our target declared above
            adjust: { y: (target.length ? 8 : 30), x: (target.length ? 0 : -5)  },
            effect: function(api, newPos) {
                // Animate as usual if the window element is the target
                $(this).animate(newPos, {
                    duration: 400,
                    queue: false
                });

                // Store the final animate position
                api.cache.finalPos = newPos;
            }
        },
        show: {
            event: false,
            // Don't show it on a regular event
            ready: true,
            // Show it when ready (rendered)
            effect: function() {
                $(this).stop(0, 1).fadeIn(600);
            },
            // Matches the hide effect
            delay: 0,
            // Needed to prevent positioning issues
            // Custom option for use with the .get()/.set() API, awesome!
            persistent: false
        },
        hide: {
            event: false,
            // Don't hide it on a regular event
            effect: function(api) {
                // Do a regular fadeOut, but add some spice!
                $(this).stop(0, 1).fadeOut(400).queue(function() {
                    // Destroy this tooltip after fading out
                    api.destroy();

                });
            }
        },
        style: {
            classes: 'cluetip qtip-tipsy',
            // Some nice visual classes
            tip: false // No tips for this one (optional ofcourse)
        },
        events: {
            render: function(event, api) {
                // Trigger the timer (below) on render
                timer.call(api.elements.tooltip, event);
            }
        }
    }).removeData('qtip');
};

// Setup our timer function
function timer(event) {
    var api = $(this).data('qtip'),
        lifespan = 3000; // 3s second lifespan

    // If persistent is set to true, don't do anything.
    if (api.get('show.persistent') === true) { return; }

    // Otherwise, start/clear the timer depending on event type
    clearTimeout(api.timer);
    if (event.type !== 'mouseover') {
        api.timer = setTimeout(api.hide, lifespan);
    }
}

// Utilise delegate so we don't have to rebind for every qTip!
$(document).delegate('.qtip.cluetip', 'mouseover mouseout', timer);





return app;

}));
var root_url = window.location,
    db = url.resolve(root_url, '/dashboard'),
    // the hardcoded, pre agreed location of this script.
    baseJavascript = "/dashboard/_design/dashboard/_rewrite/static/js/topbar.js";


var queryOptions = findScriptParams();


window.garden_ui = new garden_menu_widget(db, queryOptions);
window.garden_ui.init(function(err){

});
$.noConflict(true);



// get querystring params from this
function findScriptParams() {
    var links = $('script');
    var results = {};
    $.each(links, function(i, script){
        var src = $(script).attr('src');
        if (src && src.indexOf(baseJavascript) === 0) {
            var param =  src.split('?')[1];
            console.log(param);
            if (param) {
                results = parseQueryString(param);
            }
        }
    });
    return results;
}


function parseQueryString(str){
  if ('string' != typeof str) return {};
  str = trim(str);
  if ('' === str) return {};
  return reduce(str.split('&'), function(obj, pair){
    var parts = pair.split('=');
    obj[parts[0]] = null === parts[1] ? '' : decodeURIComponent(parts[1]);
    return obj;
  }, {});
}

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

function reduce(arr, fn, initial){
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3 ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }

  return curr;
}

if (mlt==='r') {exports=ml;} if (mlt==='a'){define=ml;} })() 
