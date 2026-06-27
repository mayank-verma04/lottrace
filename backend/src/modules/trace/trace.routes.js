const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const validate = require('../../middleware/validate');
const rbac = require('../../middleware/rbac');
const traceController = require('./trace.controller');
const { traceParamsSchema } = require('./trace.validation');

const router = express.Router();

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/:lotId/forward',
  rbac(['org_admin', 'compliance_manager', 'operator', 'auditor']),
  validate({ params: traceParamsSchema }),
  traceController.forwardTrace
);

router.get(
  '/:lotId/backward',
  rbac(['org_admin', 'compliance_manager', 'operator', 'auditor']),
  validate({ params: traceParamsSchema }),
  traceController.backwardTrace
);

router.get(
  '/:lotId/full',
  rbac(['org_admin', 'compliance_manager', 'operator', 'auditor']),
  validate({ params: traceParamsSchema }),
  traceController.fullTrace
);

module.exports = router;
