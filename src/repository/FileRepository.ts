import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { StorageError } from '../errors.js';
import type { DataStore } from '../types.js';

const DATA_DIR = join(homedir(), '.tiny-house-calculator');
const DATA_FILE = join(DATA_DIR, 'data.json');
const DATA_FILE_TMP = join(DATA_DIR, 'data.json.tmp');

/**
 * Ensures the data directory exists.
 * Creates it if absent, using recursive: true to create parent directories.
 */
export async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    throw new StorageError(
      `Failed to create data directory at ${DATA_DIR}`,
      error
    );
  }
}

/**
 * Reads the data store from disk.
 * Returns a default empty store if the file does not exist.
 * Wraps fs errors in StorageError.
 */
export async function readStore(): Promise<DataStore> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content) as DataStore;
  } catch (error: any) {
    // File doesn't exist - return default empty store
    if (error.code === 'ENOENT') {
      return { version: 1, projects: [] };
    }
    // Other errors (permissions, invalid JSON, etc.)
    throw new StorageError(
      `Failed to read data store from ${DATA_FILE}`,
      error
    );
  }
}

/**
 * Writes the data store to disk atomically.
 * Serializes to JSON with 2-space indentation.
 * Writes to a temp file first, then renames to prevent corruption.
 * Wraps fs errors in StorageError.
 */
export async function writeStore(store: DataStore): Promise<void> {
  try {
    // Ensure directory exists
    await ensureDataDir();

    // Serialize with pretty printing (2-space indent)
    const json = JSON.stringify(store, null, 2);

    // Write to temp file
    await fs.writeFile(DATA_FILE_TMP, json, 'utf-8');

    // Atomic rename (POSIX guarantees atomicity)
    await fs.rename(DATA_FILE_TMP, DATA_FILE);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(DATA_FILE_TMP);
    } catch {
      // Ignore cleanup errors
    }

    throw new StorageError(
      `Failed to write data store to ${DATA_FILE}`,
      error
    );
  }
}
