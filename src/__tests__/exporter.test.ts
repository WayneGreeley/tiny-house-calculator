import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import { writeAtomic, exportJson, exportCsv } from '../exporter.js';
import { ExportError } from '../errors.js';
import type { BillOfMaterials } from '../types.js';

describe('exporter', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique test directory in temp
    testDir = join(tmpdir(), `thc-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('writeAtomic', () => {
    it('writes content to file atomically', async () => {
      // Given: a file path and content
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, world!';

      // When: writeAtomic is called
      await writeAtomic(filePath, content);

      // Then: file is written with correct content
      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });

    it('overwrites existing file', async () => {
      // Given: existing file with old content
      const filePath = join(testDir, 'existing.txt');
      await fs.writeFile(filePath, 'old content', 'utf-8');

      // When: writeAtomic is called with new content
      await writeAtomic(filePath, 'new content');

      // Then: file contains new content
      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe('new content');
    });

    it('cleans up temp file after successful write', async () => {
      // Given: a file path
      const filePath = join(testDir, 'test.txt');

      // When: writeAtomic is called
      await writeAtomic(filePath, 'content');

      // Then: temp file is cleaned up
      const tmpPath = `${filePath}.tmp`;
      await expect(fs.access(tmpPath)).rejects.toThrow();
    });

    it('throws ExportError on write failure', async () => {
      // Given: invalid directory path
      const invalidPath = '/invalid/nonexistent/path/file.txt';

      // When: writeAtomic is called
      // Then: ExportError is thrown
      await expect(writeAtomic(invalidPath, 'content')).rejects.toThrow(ExportError);
    });

    it('cleans up temp file on write failure', async () => {
      // Given: a path that will fail on rename
      const filePath = join(testDir, 'test.txt');

      // Create the target as a directory to cause rename to fail
      await fs.mkdir(filePath, { recursive: true });

      // When: writeAtomic is called and fails
      await expect(writeAtomic(filePath, 'content')).rejects.toThrow();

      // Then: temp file is cleaned up
      const tmpPath = `${filePath}.tmp`;
      await expect(fs.access(tmpPath)).rejects.toThrow();
    });
  });

  describe('exportJson', () => {
    it('exports BOM to JSON with correct structure', async () => {
      // Given: a valid BOM
      const bom: BillOfMaterials = {
        projectName: 'Test Project',
        description: 'Test description',
        generatedDate: '2025-01-15',
        categories: [
          {
            category: 'Framing',
            lineItems: [
              {
                id: 'item-1',
                name: '2x4 Lumber',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: 'Test notes',
              },
            ],
            subtotal: 50.00,
          },
        ],
        grandTotal: 50.00,
      };
      const outputPath = join(testDir, 'bom.json');

      // When: exportJson is called
      await exportJson(bom, outputPath);

      // Then: file is created with valid JSON
      const content = await fs.readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(bom);
    });

    it('serializes JSON with 2-space indentation', async () => {
      // Given: a simple BOM
      const bom: BillOfMaterials = {
        projectName: 'Test',
        description: '',
        generatedDate: '2025-01-15',
        categories: [],
        grandTotal: 0,
      };
      const outputPath = join(testDir, 'bom.json');

      // When: exportJson is called
      await exportJson(bom, outputPath);

      // Then: JSON is pretty-printed with 2-space indent
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('\n');
      expect(content).toMatch(/\n {2}/);
    });

    it('throws ExportError on write failure', async () => {
      // Given: invalid path
      const bom: BillOfMaterials = {
        projectName: 'Test',
        description: '',
        generatedDate: '2025-01-15',
        categories: [],
        grandTotal: 0,
      };
      const invalidPath = '/invalid/path/bom.json';

      // When: exportJson is called
      // Then: ExportError is thrown
      await expect(exportJson(bom, invalidPath)).rejects.toThrow(ExportError);
    });

    it('exports empty BOM correctly', async () => {
      // Given: BOM with no items
      const bom: BillOfMaterials = {
        projectName: 'Empty Project',
        description: 'No items',
        generatedDate: '2025-01-15',
        categories: [],
        grandTotal: 0,
      };
      const outputPath = join(testDir, 'empty-bom.json');

      // When: exportJson is called
      await exportJson(bom, outputPath);

      // Then: file contains valid empty BOM
      const content = await fs.readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.categories).toEqual([]);
      expect(parsed.grandTotal).toBe(0);
    });
  });

  describe('exportCsv', () => {
    it('exports BOM to CSV with header and data rows', async () => {
      // Given: a BOM with line items
      const bom: BillOfMaterials = {
        projectName: 'Test Project',
        description: 'Test',
        generatedDate: '2025-01-15',
        categories: [
          {
            category: 'Framing',
            lineItems: [
              {
                id: 'item-1',
                name: '2x4 Lumber',
                category: 'Framing',
                quantity: 10,
                unit: 'board',
                unitCost: 5.00,
                totalCost: 50.00,
                notes: 'Test notes',
              },
            ],
            subtotal: 50.00,
          },
        ],
        grandTotal: 50.00,
      };
      const outputPath = join(testDir, 'bom.csv');

      // When: exportCsv is called
      await exportCsv(bom, outputPath);

      // Then: CSV file is created
      const content = await fs.readFile(outputPath, 'utf-8');
      const lines = content.trim().split('\n');

      // Then: has header row
      expect(lines[0]).toContain('category');
      expect(lines[0]).toContain('name');
      expect(lines[0]).toContain('quantity');

      // Then: has data row
      expect(lines[1]).toContain('Framing');
      expect(lines[1]).toContain('2x4 Lumber');
      expect(lines[1]).toContain('10');
      expect(lines[1]).toContain('board');
      expect(lines[1]).toContain('5');
      expect(lines[1]).toContain('50');
      expect(lines[1]).toContain('Test notes');
    });

    it('exports multiple line items across categories', async () => {
      // Given: BOM with multiple categories and items
      const bom: BillOfMaterials = {
        projectName: 'Test Project',
        description: '',
        generatedDate: '2025-01-15',
        categories: [
          {
            category: 'Framing',
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
            ],
            subtotal: 90.00,
          },
          {
            category: 'Roofing',
            lineItems: [
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
            subtotal: 300.00,
          },
        ],
        grandTotal: 390.00,
      };
      const outputPath = join(testDir, 'multi-bom.csv');

      // When: exportCsv is called
      await exportCsv(bom, outputPath);

      // Then: CSV has 1 header + 3 data rows
      const content = await fs.readFile(outputPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(4); // header + 3 items
    });

    it('exports only header when BOM has no items', async () => {
      // Given: empty BOM
      const bom: BillOfMaterials = {
        projectName: 'Empty Project',
        description: '',
        generatedDate: '2025-01-15',
        categories: [],
        grandTotal: 0,
      };
      const outputPath = join(testDir, 'empty-bom.csv');

      // When: exportCsv is called
      await exportCsv(bom, outputPath);

      // Then: only header row is written
      const content = await fs.readFile(outputPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1); // only header
      expect(lines[0]).toContain('category');
    });

    it('handles empty notes field', async () => {
      // Given: BOM with item without notes
      const bom: BillOfMaterials = {
        projectName: 'Test',
        description: '',
        generatedDate: '2025-01-15',
        categories: [
          {
            category: 'Framing',
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
            subtotal: 10.00,
          },
        ],
        grandTotal: 10.00,
      };
      const outputPath = join(testDir, 'no-notes.csv');

      // When: exportCsv is called
      await exportCsv(bom, outputPath);

      // Then: CSV is created successfully with empty notes field
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toBeTruthy();
    });

    it('throws ExportError on write failure', async () => {
      // Given: invalid path
      const bom: BillOfMaterials = {
        projectName: 'Test',
        description: '',
        generatedDate: '2025-01-15',
        categories: [],
        grandTotal: 0,
      };
      const invalidPath = '/invalid/path/bom.csv';

      // When: exportCsv is called
      // Then: ExportError is thrown
      await expect(exportCsv(bom, invalidPath)).rejects.toThrow(ExportError);
    });
  });
});
