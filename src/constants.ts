import type { CategoryName } from './types.js';

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

// Field length limits
export const NAME_MAX = 100;
export const DESC_MAX = 500;
export const UNIT_MAX = 50;
export const NOTES_MAX = 500;
