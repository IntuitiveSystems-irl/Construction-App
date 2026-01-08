# 🧩 Rooster as Modular Services for LaunchFlow

**Date**: October 14, 2025 @ 7:04 PM

---

## 🎯 Concept

Break down Rooster into **optional services** that LaunchFlow tenants can add to their dashboard:

```
LaunchFlow Multi-Tenant Platform
├── Core Features (Always Available)
│   ├── Dashboard
│   ├── Settings
│   ├── User Management
│   └── Billing
└── Optional Services (Tenant Chooses)
    ├── 📄 Contract Management Service
    ├── 🏗️ Job Site Management Service
    ├── 📁 Document Management Service
    ├── 💰 Estimates & Invoicing Service
    └── 👥 Client/Subcontractor Portal Service
```

---

## 🧩 Service Breakdown

### Service 1: Contract Management 📄

**What it includes**:
- Contract generation from templates
- Digital signature collection
- Contract status tracking
- PDF generation
- Email notifications

**Database Tables**:
- `contracts`
- `contract_templates`

**API Routes**:
- `/api/contracts/*`
- `/api/contract-templates/*`

**Frontend Pages**:
- Contracts list
- Generate contract
- View/sign contract
- Template management

**Pricing**: $10/month or included in Pro plan

---

### Service 2: Job Site Management 🏗️

**What it includes**:
- Job site creation
- Team assignments
- Progress tracking
- Safety requirements
- Site communications

**Database Tables**:
- `job_sites`
- `job_assignments`
- `job_messages`

**API Routes**:
- `/api/job-sites/*`
- `/api/job-assignments/*`
- `/api/job-messages/*`

**Frontend Pages**:
- Job sites list
- Job site details
- Team management
- Communications

**Pricing**: $15/month or included in Pro plan

---

### Service 3: Document Management 📁

**What it includes**:
- Document upload/storage
- Document expiration tracking
- Document sharing
- Version control
- Document categories

**Database Tables**:
- `documents`
- `job_site_uploads`

**API Routes**:
- `/api/documents/*`
- `/api/uploads/*`

**Frontend Pages**:
- Document library
- Upload interface
- Document viewer

**Pricing**: $5/month or included in Starter plan

---

### Service 4: Estimates & Invoicing 💰

**What it includes**:
- Estimate creation
- Invoice generation
- Payment tracking
- Receipt management
- Financial reports

**Database Tables**:
- `estimates`
- `invoices`
- `receipts`

**API Routes**:
- `/api/estimates/*`
- `/api/invoices/*`
- `/api/receipts/*`

**Frontend Pages**:
- Estimates list
- Create estimate
- Invoices list
- Payment tracking

**Pricing**: $10/month or included in Pro plan

---

### Service 5: Client/Subcontractor Portal 👥

**What it includes**:
- Client access portal
- Subcontractor management
- Role-based permissions
- Communication tools
- Activity tracking

**Database Tables**:
- `users` (with roles)
- `notifications`
- `notification_preferences`

**API Routes**:
- `/api/clients/*`
- `/api/subcontractors/*`
- `/api/notifications/*`

**Frontend Pages**:
- Client dashboard
- Subcontractor dashboard
- Communication center

**Pricing**: $5/month or included in Starter plan

---

## 🗄️ Database Architecture

### Core Tables (Always Present):
```sql
- tenants
- tenant_settings
- tenant_services (NEW)
- users
- notifications
```

### Service Tables (Created on Enable):
```sql
-- Contract Service
- contracts
- contract_templates

-- Job Site Service
- job_sites
- job_assignments
- job_messages

-- Document Service
- documents
- job_site_uploads

-- Estimates Service
- estimates
- invoices
- receipts
```

### New Table: tenant_services
```sql
CREATE TABLE tenant_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 0,
  enabled_at DATETIME,
  settings JSON,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(tenant_id, service_name)
);
```

---

## 🎛️ Service Management

### Enable/Disable Services

**Admin Dashboard**:
```
Settings → Services
┌─────────────────────────────────────┐
│ Available Services                  │
├─────────────────────────────────────┤
│ ☑ Contract Management    $10/mo    │
│ ☑ Job Site Management    $15/mo    │
│ ☐ Document Management    $5/mo     │
│ ☐ Estimates & Invoicing  $10/mo    │
│ ☑ Client Portal          $5/mo     │
├─────────────────────────────────────┤
│ Total: $30/month                    │
│ [Save Changes]                      │
└─────────────────────────────────────┘
```

### API Endpoint:
```javascript
// Enable service
POST /api/tenant/services/enable
{
  "service": "contracts",
  "plan": "monthly"
}

// Disable service
POST /api/tenant/services/disable
{
  "service": "contracts"
}

// Get enabled services
GET /api/tenant/services
```

---

## 🎨 Frontend Integration

### Dynamic Menu (LaunchFlow Dashboard)

```jsx
// src/components/Sidebar.jsx

const ServiceMenu = () => {
  const { enabledServices } = useTenantServices();
  
  return (
    <nav>
      {/* Core Features - Always Visible */}
      <MenuItem icon={Home} to="/dashboard">Dashboard</MenuItem>
      <MenuItem icon={Settings} to="/settings">Settings</MenuItem>
      
      {/* Service-Based Features - Conditional */}
      {enabledServices.includes('contracts') && (
        <MenuItem icon={FileText} to="/contracts">Contracts</MenuItem>
      )}
      
      {enabledServices.includes('job_sites') && (
        <MenuItem icon={Building} to="/job-sites">Job Sites</MenuItem>
      )}
      
      {enabledServices.includes('documents') && (
        <MenuItem icon={Folder} to="/documents">Documents</MenuItem>
      )}
      
      {enabledServices.includes('estimates') && (
        <MenuItem icon={DollarSign} to="/estimates">Estimates</MenuItem>
      )}
      
      {enabledServices.includes('client_portal') && (
        <MenuItem icon={Users} to="/clients">Clients</MenuItem>
      )}
    </nav>
  );
};
```

---

## 🔐 Middleware for Service Access

```javascript
// server-middleware/service-check.js

export const requireService = (serviceName) => {
  return async (req, res, next) => {
    const tenantId = req.tenant.id;
    
    // Check if tenant has service enabled
    const service = await db.get(
      'SELECT * FROM tenant_services WHERE tenant_id = ? AND service_name = ? AND enabled = 1',
      [tenantId, serviceName]
    );
    
    if (!service) {
      return res.status(403).json({
        error: 'Service not enabled',
        message: `This feature requires the ${serviceName} service. Please enable it in Settings.`,
        service: serviceName
      });
    }
    
    next();
  };
};

// Usage in routes
app.get('/api/contracts', 
  authenticate, 
  identifyTenant, 
  validateTenantUser,
  requireService('contracts'), // Check if contracts service is enabled
  getContracts
);
```

---

## 💰 Pricing Tiers

### Free Tier
- Core features only
- No services
- 5 users
- 1GB storage

### Starter ($49/month)
- Core features
- Choose 2 services (included)
- 10 users
- 5GB storage

### Professional ($99/month)
- Core features
- All services (included)
- 50 users
- 25GB storage
- Custom branding

### Enterprise ($299/month)
- Everything in Pro
- Unlimited users
- 100GB storage
- White-label
- API access
- Priority support

### À la carte
- Add any service: $5-15/month each
- Mix and match as needed

---

## 📊 Service Marketplace (Future)

```
LaunchFlow Service Marketplace
├── Construction Services (Rooster)
│   ├── Contract Management
│   ├── Job Site Management
│   └── Document Management
├── Accounting Services
│   ├── QuickBooks Integration
│   └── Invoice Management
├── CRM Services
│   ├── Client Management
│   └── Lead Tracking
└── Marketing Services
    ├── Email Campaigns
    └── Social Media
```

---

## 🚀 Implementation Plan

### Phase 1: Core Setup (2-3 hours)

1. **Create tenant_services table**
```sql
CREATE TABLE tenant_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 0,
  enabled_at DATETIME,
  settings JSON,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(tenant_id, service_name)
);
```

2. **Create service middleware**
```javascript
// server-middleware/service-check.js
export const requireService = (serviceName) => { ... }
```

3. **Add service management API**
```javascript
// server/routes/tenant-services.js
POST /api/tenant/services/enable
POST /api/tenant/services/disable
GET /api/tenant/services
```

---

### Phase 2: Frontend Integration (3-4 hours)

1. **Create service context**
```jsx
// src/context/ServiceContext.jsx
export const ServiceProvider = ({ children }) => {
  const [enabledServices, setEnabledServices] = useState([]);
  // Fetch enabled services for tenant
}
```

2. **Update sidebar to be dynamic**
```jsx
// Show/hide menu items based on enabled services
```

3. **Create service settings page**
```jsx
// src/pages/ServiceSettings.jsx
// Enable/disable services
// Show pricing
// Manage subscriptions
```

---

### Phase 3: Convert Rooster Pages (4-6 hours)

1. **Contracts Service**
   - Convert Next.js pages to React components
   - Add to LaunchFlow routes
   - Test with service middleware

2. **Job Sites Service**
   - Convert pages
   - Add routes
   - Test

3. **Documents Service**
   - Convert pages
   - Add routes
   - Test

4. **Estimates Service**
   - Convert pages
   - Add routes
   - Test

---

### Phase 4: Testing & Polish (2-3 hours)

1. Test enabling/disabling services
2. Test service access control
3. Test billing integration
4. Polish UI
5. Add documentation

**Total Time**: 11-16 hours

---

## 🎯 Benefits of This Approach

### For Tenants:
- ✅ Pay only for what they use
- ✅ Clean, uncluttered interface
- ✅ Easy to add/remove features
- ✅ Flexible pricing

### For You:
- ✅ Modular codebase
- ✅ Easy to maintain
- ✅ Easy to add new services
- ✅ Multiple revenue streams
- ✅ Scalable architecture

### For Development:
- ✅ Services can be developed independently
- ✅ Easy to test
- ✅ Easy to deploy
- ✅ Clear separation of concerns

---

## 🎉 Example User Flow

### Tenant Signs Up:
1. Creates account on LaunchFlow
2. Sees core dashboard
3. Goes to Settings → Services
4. Sees available services
5. Enables "Contract Management" + "Job Sites"
6. Menu updates to show new options
7. Starts using features immediately

### Tenant Grows:
1. Business expands
2. Needs document management
3. Goes to Settings → Services
4. Enables "Document Management"
5. Feature appears in menu
6. Starts using immediately

---

## 🚀 Ready to Implement?

**What would you like to do?**

A. **Start with Phase 1** - Create service infrastructure (2-3 hours)
B. **See a demo** - I'll show you how it would work
C. **Different approach** - Tell me your thoughts

This modular approach gives you:
- ✅ Maximum flexibility
- ✅ Better user experience
- ✅ Multiple revenue streams
- ✅ Scalable architecture

**Want to start building this?** 🎉
