// Re-export types from the shared types module
// This provides a cleaner import path for web client components

export type {
  Project,
  LineItem,
  BillOfMaterials,
  CategoryName,
  Result,
} from '../../../src/types';
