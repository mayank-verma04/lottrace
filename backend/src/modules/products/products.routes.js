const express = require('express');
const router = express.Router();

const productsController = require('./products.controller');
const productsValidation = require('./products.validation');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const rbac = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

// All product routes require auth + tenant scope
router.use(authenticate, tenantScope);

// GET /api/v1/products — all authenticated users can list
router.get('/',
  validate({ query: productsValidation.listProductsSchema }),
  productsController.listProducts
);

// POST /api/v1/products — org_admin, compliance_manager
router.post('/',
  rbac(['org_admin', 'compliance_manager']),
  validate(productsValidation.createProductSchema),
  productsController.createProduct
);

// GET /api/v1/products/:productId — all authenticated users
router.get('/:productId', productsController.getProduct);

// PATCH /api/v1/products/:productId — org_admin, compliance_manager
router.patch('/:productId',
  rbac(['org_admin', 'compliance_manager']),
  validate(productsValidation.updateProductSchema),
  productsController.updateProduct
);

module.exports = router;
