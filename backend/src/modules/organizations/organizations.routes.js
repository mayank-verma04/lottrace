const express = require('express');
const router = express.Router();

const organizationsController = require('./organizations.controller');
const organizationsValidation = require('./organizations.validation');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const rbac = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

// All org routes require auth + tenant scope
router.use(authenticate, tenantScope);

// GET /api/v1/organizations/me — any authenticated user
router.get('/me', organizationsController.getMe);

// PATCH /api/v1/organizations/me — org_admin only
router.patch('/me', rbac(['org_admin']), validate(organizationsValidation.updateOrgSchema), organizationsController.updateMe);

module.exports = router;
