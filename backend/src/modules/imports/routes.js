const express = require('express');
const router = express.Router();
const multer = require('multer');
const validate = require('../../middleware/validate');
const { createImportSchema, listImportsSchema, getImportErrorsSchema, templateParamsSchema } = require('./validation');
const importsController = require('./controller');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const rbac = require('../../middleware/rbac');
const auditLogger = require('../../middleware/auditLogger');

// Multer config: memory storage, 10MB limit, CSV only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

router.use(authenticate, tenantScope);

// Template download (must be before /:id to avoid route conflict)
router.get('/template/:cteType',
  validate({ params: templateParamsSchema }),
  importsController.downloadTemplate
);

// List imports
router.get('/',
  validate({ query: listImportsSchema }),
  importsController.listImports
);

// Get single import
router.get('/:id', importsController.getImport);

// Get import errors
router.get('/:importId/errors',
  validate({ query: getImportErrorsSchema }),
  importsController.getImportErrors
);

// Upload CSV and create import
router.post('/',
  rbac(['org_admin', 'compliance_manager', 'operator']),
  upload.single('file'),
  validate({ body: createImportSchema }),
  auditLogger('import'),
  importsController.createImport
);

module.exports = router;
