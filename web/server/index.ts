import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projects.js';
import lineItemRoutes from './routes/lineItems.js';
import bomRoutes from './routes/bom.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/projects', projectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
