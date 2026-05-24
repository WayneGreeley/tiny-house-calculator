import { Router } from 'express';
import * as LineItemService from '../../../src/services/LineItemService.js';
import type { CategoryName } from '../../../src/types.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectName/items - List line items (with optional category filter)
router.get('/', async (req, res) => {
  const projectName = decodeURIComponent(req.params.projectName);
  const category = req.query.category as CategoryName | undefined;

  const result = await LineItemService.list(projectName, category);
  res.status(result.success ? 200 : 404).json(result);
});

// POST /api/projects/:projectName/items - Add new line item
router.post('/', async (req, res) => {
  const projectName = decodeURIComponent(req.params.projectName);
  const { name, category, quantity, unit, unitCost, notes } = req.body;

  const result = await LineItemService.add(projectName, {
    name,
    category,
    quantity,
    unit,
    unitCost,
    notes,
  });

  res.status(result.success ? 201 : 400).json(result);
});

// PATCH /api/projects/:projectName/items/:itemId - Update line item
router.patch('/:itemId', async (req, res) => {
  const projectName = decodeURIComponent(req.params.projectName);
  const itemId = req.params.itemId;
  const updates = req.body;

  const result = await LineItemService.update(projectName, itemId, updates);
  res.status(result.success ? 200 : 404).json(result);
});

// DELETE /api/projects/:projectName/items/:itemId - Delete line item
router.delete('/:itemId', async (req, res) => {
  const projectName = decodeURIComponent(req.params.projectName);
  const itemId = req.params.itemId;

  const result = await LineItemService.remove(projectName, itemId);
  res.status(result.success ? 200 : 404).json(result);
});

export default router;
