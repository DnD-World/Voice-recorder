const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 99599;
const HOST = '0.0.0.0'; // Listen on all interfaces (Tailscale accessible)

// Auto-save directory
const AUTO_SAVE_DIR = path.join(__dirname, 'autosave');

// Create autosave directory if it doesn't exist
if (!fs.existsSync(AUTO_SAVE_DIR)) {
  fs.mkdirSync(AUTO_SAVE_DIR, { recursive: true });
  console.log(`📁 Created autosave directory: ${AUTO_SAVE_DIR}`);
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle auto-save API endpoint
  if (req.url === '/api/autosave' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { content, format } = data;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = format === 'markdown' ? 'md' : 'txt';
        const filename = `voice-notes-${timestamp}.${extension}`;
        const filepath = path.join(AUTO_SAVE_DIR, filename);
        
        fs.writeFileSync(filepath, content, 'utf8');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, filename, path: filepath }));
        console.log(`💾 Auto-saved: ${filename}`);
      } catch (error) {
        console.error('Auto-save error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // Handle list autosave files
  if (req.url === '/api/autosave' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(AUTO_SAVE_DIR)
        .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
        .map(f => ({
          name: f,
          path: path.join(AUTO_SAVE_DIR, f),
          size: fs.statSync(path.join(AUTO_SAVE_DIR, f)).size,
          modified: fs.statSync(path.join(AUTO_SAVE_DIR, f)).mtime
        }))
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // Serve index.html for root
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query strings
  filePath = filePath.split('?')[0];
  
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  const fullPath = path.join(__dirname, 'dist', filePath);

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve index.html (SPA routing)
        fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║   🎤  Φωνή (Foni) - Greek Voice Notes                 ║');
  console.log('║                                                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║                                                        ║');
  console.log(`║   Local:    http://localhost:${PORT}                     ║`);
  console.log('║                                                        ║');
  console.log('║   Tailscale: http://YOUR-TAILSCALE-IP:' + PORT + '        ║');
  console.log('║                                                        ║');
  console.log('║   Auto-save: ./autosave/                              ║');
  console.log('║                                                        ║');
  console.log('║   Press Ctrl+C to stop the server                     ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Access from your phone:');
  console.log('  1. Make sure Tailscale is running on both devices');
  console.log('  2. Find your Tailscale IP: tailscale ip -4');
  console.log(`  3. Open http://[YOUR-IP]:${PORT} on your phone`);
  console.log('');
  console.log('Auto-save location:');
  console.log(`  ${AUTO_SAVE_DIR}`);
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use!`);
    console.error('   Try stopping other servers or use a different port.\n');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
