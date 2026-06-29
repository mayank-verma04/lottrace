const express = require('express');
const router = express.Router();
const validate = require('../../middleware/validate');
const { createImportSchema } = require('./validation');
const importsController = require('./controller');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const rbac = require('../../middleware/rbac');

router.use(authenticate, tenantScope);

router.post('/',
  rbac(['org_admin', 'compliance_manager', 'operator']),
  validate({ body: createImportSchema }),
  importsController.createImport
);

router.get('/', importsController.listImports);
router.get('/:id', importsController.getImport);

module.exports = router;
