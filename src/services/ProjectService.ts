import { v4 as uuidv4 } from 'uuid';
import { validateProjectName, validateDescription } from '../validator.js';
import { ConflictError, NotFoundError } from '../errors.js';
import { readStore, writeStore } from '../repository/FileRepository.js';
import type { Project, Result } from '../types.js';

/**
 * Creates a new project with the given name and optional description.
 * Validates inputs, checks for case-insensitive name uniqueness,
 * assigns a UUID v4 id, sets createdAt timestamp, and persists via repository.
 *
 * @throws ValidationError if name or description is invalid
 * @throws ConflictError if a project with the same name already exists (case-insensitive)
 * @throws StorageError if persistence fails
 */
export async function create(
  name: string,
  description?: string
): Promise<Result<Project>> {
  try {
    // Validate inputs
    validateProjectName(name);
    const trimmedName = name.trim();
    const trimmedDescription = description?.trim() || '';

    if (trimmedDescription) {
      validateDescription(trimmedDescription);
    }

    // Load existing projects
    const store = await readStore();

    // Check for case-insensitive name conflicts
    const existingProject = store.projects.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingProject) {
      throw new ConflictError('name', trimmedName);
    }

    // Create new project
    const project: Project = {
      id: uuidv4(),
      name: trimmedName,
      description: trimmedDescription,
      createdAt: new Date().toISOString(),
      lineItems: [],
    };

    // Persist
    store.projects.push(project);
    await writeStore(store);

    return { success: true, data: project };
  } catch (error) {
    if (
      error instanceof ConflictError ||
      error instanceof Error
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Lists all projects.
 * Returns an empty array when no projects exist.
 *
 * @throws StorageError if reading from storage fails
 */
export async function list(): Promise<Result<Project[]>> {
  try {
    const store = await readStore();
    return { success: true, data: store.projects };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Gets a project by name (case-insensitive).
 *
 * @throws NotFoundError if no project with the given name exists
 * @throws StorageError if reading from storage fails
 */
export async function get(name: string): Promise<Result<Project>> {
  try {
    const store = await readStore();
    const trimmedName = name.trim();

    const project = store.projects.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (!project) {
      throw new NotFoundError('Project', trimmedName);
    }

    return { success: true, data: project };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Deletes a project by name (case-insensitive).
 * Removes the project and all its line items.
 *
 * @throws NotFoundError if no project with the given name exists
 * @throws StorageError if persistence fails
 */
export async function deleteProject(name: string): Promise<Result<void>> {
  try {
    const store = await readStore();
    const trimmedName = name.trim();

    const projectIndex = store.projects.findIndex(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (projectIndex === -1) {
      throw new NotFoundError('Project', trimmedName);
    }

    // Remove project (and all its line items)
    store.projects.splice(projectIndex, 1);
    await writeStore(store);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}
