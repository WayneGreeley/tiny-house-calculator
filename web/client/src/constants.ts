// Re-export constants needed by the web client
// This avoids Vite import resolution issues with paths outside the client directory

import type { CategoryName } from '../../../src/types';

export const VALID_CATEGORIES: CategoryName[] = [
  'Foundation',
  'Framing',
  'Roofing',
  'Electrical',
  'Plumbing',
  'Insulation',
  'Interior',
  'Exterior',
  'Windows & Doors',
  'Appliances',
  'Miscellaneous',
];
