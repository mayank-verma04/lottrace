const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');

router.use(authenticate);
router.use(tenantScope);

router.get('/compliance-gaps', reportsController.getComplianceGaps);
router.post('/export', reportsController.requestExport);

module.exports = router;
