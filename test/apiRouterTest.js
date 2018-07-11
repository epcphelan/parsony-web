const { expect } = require('chai');
const ApiRouter = require('../libs/apiRouter');
const SessionManager = require('../libs/sessionManager');

const app = {
  middlewares :[],
  use: function(fn){
    this.middlewares.push(fn);
  },
  routes:{},
  post: function(url, fn){
    this.routes[url] = fn
  }
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
  });

  describe('.sendError()', function(){
    const SERVER_ERROR = {
      success: false,
      error: {
        code: 500,
        type: "api_server",
        message: "API server not responding.",
        detail: "[CRITICAL] The API server is not responding."
      }
    };
    const res = {
      head:null,
      body:null,
      writeHead: function (val){
        this.head = val;
      },
      end: function (body){
        this.body = body;
      }
    };
    ApiRouter.sendError(res);
    it('should send  error with 200 header', function(){
      expect(res.head).to.equal(200)
    });
    it('should send error object', function(){
      expect(res.body).to.equal(JSON.stringify(SERVER_ERROR))
    })
  });

  describe('.sendResponse()', function(){
    const Response = {
      head:null,
      body:null,
      cookies:{},
      writeHead: function (val){
        this.head = val;
      },
      end: function (body){
        this.body = body;
      },
      clearCookie: function(){
        this.cookies = {}
      },
      append:function(key,value){
        this.cookies[key] = value
      }
    };
    describe('no cookies', function(){
      const apiResponse = {
        hello:"world"
      };
      const res = Object.assign({},Response);
      const bodyText = JSON.stringify(apiResponse);
      ApiRouter.sendResponse(res,{text:bodyText});

      it('should send  error with 200 header', function(){
        expect(res.head).to.equal(200)
      });

      it('should send error object', function(){
        expect(res.body).to.equal(bodyText)
      })
    });
    describe('cookies', function(){
      const loginResponse = {
        requested:"user.login",
        success:true,
        data:{
          sessionToken:'123456789'
        }
      };
      const logoutResponse = {
        requested:"user.logout",
        success:true,
        data:{}
      };


      describe('set cookie', function(){
        const res = Object.assign({},Response);
        const body = JSON.stringify(loginResponse );
        ApiRouter.sendResponse(res,{text:body});
        it('should send 200 header', function(){
          expect(res.head).to.equal(200)
        });

        it('should set cookie header', function(){
          expect(res.cookies['Set-Cookie']).to.equal('parsonySession=123456789; HttpOnly');
        });
      });

      describe('clear cookie', function(){
        const res = Object.assign({},Response);
        const logout = JSON.stringify(logoutResponse);
        const login = JSON.stringify(loginResponse );
        ApiRouter.sendResponse(res,{text:login});
        ApiRouter.sendResponse(res,{text:logout});

        it('should send 200 header', function(){
          expect(res.head).to.equal(200)
        });

        it('should clear cookie header', function(){
          expect(res.cookies['Set-Cookie']).to.equal(undefined);
        })
      })

    })

  })
});