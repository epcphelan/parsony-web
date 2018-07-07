const superAgent = require("superagent");
const SessionManager = require("./sessionManager");
const SignedRequest = require('./signedRequest');



const SERVER_ERROR = {
  success: false,
  error: {
    code: 500,
    type: "api_server",
    message: "API server not responding.",
    detail: "[CRITICAL] The API server is not responding."
  }
};

const HEADERS = {
  CONTENT_TYPE: "Content-Type",
  APP_JSON: "application/json;charset=utf-8",
  SESSION_TOKEN: "Session-Token",
  API_KEY: "Api-Key"
};

class ApiRouter {
  constructor(app, servicesEndpoint) {
    this.servicesEndpoint = servicesEndpoint;
    this.app = app;
    this.sessionManager = new SessionManager(app);
    this.app.use(this.sessionManager.observe());
    this.apiEndpoint = "/json-api";
    this.smsEndpoint = "/sms";
  }

  setApiCredentials(apiKey, secret){
    this.apiKey = apiKey;
    this.secret = secret;
    this.signedRequest = new SignedRequest(this.secret);
  }

  setEndpoints({ api, sms }) {
    this.apiEndpoint = api;
    this.smsEndpoint = sms;
  }

  attachEndpoints() {
    this.bindApiEndpoint();
    this.bindSmsEndpoint();
  }

  static sendError(res){
    res.writeHead(200);
    res.end(JSON.stringify(SERVER_ERROR));
  }

  static sendResponse(res, apiResponse){
    let body = JSON.parse(apiResponse.text);
    SessionManager.setSessionCookie(res, body);
    SessionManager.sanitizeResponse(body);

    res.writeHead(200);
    res.end(JSON.stringify(body));
  }

  bindApiEndpoint() {
    this.app.post(this.apiEndpoint, (req, res) => {
      const token = req.parsonySession;
      const signedPkg = this.signedRequest.sign(req.body);
      superAgent
        .post(this.servicesEndpoint)
        .set(HEADERS.CONTENT_TYPE, HEADERS.APP_JSON)
        .set(HEADERS.SESSION_TOKEN, token)
        .set(HEADERS.API_KEY, this.apiKey)
        .send(signedPkg)
        .end(function(err, response) {
          if (err) {
            ApiRouter.sendError(res);
          } else {
            ApiRouter.sendResponse(res, response)
          }
        });
    });
  }

  bindSmsEndpoint() {
    this.app.post(this.smsEndpoint, (req, res) => {
      let body = {
        method: "sms",
        args: {
          content: req.body.Body
        }
      };
      superAgent
        .post(this.servicesEndpoint)
        .set("Content-Type", "application/json;charset=utf-8")
        .send(body)
        .end(function(err, response) {
          if (err) {
            res.writeHead(500, { "Content-Type": "text/xml" });
            res.end();
          } else {
            res.writeHead(200, { "Content-Type": "text/xml" });
            const jsonResp = JSON.parse(response.text);
            res.end(jsonResp.data.twiml);
          }
        });
    });
  }
}

module.exports = ApiRouter;
