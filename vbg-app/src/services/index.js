// Service Registry - Automatically loads all services
import authService, { metadata as authMeta } from './auth.service.js';
import documentsService, { metadata as docsMeta } from './documents.service.js';
import contractsService, { metadata as contractsMeta } from './contracts.service.js';
import usersService, { metadata as usersMeta } from './users.service.js';

// Registry of all services
export const services = [
  { router: authService, metadata: authMeta },
  { router: documentsService, metadata: docsMeta },
  { router: contractsService, metadata: contractsMeta },
  { router: usersService, metadata: usersMeta }
];

// Load all services into Express app
export const loadServices = (app) => {
  console.log('\n📦 Loading Services...\n');
  
  services.forEach(({ router, metadata }) => {
    app.use(router);
    console.log(`✅ ${metadata.name} v${metadata.version}`);
    metadata.routes.forEach(route => {
      console.log(`   ${route}`);
    });
    console.log('');
  });
  
  console.log(`✅ ${services.length} services loaded successfully\n`);
};

export default { services, loadServices };
