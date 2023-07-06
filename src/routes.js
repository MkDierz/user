const { Router } = require('express');
const { checkToken } = require('../utils/middleware');
const errorHandler = require('../utils/errorHandler');
const {
  usernameField,
  updateFriendRequestFields,
  updateProfileField,
  searchFields,
} = require('../utils/validator');
const {
  profile,
  updateProfile,
  friendRequest,
  friendRequestSent,
  sendFriendRequest,
  updateFriendRequest,
  friendList,
  findUser,
} = require('./app');

const router = Router();
router.use(checkToken);

router.get('/', searchFields, errorHandler.validation, findUser);

router.get('/profile', profile);
router.put('/profile', updateProfileField, errorHandler.validation, updateProfile);

router.get('/friend', friendList);

router.get('/friend-request', friendRequest);
router.put('/friend-request', updateFriendRequestFields, errorHandler.validation, updateFriendRequest);
router.post('/friend-request', usernameField, errorHandler.validation, sendFriendRequest);
router.get('/friend-request/sent', friendRequestSent);

module.exports = router;
