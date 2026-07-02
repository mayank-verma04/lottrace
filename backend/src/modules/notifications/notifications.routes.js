const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const validate = require('../../middleware/validate');
const rbac = require('../../middleware/rbac');
const notificationsController = require('./notifications.controller');
const { getNotificationsQuerySchema, markNotificationReadParamsSchema } = require('./notifications.validation');

const router = express.Router();

router.use(authenticate);
router.use(tenantScope);

// All authenticated roles can access their own notifications
router.get(
  '/',
  validate({ query: getNotificationsQuerySchema }),
  notificationsController.getNotifications
);

router.patch(
  '/read-all',
  notificationsController.markAllAsRead
);

router.patch(
  '/:id/read',
  validate({ params: markNotificationReadParamsSchema }),
  notificationsController.markAsRead
);

module.exports = router;
