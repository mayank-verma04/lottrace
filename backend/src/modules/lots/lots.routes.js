const express = require('express');
const router = express.Router();

const lotsController = require('./lots.controller');
const lotsValidation = require('./lots.validation');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const rbac = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

// All lot routes require auth + tenant scope
router.use(authenticate, tenantScope);

// GET /api/v1/lots — all authenticated users can list
router.get('/',
  validate({ query: lotsValidation.listLotsSchema }),
  lotsController.listLots
);

// POST /api/v1/lots — org_admin, compliance_manager, operator
router.post('/',
  rbac(['org_admin', 'compliance_manager', 'operator']),
  validate({ body: lotsValidation.createLotSchema }),
  lotsController.createLot
);

// GET /api/v1/lots/:lotId — all authenticated users
router.get('/:lotId', lotsController.getLot);

// PATCH /api/v1/lots/:lotId — org_admin, compliance_manager, operator
router.patch('/:lotId',
  rbac(['org_admin', 'compliance_manager', 'operator']),
  validate({ body: lotsValidation.updateLotSchema }),
  lotsController.updateLot
);

// POST /api/v1/lots/:lotId/void — org_admin, compliance_manager
router.post('/:lotId/void',
  rbac(['org_admin', 'compliance_manager']),
  validate({ body: lotsValidation.voidLotSchema }),
  lotsController.voidLot
);

module.exports = router;
