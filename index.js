const cors = require("cors");
const express = require("express");
const http = require("http");
const path = require("path");
const ApiRouter = require("./libs/apiRouter");

/**
 * @class Parsony Web Server
 * Handles API routing, serving static files, and SPA fallback
 */
class ParsonyServer {
  /**
   * Instantiate
   * @param configs
   * @example
   * {
        "http_port": 8090,
        "api_key": "b58445978454a0d72a4dfabad96f5f8542ebf927.key",
        "secret":"c3af42468f78d431729ab501ee1df6d2d6e8e03d.secret",
        "services_uri": "http://localhost:8070/json-api",
        "endpoints":{
          "api":"/json-api",
          "sms":"/sms"
        },
        "static_files":"/dist"
      }
   */
  constructor(configs) {
    this.configs = configs;
    this.app = ParsonyServer.createApp();
    this._addRoot(this.app);
    this._bindMiddlewares(this.app);
    this._addRouting(this.app);
    this._addStaticDir(this.app);
    this._addReactIndexFallback(this.app);
  }

  /**
   * Create express app;
   * @return {*|Function}
   */
  static createApp() {
    return express();
  }

  _bindMiddlewares() {
    this.app.use(express.json({ limit: "50mb", extended: true }));
    this.app.use(express.urlencoded({ limit: "50mb", extended: true }));
    this.app.use(cors());
  }

  _addRouting(app) {
    const {
      endpoints: { api, sms },
      services_uri,
      api_key,
      secret,
    } = this.configs;
    const apiRouter = new ApiRouter(app, services_uri);
    apiRouter.setApiCredentials(api_key, secret);
    apiRouter.setEndpoints({ api, sms });
    apiRouter.attachEndpoints();
  }

  _addStaticDir(app) {
    const { static_files } = this.configs;
    app.use(express.static(static_files, { extensions: ["html"] }));
  }

  _addRoot(app) {
    const {
      endpoints: { index },
    } = this.configs;
    if (index !== "/dist/index.html") {
      app.get("/", (req, res) => {
        const externalReq = http.request(index, function (externalRes) {
          externalRes.pipe(res);
        });
        externalReq.end();
      });
    }
  }

  _addIndexPipe(app) {
    app.use((req, res) => {
      const externalReq = http.request(index, function (externalRes) {
        externalRes.pipe(res);
      });
      externalReq.end();
    });
  }

  _addReactIndexFallback(app) {
    const {
      endpoints: { index },
    } = this.configs;

    if (index !== "/dist/index.html") {
      this._addIndexPipe(app);
    } else {
      const { static_files } = this.configs;
      const indexHtml = path.join(static_files, "index.html");
      app.use((req, res) => {
        res.status(200);
        res.sendFile(indexHtml);
      });
    }
  }

  /**
   * Start server listening on provided port.
   */
  start() {
    const { http_port } = this.configs;
    this.app.listen(http_port, function (err) {
      if (!err) {
        console.log(`Web server running on: ${http_port}`);
      }
    });
  }
}

module.exports = ParsonyServer;
