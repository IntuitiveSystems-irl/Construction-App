# 🚀 Rooster Multi-Tenant Merge Plan

## ✅ Backups Created

**Date**: October 14, 2025 @ 6:17 PM

### Backup Locations:
1. **Rooster Master Backup**:
   - Directory: `/Users/ray/rooster-master-backup-20251014_181708/`
   - Archive: `/Users/ray/rooster-master-backup-20251014_181708.tar.gz` (285MB)
   
2. **LaunchFlow Backup**:
   - Directory: `/Users/ray/launchflow-backup-20251014_181708/`
   - Archive: `/Users/ray/launchflow-backup-20251014_181708.tar.gz` (52MB)

3. **New Multi-Tenant Project**:
   - Location: `/Users/ray/rooster-multitenant/`
   - Based on: Rooster Master dashboard + LaunchFlow multi-tenant infrastructure

---

## 🎯 Project Goal

Create a **multi-tenant SaaS platform** where:
- Multiple construction companies can sign up
- Each company gets isolated workspace (subdomain: `company.rooster.app`)
- Uses Rooster's beautiful dashboard UI
- Leverages LaunchFlow's multi-tenant backend infrastructure
- Each tenant manages their own clients, subcontractors, job sites, and contracts

---

## 📊 Architecture Overview

### Frontend (Rooster Dashboard)
- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: TailwindCSS with custom theme
- **Features**: 
  - Modern construction management UI
  - Contract generation with digital signatures
  - Job site management
  - Document management
  - Client/subcontractor portals

### Backend (LaunchFlow Multi-Tenant)
- **Framework**: Express.js + SQLite
- **Architecture**: Multi-tenant with tenant isolation
- **Features**:
  - Tenant management (signup, billing, limits)
  - Role-based access control
  - Payment integrations (Stripe, Square, PayPal)
  - Communication (Twilio SMS, Email)
  - API integrations (QuickBooks, Google Workspace)

---

## 🔧 Implementation Steps

### Phase 1: Database Schema Integration (2-3 hours)

#### 1.1 Add Tenant Table to Rooster Database

**File**: `/Users/ray/rooster-multitenant/database/multi-tenant-schema.sql`

```sql
-- Add tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  owner_email TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Subscription
  plan TEXT DEFAULT 'trial',
  status TEXT DEFAULT 'active',
  trial_ends_at DATETIME,
  
  -- Limits
  max_users INTEGER DEFAULT 10,
  max_clients INTEGER DEFAULT 50,
  max_job_sites INTEGER DEFAULT 25,
  max_storage_mb INTEGER DEFAULT 5000,
  current_storage_mb INTEGER DEFAULT 0,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#059669',
  secondary_color TEXT DEFAULT '#0891b2',
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add tenant_id to existing tables
ALTER TABLE users ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE job_sites ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE contracts ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE notifications ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Create indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_job_sites_tenant ON job_sites(tenant_id);
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
```

#### 1.2 Update User Roles

```sql
-- Update users table to support multi-tenant roles
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client';
-- Roles: tenant_owner, tenant_admin, client, subcontractor

-- Add user status
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
-- Status: active, inactive, invited
```

---

### Phase 2: Backend Middleware (3-4 hours)

#### 2.1 Create Tenant Middleware

**File**: `/Users/ray/rooster-multitenant/server-middleware/tenant.js`

```javascript
import sqlite3 from 'sqlite3';
import path from 'path';

const db = new sqlite3.Database(process.env.DB_FILENAME || './rooster.db');

// Identify tenant from request
export const identifyTenant = async (req, res, next) => {
  try {
    let tenant = null;
    
    // Method 1: Subdomain (e.g., acme.rooster.app)
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
      tenant = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM tenants WHERE subdomain = ? AND status = ?',
          [subdomain, 'active'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    }
    
    // Method 2: From authenticated user
    if (!tenant && req.user && req.user.tenant_id) {
      tenant = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM tenants WHERE id = ? AND status = ?',
          [req.user.tenant_id, 'active'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    }
    
    // Development fallback
    if (!tenant && process.env.NODE_ENV === 'development') {
      tenant = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM tenants LIMIT 1', (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'Tenant account is suspended' });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant identification error:', error);
    res.status(500).json({ error: 'Failed to identify tenant' });
  }
};

// Validate user belongs to tenant
export const validateTenantUser = (req, res, next) => {
  if (!req.user || !req.tenant) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.tenant_id !== req.tenant.id) {
    return res.status(403).json({ error: 'Access denied: User does not belong to this tenant' });
  }
  
  next();
};

// Check user role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied: Requires role ${roles.join(' or ')}` });
    }
    
    next();
  };
};

// Check tenant limits
export const checkTenantLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant;
      let currentCount = 0;
      let maxAllowed = 0;
      
      switch (resourceType) {
        case 'users':
          currentCount = await new Promise((resolve, reject) => {
            db.get(
              'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND status = ?',
              [tenant.id, 'active'],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              }
            );
          });
          maxAllowed = tenant.max_users;
          break;
          
        case 'job_sites':
          currentCount = await new Promise((resolve, reject) => {
            db.get(
              'SELECT COUNT(*) as count FROM job_sites WHERE tenant_id = ?',
              [tenant.id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              }
            );
          });
          maxAllowed = tenant.max_job_sites;
          break;
          
        case 'clients':
          currentCount = await new Promise((resolve, reject) => {
            db.get(
              'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND user_type = ?',
              [tenant.id, 'client'],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              }
            );
          });
          maxAllowed = tenant.max_clients;
          break;
      }
      
      if (currentCount >= maxAllowed) {
        return res.status(403).json({
          error: `Tenant limit reached for ${resourceType}`,
          current: currentCount,
          max: maxAllowed,
          message: 'Please upgrade your plan to add more.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Limit check error:', error);
      next(error);
    }
  };
};
```

#### 2.2 Update Authentication to Include Tenant

**File**: `/Users/ray/rooster-multitenant/server.js`

Update JWT token generation to include `tenant_id`:

```javascript
// In login route
const token = jwt.sign(
  { 
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    role: user.role,  // NEW
    tenant_id: user.tenant_id  // NEW
  },
  JWT_SECRET,
  { expiresIn: '30d' }
);
```

---

### Phase 3: Update All Routes (4-5 hours)

#### 3.1 Apply Middleware to Routes

**File**: `/Users/ray/rooster-multitenant/server.js`

```javascript
import { identifyTenant, validateTenantUser, requireRole, checkTenantLimit } from './server-middleware/tenant.js';

// Apply to all API routes (except auth)
app.use('/api/admin/*', authenticate, identifyTenant, validateTenantUser, requireRole('tenant_owner', 'tenant_admin'));
app.use('/api/user/*', authenticate, identifyTenant, validateTenantUser);
```

#### 3.2 Update Query Patterns

**Before (Single Tenant)**:
```javascript
db.all('SELECT * FROM job_sites WHERE client_id = ?', [clientId])
```

**After (Multi-Tenant)**:
```javascript
db.all('SELECT * FROM job_sites WHERE tenant_id = ? AND client_id = ?', [req.tenant.id, clientId])
```

---

### Phase 4: Tenant Signup Flow (4-5 hours)

#### 4.1 Create Signup API

**File**: `/Users/ray/rooster-multitenant/server-routes/tenant-signup.js`

```javascript
// POST /api/tenant/register
router.post('/register', async (req, res) => {
  const { business_name, owner_name, owner_email, password, subdomain } = req.body;
  
  // 1. Validate input
  // 2. Check email/subdomain availability
  // 3. Hash password
  // 4. Create tenant
  // 5. Create owner user
  // 6. Send welcome email
  // 7. Return JWT token
});
```

#### 4.2 Create Signup Page

**File**: `/Users/ray/rooster-multitenant/app/signup/page.tsx`

Modern signup form with:
- Company name input
- Subdomain selection (with availability check)
- Owner details
- Password creation
- Plan selection
- Terms acceptance

---

### Phase 5: Frontend Updates (3-4 hours)

#### 5.1 Add Tenant Context

**File**: `/Users/ray/rooster-multitenant/app/contexts/TenantContext.tsx`

```typescript
interface Tenant {
  id: number;
  business_name: string;
  subdomain: string;
  plan: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
}

export const TenantContext = createContext<Tenant | null>(null);
```

#### 5.2 Update Dashboard to Show Tenant Info

- Display company logo
- Show plan limits
- Add tenant settings link
- Apply custom branding colors

---

## 📋 Testing Checklist

- [ ] Create new tenant via signup
- [ ] Login as tenant owner
- [ ] Add team members (clients, subcontractors)
- [ ] Create job site
- [ ] Generate contract
- [ ] Upload document
- [ ] Verify data isolation (create second tenant, ensure no data leakage)
- [ ] Test subdomain routing
- [ ] Test plan limits
- [ ] Test role permissions

---

## 🚀 Deployment

### Development
```bash
cd /Users/ray/rooster-multitenant
npm install
npm run dev
```

### Production
1. Set up subdomain wildcard DNS: `*.rooster.app → your-server-ip`
2. Configure Nginx for subdomain routing
3. Set environment variables
4. Run with PM2

---

## 📊 Subscription Plans

### Trial (14 days free)
- 5 users
- 10 job sites
- 50 clients
- 1GB storage

### Starter ($49/month)
- 10 users
- 25 job sites
- 100 clients
- 5GB storage

### Professional ($99/month)
- 50 users
- 100 job sites
- 500 clients
- 25GB storage
- Custom branding

### Enterprise ($299/month)
- Unlimited users
- Unlimited job sites
- Unlimited clients
- 100GB storage
- White-label
- Priority support

---

## 🔗 Next Steps

1. **Review this plan** and confirm approach
2. **Implement Phase 1**: Database schema
3. **Implement Phase 2**: Middleware
4. **Implement Phase 3**: Update routes
5. **Implement Phase 4**: Signup flow
6. **Implement Phase 5**: Frontend updates
7. **Test thoroughly**
8. **Deploy to production**

**Estimated Total Time**: 16-21 hours
