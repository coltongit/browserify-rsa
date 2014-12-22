var bn = require('bn.js');
module.exports = crt;
// based on https://github.com/google/end-to-end/blob/bd14d9607e742cd94b1a5af39e0f9e8c454b4a32/src/javascript/crypto/e2e/asymmetric/rsa.js#L196
function blind(priv, crypto) {
  var mod = bn.mont(priv.modulus);
  var r = getr(priv, crypto);
  var p = priv.prime1;
  var q = priv.prime2;
  var ONE = new bn(1);

  var blinder = r.toRed(mod)
  .redPow(new bn(priv.publicExponent)).fromRed();
  return {
    blinder: blinder,
    unblinder:r.invm(priv.modulus)
  };
}
function crt(msg, priv, crypto) {
  var blinds = blind(priv, crypto);
  var mod = bn.mont(priv.modulus);
  var blinded = new bn(msg).mul(blinds.blinder).mod(priv.modulus);
  var c1 = blinded.toRed(bn.mont(priv.prime1));
  var c2 = blinded.toRed(bn.mont(priv.prime2));
  var qinv = priv.coefficient;
  var p = priv.prime1;
  var q = priv.prime2;
  var m1 = c1.redPow(priv.exponent1);
  var m2 = c2.redPow(priv.exponent2);
  m1 = m1.fromRed();
  m2 = m2.fromRed();
  var h = m1.isub(m2).imul(qinv).mod(p);
  h.imul(q);
  m2.iadd(h);
  return new Buffer(m2.imul(blinds.unblinder).mod(priv.modulus).toArray());
}

function getr(priv, crypto) {
  var len = priv.modulus.byteLength();
  var r = new bn(crypto.randomBytes(len));
  while (r.cmp(priv.modulus) >=  0 || !r.mod(priv.prime1) || !r.mod(priv.prime2)) {
    r = new bn(crypto.randomBytes(len));
  }
  return r;
}