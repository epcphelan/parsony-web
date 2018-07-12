/**
 * @module /libs/signedRequest
 */

const crypto = require('crypto');

/**
 * @class SignedRequest
 * @classdesc Handles signing parsony requests using SHa256 hash of
 * payload and salted with the API Secret
 */
class SignedRequest {
  /**
   * Instantiate with API secret
   * @param {string} secret
   * @example
   * 9701bcccb27693b1268c7c6d3dcbf4666e5ea7e2.secret
   */
  constructor(secret){
    this.secret = secret;
  }

  /**
   * Method returns signed payload
   * @param {object} payload - JSON payload
   * @return {*}
   */
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