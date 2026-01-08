import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'fullchain.pem'))
};

const { default: app } = await import('./server.js');
const PORT = process.env.PORT || 5000;
const server = https.createServer(httpsOptions, app);

server.listen(PORT, '0.0.0.0', () => {
    console.log('HTTPS Server running on port ' + PORT);
    console.log('Access at: https://31.97.144.132:' + PORT);
});
