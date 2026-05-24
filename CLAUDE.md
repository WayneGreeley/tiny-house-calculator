# Tiny House Cost Calculator

## Project Overview

The Tiny House Cost Calculator is a **local TypeScript/Node.js CLI tool** that helps users plan and estimate the total cost of building a tiny house. Users can create named projects, add materials and components grouped by category, track costs automatically, and export a complete bill of materials to JSON or CSV.

**Key characteristics:**
- Fully local — no network calls, no cloud services
- Single JSON file storage at `~/.tiny-house-calculator/data.json`
- Precise decimal arithmetic using `Decimal.js` to avoid floating-point errors
- Property-based testing with `fast-check` for correctness guarantees

## Architecture

The application follows a layered architecture:

```
CLI Layer (Commander.js)
  ↓
Service Layer (business logic)
  ↓
Repository Layer (persistence)
  ↓
Storage (~/.tiny-house-calculator/data.json)
```

### Core Components

| Layer | Module | Responsibility |
|-------|--------|----------------|
| **CLI** | `src/index.ts` | Entry point, registers all subcommands |
| | `src/cli/project.ts` | Project CRUD commands |
| | `src/cli/item.ts` | Line item CRUD commands |
| | `src/cli/bom.ts` | Bill of materials view command |
| | `src/cli/export.ts` | Export commands (JSON/CSV) |
| | `src/cli/formatter.ts` | Terminal output formatting |
| **Services** | `src/services/ProjectService.ts` | Project management, name uniqueness |
| | `src/services/LineItemService.ts` | Line item CRUD, cost computation |
| | `src/services/BomService.ts` | Assembles bill of materials |
| **Core Logic** | `src/calculator.ts` | Cost computation with `Decimal.js` |
| | `src/validator.ts` | Input validation with detailed errors |
| | `src/exporter.ts` | JSON/CSV export with atomic writes |
| **Repository** | `src/repository/FileRepository.ts` | Atomic file I/O for `data.json` |
| **Types** | `src/types.ts` | All TypeScript interfaces |
| | `src/constants.ts` | Valid categories, field limits |
| | `src/errors.ts` | Custom error classes |

## Key Concepts

### Categories

All materials are organized into predefined categories:
- Foundation, Framing, Roofing, Electrical, Plumbing, Insulation, Interior, Exterior, Windows & Doors, Appliances, Miscellaneous

### Line Items

Each line item tracks:
- **Name** (1-100 chars), **Category**, **Quantity** (0.01-999,999.99)
- **Unit** (e.g., "board", "sheet", "each"), **Unit Cost** ($0.00-$999,999,999.99)
- **Total Cost** (automatically computed: quantity × unit cost, rounded half-up to 2dp)
- **Notes** (optional, 0-500 chars)

### Cost Computation

All monetary calculations use **`Decimal.js`** with `ROUND_HALF_UP` to avoid IEEE 754 floating-point errors:
- **Total Cost** = quantity × unit cost (per line item)
- **Category Subtotals** = sum of total costs for items in that category
- **Grand Total** = sum of all category subtotals

### Data Persistence

All data is stored in `~/.tiny-house-calculator/data.json` with atomic writes:
1. Write to temporary file (`data.json.tmp`)
2. `fs.rename` to target path (atomic on POSIX)
3. Prevents corruption on write failures

## Current Implementation Status

Based on the tasks document (`.kiro/specs/tiny-house-calculator/tasks.md`):

### ✅ Completed (All Tasks)
- **Task 1**: Project structure, types, constants, errors
- **Task 2**: Cost calculator with property-based tests
- **Task 3**: Input validator with property-based tests
- **Task 4**: Repository layer (`FileRepository.ts`) with atomic writes
- **Task 5**: `ProjectService` with full CRUD operations
- **Task 6**: `LineItemService` with add/update/remove/list
- **Task 7**: `BomService` for bill of materials assembly
- **Task 8**: Checkpoint - all service tests pass
- **Task 9**: Export module (JSON/CSV) with atomic writes
- **Task 10**: Complete CLI layer with all commands
- **Task 11**: Final checkpoint - all 108 tests pass, full end-to-end CLI validation

The application is **fully functional** and ready for use!

## CLI Interface

The CLI binary is `thc` (tiny house calculator):

```bash
# Project management
thc project create <name> [--description <text>]
thc project list
thc project get <name>
thc project delete <name>

# Line items
thc item add <project-name> --name <text> --category <cat> --quantity <n> --unit <text> --unit-cost <n> [--notes <text>]
thc item update <project-name> <item-id> [--name <text>] [--category <cat>] [--quantity <n>] [--unit <text>] [--unit-cost <n>] [--notes <text>]
thc item remove <project-name> <item-id>
thc item list <project-name> [--category <cat>]

# Bill of materials
thc bom view <project-name>

# Export
thc export json <project-name> [--output <filepath>]
thc export csv <project-name> [--output <filepath>]
```

### Example Session

```bash
$ thc project create "Mountain Cabin" --description "Off-grid 180 sq ft build"
✓ Project "Mountain Cabin" created.

$ thc item add "Mountain Cabin" \
    --name "2x6 Lumber" \
    --category Framing \
    --quantity 40 \
    --unit board \
    --unit-cost 8.50
✓ Line item added (id: a1b2c3d4).

$ thc bom view "Mountain Cabin"
Project: Mountain Cabin
Description: Off-grid 180 sq ft build
Generated: 2025-07-01

FRAMING
  2x6 Lumber    40 board @ $8.50    $340.00
  Subtotal:                         $340.00

GRAND TOTAL:                        $340.00

$ thc export csv "Mountain Cabin"
✓ Exported to ./Mountain Cabin-bom.csv
```

## Testing Strategy

The project uses a **dual testing approach**:

1. **Unit tests** — Example-based tests for specific behaviors, edge cases, and integration between components
2. **Property tests** — `fast-check` property-based tests (100 iterations each) to verify 10 core correctness properties

### 10 Correctness Properties

1. TotalCost is always quantity × unitCost rounded half-up to 2dp
2. GrandTotal equals the sum of all line item TotalCosts
3. Category subtotals are consistent with line item TotalCosts
4. JSON export round-trip preserves all data
5. Whitespace-only project names are always rejected
6. Whitespace-only line item names are always rejected
7. Input trimming is applied before validation
8. Invalid category values are always rejected
9. Quantity out of range is always rejected
10. Unit cost out of range is always rejected

### Test Organization

Tests live in `src/__tests__/` and use:
- **Vitest** as the test runner
- **fast-check** for property-based testing
- Mocked `fs/promises` for repository tests (no real file I/O except exporter tests)
- Real temp files in `os.tmpdir()` for exporter tests only

## Error Handling

All errors are typed and provide descriptive messages:

- **`ValidationError`** — Invalid input (name empty, quantity out of range, etc.)
- **`NotFoundError`** — Resource not found (project, line item)
- **`ConflictError`** — Duplicate name detected
- **`StorageError`** — File system error during persistence
- **`ExportError`** — Export operation failed

Error messages follow the pattern:
```
✗ Error: <descriptive message>
```

## Key Design Decisions

1. **Local JSON storage** — Simple, portable, no external dependencies
2. **Commander.js for CLI** — Most widely used, well-typed Node.js CLI framework
3. **csv-stringify for CSV export** — Part of mature `csv` ecosystem, TypeScript-native
4. **Decimal.js for arithmetic** — Avoids floating-point rounding errors (`0.1 + 0.2 !== 0.3`)
5. **fast-check for PBT** — Leading property-based testing library for TypeScript
6. **Atomic writes** — Prevents data corruption via temp file + rename pattern

## File Structure

```
tiny-house-calculator/
├── .kiro/
│   └── specs/
│       └── tiny-house-calculator/
│           ├── requirements.md   # Detailed requirements with acceptance criteria
│           ├── design.md         # Architecture, data models, CLI design
│           └── tasks.md          # Implementation plan with task checklist
├── src/
│   ├── types.ts                  # TypeScript interfaces
│   ├── constants.ts              # Valid categories, field limits
│   ├── errors.ts                 # Custom error classes
│   ├── calculator.ts             # Cost computation (Decimal.js)
│   ├── validator.ts              # Input validation
│   ├── exporter.ts               # JSON/CSV export
│   ├── services/
│   │   ├── ProjectService.ts     # Project CRUD
│   │   ├── LineItemService.ts    # Line item CRUD
│   │   └── BomService.ts         # Bill of materials assembly
│   ├── repository/
│   │   └── FileRepository.ts     # Atomic file I/O
│   ├── cli/
│   │   ├── project.ts            # Project commands
│   │   ├── item.ts               # Item commands
│   │   ├── bom.ts                # BOM view command
│   │   ├── export.ts             # Export commands
│   │   └── formatter.ts          # Terminal output formatting
│   ├── index.ts                  # Entry point
│   └── __tests__/
│       ├── errors.test.ts
│       ├── calculator.property.test.ts
│       └── ...                   # Additional test files
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── CLAUDE.md                     # This file
```

## Development Commands

```bash
npm run build        # Compile TypeScript to dist/
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode
```

## Data Model

### DataStore (persisted to `~/.tiny-house-calculator/data.json`)

```typescript
{
  version: number;       // Schema version for future migrations
  projects: Project[];   // All projects
}
```

### Project

```typescript
{
  id: string;            // UUID v4
  name: string;          // 1-100 chars, trimmed, case-insensitive unique
  description: string;   // 0-500 chars, trimmed
  createdAt: string;     // ISO 8601 timestamp
  lineItems: LineItem[]; // All materials for this project
}
```

### LineItem

```typescript
{
  id: string;            // UUID v4, unique within project
  name: string;          // 1-100 chars, trimmed
  category: CategoryName;
  quantity: number;      // 0.01-999,999.99
  unit: string;          // 1-50 chars, trimmed
  unitCost: number;      // 0.00-999,999,999.99
  totalCost: number;     // Computed: quantity × unitCost, rounded half-up to 2dp
  notes: string;         // 0-500 chars, trimmed
}
```

### BillOfMaterials

```typescript
{
  projectName: string;
  description: string;
  generatedDate: string;          // ISO 8601 date: YYYY-MM-DD
  categories: CategorySection[];  // Only non-empty categories
  grandTotal: number;             // Sum of all category subtotals
}
```

## Notes for Future Development

- **Schema versioning**: The `version` field in `DataStore` allows future migrations when the data model changes
- **Atomic writes**: Both `FileRepository` and `exporter` use the temp-file-then-rename pattern to prevent partial writes
- **Case-insensitive project names**: Project names are unique case-insensitively to avoid confusion
- **Zero quantities excluded**: Line items with quantity 0 are excluded from the BOM view
- **No hypothetical features**: The codebase implements exactly what's specified — no abstractions for future requirements
