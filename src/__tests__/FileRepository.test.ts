import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { readStore, writeStore, ensureDataDir } from '../repository/FileRepository.js';
import { StorageError } from '../errors.js';
import type { DataStore } from '../types.js';

// Mock fs/promises to use memfs
vi.mock('fs', () => {
  return {
    promises: vol.promises,
  };
});

// Mock os.homedir to return a consistent test path
vi.mock('os', () => {
  return {
    homedir: () => '/home/testuser',
  };
});

describe('FileRepository', () => {
  beforeEach(() => {
    // Reset the in-memory filesystem before each test
    vol.reset();
  });

  afterEach(() => {
    // Clean up
    vol.reset();
  });

  describe('ensureDataDir', () => {
    it('creates the data directory if it does not exist', async () => {
      // Given: directory does not exist
      // When: ensureDataDir is called
      await ensureDataDir();

      // Then: directory is created
      const stats = await vol.promises.stat('/home/testuser/.tiny-house-calculator');
      expect(stats.isDirectory()).toBe(true);
    });

    it('succeeds if the directory already exists', async () => {
      // Given: directory already exists
      await vol.promises.mkdir('/home/testuser/.tiny-house-calculator', { recursive: true });

      // When: ensureDataDir is called
      // Then: no error is thrown
      await expect(ensureDataDir()).resolves.toBeUndefined();
    });

    it('throws StorageError if mkdir fails with non-EEXIST error', async () => {
      // Given: mkdir will fail with permission error
      vi.spyOn(vol.promises, 'mkdir').mockRejectedValueOnce(
        Object.assign(new Error('Permission denied'), { code: 'EACCES' })
      );

      // When: ensureDataDir is called
      // Then: StorageError is thrown
      await expect(ensureDataDir()).rejects.toThrow(StorageError);
    });
  });

  describe('readStore', () => {
    it('returns default empty store when file does not exist', async () => {
      // Given: data file does not exist
      // When: readStore is called
      const store = await readStore();

      // Then: default store is returned
      expect(store).toEqual({ version: 1, projects: [] });
    });

    it('reads and parses existing data file', async () => {
      // Given: data file exists with valid JSON
      const testStore: DataStore = {
        version: 1,
        projects: [
          {
            id: 'test-id',
            name: 'Test Project',
            description: 'Test description',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };
      await vol.promises.mkdir('/home/testuser/.tiny-house-calculator', { recursive: true });
      await vol.promises.writeFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        JSON.stringify(testStore),
        'utf-8'
      );

      // When: readStore is called
      const store = await readStore();

      // Then: parsed store matches the test data
      expect(store).toEqual(testStore);
    });

    it('throws StorageError when file contains invalid JSON', async () => {
      // Given: data file exists with invalid JSON
      await vol.promises.mkdir('/home/testuser/.tiny-house-calculator', { recursive: true });
      await vol.promises.writeFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        'invalid json {',
        'utf-8'
      );

      // When: readStore is called
      // Then: StorageError is thrown
      await expect(readStore()).rejects.toThrow(StorageError);
    });

    it('throws StorageError on permission error', async () => {
      // Given: readFile will fail with permission error
      await vol.promises.mkdir('/home/testuser/.tiny-house-calculator', { recursive: true });
      await vol.promises.writeFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        '{}',
        'utf-8'
      );
      vi.spyOn(vol.promises, 'readFile').mockRejectedValueOnce(
        Object.assign(new Error('Permission denied'), { code: 'EACCES' })
      );

      // When: readStore is called
      // Then: StorageError is thrown
      await expect(readStore()).rejects.toThrow(StorageError);
    });
  });

  describe('writeStore', () => {
    it('writes data store to file with atomic rename', async () => {
      // Given: a valid DataStore
      const testStore: DataStore = {
        version: 1,
        projects: [
          {
            id: 'test-id',
            name: 'Test Project',
            description: 'Test description',
            createdAt: '2025-01-01T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };

      // When: writeStore is called
      await writeStore(testStore);

      // Then: file is written with correct content
      const content = await vol.promises.readFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        'utf-8'
      );
      const parsed = JSON.parse(content as string);
      expect(parsed).toEqual(testStore);

      // Then: temp file is cleaned up
      await expect(
        vol.promises.access('/home/testuser/.tiny-house-calculator/data.json.tmp')
      ).rejects.toThrow();
    });

    it('serializes with 2-space indentation', async () => {
      // Given: a valid DataStore
      const testStore: DataStore = {
        version: 1,
        projects: [],
      };

      // When: writeStore is called
      await writeStore(testStore);

      // Then: file content is pretty-printed
      const content = await vol.promises.readFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        'utf-8'
      );
      expect(content).toContain('\n');
      expect(content).toMatch(/\n {2}/); // Check for 2-space indent
    });

    it('creates directory if it does not exist', async () => {
      // Given: directory does not exist and a valid DataStore
      const testStore: DataStore = { version: 1, projects: [] };

      // When: writeStore is called
      await writeStore(testStore);

      // Then: directory is created and file is written
      const stats = await vol.promises.stat('/home/testuser/.tiny-house-calculator');
      expect(stats.isDirectory()).toBe(true);

      const content = await vol.promises.readFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        'utf-8'
      );
      expect(JSON.parse(content as string)).toEqual(testStore);
    });

    it('overwrites existing file atomically', async () => {
      // Given: existing file with old data
      await vol.promises.mkdir('/home/testuser/.tiny-house-calculator', { recursive: true });
      await vol.promises.writeFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        JSON.stringify({ version: 1, projects: [] }),
        'utf-8'
      );

      const newStore: DataStore = {
        version: 1,
        projects: [
          {
            id: 'new-id',
            name: 'New Project',
            description: '',
            createdAt: '2025-01-02T00:00:00.000Z',
            lineItems: [],
          },
        ],
      };

      // When: writeStore is called with new data
      await writeStore(newStore);

      // Then: file is updated with new data
      const content = await vol.promises.readFile(
        '/home/testuser/.tiny-house-calculator/data.json',
        'utf-8'
      );
      expect(JSON.parse(content as string)).toEqual(newStore);
    });

    it('throws StorageError on write failure', async () => {
      // Given: writeFile will fail
      vi.spyOn(vol.promises, 'writeFile').mockRejectedValueOnce(
        new Error('Disk full')
      );

      const testStore: DataStore = { version: 1, projects: [] };

      // When: writeStore is called
      // Then: StorageError is thrown
      await expect(writeStore(testStore)).rejects.toThrow(StorageError);
    });

    it('cleans up temp file on write failure', async () => {
      // Given: rename will fail after successful write
      await vol.promises.mkdir('/home/testuser/.tiny-house-calculator', { recursive: true });

      // Create temp file first
      await vol.promises.writeFile(
        '/home/testuser/.tiny-house-calculator/data.json.tmp',
        'temp',
        'utf-8'
      );

      vi.spyOn(vol.promises, 'rename').mockRejectedValueOnce(
        new Error('Rename failed')
      );

      const testStore: DataStore = { version: 1, projects: [] };

      // When: writeStore is called and fails
      await expect(writeStore(testStore)).rejects.toThrow(StorageError);

      // Then: temp file is cleaned up
      await expect(
        vol.promises.access('/home/testuser/.tiny-house-calculator/data.json.tmp')
      ).rejects.toThrow();
    });
  });

  describe('atomic write behavior', () => {
    it('ensures readStore returns same data after writeStore', async () => {
      // Given: a valid DataStore
      const testStore: DataStore = {
        version: 1,
        projects: [
          {
            id: 'roundtrip-id',
            name: 'Roundtrip Project',
            description: 'Testing roundtrip',
            createdAt: '2025-01-03T00:00:00.000Z',
            lineItems: [
              {
                id: 'item-1',
                name: '2x4 Lumber',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.50,
                totalCost: 55.00,
                notes: 'Test item',
              },
            ],
          },
        ],
      };

      // When: writeStore then readStore
      await writeStore(testStore);
      const readBack = await readStore();

      // Then: data matches exactly
      expect(readBack).toEqual(testStore);
    });
  });
});
