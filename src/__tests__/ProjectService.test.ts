import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as ProjectService from '../services/ProjectService.js';
import * as FileRepository from '../repository/FileRepository.js';
import type { DataStore } from '../types.js';

// Mock the FileRepository module
vi.mock('../repository/FileRepository.js');

describe('ProjectService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates a project with valid name and description', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: create is called with valid inputs
      const result = await ProjectService.create('My Build', 'A test project');

      // Then: project is created with UUID and timestamp
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Build');
        expect(result.data.description).toBe('A test project');
        expect(result.data.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(result.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(result.data.lineItems).toEqual([]);
      }

      // Then: writeStore was called with updated store
      expect(FileRepository.writeStore).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
          projects: expect.arrayContaining([
            expect.objectContaining({ name: 'My Build' }),
          ]),
        })
      );
    });

    it('creates a project without description', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: create is called without description
      const result = await ProjectService.create('Simple Build');

      // Then: project is created with empty description
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('trims whitespace from name and description', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: create is called with padded inputs
      const result = await ProjectService.create('  Padded Name  ', '  Padded Desc  ');

      // Then: values are trimmed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Padded Name');
        expect(result.data.description).toBe('Padded Desc');
      }
    });

    it('returns error when name is empty or whitespace-only', async () => {
      // Given: any store state
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);

      // When: create is called with empty/whitespace name
      const result1 = await ProjectService.create('');
      const result2 = await ProjectService.create('   ');

      // Then: ValidationError is returned
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      if (!result1.success) {
        expect(result1.error).toContain('name');
      }
    });

    it('returns error when name exceeds 100 characters', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);

      // When: create is called with too-long name
      const longName = 'a'.repeat(101);
      const result = await ProjectService.create(longName);

      // Then: ValidationError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('100');
      }
    });

    it('returns error when description exceeds 500 characters', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);

      // When: create is called with too-long description
      const longDesc = 'a'.repeat(501);
      const result = await ProjectService.create('Valid Name', longDesc);

      // Then: ValidationError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('500');
      }
    });

    it('returns ConflictError for duplicate name (case-insensitive)', async () => {
      // Given: store with existing project
      const storeWithProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'existing-id',
            name: 'My Build',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(storeWithProject);

      // When: create is called with same name (different case)
      const result1 = await ProjectService.create('My Build');
      const result2 = await ProjectService.create('my build');
      const result3 = await ProjectService.create('MY BUILD');

      // Then: ConflictError is returned
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);

      if (!result1.success) {
        expect(result1.error).toContain('already exists');
      }

      // Then: writeStore was never called
      expect(FileRepository.writeStore).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns all projects', async () => {
      // Given: store with multiple projects
      const storeWithProjects: DataStore = {
        version: 1,
        projects: [
          {
            id: 'id-1',
            name: 'Project 1',
            description: 'First',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
          {
            id: 'id-2',
            name: 'Project 2',
            description: 'Second',
            createdAt: '2025-01-02T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(storeWithProjects);

      // When: list is called
      const result = await ProjectService.list();

      // Then: all projects are returned
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Project 1');
        expect(result.data[1].name).toBe('Project 2');
      }
    });

    it('returns empty array when no projects exist', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);

      // When: list is called
      const result = await ProjectService.list();

      // Then: empty array is returned
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns error on storage failure', async () => {
      // Given: readStore throws error
      vi.mocked(FileRepository.readStore).mockRejectedValue(new Error('Storage error'));

      // When: list is called
      const result = await ProjectService.list();

      // Then: error is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Storage error');
      }
    });
  });

  describe('get', () => {
    it('returns project by name (case-insensitive)', async () => {
      // Given: store with project
      const storeWithProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'test-id',
            name: 'My Build',
            description: 'Test project',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(storeWithProject);

      // When: get is called with various cases
      const result1 = await ProjectService.get('My Build');
      const result2 = await ProjectService.get('my build');
      const result3 = await ProjectService.get('MY BUILD');

      // Then: project is returned for all cases
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      if (result1.success) {
        expect(result1.data.name).toBe('My Build');
        expect(result1.data.id).toBe('test-id');
      }
    });

    it('trims whitespace from search name', async () => {
      // Given: store with project
      const storeWithProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'test-id',
            name: 'My Build',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(storeWithProject);

      // When: get is called with padded name
      const result = await ProjectService.get('  My Build  ');

      // Then: project is found
      expect(result.success).toBe(true);
    });

    it('returns NotFoundError when project does not exist', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);

      // When: get is called with non-existent name
      const result = await ProjectService.get('Nonexistent');

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
        expect(result.error).toContain('Nonexistent');
      }
    });
  });

  describe('deleteProject', () => {
    it('deletes project by name (case-insensitive)', async () => {
      // Given: store with project
      const storeWithProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'test-id',
            name: 'My Build',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Test Item',
                category: 'Framing',
                quantity: 1,
                unit: 'each',
                unitCost: 10,
                totalCost: 10,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(storeWithProject);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: deleteProject is called
      const result = await ProjectService.deleteProject('my build');

      // Then: project is deleted
      expect(result.success).toBe(true);

      // Then: writeStore was called with empty projects array
      expect(FileRepository.writeStore).toHaveBeenCalledWith(
        expect.objectContaining({
          projects: [],
        })
      );
    });

    it('deletes project and all its line items', async () => {
      // Given: store with project containing line items
      const storeWithProject: DataStore = {
        version: 1,
        projects: [
          {
            id: 'test-id',
            name: 'My Build',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: 'Item 1',
                category: 'Framing',
                quantity: 1,
                unit: 'each',
                unitCost: 10,
                totalCost: 10,
                notes: '',
              },
              {
                id: 'item-2',
                name: 'Item 2',
                category: 'Roofing',
                quantity: 2,
                unit: 'each',
                unitCost: 20,
                totalCost: 40,
                notes: '',
              },
            ],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(storeWithProject);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: deleteProject is called
      const result = await ProjectService.deleteProject('My Build');

      // Then: success
      expect(result.success).toBe(true);

      // Then: all line items are removed with the project
      expect(FileRepository.writeStore).toHaveBeenCalledWith({
        version: 1,
        projects: [],
      });
    });

    it('returns NotFoundError when project does not exist', async () => {
      // Given: empty store
      const emptyStore: DataStore = { version: 1, projects: [] };
      vi.mocked(FileRepository.readStore).mockResolvedValue(emptyStore);

      // When: deleteProject is called with non-existent name
      const result = await ProjectService.deleteProject('Nonexistent');

      // Then: NotFoundError is returned
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }

      // Then: writeStore was not called
      expect(FileRepository.writeStore).not.toHaveBeenCalled();
    });

    it('does not affect other projects', async () => {
      // Given: store with multiple projects
      const storeWithProjects: DataStore = {
        version: 1,
        projects: [
          {
            id: 'id-1',
            name: 'Project 1',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
          {
            id: 'id-2',
            name: 'Project 2',
            description: '',
            createdAt: '2025-01-02T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      vi.mocked(FileRepository.readStore).mockResolvedValue(storeWithProjects);
      vi.mocked(FileRepository.writeStore).mockResolvedValue(undefined);

      // When: deleteProject is called for one project
      const result = await ProjectService.deleteProject('Project 1');

      // Then: only that project is removed
      expect(result.success).toBe(true);
      expect(FileRepository.writeStore).toHaveBeenCalledWith({
        version: 1,
        projects: [
          expect.objectContaining({ name: 'Project 2' }),
        ],
      });
    });
  });
});
