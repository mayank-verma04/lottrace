const express = require('express');
const router = express.Router();

const usersController = require('./users.controller');
const usersValidation = require('./users.validation');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const rbac = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

// All user routes require auth + tenant scope
router.use(authenticate, tenantScope);

// GET /api/v1/users — org_admin + compliance_manager can list
router.get('/', rbac(['org_admin', 'compliance_manager']), usersController.listUsers);

// POST /api/v1/users/invite — org_admin only
router.post('/invite', rbac(['org_admin']), validate(usersValidation.inviteUserSchema), usersController.inviteUser);

// GET /api/v1/users/:userId — org_admin + compliance_manager
router.get('/:userId', rbac(['org_admin', 'compliance_manager']), usersController.getUser);

// PATCH /api/v1/users/:userId — org_admin only
router.patch('/:userId', rbac(['org_admin']), validate(usersValidation.updateUserSchema), usersController.updateUser);

// POST /api/v1/users/:userId/deactivate — org_admin only
router.post('/:userId/deactivate', rbac(['org_admin']), usersController.deactivateUser);

// POST /api/v1/users/:userId/reactivate — org_admin only
router.post('/:userId/reactivate', rbac(['org_admin']), usersController.reactivateUser);

module.exports = router;
