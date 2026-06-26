# LotTrace — RBAC (Role-Based Access Control)

> Reference this before adding any `requireRole()` middleware call.
> Every protected route must declare which roles can access it.

---

## Roles

| Role | Who Is This |
|------|-------------|
| `org_admin` | Company owner/manager — full control of their org |
| `compliance_manager` | FSMA compliance officer — full traceability access, no billing/user admin |
| `operator` | Warehouse/floor worker — record events, view their own work |
| `auditor` | Read-only internal or external auditor |
| `api_key` | Machine-to-machine API access (scoped per key) |
| `super_admin` | Internal LotTrace platform team only |

---

## Permission Matrix

✅ = Full access | 📖 = Read only | 🚫 = No access | ⚙️ = Own records only

| Resource / Action | org_admin | compliance_mgr | operator | auditor |
|-------------------|-----------|---------------|----------|---------|
| **Dashboard** | | | | |
| View stats + activity | ✅ | ✅ | ✅ | ✅ |
| **Lots** | | | | |
| List / view lots | ✅ | ✅ | ✅ | 📖 |
| Create lot | ✅ | ✅ | ✅ | 🚫 |
| Void lot | ✅ | ✅ | 🚫 | 🚫 |
| **Events** | | | | |
| List / view events | ✅ | ✅ | ✅ | 📖 |
| Create event (all CTEs) | ✅ | ✅ | ✅ | 🚫 |
| Amend event | ✅ | ✅ | 🚫 | 🚫 |
| Void event | ✅ | ✅ | 🚫 | 🚫 |
| Upload attachments | ✅ | ✅ | ✅ | 🚫 |
| **Trace Engine** | | | | |
| Run forward/backward trace | ✅ | ✅ | ✅ | 📖 |
| **Locations** | | | | |
| List / view locations | ✅ | ✅ | ✅ | 📖 |
| Create / edit location | ✅ | ✅ | 🚫 | 🚫 |
| Deactivate location | ✅ | 🚫 | 🚫 | 🚫 |
| **Products** | | | | |
| List / view products | ✅ | ✅ | ✅ | 📖 |
| Create / edit product | ✅ | ✅ | 🚫 | 🚫 |
| Edit KDE schema | ✅ | ✅ | 🚫 | 🚫 |
| **Imports** | | | | |
| Upload CSV import | ✅ | ✅ | 🚫 | 🚫 |
| View import history | ✅ | ✅ | 🚫 | 📖 |
| Download error report | ✅ | ✅ | 🚫 | 📖 |
| **Reports** | | | | |
| View compliance gaps | ✅ | ✅ | ✅ | 📖 |
| Export CSV/PDF | ✅ | ✅ | 🚫 | 📖 |
| **Recall Simulations** | | | | |
| Run simulation | ✅ | ✅ | 🚫 | 🚫 |
| View past simulations | ✅ | ✅ | 🚫 | 📖 |
| **Audit Log** | | | | |
| View audit log | ✅ | ✅ | 🚫 | ✅ |
| **Notifications** | | | | |
| View own notifications | ✅ | ✅ | ✅ | ✅ |
| **User Management** | | | | |
| View team members | ✅ | ✅ | 🚫 | 🚫 |
| Invite users | ✅ | 🚫 | 🚫 | 🚫 |
| Edit user roles | ✅ | 🚫 | 🚫 | 🚫 |
| Deactivate users | ✅ | 🚫 | 🚫 | 🚫 |
| **API Keys** | | | | |
| Manage API keys | ✅ | 🚫 | 🚫 | 🚫 |
| **Webhooks** | | | | |
| Manage webhooks | ✅ | 🚫 | 🚫 | 🚫 |
| **Org Settings** | | | | |
| View org settings | ✅ | ✅ | 🚫 | 🚫 |
| Update org settings | ✅ | 🚫 | 🚫 | 🚫 |
| **Billing** | | | | |
| View billing / plan | ✅ | 🚫 | 🚫 | 🚫 |
| Upgrade / downgrade | ✅ | 🚫 | 🚫 | 🚫 |

---

## RBAC Middleware Implementation

```javascript
// middleware/rbac.js
const AppError = require('../utils/AppError');
const apiResponse = require('../utils/apiResponse');

/**
 * Middleware factory: require one of the listed roles.
 * Always placed AFTER `authenticate` middleware.
 *
 * @param {string[]} roles - allowed roles, e.g. ['org_admin', 'compliance_manager']
 */
const requireRole = (roles) => (req, res, next) => {
  if (!req.user) return apiResponse.unauthorized(res);

  // Super admin can access anything except routes explicitly blocked
  if (req.user.role === 'super_admin' && !req.noSuperAdmin) return next();

  if (!roles.includes(req.user.role)) {
    return apiResponse.forbidden(res, 'Insufficient permissions for this action');
  }
  next();
};

/**
 * Require org_admin specifically (for admin-only destructive actions)
 */
const requireAdmin = requireRole(['org_admin']);

/**
 * Require operator or above (excludes auditor)
 */
const requireOperator = requireRole(['org_admin', 'compliance_manager', 'operator']);

/**
 * Allow any authenticated user (all roles except super_admin)
 */
const requireAnyRole = requireRole(['org_admin', 'compliance_manager', 'operator', 'auditor']);

module.exports = { requireRole, requireAdmin, requireOperator, requireAnyRole };
```

---

## Route-Level Declarations (Reference)

```javascript
// Example: events routes with per-action RBAC
const { requireRole, requireAdmin, requireOperator } = require('../../middleware/rbac');

// Anyone authenticated can read
router.get('/',     authenticate, requireAnyRole,   eventsController.listEvents);
router.get('/:id',  authenticate, requireAnyRole,   eventsController.getEvent);

// Operators and above can create
router.post('/',    authenticate, requireOperator,   validate({ body: createEventSchema }), eventsController.createEvent);

// Only admin and compliance manager can amend/void
router.post('/:id/amend', authenticate, requireRole(['org_admin', 'compliance_manager']), eventsController.amendEvent);
router.post('/:id/void',  authenticate, requireRole(['org_admin', 'compliance_manager']), eventsController.voidEvent);
```

---

## Business Rules for Roles

### org_admin Constraints
- The **last** `org_admin` cannot deactivate or demote themselves
- Check before deactivation: `SELECT count(*) FROM users WHERE organization_id = $1 AND role = 'org_admin' AND status = 'active'` — block if count = 1
- Role changes take effect immediately (no cache — JWT re-checked per-request)

### Auditor Constraints
- Auditor can view compliance gaps, events, lots, trace results, and audit log
- Auditor CANNOT export data (read in UI only)
- Auditor CANNOT create, modify, or void any records

### operator Constraints
- Operator CAN create events and lots
- Operator CANNOT void, amend, or manage team members
- Operator can see their own recent activity (filtered to created_by = req.user.id in some endpoints)

### api_key Role
- API keys don't use the same role system — they have explicit scopes
- Scopes declared per key: `['read', 'write:events', 'read:lots']`
- Middleware checks scope against requested action, not role name

---

## Frontend Permission Guards

```jsx
// components/layout/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const ProtectedRoute = ({ children }) => {
  const { user, accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
};

// Usage for role-specific pages:
export const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'org_admin') return <Navigate to="/dashboard" replace />;
  return children;
};
```

```jsx
// Hide actions the user can't perform
const { can } = usePermissions();

<div className="flex gap-2">
  {can('events.create') && (
    <Button onClick={() => navigate('/events/record')}>Record Event</Button>
  )}
  {can('lots.void') && (
    <Button variant="destructive" onClick={handleVoid}>Void Lot</Button>
  )}
</div>
```
