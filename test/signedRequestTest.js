const {expect} = require('chai');
const SignedRequest = require('../libs/signedRequest');

const secret = 'asaadfkeh28faf=';
const payload = {
  method:"method.test",
  args:{
    arg1: 'firstArg',
    arg2: 'secondArg'
  }
};


describe('Signed Request', function(){
  const sr = new SignedRequest(secret);
  describe('.sign()', function(){
    const signedPayload = sr.sign(payload);
    it('should have a signature', function(){
      expect(signedPayload.signed).to.have.length(64);
    })
  })
});