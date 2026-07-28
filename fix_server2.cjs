const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const injection = `
  app.get('/api/debug-metrics', async (req, res) => {
    try {
      const { fetchMetrics } = await import('./get_metrics.js');
      const metrics = await fetchMetrics();
      res.json(metrics);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
`;

code = code.replace('// API routes FIRST', '// API routes FIRST' + injection);
fs.writeFileSync('server.ts', code);
