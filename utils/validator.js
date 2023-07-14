const { body, query, param } = require('express-validator');

const idParam = param('id').notEmpty().isNumeric().withMessage('valid id required')
  .toInt();
const statusField = body('status').notEmpty().isIn(['ACCEPTED', 'UNACCEPTED']).withMessage('valid status is required');
const nameField = () => body('name').isString().withMessage('valid name is required');
const usernameField = () => body('username').notEmpty().withMessage('username is required');
const emailField = () => body('email').isEmail().withMessage('valid email required');
const bioField = () => body('bio').isString().withMessage('string only for bio');
const locationField = () => body('location').isString().withMessage('string only for location');
const passwordField = () => body('password').isLength({ min: 6 }).withMessage('minimum length for password is 6');
const searchQueryField = query('query').notEmpty().isLength({ min: 3 }).withMessage('valid query required')
  .optional();
const idQuery = query('id')
  .custom((value) => {
    if (!value.split(',').map((i) => parseInt(i, 10)).every(Number.isInteger)) {
      throw new Error('Array does not contain Integers');
    }
    return true;
  })
  .customSanitizer((value) => value.split(',').map((i) => parseInt(i, 10)))
  .optional();

const updateFriendRequestFields = [usernameField(), statusField];
const updateProfileField = [
  nameField().optional(),
  usernameField().optional(),
  emailField().optional(),
  bioField().optional(),
  locationField().optional(),
  passwordField().optional(),
];
const searchFields = [
  searchQueryField,
  idQuery,
];

module.exports = {
  usernameField,
  updateFriendRequestFields,
  updateProfileField,
  searchQueryField,
  searchFields,
  idParam,
};
