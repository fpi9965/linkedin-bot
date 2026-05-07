import 'dotenv/config';
import express from 'express';
import webhookRoutes from './webhooks/salla.js';
import apiRoutes from './routes/api.js';
import linkedinRoutes from './routes/linkedin.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', webhookRoutes);
app.use('/api', apiRoutes);
app.use('/api/linkedin', linkedinRoutes);

app.get('/health', (req, res) => {
    res.json({ status: '✅ Server is running', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🤖 Salla WhatsApp Automation Bot                  ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on port: ${PORT}                            ║
║  Webhook URL: /salla/webhook                              ║
║  LinkedIn API: /api/linkedin/*                            ║
║  Health: /health                                          ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
});
