# Implementation Plan: Tiny House Calculator

## Overview

Build a local TypeScript/Node.js CLI tool (`thc`) that manages tiny house build projects, tracks line items with cost calculations, and exports a bill of materials to JSON or CSV. The implementation follows a layered architecture: CLI (Commander.js) → Services → Repository → `~/.tiny-house-calculator/data.json`.

---

## Tasks

- [x] 1. Bootstrap project structure, types, and constants
  - Initialize `package.json` with `type: "module"`, `bin: { thc: "./dist/index.js" }`, and all required dependencies: `commander`, `decimal.js`, `csv-stringify`, `uuid`; dev dependencies: `typescript`, `vitest`, `fast-check`, `@types/node`, `@types/uuid`
  - Create `tsconfig.json` targeting ES2022 modules with `NodeNext` resolution and `strict: true`
  - Create `vitest.config.ts` with `globals: true` and `environment: "node"`
  - Create `src/types.ts` with all interfaces: `CategoryName`, `Project`, `LineItem`, `BillOfMaterials`, `CategorySection`, `DataStore`, `Result<T>`
  - Create `src/constants.ts` with the `VALID_CATEGORIES` array and field length limits (`NAME_MAX`, `DESC_MAX`, `UNIT_MAX`, `NOTES_MAX`)
  - Create `src/errors.ts` with `ValidationError`, `NotFoundError`, `ConflictError`, `StorageError`, `ExportError`
  - _Requirements: 1.1, 2.1, 6.1–6.8_

  - [x] 1.1 Write unit tests for custom error classes
    - Given each custom error class is instantiated with valid arguments, when the error is thrown and caught, then `error.name`, `error.message`, and any typed fields (`field`, `resource`, `identifier`, `value`) match the constructor arguments
    - _Requirements: 6.1–6.8_

- [x] 2. Implement cost calculator and input validator
  - [x] 2.1 Implement `src/calculator.ts`
    - Export `computeTotalCost(quantity, unitCost): number` using `Decimal.js` with `ROUND_HALF_UP` and `toDecimalPlaces(2)`
    - Export `computeGrandTotal(lineItems: LineItem[]): number` summing all `totalCost` values
    - Export `computeCategorySubtotals(lineItems: LineItem[]): Map<CategoryName, number>`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Write property test — Property 1: TotalCost equals quantity × unitCost rounded half-up to 2dp
    - **Property 1: TotalCost is always quantity × unitCost rounded half-up to 2 decimal places**
    - **Validates: Requirements 3.1**
    - Given any valid quantity (0.01–999,999.99) and unit cost (0.00–999,999,999.99), when `computeTotalCost` is called, then the result is a finite number with at most 2 decimal places and equals `round_half_up(quantity × unitCost, 2)`
    - Use `fc.float` with `noNaN: true`, `numRuns: 100`

  - [x] 2.3 Write property test — Property 2: GrandTotal equals sum of all line item TotalCosts
    - **Property 2: GrandTotal equals the sum of all line item TotalCosts**
    - **Validates: Requirements 3.2, 3.4**
    - Given any array of line items with valid `totalCost` values, when `computeGrandTotal` is called, then the result equals the Decimal-precise sum of all `totalCost` values rounded half-up to 2dp
    - Use `fc.array(fc.record({ totalCost: fc.float(...) }))`, `numRuns: 100`

  - [x] 2.4 Write property test — Property 3: Category subtotals are consistent with line item TotalCosts
    - **Property 3: Category subtotals are consistent with line item TotalCosts**
    - **Validates: Requirements 3.3**
    - Given any array of line items with valid categories and `totalCost` values, when `computeCategorySubtotals` is called, then each category's subtotal equals the sum of `totalCost` for items in that category, and the sum of all subtotals equals `computeGrandTotal` of the same items
    - `numRuns: 100`

  - [x] 2.5 Implement `src/validator.ts`
    - Export `validateProjectName(name: string): void` — trims, checks non-empty, checks length ≤ 100; throws `ValidationError`
    - Export `validateDescription(desc: string): void` — trims, checks length ≤ 500; throws `ValidationError`
    - Export `validateLineItemName(name: string): void` — trims, checks non-empty, checks length ≤ 100; throws `ValidationError`
    - Export `validateCategory(cat: string): CategoryName` — checks membership in `VALID_CATEGORIES`; throws `ValidationError` listing all valid categories
    - Export `validateQuantity(qty: unknown): number` — checks numeric, range 0.01–999,999.99; throws `ValidationError`
    - Export `validateUnitCost(cost: unknown): number` — checks numeric, range 0.00–999,999,999.99; throws `ValidationError`
    - Export `validateUnit(unit: string): void` — trims, checks non-empty, checks length ≤ 50; throws `ValidationError`
    - Export `validateNotes(notes: string): void` — trims, checks length ≤ 500; throws `ValidationError`
    - All validators apply trimming before validation (Requirement 6.8)
    - _Requirements: 6.1–6.8_

  - [x] 2.6 Write property test — Property 5: Whitespace-only project names are always rejected
    - **Property 5: Whitespace-only project names are always rejected**
    - **Validates: Requirements 1.3, 6.2**
    - Given any string composed entirely of whitespace characters, when `validateProjectName` is called, then a `ValidationError` is thrown and no project is created
    - Use `fc.stringMatching(/^\s+$/)`, `numRuns: 100`

  - [x] 2.7 Write property test — Property 6: Whitespace-only line item names are always rejected
    - **Property 6: Whitespace-only line item names are always rejected**
    - **Validates: Requirements 6.1**
    - Given any string composed entirely of whitespace characters, when `validateLineItemName` is called, then a `ValidationError` is thrown
    - Use `fc.stringMatching(/^\s+$/)`, `numRuns: 100`

  - [x] 2.8 Write property test — Property 7: Input trimming is applied before validation
    - **Property 7: Input trimming is applied before validation**
    - **Validates: Requirements 6.8**
    - Given any valid name string with arbitrary leading/trailing whitespace, when `validateProjectName` or `validateLineItemName` is called, then the trimmed value is used for validation (no error thrown for padded-but-valid names)
    - Use `fc.string({ minLength: 1 })` combined with `fc.string()` for padding, `numRuns: 100`

  - [x] 2.9 Write property test — Property 8: Invalid category values are always rejected
    - **Property 8: Invalid category values are always rejected**
    - **Validates: Requirements 6.7**
    - Given any string not in `VALID_CATEGORIES`, when `validateCategory` is called, then a `ValidationError` is thrown whose message lists all valid categories
    - Use `fc.string()` filtered to exclude valid category names, `numRuns: 100`

  - [x] 2.10 Write property test — Property 9: Quantity out of range is always rejected
    - **Property 9: Quantity out of range is always rejected**
    - **Validates: Requirements 2.3, 6.4**
    - Given any numeric value outside 0.01–999,999.99, when `validateQuantity` is called, then a `ValidationError` is thrown identifying the quantity field and allowed range
    - Use `fc.oneof(fc.float({ max: 0.009 }), fc.float({ min: 1_000_000 }))`, `numRuns: 100`

  - [x] 2.11 Write property test — Property 10: Unit cost out of range is always rejected
    - **Property 10: Unit cost out of range is always rejected**
    - **Validates: Requirements 2.4, 6.6**
    - Given any numeric value outside 0.00–999,999,999.99, when `validateUnitCost` is called, then a `ValidationError` is thrown identifying the unit cost field and allowed range
    - Use `fc.float({ min: 1_000_000_000 })`, `numRuns: 100`

- [x] 3. Checkpoint — Ensure all calculator and validator tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the repository layer
  - [x] 4.1 Implement `src/repository/FileRepository.ts`
    - Resolve data directory to `~/.tiny-house-calculator/` using `os.homedir()`
    - Export `readStore(): Promise<DataStore>` — reads `data.json`; returns `{ version: 1, projects: [] }` if file does not exist; wraps `fs` errors in `StorageError`
    - Export `writeStore(store: DataStore): Promise<void>` — serializes to JSON (2-space indent), writes to `data.json.tmp`, then `fs.rename` to `data.json`; wraps errors in `StorageError`
    - Export `ensureDataDir(): Promise<void>` — creates the directory with `fs.mkdir({ recursive: true })` if absent
    - _Requirements: 1.1, 1.6_

  - [x] 4.2 Write unit tests for `FileRepository`
    - Given the data file does not exist, when `readStore` is called, then it returns the default empty store
    - Given a valid `DataStore`, when `writeStore` is called, then the file is written atomically (tmp → rename) and `readStore` returns the same data
    - Given an unwritable directory, when `writeStore` is called, then a `StorageError` is thrown
    - Mock `fs/promises` using `vi.mock`; do not perform real file I/O in tests
    - _Requirements: 1.1_

- [x] 5. Implement `ProjectService`
  - [x] 5.1 Implement `src/services/ProjectService.ts`
    - `create(name, description?): Promise<Result<Project>>` — validates inputs, checks case-insensitive name uniqueness (throws `ConflictError`), assigns UUID v4 id, sets `createdAt` to `new Date().toISOString()`, persists via repository
    - `list(): Promise<Result<Project[]>>` — returns all projects (empty array when none)
    - `get(name): Promise<Result<Project>>` — finds by case-insensitive name; throws `NotFoundError` if absent
    - `delete(name): Promise<Result<void>>` — finds by case-insensitive name; removes project and all its line items; throws `NotFoundError` if absent
    - _Requirements: 1.1–1.9_

  - [x] 5.2 Write unit tests for `ProjectService`
    - Given a valid name, when `create` is called, then the project is persisted with a UUID id and ISO timestamp
    - Given a duplicate name (case-insensitive), when `create` is called, then a `ConflictError` is returned
    - Given an empty/whitespace name, when `create` is called, then a `ValidationError` is returned
    - Given a non-existent project name, when `get` or `delete` is called, then a `NotFoundError` is returned
    - Given an existing project, when `delete` is called, then the project and all its line items are removed
    - Given no projects, when `list` is called, then an empty array is returned
    - Mock the repository; do not perform real file I/O
    - _Requirements: 1.1–1.9_

- [x] 6. Implement `LineItemService`
  - [x] 6.1 Implement `src/services/LineItemService.ts`
    - `add(projectName, fields): Promise<Result<LineItem>>` — validates all fields, assigns UUID v4 id, computes `totalCost` via `computeTotalCost`, appends to project's `lineItems`, persists
    - `update(projectName, itemId, fields): Promise<Result<LineItem>>` — finds item by id (throws `NotFoundError` if absent), validates only provided fields, recomputes `totalCost`, persists; leaves item unchanged on validation failure
    - `remove(projectName, itemId): Promise<Result<void>>` — finds item by id (throws `NotFoundError` if absent), removes from project, persists
    - `list(projectName, category?): Promise<Result<LineItem[]>>` — returns all items or filtered by category; returns empty array when no matches
    - _Requirements: 2.1–2.11, 3.1_

  - [x] 6.2 Write unit tests for `LineItemService`
    - Given valid fields, when `add` is called, then the item is persisted with a UUID id and correct `totalCost`
    - Given an invalid quantity (≤ 0 or out of range), when `add` is called, then a `ValidationError` is returned and no item is added
    - Given a negative unit cost, when `add` is called, then a `ValidationError` is returned
    - Given a non-existent item id, when `update` or `remove` is called, then a `NotFoundError` is returned
    - Given a category filter with no matching items, when `list` is called, then an empty array is returned (not an error)
    - Given a valid update, when `update` is called, then `totalCost` is recomputed correctly
    - Mock the repository; do not perform real file I/O
    - _Requirements: 2.1–2.11, 3.1_

- [x] 7. Implement `BomService`
  - [x] 7.1 Implement `src/services/BomService.ts`
    - `build(projectName): Promise<Result<BillOfMaterials>>` — loads project, groups line items by category (omitting empty categories and items with quantity 0), computes subtotals via `computeCategorySubtotals`, computes `grandTotal` via `computeGrandTotal`, sets `generatedDate` to `new Date().toISOString().slice(0, 10)`
    - _Requirements: 3.2–3.4, 4.1–4.7_

  - [x] 7.2 Write unit tests for `BomService`
    - Given a project with line items in multiple categories, when `build` is called, then items are grouped correctly and subtotals match
    - Given a project with no line items, when `build` is called, then `grandTotal` is 0 and `categories` is empty
    - Given a line item with quantity 0, when `build` is called, then that item is excluded from the BOM
    - Given a category with no items after filtering, when `build` is called, then that category is omitted
    - Mock the repository; do not perform real file I/O
    - _Requirements: 3.2–3.4, 4.1–4.7_

- [x] 8. Checkpoint — Ensure all service and repository tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement the export module
  - [~] 9.1 Implement `src/exporter.ts`
    - Export `writeAtomic(filePath: string, content: string): Promise<void>` — writes to `<filePath>.tmp` then renames; wraps errors in `ExportError` and cleans up the `.tmp` file before re-throwing
    - Export `exportJson(bom: BillOfMaterials, outputPath: string): Promise<void>` — serializes BOM with `JSON.stringify(bom, null, 2)` and calls `writeAtomic`
    - Export `exportCsv(bom: BillOfMaterials, outputPath: string): Promise<void>` — uses `csv-stringify/sync` `stringify` with header row `['category','name','quantity','unit','unit cost','total cost','notes']`, one row per line item across all categories, calls `writeAtomic`
    - _Requirements: 5.1–5.6_

  - [~] 9.2 Write property test — Property 4: JSON export round-trip preserves all data
    - **Property 4: JSON export round-trip preserves all data**
    - **Validates: Requirements 5.3**
    - Given any `BillOfMaterials` with any number of valid line items, when `exportJson` writes to a temp path and the file is parsed back, then line item count, all field values, category subtotals, and `grandTotal` are identical to the original
    - Use `fc.record` to generate arbitrary valid BOMs; use real temp files in `os.tmpdir()`; clean up after each run; `numRuns: 100`

  - [~] 9.3 Write unit tests for `exporter.ts`
    - Given a valid BOM, when `exportJson` is called, then the output file contains valid JSON matching the BOM structure
    - Given a valid BOM, when `exportCsv` is called, then the output file has a header row and one data row per line item
    - Given a file system error during write, when `exportJson` or `exportCsv` is called, then an `ExportError` is thrown and no partial file remains
    - Given a BOM with no line items, when `exportCsv` is called, then only the header row is written
    - Use real temp files in `os.tmpdir()`; clean up after each test
    - _Requirements: 5.1–5.6_

- [ ] 10. Implement the CLI layer
  - [~] 10.1 Implement `src/cli/formatter.ts`
    - Export `formatSuccess(message: string): string` — returns `✓ <message>`
    - Export `formatError(message: string): string` — returns `✗ Error: <message>`
    - Export `formatTable(headers: string[], rows: string[][]): string` — returns a plain-text aligned table
    - Export `formatBom(bom: BillOfMaterials): string` — renders the BOM with category sections, subtotals, and grand total matching the example session in the design
    - _Requirements: 4.1–4.7_

  - [~] 10.2 Write unit tests for `formatter.ts`
    - Given a success message, when `formatSuccess` is called, then the output starts with `✓`
    - Given an error message, when `formatError` is called, then the output starts with `✗ Error:`
    - Given a BOM with one category and one item, when `formatBom` is called, then the output contains the category name, item name, quantity, unit cost, total cost, and grand total
    - _Requirements: 4.1–4.7_

  - [~] 10.3 Implement `src/cli/project.ts`
    - Register `project create <name>` with optional `--description` option; call `ProjectService.create`; print success or error via formatter
    - Register `project list`; call `ProjectService.list`; print table of name/description/createdAt or "No projects found"
    - Register `project get <name>`; call `ProjectService.get`; print project details
    - Register `project delete <name>`; call `ProjectService.delete`; print success or error
    - _Requirements: 1.1–1.9_

  - [~] 10.4 Write unit tests for project CLI commands
    - Given `project create "My Build"`, when the command runs, then `ProjectService.create` is called with the correct name and the success message is printed
    - Given `project create` with a duplicate name, when the command runs, then the error message is printed and exit code is non-zero
    - Given `project list` with no projects, when the command runs, then "No projects found" is printed
    - Given `project delete` with a non-existent name, when the command runs, then the not-found error is printed
    - Mock `ProjectService`; test CLI wiring only
    - _Requirements: 1.1–1.9_

  - [~] 10.5 Implement `src/cli/item.ts`
    - Register `item add <project-name>` with required options `--name`, `--category`, `--quantity`, `--unit`, `--unit-cost` and optional `--notes`; call `LineItemService.add`; print success with item id or error
    - Register `item update <project-name> <item-id>` with all fields optional; call `LineItemService.update`; print success or error
    - Register `item remove <project-name> <item-id>`; call `LineItemService.remove`; print success or error
    - Register `item list <project-name>` with optional `--category` filter; call `LineItemService.list`; print table or "No items found"
    - _Requirements: 2.1–2.11_

  - [~] 10.6 Write unit tests for item CLI commands
    - Given `item add` with all required options, when the command runs, then `LineItemService.add` is called with correct parsed arguments
    - Given `item add` with a missing required option, when the command runs, then Commander prints a usage error
    - Given `item remove` with a non-existent item id, when the command runs, then the not-found error is printed
    - Given `item list` with a `--category` filter, when the command runs, then `LineItemService.list` is called with the category argument
    - Mock `LineItemService`; test CLI wiring only
    - _Requirements: 2.1–2.11_

  - [~] 10.7 Implement `src/cli/bom.ts`
    - Register `bom view <project-name>`; call `BomService.build`; print formatted BOM via `formatBom` or error
    - _Requirements: 4.1–4.7_

  - [~] 10.8 Write unit tests for bom CLI command
    - Given `bom view "My Build"` and a valid BOM, when the command runs, then `BomService.build` is called and the formatted BOM is printed
    - Given `bom view` with a non-existent project, when the command runs, then the not-found error is printed
    - Mock `BomService`; test CLI wiring only
    - _Requirements: 4.1–4.7_

  - [~] 10.9 Implement `src/cli/export.ts`
    - Register `export json <project-name>` with optional `--output`; default output path `<cwd>/<project-name>-bom.json`; call `BomService.build` then `exportJson`; print success path or error
    - Register `export csv <project-name>` with optional `--output`; default output path `<cwd>/<project-name>-bom.csv`; call `BomService.build` then `exportCsv`; print success path or error
    - _Requirements: 5.1–5.6_

  - [~] 10.10 Write unit tests for export CLI commands
    - Given `export json "My Build"`, when the command runs, then `exportJson` is called with the default output path and the success message includes the file path
    - Given `export csv "My Build" --output /tmp/out.csv`, when the command runs, then `exportCsv` is called with `/tmp/out.csv`
    - Given an export failure, when the command runs, then the error message is printed and no partial file remains
    - Mock `BomService` and `exporter`; test CLI wiring only
    - _Requirements: 5.1–5.6_

  - [~] 10.11 Implement `src/index.ts` entry point
    - Create the root Commander program with name `thc`, version from `package.json`, and description
    - Register all subcommand modules: `project`, `item`, `bom`, `export`
    - Call `program.parseAsync(process.argv)` wrapped in a top-level try/catch that prints `formatError` and exits with code 1 on unhandled errors
    - _Requirements: 1.1–6.8_

- [~] 11. Final checkpoint — Ensure all tests pass and CLI is wired end-to-end
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all 10 correctness properties have corresponding property test sub-tasks
- Every non-optional sub-task must have a passing test before it can be marked complete
- Tests use Given-When-Then comment structure and live in `src/__tests__/` alongside source
- Repository and CLI tests use `vi.mock` — no real file I/O except in `exporter.ts` tests (which use `os.tmpdir()` and clean up)
- Atomic writes use `fs.rename` (POSIX-atomic); the same pattern applies to both `FileRepository` and `writeAtomic` in the exporter
- `Decimal.js` is configured globally with `ROUND_HALF_UP` in `calculator.ts`; all monetary math flows through it
- `csv-stringify/sync` is used for synchronous CSV generation inside the async `exportCsv` wrapper

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.5"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1", "7.1"] },
    { "id": 4, "tasks": ["5.2", "6.1", "7.2"] },
    { "id": 5, "tasks": ["6.2", "9.1", "10.1"] },
    { "id": 6, "tasks": ["9.2", "9.3", "10.2", "10.3", "10.5", "10.7", "10.9"] },
    { "id": 7, "tasks": ["10.4", "10.6", "10.8", "10.10", "10.11"] }
  ]
}
```
