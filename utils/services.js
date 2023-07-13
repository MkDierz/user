const { default: axios } = require('axios');
const { baseUrl } = require('../config');

const auth = {
  verifyToken: (accessToken) => axios.get(`${baseUrl}/auth/verify-token?accessToken=${accessToken}`),
  update: (data, token) => axios.put(`${baseUrl}/auth/update`, {
    ...data,
  }, {
    headers: {
      authorization: token,
    },
  }),
};

module.exports = {
  auth,
};
