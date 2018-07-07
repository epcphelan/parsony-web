const ApiRouter = require("./libs/apiRouter");
const cors = require("cors");
const express = require("express");
const body_parser = require("body-parser");
const path = require('path');

class ParsonyServer {
  constructor(configs) {
    this.configs = configs;
    this.app = ParsonyServer.createApp();
    this.bindMiddlewares(this.app);
    this.addRouting(this.app);
    this.addStaticDir(this.app);
    this.addReactIndexFallback(this.app);
  }

  static createApp() {
    return express();
  }

  bindMiddlewares() {
    this.app.use(body_parser.json());
    this.app.use(body_parser.urlencoded({ extended: true }));
    this.app.use(cors());
  }

  addRouting(app) {
    const {
      endpoints: { api, sms },
      services_uri
    } = this.configs;
    const apiRouter = new ApiRouter(app, services_uri);
    apiRouter.setEndpoints({ api, sms });
    apiRouter.attachEndpoints();
  }

  addStaticDir(app) {
    const { static_files } = this.configs;
    app.use(express.static(static_files, { extensions: ["html"] }));
  }

  addReactIndexFallback(app){
    const { static_files } = this.configs;
    const index = path.join(static_files, 'index.html');
    app.use((req,res)=>{
      res.status(200);
      res.sendFile(index);
    })
  }

  start() {
    const { http_port } = this.configs;
    this.app.listen(http_port, function(err) {
      if (!err) {
        console.log(`Web server running on: ${http_port}`);
      }
    });
  }
}

module.exports = ParsonyServer;
