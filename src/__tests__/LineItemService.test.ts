import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as LineItemService from '../services/LineItemService.js';
import * as FileRepository from '../repository/FileRepository.js';
import type { DataStore } from '../types.js';

// Mock the FileRepository module
vi.mock('../repository/FileRepository.js');

describe('LineItemService', () => {
  const testProject: DataStore = {
    version: 1,
    projects: [
      {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        createdAt: '2025-01-01T00:00:00.000Z',
        lineItems: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('add', () => {
    it('adds a line item with all valid fields', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject)); // deep copy
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: add is called with valid fields
      const result = await LineItemService.add('Test Project', {
        name: '2x4 Lumber',
        category: 'Framing',
        quantity: 10,
        unit: 'board',
        unitCost: 5.50,
        notes: 'Test notes',
      });

      // Then: line item is created with correct values
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('2x4 Lumber');
        expect(result.data.category).toBe('Framing');
        expect(result.data.quantity).toBe(10);
        expect(result.data.unit).toBe('board');
        expect(result.data.unitCost).toBe(5.50);
        expect(result.data.totalCost).toBe(55.00);
        expect(result.data.notes).toBe('Test notes');
        expect(result.data.id).toMatch(/^[0-9a-f-]{36}$/);
      }
    });

    it('adds a line item without notes', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: add is called without notes
      const result = await LineItemService.add('Test Project', {
        name: '2x4 Lumber',
        category: 'Framing',
        quantity: 10,
        unit: 'board',
        unitCost: 5.50,
      });

      // Then: notes defaults to empty string
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('');
      }
    });

    it('computes totalCost correctly', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: add is called
      const result = await LineItemService.add('Test Project', {
        name: 'Test Item',
        category: 'Framing',
        quantity: 3.5,
        unit: 'each',
        unitCost: 12.25,
      });

      // Then: totalCost is quantity × unitCost rounded to 2dp
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalCost).toBe(42.88);
      }
    });

    it('trims whitespace from string fields', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: add is called with padded strings
      const result = await LineItemService.add('Test Project', {
        name: '  Padded Name  ',
        category: 'Framing',
        quantity: 1,
        unit: '  padded unit  ',
        unitCost: 10,
        notes: '  padded notes  ',
      });

      // Then: strings are trimmed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Padded Name');
        expect(result.data.unit).toBe('padded unit');
        expect(result.data.notes).toBe('padded notes');
      }
    });

    it('returns error when project does not exist', async () => {
      // Given: empty store
      vi.mocked(FileRepository.readStore).mockResolvedValue({ version: 1, projects: [] });

      // When: add is called for non-existent project
      const result = await LineItemService.add('Nonexistent', {
        name: 'Test',
        category: 'Framing',
        quantity: 1,
        unit: 'each',
        unitCost: 10,
      });

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
        expect(result.error).toContain('Nonexistent');
      }
    });

    it('returns error when name is empty or whitespace', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);

      // When: add is called with invalid name
      const result = await LineItemService.add('Test Project', {
        name: '   ',
        category: 'Framing',
        quantity: 1,
        unit: 'each',
        unitCost: 10,
      });

      // Then: ValidationError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('name');
      }
    });

    it('returns error when category is invalid', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);

      // When: add is called with invalid category
      const result = await LineItemService.add('Test Project', {
        name: 'Test',
        category: 'InvalidCategory',
        quantity: 1,
        unit: 'each',
        unitCost: 10,
      });

      // Then: ValidationError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid category');
      }
    });

    it('returns error when quantity is out of range', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);

      // When: add is called with invalid quantity
      const result1 = await LineItemService.add('Test Project', {
        name: 'Test',
        category: 'Framing',
        quantity: 0,
        unit: 'each',
        unitCost: 10,
      });

      const result2 = await LineItemService.add('Test Project', {
        name: 'Test',
        category: 'Framing',
        quantity: 10000000,
        unit: 'each',
        unitCost: 10,
      });

      // Then: ValidationError is returned
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it('returns error when unit cost is negative', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);

      // When: add is called with negative unitCost
      const result = await LineItemService.add('Test Project', {
        name: 'Test',
        category: 'Framing',
        quantity: 1,
        unit: 'each',
        unitCost: -5,
      });

      // Then: ValidationError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('unit cost');
      }
    });

    it('persists line item to project', async () => {
      // Given: project exists
      const store = JSON.parse(JSON.stringify(testProject)); // deep copy
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: add is called
      await LineItemService.add('Test Project', {
        name: 'Test Item',
        category: 'Framing',
        quantity: 1,
        unit: 'each',
        unitCost: 10,
      });

      // Then: writeStore was called with updated project
      expect(FileRepository.writeStore).toHaveBeenCalledWith(
        expect.objectContaining({
          projects: expect.arrayContaining([
            expect.objectContaining({
              lineItems: expect.arrayContaining([
                expect.objectContaining({ name: 'Test Item' }),
              ]),
            }),
          ]),
        })
      );
    });
  });

  describe('update', () => {
    const projectWithItem: DataStore = {
      version: 1,
      projects: [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test',
          createdAt: '2025-01-01T00:00:00.000Z',
          lineItems: [
            {
              id: 'item-1',
              name: 'Original Name',
              category: 'Framing',
              quantity: 10,
              unit: 'board',
              unitCost: 5.00,
              totalCost: 50.00,
              notes: 'Original notes',
            },
          ],
        },
      ],
    };

    it('updates only specified fields', async () => {
      // Given: project with line item exists
      const store = JSON.parse(JSON.stringify(projectWithItem));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: update is called with only name
      const result = await LineItemService.update('Test Project', 'item-1', {
        name: 'Updated Name',
      });

      // Then: only name is changed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.category).toBe('Framing');
        expect(result.data.quantity).toBe(10);
        expect(result.data.unitCost).toBe(5.00);
        expect(result.data.totalCost).toBe(50.00);
        expect(result.data.notes).toBe('Original notes');
      }
    });

    it('recomputes totalCost when quantity changes', async () => {
      // Given: project with line item exists
      const store = JSON.parse(JSON.stringify(projectWithItem));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: update is called with new quantity
      const result = await LineItemService.update('Test Project', 'item-1', {
        quantity: 20,
      });

      // Then: totalCost is recomputed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(20);
        expect(result.data.unitCost).toBe(5.00);
        expect(result.data.totalCost).toBe(100.00);
      }
    });

    it('recomputes totalCost when unitCost changes', async () => {
      // Given: project with line item exists
      const store = JSON.parse(JSON.stringify(projectWithItem));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: update is called with new unitCost
      const result = await LineItemService.update('Test Project', 'item-1', {
        unitCost: 7.50,
      });

      // Then: totalCost is recomputed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(10);
        expect(result.data.unitCost).toBe(7.50);
        expect(result.data.totalCost).toBe(75.00);
      }
    });

    it('recomputes totalCost when both quantity and unitCost change', async () => {
      // Given: project with line item exists
      const store = JSON.parse(JSON.stringify(projectWithItem));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: update is called with both
      const result = await LineItemService.update('Test Project', 'item-1', {
        quantity: 15,
        unitCost: 6.00,
      });

      // Then: totalCost is recomputed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalCost).toBe(90.00);
      }
    });

    it('does not recompute totalCost when neither quantity nor unitCost change', async () => {
      // Given: project with line item exists
      const store = JSON.parse(JSON.stringify(projectWithItem));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: update is called with only name and notes
      const result = await LineItemService.update('Test Project', 'item-1', {
        name: 'New Name',
        notes: 'New notes',
      });

      // Then: totalCost remains unchanged
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalCost).toBe(50.00);
      }
    });

    it('updates multiple fields at once', async () => {
      // Given: project with line item exists
      const store = JSON.parse(JSON.stringify(projectWithItem));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: update is called with multiple fields
      const result = await LineItemService.update('Test Project', 'item-1', {
        name: 'Updated Name',
        category: 'Roofing',
        quantity: 5,
        unit: 'sheet',
        unitCost: 12.00,
        notes: 'Updated notes',
      });

      // Then: all fields are updated
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.category).toBe('Roofing');
        expect(result.data.quantity).toBe(5);
        expect(result.data.unit).toBe('sheet');
        expect(result.data.unitCost).toBe(12.00);
        expect(result.data.totalCost).toBe(60.00);
        expect(result.data.notes).toBe('Updated notes');
      }
    });

    it('returns error when project does not exist', async () => {
      // Given: empty store
      vi.mocked(FileRepository.readStore).mockResolvedValue({ version: 1, projects: [] });

      // When: update is called for non-existent project
      const result = await LineItemService.update('Nonexistent', 'item-1', {
        name: 'Test',
      });

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });

    it('returns error when line item does not exist', async () => {
      // Given: project exists but item does not
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);

      // When: update is called for non-existent item
      const result = await LineItemService.update('Test Project', 'nonexistent-id', {
        name: 'Test',
      });

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });

    it('returns error on validation failure', async () => {
      // Given: project with item exists
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithItem);

      // When: update is called with invalid quantity
      const result = await LineItemService.update('Test Project', 'item-1', {
        quantity: -5,
      });

      // Then: ValidationError is returned and item remains unchanged
      expect(result.success).toBe(false);
      expect(FileRepository.writeStore).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const projectWithItems: DataStore = {
      version: 1,
      projects: [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test',
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
              quantity: 5,
              unit: 'sheet',
              unitCost: 20.00,
              totalCost: 100.00,
              notes: '',
            },
          ],
        },
      ],
    };

    it('removes a line item by id', async () => {
      // Given: project with items exists
      const store = JSON.parse(JSON.stringify(projectWithItems));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: remove is called
      const result = await LineItemService.remove('Test Project', 'item-1');

      // Then: item is removed
      expect(result.success).toBe(true);

      // Then: writeStore was called with updated project
      expect(FileRepository.writeStore).toHaveBeenCalledWith(
        expect.objectContaining({
          projects: expect.arrayContaining([
            expect.objectContaining({
              lineItems: [
                expect.objectContaining({ id: 'item-2' }),
              ],
            }),
          ]),
        })
      );
    });

    it('does not affect other items', async () => {
      // Given: project with multiple items
      const store = JSON.parse(JSON.stringify(projectWithItems));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: remove is called for one item
      await LineItemService.remove('Test Project', 'item-1');

      // Then: only that item is removed
      const writeCall = vi.mocked(FileRepository.writeStore).mock.calls[0][0];
      expect(writeCall.projects[0].lineItems).toHaveLength(1);
      expect(writeCall.projects[0].lineItems[0].id).toBe('item-2');
    });

    it('returns error when project does not exist', async () => {
      // Given: empty store
      vi.mocked(FileRepository.readStore).mockResolvedValue({ version: 1, projects: [] });

      // When: remove is called for non-existent project
      const result = await LineItemService.remove('Nonexistent', 'item-1');

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });

    it('returns error when line item does not exist', async () => {
      // Given: project exists but item does not
      const store = JSON.parse(JSON.stringify(testProject));
      vi.mocked(FileRepository.readStore).mockResolvedValue(store);

      // When: remove is called for non-existent item
      const result = await LineItemService.remove('Test Project', 'nonexistent-id');

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      expect(FileRepository.writeStore).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    const projectWithMultipleItems: DataStore = {
      version: 1,
      projects: [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test',
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
              name: 'Framing Item 2',
              category: 'Framing',
              quantity: 5,
              unit: 'board',
              unitCost: 10.00,
              totalCost: 50.00,
              notes: '',
            },
            {
              id: 'item-3',
              name: 'Roofing Item',
              category: 'Roofing',
              quantity: 3,
              unit: 'sheet',
              unitCost: 20.00,
              totalCost: 60.00,
              notes: '',
            },
          ],
        },
      ],
    };

    it('returns all line items when no category filter', async () => {
      // Given: project with multiple items
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithMultipleItems);

      // When: list is called without category
      const result = await LineItemService.list('Test Project');

      // Then: all items are returned
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
      }
    });

    it('filters line items by category', async () => {
      // Given: project with multiple categories
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithMultipleItems);

      // When: list is called with category filter
      const result = await LineItemService.list('Test Project', 'Framing');

      // Then: only matching items are returned
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].category).toBe('Framing');
        expect(result.data[1].category).toBe('Framing');
      }
    });

    it('returns empty array when category has no matches', async () => {
      // Given: project with items
      vi.mocked(FileRepository.readStore).mockResolvedValue(projectWithMultipleItems);

      // When: list is called with non-matching category
      const result = await LineItemService.list('Test Project', 'Electrical');

      // Then: empty array is returned (not an error)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns empty array when project has no items', async () => {
      // Given: project with no items (use fresh copy)
      const emptyProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyProject);

      // When: list is called
      const result = await LineItemService.list('Test Project');

      // Then: empty array is returned
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns error when project does not exist', async () => {
      // Given: empty store
      vi.mocked(FileRepository.readStore).mockResolvedValue({ version: 1, projects: [] });

      // When: list is called for non-existent project
      const result = await LineItemService.list('Nonexistent');

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });
  });
});
