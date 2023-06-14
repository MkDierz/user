const jwt = require('jsonwebtoken');

class TokenBlacklist {
  constructor() {
    this.blacklist = [];
  }

  addBlacklist(token) {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const exp = decoded.exp * 1000;
      const now = Date.now();

      if (exp > now) {
        this.blacklist.push(token);

        setTimeout(() => {
          const index = this.blacklist.indexOf(token);
          if (index > -1) {
            this.blacklist.splice(index, 1);
          }
        }, exp - now);
      }
    }
  }

  getBlacklist() {
    return this.blacklist;
  }
}

const tokenBlacklist = new TokenBlacklist();

module.exports = {
  TokenBlacklist,
  tokenBlacklist,
};
