/**
 *
 * @module /libs/apiRouter.js
 */

const superAgent = require("superagent");
const SessionManager = require("./sessionManager");
const SignedRequest = require("./signedRequest");

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

/**
 * @class API Router
 * @classdesc Routes incoming API requests to Parsony API and SMS endpoints
 */
class ApiRouter {
  /**
   * Instantiate
   * @param {object} app - Express app
   * @param {string} servicesEndpoint - private parsony services api endpoint
   */
  constructor(app, servicesEndpoint) {
    this.servicesEndpoint = servicesEndpoint;
    this.app = app;
    this.sessionManager = new SessionManager(app);
    this.app.use(this.sessionManager.observe());
    this.apiEndpoint = "/json-api";
    this.smsEndpoint = "/sms";
  }

  /**
   * Set credentials on instance
   * @param {string} apiKey
   * @param {string} secret
   */
  setApiCredentials(apiKey, secret) {
    this.apiKey = apiKey;
    this.secret = secret;
    this.signedRequest = new SignedRequest(this.secret);
  }

  /**
   * Overrides default public endpoints
   * @param {string} api
   * @param {string} sms
   */
  setEndpoints({ api, sms }) {
    this.apiEndpoint = api;
    this.smsEndpoint = sms;
  }

  /**
   * Bind routes to Express app
   */
  attachEndpoints() {
    this._bindApiEndpoint();
    this._bindSmsEndpoint();
  }

  /**
   * Send API error response
   * @param {object} res - Express app response
   */
  static sendError(res) {
    res.writeHead(200);
    res.end(JSON.stringify(SERVER_ERROR));
  }

  /**
   * Send success response
   * @param {object} res - Express response object
   * @param {object} apiResponse - sanitizes response
   */
  static sendResponse(res, apiResponse) {
    let body = JSON.parse(apiResponse.text);
    SessionManager.setSessionCookie(res, body);
    SessionManager.sanitizeResponse(body);

    res.writeHead(200);
    res.end(JSON.stringify(body));
  }

  _bindApiEndpoint() {
    this.app.post(this.apiEndpoint, (req, res) => {
      const token = req.parsonySession;
      const pkg = req.body;
      pkg.key = this.apiKey;
      pkg.token = token;
      const signedPkg = this.signedRequest.sign(pkg);
      superAgent
        .post(this.servicesEndpoint)
        .set(HEADERS.CONTENT_TYPE, HEADERS.APP_JSON)
        .send(signedPkg)
        .end(function(err, response) {
          if (err) {
            ApiRouter.sendError(res);
          } else {
            ApiRouter.sendResponse(res, response);
          }
        });
    });
  }

  _bindSmsEndpoint() {
    this.app.post(this.smsEndpoint, (req, res) => {
      const pkg = {
        method: "sms.webhook",
        args: {
          content: req.body.Body,
          from: req.body.From,
          to: req.body.To
        }
      };
      const token = req.parsonySession;
      pkg.key = this.apiKey;
      pkg.token = token;
      const signedPkg = this.signedRequest.sign(pkg);
      superAgent
        .post(this.servicesEndpoint)
        .set(HEADERS.CONTENT_TYPE, HEADERS.APP_JSON)
        .send(signedPkg)
        .end(function(err, response) {
          if (err) {
            res.writeHead(500, { "Content-Type": "text/xml" });
            res.end();
          } else {
            res.writeHead(200, { "Content-Type": "text/xml" });
            const jsonResp = JSON.parse(response.text);
            const {data} = jsonResp;
            if(data){
              res.end(jsonResp.data.twiml);
            } else{
              res.end('No Data');
            }
          }
        });
    });
  }
}

module.exports = ApiRouter;
