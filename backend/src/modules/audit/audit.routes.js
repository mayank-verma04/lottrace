const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const validate = require('../../middleware/validate');
const rbac = require('../../middleware/rbac');
const auditController = require('./audit.controller');
const { getAuditLogQuerySchema } = require('./audit.validation');

const router = express.Router();

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/',
  rbac(['org_admin', 'compliance_manager', 'auditor']),
  validate({ query: getAuditLogQuerySchema }),
  auditController.getAuditLogs
);

module.exports = router;
