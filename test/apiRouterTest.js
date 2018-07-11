const { expect } = require('chai');
const ApiRouter = require('../libs/apiRouter');
const SessionManager = require('../libs/sessionManager');

const req ={};
const res = {};
const next = function(){};

const app = {
  middlewares :[],
  use: function(fn){
    this.middlewares.push(fn);
  },
  routes:{},
  post: function(url, fn){
    this.routes[url] = fn
  },
};

const endpoint ='http://some.api/v2';
const Router = new ApiRouter(app, endpoint);

describe('API Router', function(){
  describe('new ApiRouter', function(){
    it('should bind app', function(){
      expect(Router.app).to.equal(app);
    });
    it('should bind endpoint', function(){
      expect(Router.servicesEndpoint).to.equal(endpoint);
    });
    it('should have a session manager', function(){
      expect(Router.sessionManager instanceof SessionManager).to.equal(true);
    });
    it('should have session manager middleware .cookieParser', function(){
      expect(app.middlewares[0].name).to.equal('cookieParser');
    });
    it('should have session manager middleware .observer', function(){
      expect(app.middlewares[1].name).to.equal('observer');
    })
  });

  describe('.attachEndpoints()', function(){
    const api = "/json";
    const sms ="/sms";
    Router.setEndpoints({api,sms});
    Router.attachEndpoints();
    it('should have a an api endpoint route', function(){
      expect(app.routes[api]).to.be.a('Function')
    });
    it('should have a an sms endpoint route', function(){
      expect(app.routes[sms]).to.be.a('Function')
    })
  })
});