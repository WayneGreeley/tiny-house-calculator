import { Router } from 'express';
import * as ProjectService from '../../../src/services/ProjectService.js';
import lineItemRoutes from './lineItems.js';
import bomRoutes from './bom.js';

const router = Router();

// Mount line items and BOM routes for a specific project
router.use('/:projectName/items', lineItemRoutes);
router.use('/:projectName/bom', bomRoutes);

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  const result = await ProjectService.list();
  res.json(result);
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  const result = await ProjectService.create(name, description);
  res.status(result.success ? 201 : 400).json(result);
});

// GET /api/projects/:name - Get single project
router.get('/:name', async (req, res) => {
  const projectName = decodeURIComponent(req.params.name);
  const result = await ProjectService.get(projectName);
  res.status(result.success ? 200 : 404).json(result);
});

// DELETE /api/projects/:name - Delete project
router.delete('/:name', async (req, res) => {
  const projectName = decodeURIComponent(req.params.name);
  const result = await ProjectService.deleteProject(projectName);
  res.status(result.success ? 200 : 404).json(result);
});

export default router;
