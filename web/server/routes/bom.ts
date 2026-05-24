import { Router } from 'express';
import * as BomService from '../../../src/services/BomService.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectName/bom - Get bill of materials
router.get('/', async (req, res) => {
  const projectName = decodeURIComponent(req.params.projectName);
  const result = await BomService.build(projectName);
  res.status(result.success ? 200 : 404).json(result);
});

export default router;
