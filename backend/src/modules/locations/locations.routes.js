const express = require('express');
const router = express.Router();

const locationsController = require('./locations.controller');
const locationsValidation = require('./locations.validation');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const rbac = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

// All location routes require auth + tenant scope
router.use(authenticate, tenantScope);

// GET /api/v1/locations — all authenticated users can list
router.get('/',
  validate({ query: locationsValidation.listLocationsSchema }),
  locationsController.listLocations
);

// POST /api/v1/locations — org_admin, compliance_manager, operator can create
router.post('/',
  rbac(['org_admin', 'compliance_manager', 'operator']),
  validate(locationsValidation.createLocationSchema),
  locationsController.createLocation
);

// GET /api/v1/locations/:locationId — all authenticated users
router.get('/:locationId', locationsController.getLocation);

// PATCH /api/v1/locations/:locationId — org_admin, compliance_manager
router.patch('/:locationId',
  rbac(['org_admin', 'compliance_manager']),
  validate(locationsValidation.updateLocationSchema),
  locationsController.updateLocation
);

// POST /api/v1/locations/:locationId/deactivate — org_admin only
router.post('/:locationId/deactivate',
  rbac(['org_admin']),
  locationsController.deactivateLocation
);

module.exports = router;
