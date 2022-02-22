/**
 *
 * @module /libs/sessionManager
 */

const cookieParser = require("cookie-parser");

/**
 * @class Session Manager
 * @classdesc Responsible for managing HTTP cookies
 * Sets HttpOnly cookies with Parsony Session Token on login;
 * clears cookie on logout.
 * Sanitized response body so that no session tokens are passed in
 * the response body.
 * Provides middleware to extract session token cookie from HTTP
 * browser request and appends it to the request object.
 */
class SessionManager {
  /**
   * @param {object} app - Express app
   * @param {string} rootDomain - Root domain of the app
   */
  constructor(app, rootDomain = null) {
    this.app = app;
    this.app.use(cookieParser());
    this.rootDomain = rootDomain;
  }

  /**
   * Returns middleware which extracts Session token cookie and appends
   * to request.
   * @return {observer}
   */
  observe() {
    return function observer(req, res, next) {
      req.parsonySession = SessionManager.getSessionCookie(req);
      next();
    };
  }

  /**
   * Get session token from cookie
   * @param {object} req - Express HTTP request object
   * @return {*|string}
   */
  static getSessionCookie(req) {
    return req.cookies.parsonySession || "none";
  }

  /**
   * Remove session tokens from payload
   * @param {object} body - JSON payload
   */
  static sanitizeResponse(body) {
    if (body.data && body.data.sessionToken) {
      delete body.data.sessionToken;
    }
  }

  /**
   * Set session cookie with session token passed in parsony response
   * body.
   *
   * @example
   * {
   *    requested: "user.login",
   *    success: true,
   *    data: {
   *      sessionToken: "12398fkdjfhkdsufy9238"
   *    }
   * }
   *
   * @param {object} res - Express response object
   * @param body
   */
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
    let cookie = `parsonySession=${token}; HttpOnly`;
    if (this.rootDomain) {
      cookie = `${cookie}; Domain=${this.rootDomain}`;
    }
    return cookie;
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
