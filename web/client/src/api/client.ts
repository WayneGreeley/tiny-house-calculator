import type {
  Project,
  LineItem,
  BillOfMaterials,
  Result,
  CategoryName,
} from '../types';

const API_BASE = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<Result<T>> {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export interface AddLineItemFields {
  name: string;
  category: CategoryName;
  quantity: number;
  unit: string;
  unitCost: number;
  notes?: string;
}

export interface UpdateLineItemFields {
  name?: string;
  category?: CategoryName;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  notes?: string;
}

export const projectsApi = {
  list: () => fetchApi<Project[]>('/projects'),

  create: (name: string, description?: string) =>
    fetchApi<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  get: (name: string) =>
    fetchApi<Project>(`/projects/${encodeURIComponent(name)}`),

  delete: (name: string) =>
    fetchApi<void>(`/projects/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
};

export const lineItemsApi = {
  list: (projectName: string, category?: CategoryName) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return fetchApi<LineItem[]>(
      `/projects/${encodeURIComponent(projectName)}/items${query}`
    );
  },

  add: (projectName: string, fields: AddLineItemFields) =>
    fetchApi<LineItem>(`/projects/${encodeURIComponent(projectName)}/items`, {
      method: 'POST',
      body: JSON.stringify(fields),
    }),

  update: (projectName: string, itemId: string, fields: UpdateLineItemFields) =>
    fetchApi<LineItem>(
      `/projects/${encodeURIComponent(projectName)}/items/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(fields),
      }
    ),

  delete: (projectName: string, itemId: string) =>
    fetchApi<void>(
      `/projects/${encodeURIComponent(projectName)}/items/${itemId}`,
      {
        method: 'DELETE',
      }
    ),
};

export const bomApi = {
  get: (projectName: string) =>
    fetchApi<BillOfMaterials>(
      `/projects/${encodeURIComponent(projectName)}/bom`
    ),
};
