export type CategoryName =
  | 'Foundation'
  | 'Framing'
  | 'Roofing'
  | 'Electrical'
  | 'Plumbing'
  | 'Insulation'
  | 'Interior'
  | 'Exterior'
  | 'Windows & Doors'
  | 'Appliances'
  | 'Miscellaneous';

export interface Project {
  id: string;           // UUID v4
  name: string;         // 1–100 chars, trimmed
  description: string;  // 0–500 chars, trimmed; empty string if not provided
  createdAt: string;    // ISO 8601 timestamp
  lineItems: LineItem[];
}

export interface LineItem {
  id: string;           // UUID v4, unique within project
  name: string;         // 1–100 chars, trimmed
  category: CategoryName;
  quantity: number;     // 0.01–999,999.99
  unit: string;         // 1–50 chars, trimmed (e.g., "board", "sheet", "each")
  unitCost: number;     // 0.00–999,999,999.99
  totalCost: number;    // computed: quantity * unitCost, rounded half-up to 2dp
  notes: string;        // 0–500 chars, trimmed; empty string if not provided
}

export interface BillOfMaterials {
  projectName: string;
  description: string;
  generatedDate: string;          // ISO 8601 date: YYYY-MM-DD
  categories: CategorySection[];
  grandTotal: number;             // sum of all category subtotals, rounded half-up to 2dp
}

export interface CategorySection {
  category: CategoryName;
  lineItems: LineItem[];
  subtotal: number;               // sum of totalCost for items in this category
}

// Persisted store — the shape of data.json
export interface DataStore {
  version: number;      // schema version for future migrations
  projects: Project[];
}

// Result type for service operations
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
