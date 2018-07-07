const crypto = require('crypto');

class SignedRequest {
  constructor(secret){
    this.secret = secret;
  }

  sign(payload){
    const src = JSON.stringify(payload);
    const signature = this._hash(src);
    return Object.assign(
      {},
      payload,
      { signed:signature }
    );
  }

  _hash(src){
    const hash = crypto.createHash('sha256');
    hash.update(src);
    hash.update(this.secret);
    return hash.digest('hex');
  }
}

module.exports = SignedRequest;