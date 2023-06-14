const jwt = require('jsonwebtoken');

const {
  refreshTokenSecret, tokenSecret, refreshTokenAge, tokenAge, httpError,
} = require('../config');

function signToken(payload) {
  let accessToken;
  let refreshToken;

  try {
    accessToken = jwt.sign(payload, tokenSecret, { expiresIn: tokenAge });
    refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: refreshTokenAge });
  } catch (err) {
    return httpError.InternalServerError();
  }

  return {
    accessToken,
    refreshToken,
  };
}

function verifyAccessToken(token) {
  let authData;
  try {
    authData = jwt.verify(token, tokenSecret);
  } catch (error) {
    return httpError.Unauthorized(error.message);
  }
  return authData;
}

function verifyRefreshToken(token) {
  let authData;
  try {
    authData = jwt.verify(token, refreshTokenSecret);
  } catch (error) {
    return httpError.Unauthorized(error.message);
  }
  return authData;
}

module.exports = {
  signToken,
  verifyAccessToken,
  verifyRefreshToken,
};
