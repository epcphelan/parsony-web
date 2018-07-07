const cookieParser = require("cookie-parser");

class SessionManager {
  constructor(app) {
    this.app = app;
    this.app.use(cookieParser());
  }

  observe() {
    return (req, res, next) => {
      req.parsonySession = SessionManager.getSessionCookie(req);
      next();
    };
  }

  static getSessionCookie(req) {
    return req.cookies.parsonySession || "none";
  }

  static setSessionCookie(res, body) {
    const token = SessionManager._extractSessionToken(body);
    if (token === -1) {
      res.clearCookie("parsonySession");
    } else if (token) {
      const cookie = SessionManager._makeSessionCookie(token);
      res.append("Set-Cookie", cookie);
    }
  }
  static _makeSessionCookie(token) {
    return `parsonySession=${token}; HttpOnly`;
  }

  static sanitizeResponse(body) {
    if (body.data && body.data.sessionToken) {
      delete body.data.sessionToken;
    }
  }

  static _extractSessionToken(body) {
    switch (body.requested) {
      case "user.login":
        if (body.success) {
          return body.data.sessionToken;
        } else {
          return -1;
        }
      case "user.logout":
        if (body.success) {
          return -1;
        }
    }
  }
}

module.exports = SessionManager;
