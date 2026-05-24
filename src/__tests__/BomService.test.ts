import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as BomService from '../services/BomService.js';
import * as FileRepository from '../repository/FileRepository.js';
import type { DataStore } from '../types.js';

// Mock the FileRepository module
vi.mock('../repository/FileRepository.js');

describe('BomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('build', () => {
    it('builds a bill of materials for a project with line items in multiple categories', async () => {
      // Given: project with items in multiple categories
      const projectWithItems: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: 'A test build',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: '2x4 Lumber',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: '',
              },
              {
                id: 'item-2',
                name: '2x6 Lumber',
                category: 'Framing',
                quantity: 5,
                unit: 'board',
                unitCost: 8.00,
                totalCost: 40.00,
                notes: '',
              },
              {
                id: 'item-3',
                name: 'Shingles',
                category: 'Roofing',
                quantity: 20,
                unit: 'bundle',
                unitCost: 15.00,
                totalCost: 300.00,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithItems);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: BOM is built with correct structure
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectName).toBe('Test Project');
        expect(result.data.description).toBe('A test build');
        expect(result.data.generatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(result.data.categories).toHaveLength(2);
        expect(result.data.grandTotal).toBe(390.00);
      }
    });

    it('groups line items by category correctly', async () => {
      // Given: project with items in multiple categories
      const projectWithItems: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Framing Item 1',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: '',
              },
              {
                id: 'item-2',
                name: 'Roofing Item',
                category: 'Roofing',
                quantity: 20,
                unit: 'bundle',
                unitCost: 15.00,
                totalCost: 300.00,
                notes: '',
              },
              {
                id: 'item-3',
                name: 'Framing Item 2',
                category: 'Framing',
                quantity: 5,
                unit: 'board',
                unitCost: 8.00,
                totalCost: 40.00,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithItems);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: items are grouped correctly by category
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toHaveLength(2);

        // Find Framing category
        const framingCategory = result.data.categories.find(
          (c) => c.category === 'Framing'
        );
        expect(framingCategory).toBeDefined();
        expect(framingCategory!.lineItems).toHaveLength(2);
        expect(framingCategory!.subtotal).toBe(90.00);

        // Find Roofing category
        const roofingCategory = result.data.categories.find(
          (c) => c.category === 'Roofing'
        );
        expect(roofingCategory).toBeDefined();
        expect(roofingCategory!.lineItems).toHaveLength(1);
        expect(roofingCategory!.subtotal).toBe(300.00);
      }
    });

    it('computes category subtotals correctly', async () => {
      // Given: project with items
      const projectWithItems: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Item 1',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: '',
              },
              {
                id: 'item-2',
                name: 'Item 2',
                category: 'Framing',
                quantity: 5,
                unit: 'board',
                unitCost: 8.00,
                totalCost: 40.00,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithItems);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: subtotal is sum of item totalCosts
      expect(result.success).toBe(true);
      if (result.success) {
        const framingCategory = result.data.categories.find(
          (c) => c.category === 'Framing'
        );
        expect(framingCategory!.subtotal).toBe(90.00);
      }
    });

    it('computes grand total correctly', async () => {
      // Given: project with items in multiple categories
      const projectWithItems: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Item 1',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: '',
              },
              {
                id: 'item-2',
                name: 'Item 2',
                category: 'Roofing',
                quantity: 20,
                unit: 'bundle',
                unitCost: 15.00,
                totalCost: 300.00,
                notes: '',
              },
              {
                id: 'item-3',
                name: 'Item 3',
                category: 'Electrical',
                quantity: 3,
                unit: 'each',
                unitCost: 25.00,
                totalCost: 75.00,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithItems);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: grand total is sum of all category subtotals
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grandTotal).toBe(425.00);

        // Verify sum of subtotals equals grand total
        const subtotalsSum = result.data.categories.reduce(
          (sum, cat) => sum + cat.subtotal,
          0
        );
        expect(subtotalsSum).toBe(result.data.grandTotal);
      }
    });

    it('excludes line items with quantity 0 from BOM', async () => {
      // Given: project with item that has quantity 0
      const projectWithZeroItem: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Active Item',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: '',
              },
              {
                id: 'item-2',
                name: 'Zero Item',
                category: 'Framing',
                quantity: 0,
                unit: 'board',
                unitCost: 8.00,
                totalCost: 0,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithZeroItem);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: zero quantity item is excluded
      expect(result.success).toBe(true);
      if (result.success) {
        const framingCategory = result.data.categories.find(
          (c) => c.category === 'Framing'
        );
        expect(framingCategory!.lineItems).toHaveLength(1);
        expect(framingCategory!.lineItems[0].name).toBe('Active Item');
      }
    });

    it('omits categories with no line items from BOM', async () => {
      // Given: project with items only in one category
      const projectWithOneCategory: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Framing Item',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithOneCategory);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: only Framing category is included
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toHaveLength(1);
        expect(result.data.categories[0].category).toBe('Framing');
      }
    });

    it('omits categories that only have items with quantity 0', async () => {
      // Given: project where one category only has zero-quantity items
      const projectWithZeroCategory: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Active Item',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: '',
              },
              {
                id: 'item-2',
                name: 'Zero Roofing Item',
                category: 'Roofing',
                quantity: 0,
                unit: 'bundle',
                unitCost: 15.00,
                totalCost: 0,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithZeroCategory);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: Roofing category is omitted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toHaveLength(1);
        expect(result.data.categories[0].category).toBe('Framing');
      }
    });

    it('returns BOM with zero grand total when project has no line items', async () => {
      // Given: project with no line items
      const emptyProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Empty Project',
            description: 'No items yet',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyProject);

      // When: build is called
      const result = await BomService.build('Empty Project');

      // Then: BOM has empty categories and zero grand total
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toEqual([]);
        expect(result.data.grandTotal).toBe(0);
      }
    });

    it('returns BOM with zero grand total when all items have quantity 0', async () => {
      // Given: project where all items have quantity 0
      const allZeroProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Zero Item 1',
                category: 'Framing',
                quantity: 0,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 0,
                notes: '',
              },
              {
                id: 'item-2',
                name: 'Zero Item 2',
                category: 'Roofing',
                quantity: 0,
                unit: 'bundle',
                unitCost: 15.00,
                totalCost: 0,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(allZeroProject);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: all items excluded, empty categories, zero total
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toEqual([]);
        expect(result.data.grandTotal).toBe(0);
      }
    });

    it('sets generation date in YYYY-MM-DD format', async () => {
      // Given: project exists
      const projectWithItems: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Item',
                category: 'Framing',
                quantity: 1,
                unit: 'each',
                unitCost: 10.00,
                totalCost: 10.00,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithItems);

      // When: build is called
      const result = await BomService.build('Test Project');

      // Then: generatedDate is in YYYY-MM-DD format
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('includes project name and description in BOM', async () => {
      // Given: project with description
      const project: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'My Build',
            description: 'A detailed description',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Item',
                category: 'Framing',
                quantity: 1,
                unit: 'each',
                unitCost: 10.00,
                totalCost: 10.00,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(project);

      // When: build is called
      const result = await BomService.build('My Build');

      // Then: BOM includes project name and description
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectName).toBe('My Build');
        expect(result.data.description).toBe('A detailed description');
      }
    });

    it('returns error when project does not exist', async () => {
      // Given: empty store
      vi.mocked(FileRepository.readStore).mockResolvedValue({ version: 1, projects: [] });

      // When: build is called for non-existent project
      const result = await BomService.build('Nonexistent');

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
        expect(result.error).toContain('Nonexistent');
      }
    });

    it('finds project by case-insensitive name', async () => {
      // Given: project exists
      const project: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'My Build',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(project);

      // When: build is called with different case
      const result = await BomService.build('my build');

      // Then: project is found
      expect(result.success).toBe(true);
    });
  });
});
