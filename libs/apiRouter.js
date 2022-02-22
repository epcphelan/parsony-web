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
    detail: "[CRITICAL] The API server is not responding.",
  },
};

const HEADERS = {
  CONTENT_TYPE: "Content-Type",
  APP_JSON: "application/json;charset=utf-8",
  SESSION_TOKEN: "Session-Token",
  API_KEY: "Api-Key",
  COOKIE: "Cookie",
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
   * @param {string} rootDomain - Root domain of the app
   */
  constructor(app, servicesEndpoint, servicesProxyEndpoint, rootDomain = null) {
    this.servicesEndpoint = servicesEndpoint;
    this.servicesProxyEndpoint = servicesProxyEndpoint;
    this.app = app;
    this.sessionManager = new SessionManager(app);
    this.app.use(this.sessionManager.observe());
    this.apiEndpoint = "/json-api";
    this.smsEndpoint = "/sms";
    this.proxyEndpoint = "/proxy";
    this.rootDomain = rootDomain;
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
  setEndpoints({ api, sms, proxy }) {
    this.apiEndpoint = api;
    this.smsEndpoint = sms;
    this.proxyEndpoint = proxy;
  }

  /**
   * Bind routes to Express app
   */
  attachEndpoints() {
    this._bindApiEndpoint();
    this._bindSmsEndpoint();
    this._bindProxyEndpoint();
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
   * @param {string} rootDomain - Root domain of the app
   */
  static sendResponse(res, apiResponse, rootDomain = null) {
    let body = JSON.parse(apiResponse.text);
    SessionManager.setSessionCookie(res, body, rootDomain);
    SessionManager.sanitizeResponse(body);

    res.writeHead(200, { "Content-Type": "application/json" });
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
        .end((err, response) => {
          if (err) {
            ApiRouter.sendError(res);
          } else {
            ApiRouter.sendResponse(res, response, this.rootDomain);
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
          to: req.body.To,
        },
      };
      const token = req.parsonySession;
      pkg.key = this.apiKey;
      pkg.token = token;
      const signedPkg = this.signedRequest.sign(pkg);
      superAgent
        .post(this.servicesEndpoint)
        .set(HEADERS.CONTENT_TYPE, HEADERS.APP_JSON)
        .send(signedPkg)
        .end(function (err, response) {
          if (err) {
            res.writeHead(500, { "Content-Type": "text/xml" });
            res.end();
          } else {
            res.writeHead(200, { "Content-Type": "text/xml" });
            const jsonResp = JSON.parse(response.text);
            const { data } = jsonResp;
            if (data) {
              res.end(jsonResp.data.twiml);
            } else {
              res.end("No Data");
            }
          }
        });
    });
  }

  _bindProxyEndpoint() {
    this.app.post(`${this.proxyEndpoint}*`, (req, res) => {
      const { headers, body, url } = req;
      const sessionToken = req.parsonySession;
      const destination = url.replace(`${this.proxyEndpoint}/`, "");
      const forwardUrl = `${this.servicesProxyEndpoint}${destination}`;
      superAgent
        .post(forwardUrl)
        .set(HEADERS.CONTENT_TYPE, headers["content-type"])
        .set(HEADERS.COOKIE, `parsonySession=${sessionToken}`)
        .send(body)
        .end(function (err, response) {
          if (err) {
            res.writeHead(500, { "Content-Type": "text/xml" });
            res.end(response.text);
          } else {
            res.writeHead(200, { "Content-Type": "text/xml" });
            res.end(response.text);
          }
        });
    });
  }
}

module.exports = ApiRouter;
