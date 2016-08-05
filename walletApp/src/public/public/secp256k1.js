(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
newcryp = require('crypto');
//newbuffer = require('buffer');
module.exports = secp256k1 = require('secp256k1/js');



},{"crypto":13,"secp256k1/js":31}],2:[function(require,module,exports){
(function (Buffer){
// Reference https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki
// Format: 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
// NOTE: SIGHASH byte ignored AND restricted, truncate before use

function check (buffer) {
  if (buffer.length < 8) return false
  if (buffer.length > 72) return false
  if (buffer[0] !== 0x30) return false
  if (buffer[1] !== buffer.length - 2) return false
  if (buffer[2] !== 0x02) return false

  var lenR = buffer[3]
  if (lenR === 0) return false
  if (5 + lenR >= buffer.length) return false
  if (buffer[4 + lenR] !== 0x02) return false

  var lenS = buffer[5 + lenR]
  if (lenS === 0) return false
  if ((6 + lenR + lenS) !== buffer.length) return false

  if (buffer[4] & 0x80) return false
  if (lenR > 1 && (buffer[4] === 0x00) && !(buffer[5] & 0x80)) return false

  if (buffer[lenR + 6] & 0x80) return false
  if (lenS > 1 && (buffer[lenR + 6] === 0x00) && !(buffer[lenR + 7] & 0x80)) return false
  return true
}

function decode (buffer) {
  if (buffer.length < 8) throw new Error('DER sequence length is too short')
  if (buffer.length > 72) throw new Error('DER sequence length is too long')
  if (buffer[0] !== 0x30) throw new Error('Expected DER sequence')
  if (buffer[1] !== buffer.length - 2) throw new Error('DER sequence length is invalid')
  if (buffer[2] !== 0x02) throw new Error('Expected DER integer')

  var lenR = buffer[3]
  if (lenR === 0) throw new Error('R length is zero')
  if (5 + lenR >= buffer.length) throw new Error('R length is too long')
  if (buffer[4 + lenR] !== 0x02) throw new Error('Expected DER integer (2)')

  var lenS = buffer[5 + lenR]
  if (lenS === 0) throw new Error('S length is zero')
  if ((6 + lenR + lenS) !== buffer.length) throw new Error('S length is invalid')

  if (buffer[4] & 0x80) throw new Error('R value is negative')
  if (lenR > 1 && (buffer[4] === 0x00) && !(buffer[5] & 0x80)) throw new Error('R value excessively padded')

  if (buffer[lenR + 6] & 0x80) throw new Error('S value is negative')
  if (lenS > 1 && (buffer[lenR + 6] === 0x00) && !(buffer[lenR + 7] & 0x80)) throw new Error('S value excessively padded')

  // non-BIP66 - extract R, S values
  return {
    r: buffer.slice(4, 4 + lenR),
    s: buffer.slice(6 + lenR)
  }
}

/*
 * Expects r and s to be positive DER integers.
 *
 * The DER format uses the most significant bit as a sign bit (& 0x80).
 * If the significant bit is set AND the integer is positive, a 0x00 is prepended.
 *
 * Examples:
 *
 *      0 =>     0x00
 *      1 =>     0x01
 *     -1 =>     0xff
 *    127 =>     0x7f
 *   -127 =>     0x81
 *    128 =>   0x0080
 *   -128 =>     0x80
 *    255 =>   0x00ff
 *   -255 =>   0xff01
 *  16300 =>   0x3fac
 * -16300 =>   0xc054
 *  62300 => 0x00f35c
 * -62300 => 0xff0ca4
*/
function encode (r, s) {
  var lenR = r.length
  var lenS = s.length
  if (lenR === 0) throw new Error('R length is zero')
  if (lenS === 0) throw new Error('S length is zero')
  if (lenR > 33) throw new Error('R length is too long')
  if (lenS > 33) throw new Error('S length is too long')
  if (r[0] & 0x80) throw new Error('R value is negative')
  if (s[0] & 0x80) throw new Error('S value is negative')
  if (lenR > 1 && (r[0] === 0x00) && !(r[1] & 0x80)) throw new Error('R value excessively padded')
  if (lenS > 1 && (s[0] === 0x00) && !(s[1] & 0x80)) throw new Error('S value excessively padded')

  var signature = new Buffer(6 + lenR + lenS)

  // 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
  signature[0] = 0x30
  signature[1] = signature.length - 2
  signature[2] = 0x02
  signature[3] = r.length
  r.copy(signature, 4)
  signature[4 + lenR] = 0x02
  signature[5 + lenR] = s.length
  s.copy(signature, 6 + lenR)

  return signature
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}

}).call(this,require("buffer").Buffer)
},{"buffer":11}],3:[function(require,module,exports){
(function (Buffer){
var Transform = require('stream').Transform
var inherits = require('inherits')
var StringDecoder = require('string_decoder').StringDecoder
module.exports = CipherBase
inherits(CipherBase, Transform)
function CipherBase (hashMode) {
  Transform.call(this)
  this.hashMode = typeof hashMode === 'string'
  if (this.hashMode) {
    this[hashMode] = this._finalOrDigest
  } else {
    this.final = this._finalOrDigest
  }
  this._decoder = null
  this._encoding = null
}
CipherBase.prototype.update = function (data, inputEnc, outputEnc) {
  if (typeof data === 'string') {
    data = new Buffer(data, inputEnc)
  }
  var outData = this._update(data)
  if (this.hashMode) {
    return this
  }
  if (outputEnc) {
    outData = this._toString(outData, outputEnc)
  }
  return outData
}

CipherBase.prototype.setAutoPadding = function () {}

CipherBase.prototype.getAuthTag = function () {
  throw new Error('trying to get auth tag in unsupported state')
}

CipherBase.prototype.setAuthTag = function () {
  throw new Error('trying to set auth tag in unsupported state')
}

CipherBase.prototype.setAAD = function () {
  throw new Error('trying to set aad in unsupported state')
}

CipherBase.prototype._transform = function (data, _, next) {
  var err
  try {
    if (this.hashMode) {
      this._update(data)
    } else {
      this.push(this._update(data))
    }
  } catch (e) {
    err = e
  } finally {
    next(err)
  }
}
CipherBase.prototype._flush = function (done) {
  var err
  try {
    this.push(this._final())
  } catch (e) {
    err = e
  } finally {
    done(err)
  }
}
CipherBase.prototype._finalOrDigest = function (outputEnc) {
  var outData = this._final() || new Buffer('')
  if (outputEnc) {
    outData = this._toString(outData, outputEnc, true)
  }
  return outData
}

CipherBase.prototype._toString = function (value, enc, final) {
  if (!this._decoder) {
    this._decoder = new StringDecoder(enc)
    this._encoding = enc
  }
  if (this._encoding !== enc) {
    throw new Error('can\'t switch encodings')
  }
  var out = this._decoder.write(value)
  if (final) {
    out += this._decoder.end()
  }
  return out
}

}).call(this,require("buffer").Buffer)
},{"buffer":11,"inherits":29,"stream":21,"string_decoder":27}],4:[function(require,module,exports){
(function (Buffer){
'use strict';
var inherits = require('inherits')
var md5 = require('./md5')
var rmd160 = require('ripemd160')
var sha = require('sha.js')

var Base = require('cipher-base')

function HashNoConstructor(hash) {
  Base.call(this, 'digest')

  this._hash = hash
  this.buffers = []
}

inherits(HashNoConstructor, Base)

HashNoConstructor.prototype._update = function (data) {
  this.buffers.push(data)
}

HashNoConstructor.prototype._final = function () {
  var buf = Buffer.concat(this.buffers)
  var r = this._hash(buf)
  this.buffers = null

  return r
}

function Hash(hash) {
  Base.call(this, 'digest')

  this._hash = hash
}

inherits(Hash, Base)

Hash.prototype._update = function (data) {
  this._hash.update(data)
}

Hash.prototype._final = function () {
  return this._hash.digest()
}

module.exports = function createHash (alg) {
  alg = alg.toLowerCase()
  if ('md5' === alg) return new HashNoConstructor(md5)
  if ('rmd160' === alg || 'ripemd160' === alg) return new HashNoConstructor(rmd160)

  return new Hash(sha(alg))
}

}).call(this,require("buffer").Buffer)
},{"./md5":6,"buffer":11,"cipher-base":3,"inherits":29,"ripemd160":30,"sha.js":42}],5:[function(require,module,exports){
(function (Buffer){
'use strict';
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}
exports.hash = hash;
}).call(this,require("buffer").Buffer)
},{"buffer":11}],6:[function(require,module,exports){
'use strict';
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};
},{"./helpers":5}],7:[function(require,module,exports){
(function (Buffer){
'use strict';
var createHash = require('create-hash/browser');
var inherits = require('inherits')

var Transform = require('stream').Transform

var ZEROS = new Buffer(128)
ZEROS.fill(0)

function Hmac(alg, key) {
  Transform.call(this)
  alg = alg.toLowerCase()
  if (typeof key === 'string') {
    key = new Buffer(key)
  }

  var blocksize = (alg === 'sha512' || alg === 'sha384') ? 128 : 64

  this._alg = alg
  this._key = key

  if (key.length > blocksize) {
    key = createHash(alg).update(key).digest()

  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  var ipad = this._ipad = new Buffer(blocksize)
  var opad = this._opad = new Buffer(blocksize)

  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  this._hash = createHash(alg).update(ipad)
}

inherits(Hmac, Transform)

Hmac.prototype.update = function (data, enc) {
  this._hash.update(data, enc)

  return this
}

Hmac.prototype._transform = function (data, _, next) {
  this._hash.update(data)

  next()
}

Hmac.prototype._flush = function (next) {
  this.push(this.digest())

  next()
}

Hmac.prototype.digest = function (enc) {
  var h = this._hash.digest()

  return createHash(this._alg).update(this._opad).update(h).digest(enc)
}

module.exports = function createHmac(alg, key) {
  return new Hmac(alg, key)
}

}).call(this,require("buffer").Buffer)
},{"buffer":11,"create-hash/browser":4,"inherits":29,"stream":21}],8:[function(require,module,exports){
(function (Buffer){
'use strict'
var createHmac = require('create-hmac')
var hashInfo = require('./lib/hash-info.json')

var ebuf = new Buffer(0)
var b0x00 = new Buffer([ 0x00 ])
var b0x01 = new Buffer([ 0x01 ])

function HmacDRBG (algo, entropy, nonce, pers) {
  var info = hashInfo[algo]
  if (info === undefined) throw new Error('hash ' + algo + ' is not supported')

  this._algo = algo
  this._securityStrength = info.securityStrength / 8
  this._outlen = info.outlen / 8
  this._reseedInterval = 0x1000000000000 // 2**48

  this._init(entropy, nonce, pers)
}

HmacDRBG.prototype._update = function (seed) {
  var kmac = createHmac(this._algo, this._K).update(this._V).update(b0x00)
  if (seed) kmac.update(seed)

  this._K = kmac.digest()
  this._V = createHmac(this._algo, this._K).update(this._V).digest()
  if (!seed) return

  this._K = createHmac(this._algo, this._K).update(this._V).update(b0x01).update(seed).digest()
  this._V = createHmac(this._algo, this._K).update(this._V).digest()
}

HmacDRBG.prototype._init = function (entropy, nonce, pers) {
  if (entropy.length < this._securityStrength) throw new Error('Not enough entropy')

  this._K = new Buffer(this._outlen)
  this._V = new Buffer(this._outlen)
  for (var i = 0; i < this._K.length; ++i) {
    this._K[i] = 0x00
    this._V[i] = 0x01
  }

  this._update(Buffer.concat([ entropy, nonce, pers || ebuf ]))
  this._reseed = 1
}

HmacDRBG.prototype.reseed = function (entropy, add) {
  if (entropy.length < this._securityStrength) throw new Error('Not enough entropy')

  this._update(Buffer.concat([ entropy, add || ebuf ]))
  this._reseed = 1
}

HmacDRBG.prototype.generate = function (len, add) {
  if (this._reseed > this._reseedInterval) throw new Error('Reseed is required')

  if (add && add.length === 0) add = undefined
  if (add) this._update(add)

  var temp = new Buffer(0)
  while (temp.length < len) {
    this._V = createHmac(this._algo, this._K).update(this._V).digest()
    temp = Buffer.concat([ temp, this._V ])
  }

  this._update(add)
  this._reseed += 1
  return temp.slice(0, len)
}

module.exports = HmacDRBG

}).call(this,require("buffer").Buffer)
},{"./lib/hash-info.json":9,"buffer":11,"create-hmac":7}],9:[function(require,module,exports){
module.exports={
  "sha1": {
    "securityStrength": 128,
    "outlen": 160,
    "seedlen": 440
  },
  "sha224": {
    "securityStrength": 192,
    "outlen": 224,
    "seedlen": 440
  },
  "sha256": {
    "securityStrength": 256,
    "outlen": 256,
    "seedlen": 440
  },
  "sha384": {
    "securityStrength": 256,
    "outlen": 384,
    "seedlen": 888
  },
  "sha512": {
    "securityStrength": 256,
    "outlen": 512,
    "seedlen": 888
  }
}

},{}],10:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],11:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":10,"ieee754":28}],12:[function(require,module,exports){
var Buffer = require('buffer').Buffer;
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

},{"buffer":11}],13:[function(require,module,exports){
var Buffer = require('buffer').Buffer
var sha = require('./sha')
var sha256 = require('./sha256')
var rng = require('./rng')
var md5 = require('./md5')

var algorithms = {
  sha1: sha,
  sha256: sha256,
  md5: md5
}

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)
function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = new Buffer(key)
  if(!Buffer.isBuffer(data)) data = new Buffer(data)

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = new Buffer(blocksize), opad = new Buffer(blocksize)
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1'
  var fn = algorithms[alg]
  var bufs = []
  var length = 0
  if(!fn) error('algorithm:', alg, 'is not yet supported')
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = new Buffer(data)
        
      bufs.push(data)
      length += data.length
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs)
      var r = key ? hmac(fn, key, buf) : fn(buf)
      bufs = null
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) }
exports.createHmac = function (alg, key) { return hash(alg, key) }
exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
, 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

},{"./md5":14,"./rng":15,"./sha":16,"./sha256":17,"buffer":11}],14:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":12}],15:[function(require,module,exports){
// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

},{}],16:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var helpers = require('./helpers');

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function sha1(buf) {
  return helpers.hash(buf, core_sha1, 20, true);
};

},{"./helpers":12}],17:[function(require,module,exports){

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var helpers = require('./helpers');

var safe_add = function(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
  return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
  return (X >>> n);
};

var Ch = function(x, y, z) {
  return ((x & y) ^ ((~x) & z));
};

var Maj = function(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z));
};

var Sigma0256 = function(x) {
  return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var Sigma1256 = function(x) {
  return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var Gamma0256 = function(x) {
  return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var Gamma1256 = function(x) {
  return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
  var K = new Array(0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
  /* append padding */
  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
  for (var i = 0; i < m.length; i += 16) {
    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3]; e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
    for (var j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safe_add(d, T1); d = c; c = b; b = a; a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
};

module.exports = function sha256(buf) {
  return helpers.hash(buf, core_sha256, 32, true);
};

},{"./helpers":12}],18:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
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
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],19:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],20:[function(require,module,exports){
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

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;
var inherits = require('inherits');
var setImmediate = require('process/browser.js').nextTick;
var Readable = require('./readable.js');
var Writable = require('./writable.js');

inherits(Duplex, Readable);

Duplex.prototype.write = Writable.prototype.write;
Duplex.prototype.end = Writable.prototype.end;
Duplex.prototype._write = Writable.prototype._write;

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  var self = this;
  setImmediate(function () {
    self.end();
  });
}

},{"./readable.js":24,"./writable.js":26,"inherits":29,"process/browser.js":22}],21:[function(require,module,exports){
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

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('./readable.js');
Stream.Writable = require('./writable.js');
Stream.Duplex = require('./duplex.js');
Stream.Transform = require('./transform.js');
Stream.PassThrough = require('./passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"./duplex.js":20,"./passthrough.js":23,"./readable.js":24,"./transform.js":25,"./writable.js":26,"events":18,"inherits":29}],22:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],23:[function(require,module,exports){
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

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./transform.js');
var inherits = require('inherits');
inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./transform.js":25,"inherits":29}],24:[function(require,module,exports){
(function (process){
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

module.exports = Readable;
Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;
var Stream = require('./index.js');
var Buffer = require('buffer').Buffer;
var setImmediate = require('process/browser.js').nextTick;
var StringDecoder;

var inherits = require('inherits');
inherits(Readable, Stream);

function ReadableState(options, stream) {
  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = false;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // In streams that never have any data, and do push(null) right away,
  // the consumer can miss the 'end' event if they do some I/O before
  // consuming the stream.  So, we don't emit('end') until some reading
  // happens.
  this.calledRead = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (typeof chunk === 'string' && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null || chunk === undefined) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      // update the buffer info.
      state.length += state.objectMode ? 1 : chunk.length;
      if (addToFront) {
        state.buffer.unshift(chunk);
      } else {
        state.reading = false;
        state.buffer.push(chunk);
      }

      if (state.needReadable)
        emitReadable(stream);

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || n === null) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  var state = this._readableState;
  state.calledRead = true;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;

  // if we currently have less than the highWaterMark, then also read some
  if (state.length - n <= state.highWaterMark)
    doRead = true;

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading)
    doRead = false;

  if (doRead) {
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read called its callback synchronously, then `reading`
  // will be false, and we need to re-evaluate how much data we
  // can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we happened to read() exactly the remaining amount in the
  // buffer, and the EOF has been seen at this point, then make sure
  // that we emit 'end' on the very next tick.
  if (state.ended && !state.endEmitted && state.length === 0)
    endReadable(this);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode &&
      !er) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // if we've ended and we have some data left, then emit
  // 'readable' now to make sure it gets picked up.
  if (state.length > 0)
    emitReadable(stream);
  else
    endReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (state.emittedReadable)
    return;

  state.emittedReadable = true;
  if (state.sync)
    setImmediate(function() {
      emitReadable_(stream);
    });
  else
    emitReadable_(stream);
}

function emitReadable_(stream) {
  stream.emit('readable');
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    setImmediate(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    setImmediate(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    if (readable !== src) return;
    cleanup();
  }

  function onend() {
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (!dest._writableState || dest._writableState.needDrain)
      ondrain();
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  // check for listeners before emit removes one-time listeners.
  var errListeners = EE.listenerCount(dest, 'error');
  function onerror(er) {
    unpipe();
    if (errListeners === 0 && EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  dest.once('error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    // the handler that waits for readable events after all
    // the data gets sucked out in flow.
    // This would be easier to follow with a .once() handler
    // in flow(), but that is too slow.
    this.on('readable', pipeOnReadable);

    state.flowing = true;
    setImmediate(function() {
      flow(src);
    });
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var dest = this;
    var state = src._readableState;
    state.awaitDrain--;
    if (state.awaitDrain === 0)
      flow(src);
  };
}

function flow(src) {
  var state = src._readableState;
  var chunk;
  state.awaitDrain = 0;

  function write(dest, i, list) {
    var written = dest.write(chunk);
    if (false === written) {
      state.awaitDrain++;
    }
  }

  while (state.pipesCount && null !== (chunk = src.read())) {

    if (state.pipesCount === 1)
      write(state.pipes, 0, null);
    else
      forEach(state.pipes, write);

    src.emit('data', chunk);

    // if anyone needs a drain, then we have to wait for that.
    if (state.awaitDrain > 0)
      return;
  }

  // if every destination was unpiped, either before entering this
  // function, or in the while loop, then stop flowing.
  //
  // NB: This is a pretty rare edge case.
  if (state.pipesCount === 0) {
    state.flowing = false;

    // if there were data event listeners added, then switch to old mode.
    if (EE.listenerCount(src, 'data') > 0)
      emitDataEvents(src);
    return;
  }

  // at this point, no one needed a drain, so we just ran out of data
  // on the next readable event, start it over again.
  state.ranOut = true;
}

function pipeOnReadable() {
  if (this._readableState.ranOut) {
    this._readableState.ranOut = false;
    flow(this);
  }
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data' && !this._readableState.flowing)
    emitDataEvents(this);

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        this.read(0);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  emitDataEvents(this);
  this.read(0);
  this.emit('resume');
};

Readable.prototype.pause = function() {
  emitDataEvents(this, true);
  this.emit('pause');
};

function emitDataEvents(stream, startPaused) {
  var state = stream._readableState;

  if (state.flowing) {
    // https://github.com/isaacs/readable-stream/issues/16
    throw new Error('Cannot switch to old mode now.');
  }

  var paused = startPaused || false;
  var readable = false;

  // convert to an old-style stream.
  stream.readable = true;
  stream.pipe = Stream.prototype.pipe;
  stream.on = stream.addListener = Stream.prototype.on;

  stream.on('readable', function() {
    readable = true;

    var c;
    while (!paused && (null !== (c = stream.read())))
      stream.emit('data', c);

    if (c === null) {
      readable = false;
      stream._readableState.needReadable = true;
    }
  });

  stream.pause = function() {
    paused = true;
    this.emit('pause');
  };

  stream.resume = function() {
    paused = false;
    if (readable)
      setImmediate(function() {
        stream.emit('readable');
      });
    else
      this.read(0);
    this.emit('resume');
  };

  // now make it start, just in case it hadn't already.
  stream.emit('readable');
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (typeof stream[i] === 'function' &&
        typeof this[i] === 'undefined') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, function (x) {
      return self.emit.apply(self, ev, x);
    });
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted && state.calledRead) {
    state.ended = true;
    setImmediate(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require("lYpoI2"))
},{"./index.js":21,"buffer":11,"events":18,"inherits":29,"lYpoI2":19,"process/browser.js":22,"string_decoder":27}],25:[function(require,module,exports){
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

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./duplex.js');
var inherits = require('inherits');
inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  var ts = this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('finish', function() {
    if ('function' === typeof this._flush)
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var rs = stream._readableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./duplex.js":20,"inherits":29}],26:[function(require,module,exports){
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

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;
Writable.WritableState = WritableState;

var isUint8Array = typeof Uint8Array !== 'undefined'
  ? function (x) { return x instanceof Uint8Array }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'Uint8Array'
  }
;
var isArrayBuffer = typeof ArrayBuffer !== 'undefined'
  ? function (x) { return x instanceof ArrayBuffer }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'ArrayBuffer'
  }
;

var inherits = require('inherits');
var Stream = require('./index.js');
var setImmediate = require('process/browser.js').nextTick;
var Buffer = require('buffer').Buffer;

inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];
}

function Writable(options) {
  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Stream.Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  setImmediate(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    setImmediate(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (!Buffer.isBuffer(chunk) && isUint8Array(chunk))
    chunk = new Buffer(chunk);
  if (isArrayBuffer(chunk) && typeof Uint8Array !== 'undefined')
    chunk = new Buffer(new Uint8Array(chunk));
  
  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb))
    ret = writeOrBuffer(this, state, chunk, encoding, cb);

  return ret;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  state.needDrain = !ret;

  if (state.writing)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    setImmediate(function() {
      cb(er);
    });
  else
    cb(er);

  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished && !state.bufferProcessing && state.buffer.length)
      clearBuffer(stream, state);

    if (sync) {
      setImmediate(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  cb();
  if (finished)
    finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  for (var c = 0; c < state.buffer.length; c++) {
    var entry = state.buffer[c];
    var chunk = entry.chunk;
    var encoding = entry.encoding;
    var cb = entry.callback;
    var len = state.objectMode ? 1 : chunk.length;

    doWrite(stream, state, len, chunk, encoding, cb);

    // if we didn't call the onwrite immediately, then
    // it means that we need to wait until it does.
    // also, that means that the chunk and cb are currently
    // being processed, so move the buffer counter past them.
    if (state.writing) {
      c++;
      break;
    }
  }

  state.bufferProcessing = false;
  if (c < state.buffer.length)
    state.buffer = state.buffer.slice(c);
  else
    state.buffer.length = 0;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (typeof chunk !== 'undefined' && chunk !== null)
    this.write(chunk, encoding);

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    state.finished = true;
    stream.emit('finish');
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      setImmediate(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./index.js":21,"buffer":11,"inherits":29,"process/browser.js":22}],27:[function(require,module,exports){
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

var Buffer = require('buffer').Buffer;

function assertEncoding(encoding) {
  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  this.charBuffer = new Buffer(6);
  this.charReceived = 0;
  this.charLength = 0;
};


StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  var offset = 0;

  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived) ?
                this.charLength - this.charReceived :
                buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, offset, i);
    this.charReceived += (i - offset);
    offset = i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
    break;
  }

  var lenIncomplete = this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - lenIncomplete, end);
    this.charReceived = lenIncomplete;
    end -= lenIncomplete;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    this.charBuffer.write(charStr.charAt(charStr.length - 1), this.encoding);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  return i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 2;
  this.charLength = incomplete ? 2 : 0;
  return incomplete;
}

function base64DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 3;
  this.charLength = incomplete ? 3 : 0;
  return incomplete;
}

},{"buffer":11}],28:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],29:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],30:[function(require,module,exports){
(function (Buffer){
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/** @preserve
(c) 2012 by Cédric Mesnil. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// constants table
var zl = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
]

var zr = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
]

var sl = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
]

var sr = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
]

var hl = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]
var hr = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]

function bytesToWords (bytes) {
  var words = []
  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
    words[b >>> 5] |= bytes[i] << (24 - b % 32)
  }
  return words
}

function wordsToBytes (words) {
  var bytes = []
  for (var b = 0; b < words.length * 32; b += 8) {
    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF)
  }
  return bytes
}

function processBlock (H, M, offset) {
  // swap endian
  for (var i = 0; i < 16; i++) {
    var offset_i = offset + i
    var M_offset_i = M[offset_i]

    // Swap
    M[offset_i] = (
      (((M_offset_i << 8) | (M_offset_i >>> 24)) & 0x00ff00ff) |
      (((M_offset_i << 24) | (M_offset_i >>> 8)) & 0xff00ff00)
    )
  }

  // Working variables
  var al, bl, cl, dl, el
  var ar, br, cr, dr, er

  ar = al = H[0]
  br = bl = H[1]
  cr = cl = H[2]
  dr = dl = H[3]
  er = el = H[4]

  // computation
  var t
  for (i = 0; i < 80; i += 1) {
    t = (al + M[offset + zl[i]]) | 0
    if (i < 16) {
      t += f1(bl, cl, dl) + hl[0]
    } else if (i < 32) {
      t += f2(bl, cl, dl) + hl[1]
    } else if (i < 48) {
      t += f3(bl, cl, dl) + hl[2]
    } else if (i < 64) {
      t += f4(bl, cl, dl) + hl[3]
    } else {// if (i<80) {
      t += f5(bl, cl, dl) + hl[4]
    }
    t = t | 0
    t = rotl(t, sl[i])
    t = (t + el) | 0
    al = el
    el = dl
    dl = rotl(cl, 10)
    cl = bl
    bl = t

    t = (ar + M[offset + zr[i]]) | 0
    if (i < 16) {
      t += f5(br, cr, dr) + hr[0]
    } else if (i < 32) {
      t += f4(br, cr, dr) + hr[1]
    } else if (i < 48) {
      t += f3(br, cr, dr) + hr[2]
    } else if (i < 64) {
      t += f2(br, cr, dr) + hr[3]
    } else {// if (i<80) {
      t += f1(br, cr, dr) + hr[4]
    }

    t = t | 0
    t = rotl(t, sr[i])
    t = (t + er) | 0
    ar = er
    er = dr
    dr = rotl(cr, 10)
    cr = br
    br = t
  }

  // intermediate hash value
  t = (H[1] + cl + dr) | 0
  H[1] = (H[2] + dl + er) | 0
  H[2] = (H[3] + el + ar) | 0
  H[3] = (H[4] + al + br) | 0
  H[4] = (H[0] + bl + cr) | 0
  H[0] = t
}

function f1 (x, y, z) {
  return ((x) ^ (y) ^ (z))
}

function f2 (x, y, z) {
  return (((x) & (y)) | ((~x) & (z)))
}

function f3 (x, y, z) {
  return (((x) | (~(y))) ^ (z))
}

function f4 (x, y, z) {
  return (((x) & (z)) | ((y) & (~(z))))
}

function f5 (x, y, z) {
  return ((x) ^ ((y) | (~(z))))
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function ripemd160 (message) {
  var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]

  if (typeof message === 'string') {
    message = new Buffer(message, 'utf8')
  }

  var m = bytesToWords(message)

  var nBitsLeft = message.length * 8
  var nBitsTotal = message.length * 8

  // Add padding
  m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32)
  m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
    (((nBitsTotal << 8) | (nBitsTotal >>> 24)) & 0x00ff00ff) |
    (((nBitsTotal << 24) | (nBitsTotal >>> 8)) & 0xff00ff00)
  )

  for (var i = 0; i < m.length; i += 16) {
    processBlock(H, m, i)
  }

  // swap endian
  for (i = 0; i < 5; i++) {
    // shortcut
    var H_i = H[i]

    // Swap
    H[i] = (((H_i << 8) | (H_i >>> 24)) & 0x00ff00ff) |
      (((H_i << 24) | (H_i >>> 8)) & 0xff00ff00)
  }

  var digestbytes = wordsToBytes(H)
  return new Buffer(digestbytes)
}

module.exports = ripemd160

}).call(this,require("buffer").Buffer)
},{"buffer":11}],31:[function(require,module,exports){
'use strict'
module.exports = require('./lib')(require('./lib/js'))

},{"./lib":33,"./lib/js":39}],32:[function(require,module,exports){
(function (Buffer){
'use strict'
var toString = Object.prototype.toString

// TypeError
exports.isArray = function (value, message) {
  if (!Array.isArray(value)) throw TypeError(message)
}

exports.isBoolean = function (value, message) {
  if (toString.call(value) !== '[object Boolean]') throw TypeError(message)
}

exports.isBuffer = function (value, message) {
  if (!Buffer.isBuffer(value)) throw TypeError(message)
}

exports.isFunction = function (value, message) {
  if (toString.call(value) !== '[object Function]') throw TypeError(message)
}

exports.isNumber = function (value, message) {
  if (toString.call(value) !== '[object Number]') throw TypeError(message)
}

exports.isObject = function (value, message) {
  if (toString.call(value) !== '[object Object]') throw TypeError(message)
}

// RangeError
exports.isBufferLength = function (buffer, length, message) {
  if (buffer.length !== length) throw RangeError(message)
}

exports.isBufferLength2 = function (buffer, length1, length2, message) {
  if (buffer.length !== length1 && buffer.length !== length2) throw RangeError(message)
}

exports.isLengthGTZero = function (value, message) {
  if (value.length === 0) throw RangeError(message)
}

exports.isNumberInInterval = function (number, x, y, message) {
  if (number <= x || number >= y) throw RangeError(message)
}

}).call(this,require("buffer").Buffer)
},{"buffer":11}],33:[function(require,module,exports){
(function (Buffer){
'use strict'
var bip66 = require('bip66')

var assert = require('./assert')
var messages = require('./messages.json')

var EC_PRIVKEY_EXPORT_DER_COMPRESSED_BEGIN = new Buffer(
  '3081d30201010420', 'hex')
var EC_PRIVKEY_EXPORT_DER_COMPRESSED_MIDDLE = new Buffer(
  'a08185308182020101302c06072a8648ce3d0101022100fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f300604010004010704210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798022100fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141020101a124032200', 'hex')
var EC_PRIVKEY_EXPORT_DER_UNCOMPRESSED_BEGIN = new Buffer(
  '308201130201010420', 'hex')
var EC_PRIVKEY_EXPORT_DER_UNCOMPRESSED_MIDDLE = new Buffer(
  'a081a53081a2020101302c06072a8648ce3d0101022100fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f300604010004010704410479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8022100fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141020101a144034200', 'hex')

var ZERO_BUFFER_32 = new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex')

function initCompressedValue (value, defaultValue) {
  if (value === undefined) return defaultValue

  assert.isBoolean(value, messages.COMPRESSED_TYPE_INVALID)
  return value
}

module.exports = function (secp256k1) {
  return {
    privateKeyVerify: function (privateKey) {
      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      return privateKey.length === 32 && secp256k1.privateKeyVerify(privateKey)
    },

    privateKeyExport: function (privateKey, compressed) {
      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      assert.isBufferLength(privateKey, 32, messages.EC_PRIVATE_KEY_LENGTH_INVALID)

      compressed = initCompressedValue(compressed, true)

      var publicKey = secp256k1.privateKeyExport(privateKey, compressed)

      var result = new Buffer(compressed ? 214 : 279)
      var targetStart = 0
      if (compressed) {
        EC_PRIVKEY_EXPORT_DER_COMPRESSED_BEGIN.copy(result, targetStart)
        targetStart += EC_PRIVKEY_EXPORT_DER_COMPRESSED_BEGIN.length

        privateKey.copy(result, targetStart)
        targetStart += privateKey.length

        EC_PRIVKEY_EXPORT_DER_COMPRESSED_MIDDLE.copy(result, targetStart)
        targetStart += EC_PRIVKEY_EXPORT_DER_COMPRESSED_MIDDLE.length

        publicKey.copy(result, targetStart)
      } else {
        EC_PRIVKEY_EXPORT_DER_UNCOMPRESSED_BEGIN.copy(result, targetStart)
        targetStart += EC_PRIVKEY_EXPORT_DER_UNCOMPRESSED_BEGIN.length

        privateKey.copy(result, targetStart)
        targetStart += privateKey.length

        EC_PRIVKEY_EXPORT_DER_UNCOMPRESSED_MIDDLE.copy(result, targetStart)
        targetStart += EC_PRIVKEY_EXPORT_DER_UNCOMPRESSED_MIDDLE.length

        publicKey.copy(result, targetStart)
      }

      return result
    },

    privateKeyImport: function (privateKey) {
      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)

      do {
        var length = privateKey.length

        // sequence header
        var index = 0
        if (length < index + 1 || privateKey[index] !== 0x30) break
        index += 1

        // sequence length constructor
        if (length < index + 1 || !(privateKey[index] & 0x80)) break

        var lenb = privateKey[index] & 0x7f
        index += 1
        if (lenb < 1 || lenb > 2) break
        if (length < index + lenb) break

        // sequence length
        var len = privateKey[index + lenb - 1] | (lenb > 1 ? privateKey[index + lenb - 2] << 8 : 0)
        index += lenb
        if (length < index + len) break

        // sequence element 0: version number (=1)
        if (length < index + 3 ||
            privateKey[index] !== 0x02 ||
            privateKey[index + 1] !== 0x01 ||
            privateKey[index + 2] !== 0x01) {
          break
        }
        index += 3

        // sequence element 1: octet string, up to 32 bytes
        if (length < index + 2 ||
            privateKey[index] !== 0x04 ||
            privateKey[index + 1] > 0x20 ||
            length < index + 2 + privateKey[index + 1]) {
          break
        }

        privateKey = privateKey.slice(index + 2, index + 2 + privateKey[index + 1])
        if (privateKey.length === 32 && secp256k1.privateKeyVerify(privateKey)) return privateKey
      } while (false)

      throw new Error(messages.EC_PRIVATE_KEY_IMPORT_DER_FAIL)
    },

    privateKeyTweakAdd: function (privateKey, tweak) {
      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      assert.isBufferLength(privateKey, 32, messages.EC_PRIVATE_KEY_LENGTH_INVALID)

      assert.isBuffer(tweak, messages.TWEAK_TYPE_INVALID)
      assert.isBufferLength(tweak, 32, messages.TWEAK_LENGTH_INVALID)

      return secp256k1.privateKeyTweakAdd(privateKey, tweak)
    },

    privateKeyTweakMul: function (privateKey, tweak) {
      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      assert.isBufferLength(privateKey, 32, messages.EC_PRIVATE_KEY_LENGTH_INVALID)

      assert.isBuffer(tweak, messages.TWEAK_TYPE_INVALID)
      assert.isBufferLength(tweak, 32, messages.TWEAK_LENGTH_INVALID)

      return secp256k1.privateKeyTweakMul(privateKey, tweak)
    },

    publicKeyCreate: function (privateKey, compressed) {
      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      assert.isBufferLength(privateKey, 32, messages.EC_PRIVATE_KEY_LENGTH_INVALID)

      compressed = initCompressedValue(compressed, true)

      return secp256k1.publicKeyCreate(privateKey, compressed)
    },

    publicKeyConvert: function (publicKey, compressed) {
      assert.isBuffer(publicKey, messages.EC_PUBLIC_KEY_TYPE_INVALID)
      assert.isBufferLength2(publicKey, 33, 65, messages.EC_PUBLIC_KEY_LENGTH_INVALID)

      compressed = initCompressedValue(compressed, true)

      return secp256k1.publicKeyConvert(publicKey, compressed)
    },

    publicKeyVerify: function (publicKey) {
      assert.isBuffer(publicKey, messages.EC_PUBLIC_KEY_TYPE_INVALID)
      return secp256k1.publicKeyVerify(publicKey)
    },

    publicKeyTweakAdd: function (publicKey, tweak, compressed) {
      assert.isBuffer(publicKey, messages.EC_PUBLIC_KEY_TYPE_INVALID)
      assert.isBufferLength2(publicKey, 33, 65, messages.EC_PUBLIC_KEY_LENGTH_INVALID)

      assert.isBuffer(tweak, messages.TWEAK_TYPE_INVALID)
      assert.isBufferLength(tweak, 32, messages.TWEAK_LENGTH_INVALID)

      compressed = initCompressedValue(compressed, true)

      return secp256k1.publicKeyTweakAdd(publicKey, tweak, compressed)
    },

    publicKeyTweakMul: function (publicKey, tweak, compressed) {
      assert.isBuffer(publicKey, messages.EC_PUBLIC_KEY_TYPE_INVALID)
      assert.isBufferLength2(publicKey, 33, 65, messages.EC_PUBLIC_KEY_LENGTH_INVALID)

      assert.isBuffer(tweak, messages.TWEAK_TYPE_INVALID)
      assert.isBufferLength(tweak, 32, messages.TWEAK_LENGTH_INVALID)

      compressed = initCompressedValue(compressed, true)

      return secp256k1.publicKeyTweakMul(publicKey, tweak, compressed)
    },

    publicKeyCombine: function (publicKeys, compressed) {
      assert.isArray(publicKeys, messages.EC_PUBLIC_KEYS_TYPE_INVALID)
      assert.isLengthGTZero(publicKeys, messages.EC_PUBLIC_KEYS_LENGTH_INVALID)
      for (var i = 0; i < publicKeys.length; ++i) {
        assert.isBuffer(publicKeys[i], messages.EC_PUBLIC_KEY_TYPE_INVALID)
        assert.isBufferLength2(publicKeys[i], 33, 65, messages.EC_PUBLIC_KEY_LENGTH_INVALID)
      }

      compressed = initCompressedValue(compressed, true)

      return secp256k1.publicKeyCombine(publicKeys, compressed)
    },

    signatureNormalize: function (signature) {
      assert.isBuffer(signature, messages.ECDSA_SIGNATURE_TYPE_INVALID)
      assert.isBufferLength(signature, 64, messages.ECDSA_SIGNATURE_LENGTH_INVALID)

      return secp256k1.signatureNormalize(signature)
    },

    signatureExport: function (signature) {
      assert.isBuffer(signature, messages.ECDSA_SIGNATURE_TYPE_INVALID)
      assert.isBufferLength(signature, 64, messages.ECDSA_SIGNATURE_LENGTH_INVALID)

      var sigObj = secp256k1.signatureExport(signature)

      var r = Buffer.concat([new Buffer([0]), sigObj.r])
      for (var lenR = 33, posR = 0; lenR > 1 && r[posR] === 0x00 && !(r[posR + 1] & 0x80); --lenR, ++posR);

      var s = Buffer.concat([new Buffer([0]), sigObj.s])
      for (var lenS = 33, posS = 0; lenS > 1 && s[posS] === 0x00 && !(s[posS + 1] & 0x80); --lenS, ++posS);

      return bip66.encode(r.slice(posR), s.slice(posS))
    },

    signatureImport: function (sig) {
      assert.isBuffer(sig, messages.ECDSA_SIGNATURE_TYPE_INVALID)
      assert.isLengthGTZero(sig, messages.ECDSA_SIGNATURE_LENGTH_INVALID)

      try {
        var sigObj = bip66.decode(sig)
        if (sigObj.r.length === 33 && sigObj.r[0] === 0x00) sigObj.r = sigObj.r.slice(1)
        if (sigObj.r.length > 32) throw new Error('R length is too long')
        if (sigObj.s.length === 33 && sigObj.s[0] === 0x00) sigObj.s = sigObj.s.slice(1)
        if (sigObj.s.length > 32) throw new Error('S length is too long')
      } catch (err) {
        throw new Error(messages.ECDSA_SIGNATURE_PARSE_DER_FAIL)
      }

      return secp256k1.signatureImport({
        r: Buffer.concat([ZERO_BUFFER_32, sigObj.r]).slice(-32),
        s: Buffer.concat([ZERO_BUFFER_32, sigObj.s]).slice(-32)
      })
    },

    sign: function (message, privateKey, options) {
      assert.isBuffer(message, messages.MSG32_TYPE_INVALID)
      //assert.isBufferLength(message, 32, messages.MSG32_LENGTH_INVALID)

      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      //assert.isBufferLength(privateKey, 32, messages.EC_PRIVATE_KEY_LENGTH_INVALID)

      var data = null
      var noncefn = null
      if (options !== undefined) {
        assert.isObject(options, messages.OPTIONS_TYPE_INVALID)

        if (options.data !== undefined) {
          assert.isBuffer(options.data, messages.OPTIONS_DATA_TYPE_INVALID)
          //assert.isBufferLength(options.data, 32, messages.OPTIONS_DATA_LENGTH_INVALID)
          data = options.data
        }

        if (options.noncefn !== undefined) {
          assert.isFunction(options.noncefn, messages.OPTIONS_NONCEFN_TYPE_INVALID)
          noncefn = options.noncefn
        }
      }

      return secp256k1.sign(message, privateKey, noncefn, data)
    },

    verify: function (message, signature, publicKey) {
      assert.isBuffer(message, messages.MSG32_TYPE_INVALID)
      assert.isBufferLength(message, 32, messages.MSG32_LENGTH_INVALID)

      assert.isBuffer(signature, messages.ECDSA_SIGNATURE_TYPE_INVALID)
      assert.isBufferLength(signature, 64, messages.ECDSA_SIGNATURE_LENGTH_INVALID)

      assert.isBuffer(publicKey, messages.EC_PUBLIC_KEY_TYPE_INVALID)
      assert.isBufferLength2(publicKey, 33, 65, messages.EC_PUBLIC_KEY_LENGTH_INVALID)

      return secp256k1.verify(message, signature, publicKey)
    },

    recover: function (message, signature, recovery, compressed) {
      assert.isBuffer(message, messages.MSG32_TYPE_INVALID)
      assert.isBufferLength(message, 32, messages.MSG32_LENGTH_INVALID)

      assert.isBuffer(signature, messages.ECDSA_SIGNATURE_TYPE_INVALID)
      assert.isBufferLength(signature, 64, messages.ECDSA_SIGNATURE_LENGTH_INVALID)

      assert.isNumber(recovery, messages.RECOVERY_ID_TYPE_INVALID)
      assert.isNumberInInterval(recovery, -1, 4, messages.RECOVERY_ID_VALUE_INVALID)

      compressed = initCompressedValue(compressed, true)

      return secp256k1.recover(message, signature, recovery, compressed)
    },

    ecdh: function (publicKey, privateKey) {
      assert.isBuffer(publicKey, messages.EC_PUBLIC_KEY_TYPE_INVALID)
      assert.isBufferLength2(publicKey, 33, 65, messages.EC_PUBLIC_KEY_LENGTH_INVALID)

      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      assert.isBufferLength(privateKey, 32, messages.EC_PRIVATE_KEY_LENGTH_INVALID)

      return secp256k1.ecdh(publicKey, privateKey)
    },

    ecdhUnsafe: function (publicKey, privateKey, compressed) {
      assert.isBuffer(publicKey, messages.EC_PUBLIC_KEY_TYPE_INVALID)
      assert.isBufferLength2(publicKey, 33, 65, messages.EC_PUBLIC_KEY_LENGTH_INVALID)

      assert.isBuffer(privateKey, messages.EC_PRIVATE_KEY_TYPE_INVALID)
      assert.isBufferLength(privateKey, 32, messages.EC_PRIVATE_KEY_LENGTH_INVALID)

      compressed = initCompressedValue(compressed, true)

      return secp256k1.ecdhUnsafe(publicKey, privateKey, compressed)
    }
  }
}

}).call(this,require("buffer").Buffer)
},{"./assert":32,"./messages.json":40,"bip66":2,"buffer":11}],34:[function(require,module,exports){
(function (Buffer){
'use strict'
var optimized = require('./optimized')

function BN () {
  this.negative = 0
  this.words = null
  this.length = 0
}

BN.fromNumber = function (n) {
  var bn = new BN()
  bn.words = [n & 0x03ffffff]
  bn.length = 1
  return bn
}

BN.fromBuffer = function (b32) {
  var bn = new BN()

  bn.words = new Array(10)
  bn.words[0] = (b32[28] & 0x03) << 24 | b32[29] << 16 | b32[30] << 8 | b32[31]
  bn.words[1] = (b32[25] & 0x0F) << 22 | b32[26] << 14 | b32[27] << 6 | b32[28] >>> 2
  bn.words[2] = (b32[22] & 0x3F) << 20 | b32[23] << 12 | b32[24] << 4 | b32[25] >>> 4
  bn.words[3] = (b32[19] & 0xFF) << 18 | b32[20] << 10 | b32[21] << 2 | b32[22] >>> 6

  bn.words[4] = (b32[15] & 0x03) << 24 | b32[16] << 16 | b32[17] << 8 | b32[18]
  bn.words[5] = (b32[12] & 0x0F) << 22 | b32[13] << 14 | b32[14] << 6 | b32[15] >>> 2
  bn.words[6] = (b32[9] & 0x3F) << 20 | b32[10] << 12 | b32[11] << 4 | b32[12] >>> 4
  bn.words[7] = (b32[6] & 0xFF) << 18 | b32[7] << 10 | b32[8] << 2 | b32[9] >>> 6

  bn.words[8] = (b32[2] & 0x03) << 24 | b32[3] << 16 | b32[4] << 8 | b32[5]
  bn.words[9] = b32[0] << 14 | b32[1] << 6 | b32[2] >>> 2

  bn.length = 10
  return bn.strip()
}

BN.prototype.toBuffer = function () {
  var w = this.words
  for (var i = this.length; i < 10; ++i) w[i] = 0

  return new Buffer([
    (w[9] >>> 14) & 0xFF, (w[9] >>> 6) & 0xFF, (w[9] & 0x3F) << 2 | ((w[8] >>> 24) & 0x03), // 0, 1, 2
    (w[8] >>> 16) & 0xFF, (w[8] >>> 8) & 0xFF, w[8] & 0xFF, // 3, 4, 5

    (w[7] >>> 18) & 0xFF, (w[7] >>> 10) & 0xFF, (w[7] >>> 2) & 0xFF, // 6, 7, 8
    ((w[7] & 0x03) << 6) | ((w[6] >>> 20) & 0x3F), (w[6] >>> 12) & 0xFF, (w[6] >>> 4) & 0xFF, // 9, 10, 11
    ((w[6] & 0x0F) << 4) | ((w[5] >>> 22) & 0x0F), (w[5] >>> 14) & 0xFF, (w[5] >>> 6) & 0xFF, // 12, 13, 14
    ((w[5] & 0x3F) << 2) | ((w[4] >>> 24) & 0x03), (w[4] >>> 16) & 0xFF, (w[4] >>> 8) & 0xFF, w[4] & 0xFF, // 15, 16, 17, 18

    (w[3] >>> 18) & 0xFF, (w[3] >>> 10) & 0xFF, (w[3] >>> 2) & 0xFF, // 19, 20, 21
    ((w[3] & 0x03) << 6) | ((w[2] >>> 20) & 0x3F), (w[2] >>> 12) & 0xFF, (w[2] >>> 4) & 0xFF, // 22, 23, 24
    ((w[2] & 0x0F) << 4) | ((w[1] >>> 22) & 0x0F), (w[1] >>> 14) & 0xFF, (w[1] >>> 6) & 0xFF, // 25, 26, 27
    ((w[1] & 0x3F) << 2) | ((w[0] >>> 24) & 0x03), (w[0] >>> 16) & 0xFF, (w[0] >>> 8) & 0xFF, w[0] & 0xFF // 28, 29, 30, 31
  ])
}

BN.prototype.clone = function () {
  var r = new BN()
  r.words = new Array(this.length)
  for (var i = 0; i < this.length; i++) r.words[i] = this.words[i]
  r.length = this.length
  r.negative = this.negative
  return r
}

BN.prototype.strip = function () {
  while (this.length > 1 && (this.words[this.length - 1] | 0) === 0) this.length--
  return this
}

BN.prototype.normSign = function () {
  // -0 = 0
  if (this.length === 1 && this.words[0] === 0) this.negative = 0
  return this
}

BN.prototype.isEven = function () {
  return (this.words[0] & 1) === 0
}

BN.prototype.isOdd = function () {
  return (this.words[0] & 1) === 1
}

BN.prototype.isZero = function () {
  return this.length === 1 && this.words[0] === 0
}

BN.prototype.ucmp = function (num) {
  if (this.length !== num.length) return this.length > num.length ? 1 : -1

  for (var i = this.length - 1; i >= 0; --i) {
    if (this.words[i] !== num.words[i]) return this.words[i] > num.words[i] ? 1 : -1
  }

  return 0
}

BN.prototype.gtOne = function () {
  return this.length > 1 || this.words[0] > 1
}

BN.prototype.isOverflow = function () {
  return this.ucmp(BN.n) >= 0
}

BN.prototype.isHigh = function () {
  return this.ucmp(BN.nh) === 1
}

BN.prototype.bitLengthGT256 = function () {
  return this.length > 10 || (this.length === 10 && this.words[9] > 0x003fffff)
}

BN.prototype.iuaddn = function (num) {
  this.words[0] += num

  for (var i = 0; this.words[i] > 0x03ffffff && i < this.length; ++i) {
    this.words[i] -= 0x04000000
    this.words[i + 1] += 1
  }

  if (i === this.length) {
    this.words[i] = 1
    this.length += 1
  }

  return this
}

BN.prototype.iadd = function (num) {
  // (-this) + num -> -(this - num)
  // this + (-num) -> this - num
  if (this.negative !== num.negative) {
    if (this.negative !== 0) {
      this.negative = 0
      this.isub(num)
      this.negative ^= 1
    } else {
      num.negative = 0
      this.isub(num)
      num.negative = 1
    }

    return this.normSign()
  }

  // a.length > b.length
  var a
  var b
  if (this.length > num.length) {
    a = this
    b = num
  } else {
    a = num
    b = this
  }

  for (var i = 0, carry = 0; i < b.length; ++i) {
    var word = a.words[i] + b.words[i] + carry
    this.words[i] = word & 0x03ffffff
    carry = word >>> 26
  }

  for (; carry !== 0 && i < a.length; ++i) {
    word = a.words[i] + carry
    this.words[i] = word & 0x03ffffff
    carry = word >>> 26
  }

  this.length = a.length
  if (carry !== 0) {
    this.words[this.length++] = carry
  } else if (a !== this) {
    for (; i < a.length; ++i) {
      this.words[i] = a.words[i]
    }
  }

  return this
}

BN.prototype.add = function (num) {
  return this.clone().iadd(num)
}

BN.prototype.isub = function (num) {
  // (-this) - num -> -(this + num)
  // this - (-num) -> this + num
  if (this.negative !== num.negative) {
    if (this.negative !== 0) {
      this.negative = 0
      this.iadd(num)
      this.negative = 1
    } else {
      num.negative = 0
      this.iadd(num)
      num.negative = 1
    }

    return this.normSign()
  }

  var cmp = this.ucmp(num)
  if (cmp === 0) {
    this.negative = 0
    this.words[0] = 0
    this.length = 1
    return this
  }

  // a > b
  var a
  var b
  if (cmp > 0) {
    a = this
    b = num
  } else {
    a = num
    b = this
  }

  for (var i = 0, carry = 0; i < b.length; ++i) {
    var word = a.words[i] - b.words[i] + carry
    carry = word >> 26
    this.words[i] = word & 0x03ffffff
  }

  for (; carry !== 0 && i < a.length; ++i) {
    word = a.words[i] + carry
    carry = word >> 26
    this.words[i] = word & 0x03ffffff
  }

  if (carry === 0 && i < a.length && a !== this) {
    for (; i < a.length; ++i) this.words[i] = a.words[i]
  }

  this.length = Math.max(this.length, i)

  if (a !== this) this.negative ^= 1

  return this.strip().normSign()
}

BN.prototype.sub = function (num) {
  return this.clone().isub(num)
}

BN.umulTo = function (num1, num2, out) {
  out.length = num1.length + num2.length - 1

  var a1 = num1.words[0]
  var b1 = num2.words[0]
  var r1 = a1 * b1

  var carry = (r1 / 0x04000000) | 0
  out.words[0] = r1 & 0x03ffffff

  for (var k = 1, maxK = out.length; k < maxK; k++) {
    var ncarry = carry >>> 26
    var rword = carry & 0x03ffffff
    for (var j = Math.max(0, k - num1.length + 1), maxJ = Math.min(k, num2.length - 1); j <= maxJ; j++) {
      var i = k - j
      var a = num1.words[i]
      var b = num2.words[j]
      var r = a * b + rword
      ncarry += (r / 0x04000000) | 0
      rword = r & 0x03ffffff
    }
    out.words[k] = rword
    carry = ncarry
  }

  if (carry !== 0) out.words[out.length++] = carry

  return out.strip()
}

BN.umulTo10x10 = Math.imul ? optimized.umulTo10x10 : BN.umulTo

BN.umulnTo = function (num, k, out) {
  if (k === 0) {
    out.words = [0]
    out.length = 1
    return out
  }

  for (var i = 0, carry = 0; i < num.length; ++i) {
    var r = num.words[i] * k + carry
    out.words[i] = r & 0x03ffffff
    carry = (r / 0x04000000) | 0
  }

  if (carry > 0) {
    out.words[i] = carry
    out.length = num.length + 1
  } else {
    out.length = num.length
  }

  return out
}

BN.prototype.umul = function (num) {
  var out = new BN()
  out.words = new Array(this.length + num.length)

  if (this.length === 10 && num.length === 10) {
    return BN.umulTo10x10(this, num, out)
  } else if (this.length === 1) {
    return BN.umulnTo(num, this.words[0], out)
  } else if (num.length === 1) {
    return BN.umulnTo(this, num.words[0], out)
  } else {
    return BN.umulTo(this, num, out)
  }
}

BN.prototype.isplit = function (output) {
  output.length = Math.min(this.length, 9)
  for (var i = 0; i < output.length; ++i) output.words[i] = this.words[i]

  if (this.length <= 9) {
    this.words[0] = 0
    this.length = 1
    return this
  }

  // Shift by 9 limbs
  var prev = this.words[9]
  output.words[output.length++] = prev & 0x003fffff

  for (i = 10; i < this.length; ++i) {
    var word = this.words[i]
    this.words[i - 10] = ((word & 0x003fffff) << 4) | (prev >>> 22)
    prev = word
  }
  prev >>>= 22
  this.words[i - 10] = prev

  if (prev === 0 && this.length > 10) {
    this.length -= 10
  } else {
    this.length -= 9
  }

  return this
}

BN.prototype.fireduce = function () {
  if (this.isOverflow()) this.isub(BN.n)
  return this
}

BN.prototype.ureduce = function () {
  var num = this.clone().isplit(BN.tmp).umul(BN.nc).iadd(BN.tmp)
  if (num.bitLengthGT256()) {
    num = num.isplit(BN.tmp).umul(BN.nc).iadd(BN.tmp)
    if (num.bitLengthGT256()) num = num.isplit(BN.tmp).umul(BN.nc).iadd(BN.tmp)
  }

  return num.fireduce()
}

BN.prototype.ishrn = function (n) {
  var mask = (1 << n) - 1
  var m = 26 - n

  for (var i = this.length - 1, carry = 0; i >= 0; --i) {
    var word = this.words[i]
    this.words[i] = (carry << m) | (word >>> n)
    carry = word & mask
  }

  if (this.length > 1 && this.words[this.length - 1] === 0) this.length -= 1

  return this
}

BN.prototype.uinvm = function () {
  var x = this.clone()
  var y = BN.n.clone()

  // A * x + B * y = x
  var A = BN.fromNumber(1)
  var B = BN.fromNumber(0)

  // C * x + D * y = y
  var C = BN.fromNumber(0)
  var D = BN.fromNumber(1)

  while (x.isEven() && y.isEven()) {
    for (var k = 1, m = 1; (x.words[0] & m) === 0 && (y.words[0] & m) === 0 && k < 26; ++k, m <<= 1);
    x.ishrn(k)
    y.ishrn(k)
  }

  var yp = y.clone()
  var xp = x.clone()

  while (!x.isZero()) {
    for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
    if (i > 0) {
      x.ishrn(i)
      while (i-- > 0) {
        if (A.isOdd() || B.isOdd()) {
          A.iadd(yp)
          B.isub(xp)
        }

        A.ishrn(1)
        B.ishrn(1)
      }
    }

    for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
    if (j > 0) {
      y.ishrn(j)
      while (j-- > 0) {
        if (C.isOdd() || D.isOdd()) {
          C.iadd(yp)
          D.isub(xp)
        }

        C.ishrn(1)
        D.ishrn(1)
      }
    }

    if (x.ucmp(y) >= 0) {
      x.isub(y)
      A.isub(C)
      B.isub(D)
    } else {
      y.isub(x)
      C.isub(A)
      D.isub(B)
    }
  }

  if (C.negative === 1) {
    C.negative = 0
    var result = C.ureduce()
    result.negative ^= 1
    return result.normSign().iadd(BN.n)
  } else {
    return C.ureduce()
  }
}

BN.prototype.imulK = function () {
  this.words[this.length] = 0
  this.words[this.length + 1] = 0
  this.length += 2

  for (var i = 0, lo = 0; i < this.length; ++i) {
    var w = this.words[i] | 0
    lo += w * 0x3d1
    this.words[i] = lo & 0x03ffffff
    lo = w * 0x40 + ((lo / 0x04000000) | 0)
  }

  if (this.words[this.length - 1] === 0) {
    this.length -= 1
    if (this.words[this.length - 1] === 0) this.length -= 1
  }

  return this
}

BN.prototype.redIReduce = function () {
  this.isplit(BN.tmp).imulK().iadd(BN.tmp)
  if (this.bitLengthGT256()) this.isplit(BN.tmp).imulK().iadd(BN.tmp)

  var cmp = this.ucmp(BN.p)
  if (cmp === 0) {
    this.words[0] = 0
    this.length = 1
  } else if (cmp > 0) {
    this.isub(BN.p)
  } else {
    this.strip()
  }

  return this
}

BN.prototype.redNeg = function () {
  if (this.isZero()) return BN.fromNumber(0)

  return BN.p.sub(this)
}

BN.prototype.redAdd = function (num) {
  return this.clone().redIAdd(num)
}

BN.prototype.redIAdd = function (num) {
  this.iadd(num)
  if (this.ucmp(BN.p) >= 0) this.isub(BN.p)

  return this
}

BN.prototype.redIAdd7 = function () {
  this.iuaddn(7)
  if (this.ucmp(BN.p) >= 0) this.isub(BN.p)

  return this
}

BN.prototype.redSub = function (num) {
  return this.clone().redISub(num)
}

BN.prototype.redISub = function (num) {
  this.isub(num)
  if (this.negative !== 0) this.iadd(BN.p)

  return this
}

BN.prototype.redMul = function (num) {
  return this.umul(num).redIReduce()
}

BN.prototype.redSqr = function () {
  return this.umul(this).redIReduce()
}

BN.prototype.redSqrt = function () {
  if (this.isZero()) return this.clone()

  var wv2 = this.redSqr()
  var wv4 = wv2.redSqr()
  var wv12 = wv4.redSqr().redMul(wv4)
  var wv14 = wv12.redMul(wv2)
  var wv15 = wv14.redMul(this)

  var out = wv15
  for (var i = 0; i < 54; ++i) out = out.redSqr().redSqr().redSqr().redSqr().redMul(wv15)
  out = out.redSqr().redSqr().redSqr().redSqr().redMul(wv14)
  for (i = 0; i < 5; ++i) out = out.redSqr().redSqr().redSqr().redSqr().redMul(wv15)
  out = out.redSqr().redSqr().redSqr().redSqr().redMul(wv12)
  out = out.redSqr().redSqr().redSqr().redSqr().redSqr().redSqr().redMul(wv12)

  if (out.redSqr().ucmp(this) === 0) {
    return out
  } else {
    return null
  }
}

BN.prototype.redInvm = function () {
  var a = this.clone()
  var b = BN.p.clone()

  var x1 = BN.fromNumber(1)
  var x2 = BN.fromNumber(0)

  while (a.gtOne() && b.gtOne()) {
    for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
    if (i > 0) {
      a.ishrn(i)
      while (i-- > 0) {
        if (x1.isOdd()) x1.iadd(BN.p)
        x1.ishrn(1)
      }
    }

    for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
    if (j > 0) {
      b.ishrn(j)
      while (j-- > 0) {
        if (x2.isOdd()) x2.iadd(BN.p)
        x2.ishrn(1)
      }
    }

    if (a.ucmp(b) >= 0) {
      a.isub(b)
      x1.isub(x2)
    } else {
      b.isub(a)
      x2.isub(x1)
    }
  }

  var res
  if (a.length === 1 && a.words[0] === 1) {
    res = x1
  } else {
    res = x2
  }

  if (res.negative !== 0) res.iadd(BN.p)

  if (res.negative !== 0) {
    res.negative = 0
    return res.redIReduce().redNeg()
  } else {
    return res.redIReduce()
  }
}

BN.prototype.getNAF = function (w) {
  var naf = []
  var ws = 1 << (w + 1)
  var wsm1 = ws - 1
  var ws2 = ws >> 1

  var k = this.clone()
  while (!k.isZero()) {
    for (var i = 0, m = 1; (k.words[0] & m) === 0 && i < 26; ++i, m <<= 1) naf.push(0)

    if (i !== 0) {
      k.ishrn(i)
    } else {
      var mod = k.words[0] & wsm1
      if (mod >= ws2) {
        naf.push(ws2 - mod)
        k.iuaddn(mod - ws2).ishrn(1)
      } else {
        naf.push(mod)
        k.words[0] -= mod
        if (!k.isZero()) {
          for (i = w - 1; i > 0; --i) naf.push(0)
          k.ishrn(w)
        }
      }
    }
  }

  return naf
}

BN.prototype.inspect = function () {
  if (this.isZero()) return '0'

  var buffer = this.toBuffer().toString('hex')
  for (var i = 0; buffer[i] === '0'; ++i);
  return buffer.slice(i)
}

BN.n = BN.fromBuffer(new Buffer('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141', 'hex'))
BN.nh = BN.n.clone().ishrn(1)
BN.nc = BN.fromBuffer(new Buffer('000000000000000000000000000000014551231950B75FC4402DA1732FC9BEBF', 'hex'))
BN.p = BN.fromBuffer(new Buffer('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F', 'hex'))
BN.psn = BN.p.sub(BN.n)
BN.tmp = new BN()
BN.tmp.words = new Array(10)

// WTF?! it speed-up benchmark on ~20%
;(function () {
  var x = BN.fromNumber(1)
  x.words[3] = 0
})()

module.exports = BN

}).call(this,require("buffer").Buffer)
},{"./optimized":35,"buffer":11}],35:[function(require,module,exports){
'use strict'
exports.umulTo10x10 = function (num1, num2, out) {
  var a = num1.words
  var b = num2.words
  var o = out.words
  var c = 0
  var lo
  var mid
  var hi
  var a0 = a[0] | 0
  var al0 = a0 & 0x1fff
  var ah0 = a0 >>> 13
  var a1 = a[1] | 0
  var al1 = a1 & 0x1fff
  var ah1 = a1 >>> 13
  var a2 = a[2] | 0
  var al2 = a2 & 0x1fff
  var ah2 = a2 >>> 13
  var a3 = a[3] | 0
  var al3 = a3 & 0x1fff
  var ah3 = a3 >>> 13
  var a4 = a[4] | 0
  var al4 = a4 & 0x1fff
  var ah4 = a4 >>> 13
  var a5 = a[5] | 0
  var al5 = a5 & 0x1fff
  var ah5 = a5 >>> 13
  var a6 = a[6] | 0
  var al6 = a6 & 0x1fff
  var ah6 = a6 >>> 13
  var a7 = a[7] | 0
  var al7 = a7 & 0x1fff
  var ah7 = a7 >>> 13
  var a8 = a[8] | 0
  var al8 = a8 & 0x1fff
  var ah8 = a8 >>> 13
  var a9 = a[9] | 0
  var al9 = a9 & 0x1fff
  var ah9 = a9 >>> 13
  var b0 = b[0] | 0
  var bl0 = b0 & 0x1fff
  var bh0 = b0 >>> 13
  var b1 = b[1] | 0
  var bl1 = b1 & 0x1fff
  var bh1 = b1 >>> 13
  var b2 = b[2] | 0
  var bl2 = b2 & 0x1fff
  var bh2 = b2 >>> 13
  var b3 = b[3] | 0
  var bl3 = b3 & 0x1fff
  var bh3 = b3 >>> 13
  var b4 = b[4] | 0
  var bl4 = b4 & 0x1fff
  var bh4 = b4 >>> 13
  var b5 = b[5] | 0
  var bl5 = b5 & 0x1fff
  var bh5 = b5 >>> 13
  var b6 = b[6] | 0
  var bl6 = b6 & 0x1fff
  var bh6 = b6 >>> 13
  var b7 = b[7] | 0
  var bl7 = b7 & 0x1fff
  var bh7 = b7 >>> 13
  var b8 = b[8] | 0
  var bl8 = b8 & 0x1fff
  var bh8 = b8 >>> 13
  var b9 = b[9] | 0
  var bl9 = b9 & 0x1fff
  var bh9 = b9 >>> 13

  out.length = 19
  /* k = 0 */
  lo = Math.imul(al0, bl0)
  mid = Math.imul(al0, bh0)
  mid += Math.imul(ah0, bl0)
  hi = Math.imul(ah0, bh0)
  var w0 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w0 >>> 26)
  w0 &= 0x3ffffff
  /* k = 1 */
  lo = Math.imul(al1, bl0)
  mid = Math.imul(al1, bh0)
  mid += Math.imul(ah1, bl0)
  hi = Math.imul(ah1, bh0)
  lo += Math.imul(al0, bl1)
  mid += Math.imul(al0, bh1)
  mid += Math.imul(ah0, bl1)
  hi += Math.imul(ah0, bh1)
  var w1 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w1 >>> 26)
  w1 &= 0x3ffffff
  /* k = 2 */
  lo = Math.imul(al2, bl0)
  mid = Math.imul(al2, bh0)
  mid += Math.imul(ah2, bl0)
  hi = Math.imul(ah2, bh0)
  lo += Math.imul(al1, bl1)
  mid += Math.imul(al1, bh1)
  mid += Math.imul(ah1, bl1)
  hi += Math.imul(ah1, bh1)
  lo += Math.imul(al0, bl2)
  mid += Math.imul(al0, bh2)
  mid += Math.imul(ah0, bl2)
  hi += Math.imul(ah0, bh2)
  var w2 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w2 >>> 26)
  w2 &= 0x3ffffff
  /* k = 3 */
  lo = Math.imul(al3, bl0)
  mid = Math.imul(al3, bh0)
  mid += Math.imul(ah3, bl0)
  hi = Math.imul(ah3, bh0)
  lo += Math.imul(al2, bl1)
  mid += Math.imul(al2, bh1)
  mid += Math.imul(ah2, bl1)
  hi += Math.imul(ah2, bh1)
  lo += Math.imul(al1, bl2)
  mid += Math.imul(al1, bh2)
  mid += Math.imul(ah1, bl2)
  hi += Math.imul(ah1, bh2)
  lo += Math.imul(al0, bl3)
  mid += Math.imul(al0, bh3)
  mid += Math.imul(ah0, bl3)
  hi += Math.imul(ah0, bh3)
  var w3 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w3 >>> 26)
  w3 &= 0x3ffffff
  /* k = 4 */
  lo = Math.imul(al4, bl0)
  mid = Math.imul(al4, bh0)
  mid += Math.imul(ah4, bl0)
  hi = Math.imul(ah4, bh0)
  lo += Math.imul(al3, bl1)
  mid += Math.imul(al3, bh1)
  mid += Math.imul(ah3, bl1)
  hi += Math.imul(ah3, bh1)
  lo += Math.imul(al2, bl2)
  mid += Math.imul(al2, bh2)
  mid += Math.imul(ah2, bl2)
  hi += Math.imul(ah2, bh2)
  lo += Math.imul(al1, bl3)
  mid += Math.imul(al1, bh3)
  mid += Math.imul(ah1, bl3)
  hi += Math.imul(ah1, bh3)
  lo += Math.imul(al0, bl4)
  mid += Math.imul(al0, bh4)
  mid += Math.imul(ah0, bl4)
  hi += Math.imul(ah0, bh4)
  var w4 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w4 >>> 26)
  w4 &= 0x3ffffff
  /* k = 5 */
  lo = Math.imul(al5, bl0)
  mid = Math.imul(al5, bh0)
  mid += Math.imul(ah5, bl0)
  hi = Math.imul(ah5, bh0)
  lo += Math.imul(al4, bl1)
  mid += Math.imul(al4, bh1)
  mid += Math.imul(ah4, bl1)
  hi += Math.imul(ah4, bh1)
  lo += Math.imul(al3, bl2)
  mid += Math.imul(al3, bh2)
  mid += Math.imul(ah3, bl2)
  hi += Math.imul(ah3, bh2)
  lo += Math.imul(al2, bl3)
  mid += Math.imul(al2, bh3)
  mid += Math.imul(ah2, bl3)
  hi += Math.imul(ah2, bh3)
  lo += Math.imul(al1, bl4)
  mid += Math.imul(al1, bh4)
  mid += Math.imul(ah1, bl4)
  hi += Math.imul(ah1, bh4)
  lo += Math.imul(al0, bl5)
  mid += Math.imul(al0, bh5)
  mid += Math.imul(ah0, bl5)
  hi += Math.imul(ah0, bh5)
  var w5 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w5 >>> 26)
  w5 &= 0x3ffffff
  /* k = 6 */
  lo = Math.imul(al6, bl0)
  mid = Math.imul(al6, bh0)
  mid += Math.imul(ah6, bl0)
  hi = Math.imul(ah6, bh0)
  lo += Math.imul(al5, bl1)
  mid += Math.imul(al5, bh1)
  mid += Math.imul(ah5, bl1)
  hi += Math.imul(ah5, bh1)
  lo += Math.imul(al4, bl2)
  mid += Math.imul(al4, bh2)
  mid += Math.imul(ah4, bl2)
  hi += Math.imul(ah4, bh2)
  lo += Math.imul(al3, bl3)
  mid += Math.imul(al3, bh3)
  mid += Math.imul(ah3, bl3)
  hi += Math.imul(ah3, bh3)
  lo += Math.imul(al2, bl4)
  mid += Math.imul(al2, bh4)
  mid += Math.imul(ah2, bl4)
  hi += Math.imul(ah2, bh4)
  lo += Math.imul(al1, bl5)
  mid += Math.imul(al1, bh5)
  mid += Math.imul(ah1, bl5)
  hi += Math.imul(ah1, bh5)
  lo += Math.imul(al0, bl6)
  mid += Math.imul(al0, bh6)
  mid += Math.imul(ah0, bl6)
  hi += Math.imul(ah0, bh6)
  var w6 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w6 >>> 26)
  w6 &= 0x3ffffff
  /* k = 7 */
  lo = Math.imul(al7, bl0)
  mid = Math.imul(al7, bh0)
  mid += Math.imul(ah7, bl0)
  hi = Math.imul(ah7, bh0)
  lo += Math.imul(al6, bl1)
  mid += Math.imul(al6, bh1)
  mid += Math.imul(ah6, bl1)
  hi += Math.imul(ah6, bh1)
  lo += Math.imul(al5, bl2)
  mid += Math.imul(al5, bh2)
  mid += Math.imul(ah5, bl2)
  hi += Math.imul(ah5, bh2)
  lo += Math.imul(al4, bl3)
  mid += Math.imul(al4, bh3)
  mid += Math.imul(ah4, bl3)
  hi += Math.imul(ah4, bh3)
  lo += Math.imul(al3, bl4)
  mid += Math.imul(al3, bh4)
  mid += Math.imul(ah3, bl4)
  hi += Math.imul(ah3, bh4)
  lo += Math.imul(al2, bl5)
  mid += Math.imul(al2, bh5)
  mid += Math.imul(ah2, bl5)
  hi += Math.imul(ah2, bh5)
  lo += Math.imul(al1, bl6)
  mid += Math.imul(al1, bh6)
  mid += Math.imul(ah1, bl6)
  hi += Math.imul(ah1, bh6)
  lo += Math.imul(al0, bl7)
  mid += Math.imul(al0, bh7)
  mid += Math.imul(ah0, bl7)
  hi += Math.imul(ah0, bh7)
  var w7 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w7 >>> 26)
  w7 &= 0x3ffffff
  /* k = 8 */
  lo = Math.imul(al8, bl0)
  mid = Math.imul(al8, bh0)
  mid += Math.imul(ah8, bl0)
  hi = Math.imul(ah8, bh0)
  lo += Math.imul(al7, bl1)
  mid += Math.imul(al7, bh1)
  mid += Math.imul(ah7, bl1)
  hi += Math.imul(ah7, bh1)
  lo += Math.imul(al6, bl2)
  mid += Math.imul(al6, bh2)
  mid += Math.imul(ah6, bl2)
  hi += Math.imul(ah6, bh2)
  lo += Math.imul(al5, bl3)
  mid += Math.imul(al5, bh3)
  mid += Math.imul(ah5, bl3)
  hi += Math.imul(ah5, bh3)
  lo += Math.imul(al4, bl4)
  mid += Math.imul(al4, bh4)
  mid += Math.imul(ah4, bl4)
  hi += Math.imul(ah4, bh4)
  lo += Math.imul(al3, bl5)
  mid += Math.imul(al3, bh5)
  mid += Math.imul(ah3, bl5)
  hi += Math.imul(ah3, bh5)
  lo += Math.imul(al2, bl6)
  mid += Math.imul(al2, bh6)
  mid += Math.imul(ah2, bl6)
  hi += Math.imul(ah2, bh6)
  lo += Math.imul(al1, bl7)
  mid += Math.imul(al1, bh7)
  mid += Math.imul(ah1, bl7)
  hi += Math.imul(ah1, bh7)
  lo += Math.imul(al0, bl8)
  mid += Math.imul(al0, bh8)
  mid += Math.imul(ah0, bl8)
  hi += Math.imul(ah0, bh8)
  var w8 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w8 >>> 26)
  w8 &= 0x3ffffff
  /* k = 9 */
  lo = Math.imul(al9, bl0)
  mid = Math.imul(al9, bh0)
  mid += Math.imul(ah9, bl0)
  hi = Math.imul(ah9, bh0)
  lo += Math.imul(al8, bl1)
  mid += Math.imul(al8, bh1)
  mid += Math.imul(ah8, bl1)
  hi += Math.imul(ah8, bh1)
  lo += Math.imul(al7, bl2)
  mid += Math.imul(al7, bh2)
  mid += Math.imul(ah7, bl2)
  hi += Math.imul(ah7, bh2)
  lo += Math.imul(al6, bl3)
  mid += Math.imul(al6, bh3)
  mid += Math.imul(ah6, bl3)
  hi += Math.imul(ah6, bh3)
  lo += Math.imul(al5, bl4)
  mid += Math.imul(al5, bh4)
  mid += Math.imul(ah5, bl4)
  hi += Math.imul(ah5, bh4)
  lo += Math.imul(al4, bl5)
  mid += Math.imul(al4, bh5)
  mid += Math.imul(ah4, bl5)
  hi += Math.imul(ah4, bh5)
  lo += Math.imul(al3, bl6)
  mid += Math.imul(al3, bh6)
  mid += Math.imul(ah3, bl6)
  hi += Math.imul(ah3, bh6)
  lo += Math.imul(al2, bl7)
  mid += Math.imul(al2, bh7)
  mid += Math.imul(ah2, bl7)
  hi += Math.imul(ah2, bh7)
  lo += Math.imul(al1, bl8)
  mid += Math.imul(al1, bh8)
  mid += Math.imul(ah1, bl8)
  hi += Math.imul(ah1, bh8)
  lo += Math.imul(al0, bl9)
  mid += Math.imul(al0, bh9)
  mid += Math.imul(ah0, bl9)
  hi += Math.imul(ah0, bh9)
  var w9 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w9 >>> 26)
  w9 &= 0x3ffffff
  /* k = 10 */
  lo = Math.imul(al9, bl1)
  mid = Math.imul(al9, bh1)
  mid += Math.imul(ah9, bl1)
  hi = Math.imul(ah9, bh1)
  lo += Math.imul(al8, bl2)
  mid += Math.imul(al8, bh2)
  mid += Math.imul(ah8, bl2)
  hi += Math.imul(ah8, bh2)
  lo += Math.imul(al7, bl3)
  mid += Math.imul(al7, bh3)
  mid += Math.imul(ah7, bl3)
  hi += Math.imul(ah7, bh3)
  lo += Math.imul(al6, bl4)
  mid += Math.imul(al6, bh4)
  mid += Math.imul(ah6, bl4)
  hi += Math.imul(ah6, bh4)
  lo += Math.imul(al5, bl5)
  mid += Math.imul(al5, bh5)
  mid += Math.imul(ah5, bl5)
  hi += Math.imul(ah5, bh5)
  lo += Math.imul(al4, bl6)
  mid += Math.imul(al4, bh6)
  mid += Math.imul(ah4, bl6)
  hi += Math.imul(ah4, bh6)
  lo += Math.imul(al3, bl7)
  mid += Math.imul(al3, bh7)
  mid += Math.imul(ah3, bl7)
  hi += Math.imul(ah3, bh7)
  lo += Math.imul(al2, bl8)
  mid += Math.imul(al2, bh8)
  mid += Math.imul(ah2, bl8)
  hi += Math.imul(ah2, bh8)
  lo += Math.imul(al1, bl9)
  mid += Math.imul(al1, bh9)
  mid += Math.imul(ah1, bl9)
  hi += Math.imul(ah1, bh9)
  var w10 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w10 >>> 26)
  w10 &= 0x3ffffff
  /* k = 11 */
  lo = Math.imul(al9, bl2)
  mid = Math.imul(al9, bh2)
  mid += Math.imul(ah9, bl2)
  hi = Math.imul(ah9, bh2)
  lo += Math.imul(al8, bl3)
  mid += Math.imul(al8, bh3)
  mid += Math.imul(ah8, bl3)
  hi += Math.imul(ah8, bh3)
  lo += Math.imul(al7, bl4)
  mid += Math.imul(al7, bh4)
  mid += Math.imul(ah7, bl4)
  hi += Math.imul(ah7, bh4)
  lo += Math.imul(al6, bl5)
  mid += Math.imul(al6, bh5)
  mid += Math.imul(ah6, bl5)
  hi += Math.imul(ah6, bh5)
  lo += Math.imul(al5, bl6)
  mid += Math.imul(al5, bh6)
  mid += Math.imul(ah5, bl6)
  hi += Math.imul(ah5, bh6)
  lo += Math.imul(al4, bl7)
  mid += Math.imul(al4, bh7)
  mid += Math.imul(ah4, bl7)
  hi += Math.imul(ah4, bh7)
  lo += Math.imul(al3, bl8)
  mid += Math.imul(al3, bh8)
  mid += Math.imul(ah3, bl8)
  hi += Math.imul(ah3, bh8)
  lo += Math.imul(al2, bl9)
  mid += Math.imul(al2, bh9)
  mid += Math.imul(ah2, bl9)
  hi += Math.imul(ah2, bh9)
  var w11 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w11 >>> 26)
  w11 &= 0x3ffffff
  /* k = 12 */
  lo = Math.imul(al9, bl3)
  mid = Math.imul(al9, bh3)
  mid += Math.imul(ah9, bl3)
  hi = Math.imul(ah9, bh3)
  lo += Math.imul(al8, bl4)
  mid += Math.imul(al8, bh4)
  mid += Math.imul(ah8, bl4)
  hi += Math.imul(ah8, bh4)
  lo += Math.imul(al7, bl5)
  mid += Math.imul(al7, bh5)
  mid += Math.imul(ah7, bl5)
  hi += Math.imul(ah7, bh5)
  lo += Math.imul(al6, bl6)
  mid += Math.imul(al6, bh6)
  mid += Math.imul(ah6, bl6)
  hi += Math.imul(ah6, bh6)
  lo += Math.imul(al5, bl7)
  mid += Math.imul(al5, bh7)
  mid += Math.imul(ah5, bl7)
  hi += Math.imul(ah5, bh7)
  lo += Math.imul(al4, bl8)
  mid += Math.imul(al4, bh8)
  mid += Math.imul(ah4, bl8)
  hi += Math.imul(ah4, bh8)
  lo += Math.imul(al3, bl9)
  mid += Math.imul(al3, bh9)
  mid += Math.imul(ah3, bl9)
  hi += Math.imul(ah3, bh9)
  var w12 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w12 >>> 26)
  w12 &= 0x3ffffff
  /* k = 13 */
  lo = Math.imul(al9, bl4)
  mid = Math.imul(al9, bh4)
  mid += Math.imul(ah9, bl4)
  hi = Math.imul(ah9, bh4)
  lo += Math.imul(al8, bl5)
  mid += Math.imul(al8, bh5)
  mid += Math.imul(ah8, bl5)
  hi += Math.imul(ah8, bh5)
  lo += Math.imul(al7, bl6)
  mid += Math.imul(al7, bh6)
  mid += Math.imul(ah7, bl6)
  hi += Math.imul(ah7, bh6)
  lo += Math.imul(al6, bl7)
  mid += Math.imul(al6, bh7)
  mid += Math.imul(ah6, bl7)
  hi += Math.imul(ah6, bh7)
  lo += Math.imul(al5, bl8)
  mid += Math.imul(al5, bh8)
  mid += Math.imul(ah5, bl8)
  hi += Math.imul(ah5, bh8)
  lo += Math.imul(al4, bl9)
  mid += Math.imul(al4, bh9)
  mid += Math.imul(ah4, bl9)
  hi += Math.imul(ah4, bh9)
  var w13 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w13 >>> 26)
  w13 &= 0x3ffffff
  /* k = 14 */
  lo = Math.imul(al9, bl5)
  mid = Math.imul(al9, bh5)
  mid += Math.imul(ah9, bl5)
  hi = Math.imul(ah9, bh5)
  lo += Math.imul(al8, bl6)
  mid += Math.imul(al8, bh6)
  mid += Math.imul(ah8, bl6)
  hi += Math.imul(ah8, bh6)
  lo += Math.imul(al7, bl7)
  mid += Math.imul(al7, bh7)
  mid += Math.imul(ah7, bl7)
  hi += Math.imul(ah7, bh7)
  lo += Math.imul(al6, bl8)
  mid += Math.imul(al6, bh8)
  mid += Math.imul(ah6, bl8)
  hi += Math.imul(ah6, bh8)
  lo += Math.imul(al5, bl9)
  mid += Math.imul(al5, bh9)
  mid += Math.imul(ah5, bl9)
  hi += Math.imul(ah5, bh9)
  var w14 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w14 >>> 26)
  w14 &= 0x3ffffff
  /* k = 15 */
  lo = Math.imul(al9, bl6)
  mid = Math.imul(al9, bh6)
  mid += Math.imul(ah9, bl6)
  hi = Math.imul(ah9, bh6)
  lo += Math.imul(al8, bl7)
  mid += Math.imul(al8, bh7)
  mid += Math.imul(ah8, bl7)
  hi += Math.imul(ah8, bh7)
  lo += Math.imul(al7, bl8)
  mid += Math.imul(al7, bh8)
  mid += Math.imul(ah7, bl8)
  hi += Math.imul(ah7, bh8)
  lo += Math.imul(al6, bl9)
  mid += Math.imul(al6, bh9)
  mid += Math.imul(ah6, bl9)
  hi += Math.imul(ah6, bh9)
  var w15 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w15 >>> 26)
  w15 &= 0x3ffffff
  /* k = 16 */
  lo = Math.imul(al9, bl7)
  mid = Math.imul(al9, bh7)
  mid += Math.imul(ah9, bl7)
  hi = Math.imul(ah9, bh7)
  lo += Math.imul(al8, bl8)
  mid += Math.imul(al8, bh8)
  mid += Math.imul(ah8, bl8)
  hi += Math.imul(ah8, bh8)
  lo += Math.imul(al7, bl9)
  mid += Math.imul(al7, bh9)
  mid += Math.imul(ah7, bl9)
  hi += Math.imul(ah7, bh9)
  var w16 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w16 >>> 26)
  w16 &= 0x3ffffff
  /* k = 17 */
  lo = Math.imul(al9, bl8)
  mid = Math.imul(al9, bh8)
  mid += Math.imul(ah9, bl8)
  hi = Math.imul(ah9, bh8)
  lo += Math.imul(al8, bl9)
  mid += Math.imul(al8, bh9)
  mid += Math.imul(ah8, bl9)
  hi += Math.imul(ah8, bh9)
  var w17 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w17 >>> 26)
  w17 &= 0x3ffffff
  /* k = 18 */
  lo = Math.imul(al9, bl9)
  mid = Math.imul(al9, bh9)
  mid += Math.imul(ah9, bl9)
  hi = Math.imul(ah9, bh9)
  var w18 = c + lo + ((mid & 0x1fff) << 13)
  c = hi + (mid >>> 13) + (w18 >>> 26)
  w18 &= 0x3ffffff
  o[0] = w0
  o[1] = w1
  o[2] = w2
  o[3] = w3
  o[4] = w4
  o[5] = w5
  o[6] = w6
  o[7] = w7
  o[8] = w8
  o[9] = w9
  o[10] = w10
  o[11] = w11
  o[12] = w12
  o[13] = w13
  o[14] = w14
  o[15] = w15
  o[16] = w16
  o[17] = w17
  o[18] = w18
  if (c !== 0) {
    o[19] = c
    out.length++
  }
  return out
}

},{}],36:[function(require,module,exports){
'use strict'
var BN = require('./bn')

function ECJPoint (x, y, z) {
  if (x === null && y === null && z === null) {
    this.x = ECJPoint.one
    this.y = ECJPoint.one
    this.z = ECJPoint.zero
  } else {
    this.x = x
    this.y = y
    this.z = z
  }

  this.zOne = this.z === ECJPoint.one
}

ECJPoint.zero = BN.fromNumber(0)
ECJPoint.one = BN.fromNumber(1)

ECJPoint.prototype.neg = function () {
  if (this.inf) return this

  return new ECJPoint(this.x, this.y.redNeg(), this.z)
}

ECJPoint.prototype.add = function (p) {
  // O + P = P
  if (this.inf) return p

  // P + O = P
  if (p.inf) return this

  // http://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#addition-add-1998-cmo-2
  // 12M + 4S + 7A
  var pz2 = p.z.redSqr()
  var z2 = this.z.redSqr()
  var u1 = this.x.redMul(pz2)
  var u2 = p.x.redMul(z2)
  var s1 = this.y.redMul(pz2).redMul(p.z)
  var s2 = p.y.redMul(z2).redMul(this.z)

  var h = u1.redSub(u2)
  var r = s1.redSub(s2)
  if (h.isZero()) {
    if (r.isZero()) return this.dbl()
    return new ECJPoint(null, null, null)
  }

  var h2 = h.redSqr()
  var v = u1.redMul(h2)
  var h3 = h2.redMul(h)

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v)
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3))
  var nz = this.z.redMul(p.z).redMul(h)

  return new ECJPoint(nx, ny, nz)
}

ECJPoint.prototype.mixedAdd = function (p) {
  // O + P = P
  if (this.inf) return p.toECJPoint()

  // P + O = P
  if (p.inf) return this

  // http://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#addition-add-1998-cmo-2
  //   with p.z = 1
  // 8M + 3S + 7A
  var z2 = this.z.redSqr()
  var u1 = this.x
  var u2 = p.x.redMul(z2)
  var s1 = this.y
  var s2 = p.y.redMul(z2).redMul(this.z)

  var h = u1.redSub(u2)
  var r = s1.redSub(s2)
  if (h.isZero()) {
    if (r.isZero()) return this.dbl()
    return new ECJPoint(null, null, null)
  }

  var h2 = h.redSqr()
  var v = u1.redMul(h2)
  var h3 = h2.redMul(h)

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v)
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3))
  var nz = this.z.redMul(h)

  return new ECJPoint(nx, ny, nz)
}

ECJPoint.prototype.dbl = function () {
  if (this.inf) return this

  var nx
  var ny
  var nz

  // Z = 1
  if (this.zOne) {
    // http://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#doubling-mdbl-2007-bl
    // 1M + 5S + 6A + 3*2 + 1*3 + 1*8

    // XX = X1^2
    var xx = this.x.redSqr()
    // YY = Y1^2
    var yy = this.y.redSqr()
    // YYYY = YY^2
    var yyyy = yy.redSqr()
    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy)
    s = s.redIAdd(s)
    // M = 3 * XX
    var m = xx.redAdd(xx).redIAdd(xx)
    // T = M ^ 2 - 2*S
    var t = m.redSqr().redISub(s).redISub(s)

    // 8 * YYYY
    var yyyy8 = yyyy.redIAdd(yyyy).redIAdd(yyyy).redIAdd(yyyy)

    // X3 = T
    nx = t
    // Y3 = M * (S - T) - 8 * YYYY
    ny = m.redMul(s.redISub(t)).redISub(yyyy8)
    // Z3 = 2*Y1
    nz = this.y.redAdd(this.y)
  } else {
    // http://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#doubling-dbl-2009-l
    // 2M + 5S + 6A + 3*2 + 1*3 + 1*8

    // A = X1^2
    var a = this.x.redSqr()
    // B = Y1^2
    var b = this.y.redSqr()
    // C = B^2
    var c = b.redSqr()
    // D = 2 * ((X1 + B)^2 - A - C)
    var d = this.x.redAdd(b).redSqr().redISub(a).redISub(c)
    d = d.redIAdd(d)
    // E = 3 * A
    var e = a.redAdd(a).redIAdd(a)
    // F = E^2
    var f = e.redSqr()

    // 8 * C
    var c8 = c.redIAdd(c).redIAdd(c).redIAdd(c)

    // X3 = F - 2 * D
    nx = f.redISub(d).redISub(d)
    // Y3 = E * (D - X3) - 8 * C
    ny = e.redMul(d.redISub(nx)).redISub(c8)
    // Z3 = 2 * Y1 * Z1
    nz = this.y.redMul(this.z)
    nz = nz.redIAdd(nz)
  }

  return new ECJPoint(nx, ny, nz)
}

ECJPoint.prototype.dblp = function (pow) {
  if (pow === 0 || this.inf) return this

  var point = this
  for (var i = 0; i < pow; i++) point = point.dbl()

  return point
}

Object.defineProperty(ECJPoint.prototype, 'inf', {
  enumerable: true,
  get: function () {
    return this.z.isZero()
  }
})

module.exports = ECJPoint

},{"./bn":34}],37:[function(require,module,exports){
(function (Buffer){
'use strict'
var BN = require('./bn')
var ECJPoint = require('./ecjpoint')

function ECPoint (x, y) {
  if (x === null && y === null) {
    this.x = this.y = null
    this.inf = true
  } else {
    this.x = x
    this.y = y
    this.inf = false
  }
}

ECPoint.fromPublicKey = function (publicKey) {
  var first = publicKey[0]
  var x
  var y

  if (publicKey.length === 33 && (first === 0x02 || first === 0x03)) {
    x = BN.fromBuffer(publicKey.slice(1, 33))

    // overflow
    if (x.ucmp(BN.p) >= 0) return null

    // create from X
    y = x.redSqr().redMul(x).redIAdd7().redSqrt()
    if (y === null) return null
    if ((first === 0x03) !== y.isOdd()) y = y.redNeg()

    return new ECPoint(x, y)
  }

  if (publicKey.length === 65 && (first === 0x04 || first === 0x06 || first === 0x07)) {
    x = BN.fromBuffer(publicKey.slice(1, 33))
    y = BN.fromBuffer(publicKey.slice(33, 65))

    // overflow
    if (x.ucmp(BN.p) >= 0 || y.ucmp(BN.p) >= 0) return null

    // is odd flag
    if ((first === 0x06 || first === 0x07) && y.isOdd() !== (first === 0x07)) return null

    // x*x*x + 7 = y*y
    if (x.redSqr().redMul(x).redIAdd7().ucmp(y.redSqr()) !== 0) return null

    return new ECPoint(x, y)
  }

  return null
}

ECPoint.prototype.toPublicKey = function (compressed) {
  var x = this.x
  var y = this.y
  var publicKey

  if (compressed) {
    publicKey = new Buffer(33)
    publicKey[0] = y.isOdd() ? 0x03 : 0x02
    x.toBuffer().copy(publicKey, 1)
  } else {
    publicKey = new Buffer(65)
    publicKey[0] = 0x04
    x.toBuffer().copy(publicKey, 1)
    y.toBuffer().copy(publicKey, 33)
  }

  return publicKey
}

ECPoint.fromECJPoint = function (p) {
  if (p.inf) return new ECPoint(null, null)

  var zinv = p.z.redInvm()
  var zinv2 = zinv.redSqr()
  var ax = p.x.redMul(zinv2)
  var ay = p.y.redMul(zinv2).redMul(zinv)

  return new ECPoint(ax, ay)
}

ECPoint.prototype.toECJPoint = function () {
  if (this.inf) return new ECJPoint(null, null, null)

  return new ECJPoint(this.x, this.y, ECJPoint.one)
}

ECPoint.prototype.neg = function () {
  if (this.inf) return this

  return new ECPoint(this.x, this.y.redNeg())
}

ECPoint.prototype.add = function (p) {
  // O + P = P
  if (this.inf) return p

  // P + O = P
  if (p.inf) return this

  if (this.x.ucmp(p.x) === 0) {
    // P + P = 2P
    if (this.y.ucmp(p.y) === 0) return this.dbl()
    // P + (-P) = O
    return new ECPoint(null, null)
  }

  // s = (y - yp) / (x - xp)
  // nx = s^2 - x - xp
  // ny = s * (x - nx) - y
  var s = this.y.redSub(p.y)
  if (!s.isZero()) s = s.redMul(this.x.redSub(p.x).redInvm())

  var nx = s.redSqr().redISub(this.x).redISub(p.x)
  var ny = s.redMul(this.x.redSub(nx)).redISub(this.y)
  return new ECPoint(nx, ny)
}

ECPoint.prototype.dbl = function () {
  if (this.inf) return this

  // 2P = O
  var yy = this.y.redAdd(this.y)
  if (yy.isZero()) return new ECPoint(null, null)

  // s = (3 * x^2) / (2 * y)
  // nx = s^2 - 2*x
  // ny = s * (x - nx) - y
  var x2 = this.x.redSqr()
  var s = x2.redAdd(x2).redIAdd(x2).redMul(yy.redInvm())

  var nx = s.redSqr().redISub(this.x.redAdd(this.x))
  var ny = s.redMul(this.x.redSub(nx)).redISub(this.y)
  return new ECPoint(nx, ny)
}

ECPoint.prototype.mul = function (num) {
  // Algorithm 3.36 Window NAF method for point multiplication
  var nafPoints = this._getNAFPoints(4)
  var points = nafPoints.points

  // Get NAF form
  var naf = num.getNAF(nafPoints.wnd)

  // Add `this`*(N+1) for every w-NAF index
  var acc = new ECJPoint(null, null, null)
  for (var i = naf.length - 1; i >= 0; i--) {
    // Count zeroes
    for (var k = 0; i >= 0 && naf[i] === 0; i--, ++k);
    if (i >= 0) k += 1
    acc = acc.dblp(k)

    if (i < 0) break

    // J +- P
    var z = naf[i]
    if (z > 0) {
      acc = acc.mixedAdd(points[(z - 1) >> 1])
    } else {
      acc = acc.mixedAdd(points[(-z - 1) >> 1].neg())
    }
  }

  return ECPoint.fromECJPoint(acc)
}

ECPoint.prototype._getNAFPoints1 = function () {
  return { wnd: 1, points: [this] }
}

ECPoint.prototype._getNAFPoints = function (wnd) {
  var points = new Array((1 << wnd) - 1)
  points[0] = this
  var dbl = this.dbl()
  for (var i = 1; i < points.length; ++i) points[i] = points[i - 1].add(dbl)
  return { wnd: wnd, points: points }
}

module.exports = ECPoint

}).call(this,require("buffer").Buffer)
},{"./bn":34,"./ecjpoint":36,"buffer":11}],38:[function(require,module,exports){
(function (Buffer){
'use strict'
var BN = require('./bn')
var ECPoint = require('./ecpoint')
var ECJPoint = require('./ecjpoint')

function ECPointG () {
  this.x = BN.fromBuffer(new Buffer('79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798', 'hex'))
  this.y = BN.fromBuffer(new Buffer('483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8', 'hex'))
  this.inf = false

  this._precompute()
}

ECPointG.prototype._precompute = function () {
  var ecpoint = new ECPoint(this.x, this.y)

  var dstep = 4
  var points = new Array(1 + Math.ceil(257 / dstep))
  var acc = points[0] = ecpoint
  for (var i = 1; i < points.length; ++i) {
    for (var j = 0; j < dstep; j++) acc = acc.dbl()
    points[i] = acc
  }

  this.precomputed = {
    naf: ecpoint._getNAFPoints(7),
    doubles: {
      step: dstep,
      points: points,
      negpoints: points.map(function (p) { return p.neg() })
    }
  }
}

ECPointG.prototype.mul = function (num) {
  // Algorithm 3.42 Fixed-base NAF windowing method for point multiplication
  var step = this.precomputed.doubles.step
  var points = this.precomputed.doubles.points
  var negpoints = this.precomputed.doubles.negpoints

  var naf = num.getNAF(1)
  var I = ((1 << (step + 1)) - (step % 2 === 0 ? 2 : 1)) / 3

  // Translate into more windowed form
  var repr = []
  for (var j = 0; j < naf.length; j += step) {
    var nafW = 0
    for (var k = j + step - 1; k >= j; k--) nafW = (nafW << 1) + naf[k]
    repr.push(nafW)
  }

  var a = new ECJPoint(null, null, null)
  var b = new ECJPoint(null, null, null)
  for (var i = I; i > 0; i--) {
    for (var jj = 0; jj < repr.length; jj++) {
      if (repr[jj] === i) {
        b = b.mixedAdd(points[jj])
      } else if (repr[jj] === -i) {
        b = b.mixedAdd(negpoints[jj])
      }
    }

    a = a.add(b)
  }

  return ECPoint.fromECJPoint(a)
}

ECPointG.prototype.mulAdd = function (k1, p2, k2) {
  var nafPointsP1 = this.precomputed.naf
  var nafPointsP2 = p2._getNAFPoints1()
  var wnd = [nafPointsP1.points, nafPointsP2.points]
  var naf = [k1.getNAF(nafPointsP1.wnd), k2.getNAF(nafPointsP2.wnd)]

  var acc = new ECJPoint(null, null, null)
  var tmp = [null, null]
  for (var i = Math.max(naf[0].length, naf[1].length); i >= 0; i--) {
    var k = 0

    for (; i >= 0; ++k, --i) {
      tmp[0] = naf[0][i] | 0
      tmp[1] = naf[1][i] | 0

      if (tmp[0] !== 0 || tmp[1] !== 0) break
    }

    if (i >= 0) k += 1
    acc = acc.dblp(k)

    if (i < 0) break

    for (var jj = 0; jj < 2; jj++) {
      var z = tmp[jj]
      var p
      if (z === 0) {
        continue
      } else if (z > 0) {
        p = wnd[jj][z >> 1]
      } else if (z < 0) {
        p = wnd[jj][-z >> 1].neg()
      }

      // hack: ECPoint detection
      if (p.z === undefined) {
        acc = acc.mixedAdd(p)
      } else {
        acc = acc.add(p)
      }
    }
  }

  return acc
}

module.exports = new ECPointG()

}).call(this,require("buffer").Buffer)
},{"./bn":34,"./ecjpoint":36,"./ecpoint":37,"buffer":11}],39:[function(require,module,exports){
(function (Buffer){
'use strict'
var createHash = require('create-hash')
var HmacDRBG = require('drbg.js/hmac')
var messages = require('../messages.json')
var BN = require('./bn')
var ECPoint = require('./ecpoint')
var g = require('./ecpointg')

exports.privateKeyVerify = function (privateKey) {
  var bn = BN.fromBuffer(privateKey)
  return !(bn.isOverflow() || bn.isZero())
}

exports.privateKeyExport = function (privateKey, compressed) {
  var d = BN.fromBuffer(privateKey)
  if (d.isOverflow() || d.isZero()) throw new Error(messages.EC_PRIVATE_KEY_EXPORT_DER_FAIL)

  return g.mul(d).toPublicKey(compressed)
}

exports.privateKeyTweakAdd = function (privateKey, tweak) {
  var bn = BN.fromBuffer(tweak)
  if (bn.isOverflow()) throw new Error(messages.EC_PRIVATE_KEY_TWEAK_ADD_FAIL)

  bn.iadd(BN.fromBuffer(privateKey))
  if (bn.isOverflow()) bn.isub(BN.n)
  if (bn.isZero()) throw new Error(messages.EC_PRIVATE_KEY_TWEAK_ADD_FAIL)

  return bn.toBuffer()
}

exports.privateKeyTweakMul = function (privateKey, tweak) {
  var bn = BN.fromBuffer(tweak)
  if (bn.isOverflow() || bn.isZero()) throw new Error(messages.EC_PRIVATE_KEY_TWEAK_MUL_FAIL)

  var d = BN.fromBuffer(privateKey)
  return bn.umul(d).ureduce().toBuffer()
}

exports.publicKeyCreate = function (privateKey, compressed) {
  var d = BN.fromBuffer(privateKey)
  if (d.isOverflow() || d.isZero()) throw new Error(messages.EC_PUBLIC_KEY_CREATE_FAIL)

  return g.mul(d).toPublicKey(compressed)
}

exports.publicKeyConvert = function (publicKey, compressed) {
  var point = ECPoint.fromPublicKey(publicKey)
  if (point === null) throw new Error(messages.EC_PUBLIC_KEY_PARSE_FAIL)

  return point.toPublicKey(compressed)
}

exports.publicKeyVerify = function (publicKey) {
  return ECPoint.fromPublicKey(publicKey) !== null
}

exports.publicKeyTweakAdd = function (publicKey, tweak, compressed) {
  var point = ECPoint.fromPublicKey(publicKey)
  if (point === null) throw new Error(messages.EC_PUBLIC_KEY_PARSE_FAIL)

  tweak = BN.fromBuffer(tweak)
  if (tweak.isOverflow()) throw new Error(messages.EC_PUBLIC_KEY_TWEAK_ADD_FAIL)

  return g.mul(tweak).add(point).toPublicKey(compressed)
}

exports.publicKeyTweakMul = function (publicKey, tweak, compressed) {
  var point = ECPoint.fromPublicKey(publicKey)
  if (point === null) throw new Error(messages.EC_PUBLIC_KEY_PARSE_FAIL)

  tweak = BN.fromBuffer(tweak)
  if (tweak.isOverflow() || tweak.isZero()) throw new Error(messages.EC_PUBLIC_KEY_TWEAK_MUL_FAIL)

  return point.mul(tweak).toPublicKey(compressed)
}

exports.publicKeyCombine = function (publicKeys, compressed) {
  var points = new Array(publicKeys.length)
  for (var i = 0; i < publicKeys.length; ++i) {
    points[i] = ECPoint.fromPublicKey(publicKeys[i])
    if (points[i] === null) throw new Error(messages.EC_PUBLIC_KEY_PARSE_FAIL)
  }

  var point = points[0]
  for (var j = 1; j < points.length; ++j) point = point.add(points[j])
  if (point.inf) throw new Error(messages.EC_PUBLIC_KEY_COMBINE_FAIL)

  return point.toPublicKey(compressed)
}

exports.signatureNormalize = function (signature) {
  var r = BN.fromBuffer(signature.slice(0, 32))
  var s = BN.fromBuffer(signature.slice(32, 64))
  if (r.isOverflow() || s.isOverflow()) throw new Error(messages.ECDSA_SIGNATURE_PARSE_FAIL)

  var result = new Buffer(signature)
  if (s.isHigh()) BN.n.sub(s).toBuffer().copy(result, 32)

  return result
}

exports.signatureExport = function (signature) {
  var r = signature.slice(0, 32)
  var s = signature.slice(32, 64)
  if (BN.fromBuffer(r).isOverflow() || BN.fromBuffer(s).isOverflow()) throw new Error(messages.ECDSA_SIGNATURE_PARSE_FAIL)

  return { r: r, s: s }
}

exports.signatureImport = function (sigObj) {
  var r = BN.fromBuffer(sigObj.r)
  if (r.isOverflow()) r = BN.fromNumber(0)

  var s = BN.fromBuffer(sigObj.s)
  if (s.isOverflow()) s = BN.fromNumber(0)

  return Buffer.concat([r.toBuffer(), s.toBuffer()])
}

exports.sign = function (message, privateKey, noncefn, data) {
  var d = BN.fromBuffer(privateKey)
  if (d.isOverflow() || d.isZero()) throw new Error(messages.ECDSA_SIGN_FAIL)

  if (noncefn === null) {
    var drbg = new HmacDRBG('sha256', privateKey, message, data)
    noncefn = function () { return drbg.generate(32) }
  }

  var bnMessage = BN.fromBuffer(message)
  for (var count = 0; ; ++count) {
    var nonce = noncefn(message, privateKey, null, data, count)
    if (!Buffer.isBuffer(nonce) || nonce.length !== 32) throw new Error(messages.ECDSA_SIGN_FAIL)

    var k = BN.fromBuffer(nonce)
    if (k.isOverflow() || k.isZero()) continue

    var kp = g.mul(k)
    var r = kp.x.fireduce()
    if (r.isZero()) continue

    var s = k.uinvm().umul(r.umul(d).ureduce().iadd(bnMessage).fireduce()).ureduce()
    if (s.isZero()) continue

    var recovery = (kp.x.ucmp(r) !== 0 ? 2 : 0) | (kp.y.isOdd() ? 1 : 0)
    if (s.isHigh()) {
      s = BN.n.sub(s)
      recovery ^= 1
    }

    return {
      signature: Buffer.concat([r.toBuffer(), s.toBuffer()]),
      recovery: recovery
    }
  }
}

exports.verify = function (message, signature, publicKey) {
  var sigr = BN.fromBuffer(signature.slice(0, 32))
  var sigs = BN.fromBuffer(signature.slice(32, 64))
  if (sigr.isOverflow() || sigs.isOverflow()) throw new Error(messages.ECDSA_SIGNATURE_PARSE_FAIL)

  if (sigs.isHigh() || sigr.isZero() || sigs.isZero()) return false

  var pub = ECPoint.fromPublicKey(publicKey)
  if (pub === null) throw new Error(messages.EC_PUBLIC_KEY_PARSE_FAIL)

  var sinv = sigs.uinvm()
  var u1 = sinv.umul(BN.fromBuffer(message)).ureduce()
  var u2 = sinv.umul(sigr).ureduce()
  var point = g.mulAdd(u1, pub, u2)
  if (point.inf) return false

  // return ECPoint.fromECJPoint(point).x.fireduce().ucmp(sigr) === 0
  // Inversion-free
  var z2 = point.z.redSqr()
  if (sigr.redMul(z2).ucmp(point.x) === 0) return true
  if (sigr.ucmp(BN.psn) >= 0) return false

  return sigr.iadd(BN.psn).redMul(z2).ucmp(point.x) === 0
}

exports.recover = function (message, signature, recovery, compressed) {
  var sigr = BN.fromBuffer(signature.slice(0, 32))
  var sigs = BN.fromBuffer(signature.slice(32, 64))
  if (sigr.isOverflow() || sigs.isOverflow()) throw new Error(messages.ECDSA_SIGNATURE_PARSE_FAIL)

  do {
    if (sigr.isZero() || sigs.isZero()) break

    var kpx = sigr
    if (recovery >> 1) {
      if (kpx.ucmp(BN.psn) >= 0) break
      kpx = sigr.add(BN.n)
    }

    var kpPublicKey = Buffer.concat([new Buffer([0x02 + (recovery & 0x01)]), kpx.toBuffer()])
    var kp = ECPoint.fromPublicKey(kpPublicKey)
    if (kp === null) break

    var eNeg = BN.n.sub(BN.fromBuffer(message))
    var rInv = sigr.uinvm()
    var point = ECPoint.fromECJPoint(g.mulAdd(eNeg, kp, sigs))
    return point.mul(rInv).toPublicKey(compressed)
  } while (false)

  throw new Error(messages.ECDSA_RECOVER_FAIL)
}

exports.ecdh = function (publicKey, privateKey) {
  var shared = exports.ecdhUnsafe(publicKey, privateKey, true)
  return createHash('sha256').update(shared).digest()
}

exports.ecdhUnsafe = function (publicKey, privateKey, compressed) {
  var point = ECPoint.fromPublicKey(publicKey)
  if (point === null) throw new Error(messages.EC_PUBLIC_KEY_PARSE_FAIL)

  var scalar = BN.fromBuffer(privateKey)
  if (scalar.isOverflow() || scalar.isZero()) throw new Error(messages.ECDH_FAIL)

  return point.mul(scalar).toPublicKey(compressed)
}

}).call(this,require("buffer").Buffer)
},{"../messages.json":40,"./bn":34,"./ecpoint":37,"./ecpointg":38,"buffer":11,"create-hash":4,"drbg.js/hmac":8}],40:[function(require,module,exports){
module.exports={
  "COMPRESSED_TYPE_INVALID": "compressed should be a boolean",
  "EC_PRIVATE_KEY_TYPE_INVALID": "private key should be a Buffer",
  "EC_PRIVATE_KEY_LENGTH_INVALID": "private key length is invalid",
  "EC_PRIVATE_KEY_TWEAK_ADD_FAIL": "tweak out of range or resulting private key is invalid",
  "EC_PRIVATE_KEY_TWEAK_MUL_FAIL": "tweak out of range",
  "EC_PRIVATE_KEY_EXPORT_DER_FAIL": "couldn't export to DER format",
  "EC_PRIVATE_KEY_IMPORT_DER_FAIL": "couldn't import from DER format",
  "EC_PUBLIC_KEYS_TYPE_INVALID": "public keys should be an Array",
  "EC_PUBLIC_KEYS_LENGTH_INVALID": "public keys Array should have at least 1 element",
  "EC_PUBLIC_KEY_TYPE_INVALID": "public key should be a Buffer",
  "EC_PUBLIC_KEY_LENGTH_INVALID": "public key length is invalid",
  "EC_PUBLIC_KEY_PARSE_FAIL": "the public key could not be parsed or is invalid",
  "EC_PUBLIC_KEY_CREATE_FAIL": "private was invalid, try again",
  "EC_PUBLIC_KEY_TWEAK_ADD_FAIL": "tweak out of range or resulting public key is invalid",
  "EC_PUBLIC_KEY_TWEAK_MUL_FAIL": "tweak out of range",
  "EC_PUBLIC_KEY_COMBINE_FAIL": "the sum of the public keys is not valid",
  "ECDH_FAIL": "scalar was invalid (zero or overflow)",
  "ECDSA_SIGNATURE_TYPE_INVALID": "signature should be a Buffer",
  "ECDSA_SIGNATURE_LENGTH_INVALID": "signature length is invalid",
  "ECDSA_SIGNATURE_PARSE_FAIL": "couldn't parse signature",
  "ECDSA_SIGNATURE_PARSE_DER_FAIL": "couldn't parse DER signature",
  "ECDSA_SIGNATURE_SERIALIZE_DER_FAIL": "couldn't serialize signature to DER format",
  "ECDSA_SIGN_FAIL": "nonce generation function failed or private key is invalid",
  "ECDSA_RECOVER_FAIL": "couldn't recover public key from signature",
  "MSG32_TYPE_INVALID": "message should be a Buffer",
  "MSG32_LENGTH_INVALID": "message length is invalid",
  "OPTIONS_TYPE_INVALID": "options should be an Object",
  "OPTIONS_DATA_TYPE_INVALID": "options.data should be a Buffer",
  "OPTIONS_DATA_LENGTH_INVALID": "options.data length is invalid",
  "OPTIONS_NONCEFN_TYPE_INVALID": "options.noncefn should be a Function",
  "RECOVERY_ID_TYPE_INVALID": "recovery should be a Number",
  "RECOVERY_ID_VALUE_INVALID": "recovery should have value between -1 and 4",
  "TWEAK_TYPE_INVALID": "tweak should be a Buffer",
  "TWEAK_LENGTH_INVALID": "tweak length is invalid"
}

},{}],41:[function(require,module,exports){
(function (Buffer){
// prototype class for hash functions
function Hash (blockSize, finalSize) {
  this._block = new Buffer(blockSize)
  this._finalSize = finalSize
  this._blockSize = blockSize
  this._len = 0
  this._s = 0
}

Hash.prototype.update = function (data, enc) {
  if (typeof data === 'string') {
    enc = enc || 'utf8'
    data = new Buffer(data, enc)
  }

  var l = this._len += data.length
  var s = this._s || 0
  var f = 0
  var buffer = this._block

  while (s < l) {
    var t = Math.min(data.length, f + this._blockSize - (s % this._blockSize))
    var ch = (t - f)

    for (var i = 0; i < ch; i++) {
      buffer[(s % this._blockSize) + i] = data[i + f]
    }

    s += ch
    f += ch

    if ((s % this._blockSize) === 0) {
      this._update(buffer)
    }
  }
  this._s = s

  return this
}

Hash.prototype.digest = function (enc) {
  // Suppose the length of the message M, in bits, is l
  var l = this._len * 8

  // Append the bit 1 to the end of the message
  this._block[this._len % this._blockSize] = 0x80

  // and then k zero bits, where k is the smallest non-negative solution to the equation (l + 1 + k) === finalSize mod blockSize
  this._block.fill(0, this._len % this._blockSize + 1)

  if (l % (this._blockSize * 8) >= this._finalSize * 8) {
    this._update(this._block)
    this._block.fill(0)
  }

  // to this append the block which is equal to the number l written in binary
  // TODO: handle case where l is > Math.pow(2, 29)
  this._block.writeInt32BE(l, this._blockSize - 4)

  var hash = this._update(this._block) || this._hash()

  return enc ? hash.toString(enc) : hash
}

Hash.prototype._update = function () {
  throw new Error('_update must be implemented by subclass')
}

module.exports = Hash

}).call(this,require("buffer").Buffer)
},{"buffer":11}],42:[function(require,module,exports){
var exports = module.exports = function SHA (algorithm) {
  algorithm = algorithm.toLowerCase()

  var Algorithm = exports[algorithm]
  if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')

  return new Algorithm()
}

exports.sha = require('./sha')
exports.sha1 = require('./sha1')
exports.sha224 = require('./sha224')
exports.sha256 = require('./sha256')
exports.sha384 = require('./sha384')
exports.sha512 = require('./sha512')

},{"./sha":43,"./sha1":44,"./sha224":45,"./sha256":46,"./sha384":47,"./sha512":48}],43:[function(require,module,exports){
(function (Buffer){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
 * in FIPS PUB 180-1
 * This source code is derived from sha1.js of the same repository.
 * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
 * operation was added.
 */

var inherits = require('inherits')
var Hash = require('./hash')

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha, Hash)

Sha.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha.prototype._hash = function () {
  var H = new Buffer(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha

}).call(this,require("buffer").Buffer)
},{"./hash":41,"buffer":11,"inherits":29}],44:[function(require,module,exports){
(function (Buffer){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var inherits = require('inherits')
var Hash = require('./hash')

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha1 () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha1, Hash)

Sha1.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl1 (num) {
  return (num << 1) | (num >>> 31)
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha1.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha1.prototype._hash = function () {
  var H = new Buffer(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha1

}).call(this,require("buffer").Buffer)
},{"./hash":41,"buffer":11,"inherits":29}],45:[function(require,module,exports){
(function (Buffer){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Sha256 = require('./sha256')
var Hash = require('./hash')

var W = new Array(64)

function Sha224 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha224, Sha256)

Sha224.prototype.init = function () {
  this._a = 0xc1059ed8
  this._b = 0x367cd507
  this._c = 0x3070dd17
  this._d = 0xf70e5939
  this._e = 0xffc00b31
  this._f = 0x68581511
  this._g = 0x64f98fa7
  this._h = 0xbefa4fa4

  return this
}

Sha224.prototype._hash = function () {
  var H = new Buffer(28)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)

  return H
}

module.exports = Sha224

}).call(this,require("buffer").Buffer)
},{"./hash":41,"./sha256":46,"buffer":11,"inherits":29}],46:[function(require,module,exports){
(function (Buffer){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Hash = require('./hash')

var K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
]

var W = new Array(64)

function Sha256 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha256, Hash)

Sha256.prototype.init = function () {
  this._a = 0x6a09e667
  this._b = 0xbb67ae85
  this._c = 0x3c6ef372
  this._d = 0xa54ff53a
  this._e = 0x510e527f
  this._f = 0x9b05688c
  this._g = 0x1f83d9ab
  this._h = 0x5be0cd19

  return this
}

function ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x) {
  return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10)
}

function sigma1 (x) {
  return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7)
}

function gamma0 (x) {
  return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)
}

function gamma1 (x) {
  return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ (x >>> 10)
}

Sha256.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0
  var f = this._f | 0
  var g = this._g | 0
  var h = this._h | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 64; ++i) W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0

  for (var j = 0; j < 64; ++j) {
    var T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0
    var T2 = (sigma0(a) + maj(a, b, c)) | 0

    h = g
    g = f
    f = e
    e = (d + T1) | 0
    d = c
    c = b
    b = a
    a = (T1 + T2) | 0
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
  this._f = (f + this._f) | 0
  this._g = (g + this._g) | 0
  this._h = (h + this._h) | 0
}

Sha256.prototype._hash = function () {
  var H = new Buffer(32)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)
  H.writeInt32BE(this._h, 28)

  return H
}

module.exports = Sha256

}).call(this,require("buffer").Buffer)
},{"./hash":41,"buffer":11,"inherits":29}],47:[function(require,module,exports){
(function (Buffer){
var inherits = require('inherits')
var SHA512 = require('./sha512')
var Hash = require('./hash')

var W = new Array(160)

function Sha384 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha384, SHA512)

Sha384.prototype.init = function () {
  this._ah = 0xcbbb9d5d
  this._bh = 0x629a292a
  this._ch = 0x9159015a
  this._dh = 0x152fecd8
  this._eh = 0x67332667
  this._fh = 0x8eb44a87
  this._gh = 0xdb0c2e0d
  this._hh = 0x47b5481d

  this._al = 0xc1059ed8
  this._bl = 0x367cd507
  this._cl = 0x3070dd17
  this._dl = 0xf70e5939
  this._el = 0xffc00b31
  this._fl = 0x68581511
  this._gl = 0x64f98fa7
  this._hl = 0xbefa4fa4

  return this
}

Sha384.prototype._hash = function () {
  var H = new Buffer(48)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)

  return H
}

module.exports = Sha384

}).call(this,require("buffer").Buffer)
},{"./hash":41,"./sha512":48,"buffer":11,"inherits":29}],48:[function(require,module,exports){
(function (Buffer){
var inherits = require('inherits')
var Hash = require('./hash')

var K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
]

var W = new Array(160)

function Sha512 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha512, Hash)

Sha512.prototype.init = function () {
  this._ah = 0x6a09e667
  this._bh = 0xbb67ae85
  this._ch = 0x3c6ef372
  this._dh = 0xa54ff53a
  this._eh = 0x510e527f
  this._fh = 0x9b05688c
  this._gh = 0x1f83d9ab
  this._hh = 0x5be0cd19

  this._al = 0xf3bcc908
  this._bl = 0x84caa73b
  this._cl = 0xfe94f82b
  this._dl = 0x5f1d36f1
  this._el = 0xade682d1
  this._fl = 0x2b3e6c1f
  this._gl = 0xfb41bd6b
  this._hl = 0x137e2179

  return this
}

function Ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x, xl) {
  return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25)
}

function sigma1 (x, xl) {
  return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23)
}

function Gamma0 (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7)
}

function Gamma0l (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25)
}

function Gamma1 (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6)
}

function Gamma1l (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26)
}

function getCarry (a, b) {
  return (a >>> 0) < (b >>> 0) ? 1 : 0
}

Sha512.prototype._update = function (M) {
  var W = this._w

  var ah = this._ah | 0
  var bh = this._bh | 0
  var ch = this._ch | 0
  var dh = this._dh | 0
  var eh = this._eh | 0
  var fh = this._fh | 0
  var gh = this._gh | 0
  var hh = this._hh | 0

  var al = this._al | 0
  var bl = this._bl | 0
  var cl = this._cl | 0
  var dl = this._dl | 0
  var el = this._el | 0
  var fl = this._fl | 0
  var gl = this._gl | 0
  var hl = this._hl | 0

  for (var i = 0; i < 32; i += 2) {
    W[i] = M.readInt32BE(i * 4)
    W[i + 1] = M.readInt32BE(i * 4 + 4)
  }
  for (; i < 160; i += 2) {
    var xh = W[i - 15 * 2]
    var xl = W[i - 15 * 2 + 1]
    var gamma0 = Gamma0(xh, xl)
    var gamma0l = Gamma0l(xl, xh)

    xh = W[i - 2 * 2]
    xl = W[i - 2 * 2 + 1]
    var gamma1 = Gamma1(xh, xl)
    var gamma1l = Gamma1l(xl, xh)

    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
    var Wi7h = W[i - 7 * 2]
    var Wi7l = W[i - 7 * 2 + 1]

    var Wi16h = W[i - 16 * 2]
    var Wi16l = W[i - 16 * 2 + 1]

    var Wil = (gamma0l + Wi7l) | 0
    var Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0
    Wil = (Wil + gamma1l) | 0
    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0
    Wil = (Wil + Wi16l) | 0
    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0

    W[i] = Wih
    W[i + 1] = Wil
  }

  for (var j = 0; j < 160; j += 2) {
    Wih = W[j]
    Wil = W[j + 1]

    var majh = maj(ah, bh, ch)
    var majl = maj(al, bl, cl)

    var sigma0h = sigma0(ah, al)
    var sigma0l = sigma0(al, ah)
    var sigma1h = sigma1(eh, el)
    var sigma1l = sigma1(el, eh)

    // t1 = h + sigma1 + ch + K[j] + W[j]
    var Kih = K[j]
    var Kil = K[j + 1]

    var chh = Ch(eh, fh, gh)
    var chl = Ch(el, fl, gl)

    var t1l = (hl + sigma1l) | 0
    var t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0
    t1l = (t1l + chl) | 0
    t1h = (t1h + chh + getCarry(t1l, chl)) | 0
    t1l = (t1l + Kil) | 0
    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0
    t1l = (t1l + Wil) | 0
    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0

    // t2 = sigma0 + maj
    var t2l = (sigma0l + majl) | 0
    var t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0

    hh = gh
    hl = gl
    gh = fh
    gl = fl
    fh = eh
    fl = el
    el = (dl + t1l) | 0
    eh = (dh + t1h + getCarry(el, dl)) | 0
    dh = ch
    dl = cl
    ch = bh
    cl = bl
    bh = ah
    bl = al
    al = (t1l + t2l) | 0
    ah = (t1h + t2h + getCarry(al, t1l)) | 0
  }

  this._al = (this._al + al) | 0
  this._bl = (this._bl + bl) | 0
  this._cl = (this._cl + cl) | 0
  this._dl = (this._dl + dl) | 0
  this._el = (this._el + el) | 0
  this._fl = (this._fl + fl) | 0
  this._gl = (this._gl + gl) | 0
  this._hl = (this._hl + hl) | 0

  this._ah = (this._ah + ah + getCarry(this._al, al)) | 0
  this._bh = (this._bh + bh + getCarry(this._bl, bl)) | 0
  this._ch = (this._ch + ch + getCarry(this._cl, cl)) | 0
  this._dh = (this._dh + dh + getCarry(this._dl, dl)) | 0
  this._eh = (this._eh + eh + getCarry(this._el, el)) | 0
  this._fh = (this._fh + fh + getCarry(this._fl, fl)) | 0
  this._gh = (this._gh + gh + getCarry(this._gl, gl)) | 0
  this._hh = (this._hh + hh + getCarry(this._hl, hl)) | 0
}

Sha512.prototype._hash = function () {
  var H = new Buffer(64)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)
  writeInt64BE(this._gh, this._gl, 48)
  writeInt64BE(this._hh, this._hl, 56)

  return H
}

module.exports = Sha512

}).call(this,require("buffer").Buffer)
},{"./hash":41,"buffer":11,"inherits":29}]},{},[1])