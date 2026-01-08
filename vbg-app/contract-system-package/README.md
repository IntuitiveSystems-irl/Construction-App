# Contract System Package - Extracted from Rooster Construction

Complete contract generation, signature collection, PDF download, and notification system extracted from the working Rooster Construction app. Ready to plug into any web application.

## Features

- **Contract Generation**: Template-based contract creation with placeholder replacement
- **Digital Signatures**: Canvas-based signature collection for both parties
- **PDF Generation**: Professional PDF documents with embedded signatures
- **Email Notifications**: Automated email notifications for contract events
- **Template Management**: Support for multiple contract templates
- **Status Tracking**: Track contract lifecycle (pending, signed, approved, rejected)

## Installation

```bash
npm install @rooster/contract-system
```

## Quick Start

### 1. Backend Setup (Node.js/Express)

```javascript
import { ContractService, EmailService } from '@rooster/contract-system';

// Initialize services
const emailService = new EmailService({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const contractService = new ContractService({
  emailService,
  storageAdapter: yourStorageAdapter // See Storage Adapters section
});

// Create a contract
app.post('/api/contracts', async (req, res) => {
  const contract = await contractService.createContract({
    templateId: 'construction-contract',
    userId: req.body.userId,
    data: {
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      projectName: 'Home Renovation',
      totalAmount: 50000,
      startDate: '2025-01-01',
      endDate: '2025-06-01'
    }
  });
  
  res.json(contract);
});

// Sign a contract
app.post('/api/contracts/:id/sign', async (req, res) => {
  const signedContract = await contractService.signContract(
    req.params.id,
    req.body.signatureData,
    req.body.signerType // 'client' or 'contractor'
  );
  
  res.json(signedContract);
});

// Download contract PDF
app.get('/api/contracts/:id/download', async (req, res) => {
  const pdfBuffer = await contractService.generatePDF(req.params.id);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="contract-${req.params.id}.pdf"`);
  res.send(pdfBuffer);
});
```

### 2. Frontend Setup (React)

```tsx
import { SignatureCanvas, ContractViewer } from '@rooster/contract-system/react';

function ContractSigningPage({ contractId }) {
  const [signature, setSignature] = useState(null);
  
  const handleSign = async () => {
    const response = await fetch(`/api/contracts/${contractId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signatureData: signature,
        signerType: 'client'
      })
    });
    
    if (response.ok) {
      alert('Contract signed successfully!');
    }
  };
  
  return (
    <div>
      <ContractViewer contractId={contractId} />
      
      <SignatureCanvas
        onSave={(signatureData) => setSignature(signatureData)}
        width={600}
        height={200}
      />
      
      <button onClick={handleSign} disabled={!signature}>
        Sign Contract
      </button>
    </div>
  );
}
```

## Core Modules

### ContractService

Main service for contract operations.

```typescript
interface ContractServiceConfig {
  emailService: EmailService;
  storageAdapter: StorageAdapter;
  pdfGenerator?: PDFGenerator;
}

class ContractService {
  createContract(options: CreateContractOptions): Promise<Contract>;
  signContract(contractId: string, signatureData: string, signerType: string): Promise<Contract>;
  getContract(contractId: string): Promise<Contract>;
  updateContractStatus(contractId: string, status: ContractStatus): Promise<Contract>;
  generatePDF(contractId: string): Promise<Buffer>;
  deleteContract(contractId: string): Promise<void>;
}
```

### EmailService

Handles email notifications.

```typescript
interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  sendContractNotification(contract: Contract, recipient: string): Promise<void>;
  sendSignatureRequest(contract: Contract, recipient: string): Promise<void>;
  sendContractApproved(contract: Contract, recipient: string): Promise<void>;
  sendCustomEmail(options: EmailOptions): Promise<void>;
}
```

### PDFGenerator

Generates professional PDF documents.

```typescript
class PDFGenerator {
  generate(contract: Contract): jsPDF;
  embedSignature(pdf: jsPDF, signatureData: string, position: SignaturePosition): void;
  addWatermark(pdf: jsPDF, text: string): void;
  toBuffer(pdf: jsPDF): Buffer;
}
```

### TemplateEngine

Processes contract templates with placeholder replacement.

```typescript
class TemplateEngine {
  registerTemplate(template: ContractTemplate): void;
  processTemplate(templateId: string, data: Record<string, any>): string;
  listTemplates(): ContractTemplate[];
  getTemplate(templateId: string): ContractTemplate;
}
```

## Storage Adapters

The package supports multiple storage backends through adapters:

### SQLite Adapter (Default)

```javascript
import { SQLiteAdapter } from '@rooster/contract-system/adapters';

const storageAdapter = new SQLiteAdapter({
  dbPath: './contracts.db'
});
```

### PostgreSQL Adapter

```javascript
import { PostgreSQLAdapter } from '@rooster/contract-system/adapters';

const storageAdapter = new PostgreSQLAdapter({
  host: 'localhost',
  port: 5432,
  database: 'contracts',
  user: 'postgres',
  password: 'password'
});
```

### MongoDB Adapter

```javascript
import { MongoDBAdapter } from '@rooster/contract-system/adapters';

const storageAdapter = new MongoDBAdapter({
  uri: 'mongodb://localhost:27017/contracts'
});
```

### Custom Adapter

Implement the `StorageAdapter` interface:

```typescript
interface StorageAdapter {
  createContract(contract: Contract): Promise<Contract>;
  getContract(id: string): Promise<Contract | null>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
  listContracts(filters?: ContractFilters): Promise<Contract[]>;
}
```

## React Components

### SignatureCanvas

Canvas component for collecting digital signatures.

```tsx
<SignatureCanvas
  width={600}
  height={200}
  onSave={(signatureData) => console.log(signatureData)}
  onClear={() => console.log('Cleared')}
  strokeColor="#000000"
  strokeWidth={2}
/>
```

### ContractViewer

Display contract content with formatting.

```tsx
<ContractViewer
  contractId="CONTRACT_123"
  showSignatures={true}
  onSign={(signatureData) => handleSign(signatureData)}
/>
```

### ContractList

Display list of contracts with filtering.

```tsx
<ContractList
  contracts={contracts}
  onSelect={(contract) => navigate(`/contracts/${contract.id}`)}
  filters={{ status: 'pending' }}
/>
```

## Contract Templates

Templates use placeholders that are replaced with actual data:

```typescript
const template = {
  id: 'construction-contract',
  name: 'Construction Contract',
  content: `
CONSTRUCTION CONTRACT

Contract Date: {{DATE}}
Contract ID: {{CONTRACT_ID}}

PARTIES:
Contractor: {{CONTRACTOR_NAME}}
Client: {{CLIENT_NAME}}
Email: {{CLIENT_EMAIL}}

PROJECT DETAILS:
Project Name: {{PROJECT_NAME}}
Start Date: {{START_DATE}}
Completion Date: {{END_DATE}}
Total Amount: {{TOTAL_AMOUNT}}

SCOPE OF WORK:
{{SCOPE_OF_WORK}}

...
  `
};

// Register template
templateEngine.registerTemplate(template);
```

### Available Placeholders

- `{{DATE}}` - Current date
- `{{CONTRACT_ID}}` - Unique contract identifier
- `{{CONTRACTOR_NAME}}` - Contractor/company name
- `{{CLIENT_NAME}}` - Client name
- `{{CLIENT_EMAIL}}` - Client email
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{START_DATE}}` - Project start date
- `{{END_DATE}}` - Project end date
- `{{TOTAL_AMOUNT}}` - Contract amount
- `{{PAYMENT_TERMS}}` - Payment terms
- `{{SCOPE_OF_WORK}}` - Detailed scope

## Email Templates

Customize email notifications:

```javascript
emailService.setTemplate('contract-created', {
  subject: 'New Contract: {{PROJECT_NAME}}',
  html: `
    <h1>New Contract for Review</h1>
    <p>Dear {{CLIENT_NAME}},</p>
    <p>A new contract has been generated for your review.</p>
    <p><strong>Contract ID:</strong> {{CONTRACT_ID}}</p>
    <p><strong>Project:</strong> {{PROJECT_NAME}}</p>
    <p><a href="{{CONTRACT_URL}}">View Contract</a></p>
  `
});
```

## Events

Subscribe to contract lifecycle events:

```javascript
contractService.on('contract:created', (contract) => {
  console.log('Contract created:', contract.id);
});

contractService.on('contract:signed', (contract, signerType) => {
  console.log(`Contract signed by ${signerType}:`, contract.id);
});

contractService.on('contract:approved', (contract) => {
  console.log('Contract approved:', contract.id);
});

contractService.on('contract:rejected', (contract) => {
  console.log('Contract rejected:', contract.id);
});
```

## TypeScript Support

Full TypeScript definitions included:

```typescript
interface Contract {
  id: string;
  userId: string;
  templateId: string;
  projectName: string;
  projectDescription?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentTerms?: string;
  scope?: string;
  contractContent: string;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Signature fields
  clientSignature?: string;
  clientSignedAt?: Date;
  contractorSignature?: string;
  contractorSignedAt?: Date;
  
  // User info
  clientName: string;
  clientEmail: string;
  contractorName?: string;
  contractorEmail?: string;
}

type ContractStatus = 'pending' | 'signed' | 'approved' | 'rejected' | 'cancelled';
```

## Configuration

Create a configuration file:

```javascript
// contract-config.js
export default {
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@example.com'
  },
  
  storage: {
    type: 'sqlite', // or 'postgres', 'mongodb'
    path: './data/contracts.db'
  },
  
  pdf: {
    format: 'letter',
    margin: 20,
    embedSignatures: true
  },
  
  contracts: {
    idPrefix: 'CONTRACT_',
    defaultStatus: 'pending',
    allowMultipleSignatures: true
  }
};
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## Examples

See the [examples](./examples) directory for:
- Express.js integration
- Next.js integration
- React component examples
- Custom storage adapter
- Custom email templates

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
