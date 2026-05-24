# Requirements Document

## Introduction

The Tiny House Cost Calculator is a TypeScript/Node.js tool that helps users plan and estimate the total cost of building a tiny house. Users can define, organize, and manage all materials, products, and components required for a tiny house build — grouped by category — and receive a running total cost estimate. The tool supports adding, editing, and removing line items, applying quantities and unit costs, and exporting a final bill of materials.

## Glossary

- **Calculator**: The Tiny House Cost Calculator application
- **Project**: A named tiny house build plan containing all materials and cost data
- **LineItem**: A single material, product, or component entry within a project, including name, category, quantity, unit, unit cost, and notes
- **Category**: A logical grouping of line items (e.g., Foundation, Framing, Roofing, Electrical, Plumbing, Insulation, Interior, Exterior, Windows & Doors, Appliances, Miscellaneous)
- **BillOfMaterials**: The complete list of all line items in a project with subtotals per category and a grand total
- **UnitCost**: The cost per single unit of a line item (e.g., cost per board, per sheet, per fixture)
- **TotalCost**: The computed value of quantity multiplied by unit cost for a line item, rounded to 2 decimal places (half-up)
- **GrandTotal**: The sum of all line item total costs within a project, rounded to 2 decimal places (half-up)
- **Export**: The action of serializing a project's bill of materials to a portable format (JSON or CSV)

---

## Requirements

### Requirement 1: Project Management

**User Story:** As a tiny house builder, I want to create and manage named build projects, so that I can organize cost estimates for different builds or design variations.

#### Acceptance Criteria

1. WHEN a user creates a new Project, THE Calculator SHALL accept a name between 1 and 100 characters and an optional description up to 500 characters, and persist the Project with a creation timestamp.
2. WHEN a user attempts to create a Project with a name that matches an existing Project name (case-insensitive), THE Calculator SHALL return a descriptive error identifying the conflicting name.
3. WHEN a user provides an empty string or whitespace-only string as a Project name, THE Calculator SHALL return a descriptive error identifying the name field as invalid before any persistence occurs.
4. WHEN a user retrieves a Project by name, THE Calculator SHALL return the Project's name, description, and creation date.
5. WHEN a user requests a Project that does not exist, THE Calculator SHALL return a descriptive error indicating the Project was not found.
6. WHEN a user deletes an existing Project by name, THE Calculator SHALL remove the Project and all its LineItems.
7. WHEN a user attempts to delete a Project that does not exist, THE Calculator SHALL return a descriptive error indicating the Project was not found.
8. WHEN a user lists all Projects, THE Calculator SHALL return each Project's name, description, and creation date.
9. WHEN no Projects exist, THE Calculator SHALL return an empty list.

---

### Requirement 2: Line Item Management

**User Story:** As a tiny house builder, I want to add, edit, and remove individual materials and products within a project, so that I can build a complete and accurate bill of materials.

#### Acceptance Criteria

1. WHEN a user adds a LineItem to a Project, THE Calculator SHALL accept: name (1–100 characters), category (1–50 characters, must be a valid Category), quantity (0.01–999,999.99), unit (1–50 characters), unit cost (0.00–999,999,999.99), and an optional note (0–500 characters).
2. WHEN a LineItem is added, THE Calculator SHALL assign it a unique identifier within the Project.
3. WHEN a user provides a quantity less than or equal to zero for a LineItem, THE Calculator SHALL return a descriptive error identifying the quantity field and the violated constraint.
4. WHEN a user provides a unit cost less than zero for a LineItem, THE Calculator SHALL return a descriptive error identifying the unit cost field and the violated constraint. A unit cost of zero is valid.
5. WHEN a user updates a LineItem, THE Calculator SHALL allow updating any field except the LineItem identifier.
6. WHEN a user attempts to update a LineItem that does not exist, THE Calculator SHALL return a descriptive error indicating the LineItem was not found without modifying any existing data.
7. WHEN a LineItem update fails validation, THE Calculator SHALL return a descriptive error identifying the offending field and leave the LineItem in its previous valid state.
8. WHEN a user removes a LineItem from a Project by its identifier, THE Calculator SHALL delete that LineItem.
9. WHEN a user attempts to remove a LineItem that does not exist, THE Calculator SHALL return a descriptive error indicating the LineItem was not found.
10. WHEN a user lists all LineItems within a Project filtered by category, THE Calculator SHALL return only LineItems matching that category.
11. WHEN a user filters LineItems by a category that contains no matching items, THE Calculator SHALL return an empty list (not an error).

---

### Requirement 3: Cost Calculation

**User Story:** As a tiny house builder, I want the calculator to automatically compute costs at the line item and project level, so that I always have an accurate total estimate.

#### Acceptance Criteria

1. WHEN a LineItem is created or updated with valid quantity and unit cost, THE Calculator SHALL compute the TotalCost as quantity multiplied by unit cost, rounded to 2 decimal places using half-up rounding.
2. WHEN any LineItem in a Project is added, updated, or removed, THE Calculator SHALL recompute the GrandTotal as the sum of all LineItem TotalCost values within that Project, rounded to 2 decimal places using half-up rounding.
3. WHEN any LineItem in a Project is added, updated, or removed, THE Calculator SHALL recompute the subtotal for each Category as the sum of TotalCost values for all LineItems assigned to that Category. LineItems without a valid Category are excluded from category subtotals.
4. WHEN a Project contains no LineItems, THE Calculator SHALL return a GrandTotal of zero.

---

### Requirement 4: Bill of Materials View

**User Story:** As a tiny house builder, I want to view a structured bill of materials for my project, so that I can review all planned items and costs in one place.

#### Acceptance Criteria

1. WHEN a user requests a BillOfMaterials for a Project, THE Calculator SHALL return all LineItems grouped by Category, allowing duplicate LineItem names within the same Category.
2. IF LineItems within the same Category are tagged with different location notes, THE Calculator SHALL list them as separate entries under that Category.
3. THE BillOfMaterials SHALL include the subtotal for each Category, computed as the sum of (quantity × unit cost) for all LineItems in that Category.
4. THE BillOfMaterials SHALL include the GrandTotal, computed as the sum of all Category subtotals.
5. THE BillOfMaterials SHALL include the Project name, description, and the report generation date in ISO 8601 format (YYYY-MM-DD).
6. WHEN a Category contains no LineItems, THE Calculator SHALL omit that Category from the BillOfMaterials.
7. WHEN a LineItem has a quantity of zero, THE Calculator SHALL exclude it from the BillOfMaterials output.

---

### Requirement 5: Export

**User Story:** As a tiny house builder, I want to export my bill of materials to a file, so that I can share it with contractors or import it into other tools.

#### Acceptance Criteria

1. WHEN a user exports a Project's BillOfMaterials to JSON, THE Calculator SHALL produce a file containing: project name, description, report generation date, all LineItems (with id, name, category, quantity, unit, unit cost, total cost, and notes), category subtotals, and GrandTotal.
2. WHEN a user exports a Project's BillOfMaterials to CSV, THE Calculator SHALL produce a file with one row per LineItem and columns: category, name, quantity, unit, unit cost, total cost, and notes.
3. WHEN a JSON export is parsed and re-imported, THE Calculator SHALL produce a BillOfMaterials with the same LineItem count, identical field values for each LineItem, identical category subtotals, and an identical GrandTotal as the original.
4. WHEN a user requests an export for a Project that does not exist, THE Calculator SHALL return a descriptive error identifying the missing Project name.
5. IF a Project contains no LineItems, THE Calculator SHALL export an empty BillOfMaterials with a GrandTotal of zero.
6. WHEN an export operation fails due to a file system or serialization error, THE Calculator SHALL return a descriptive error identifying the failure reason without leaving a partial file.

---

### Requirement 6: Input Validation

**User Story:** As a tiny house builder, I want the calculator to validate all inputs, so that my cost data remains accurate and free of corrupt entries.

#### Acceptance Criteria

1. WHEN a user provides an empty string or whitespace-only string for a LineItem name, THE Calculator SHALL return a descriptive error identifying the name field as invalid.
2. WHEN a user provides an empty string or whitespace-only string for a Project name, THE Calculator SHALL return a descriptive error identifying the name field as invalid.
3. WHEN a user provides a non-numeric value for quantity, THE Calculator SHALL return a descriptive error identifying the quantity field and the violated rule.
4. WHEN a user provides a quantity outside the range 0.01–999,999.99, THE Calculator SHALL return a descriptive error identifying the quantity field and the allowed range.
5. WHEN a user provides a non-numeric value for unit cost, THE Calculator SHALL return a descriptive error identifying the unit cost field and the violated rule, regardless of whether the quantity is valid.
6. WHEN a user provides a unit cost outside the range 0.00–999,999,999.99, THE Calculator SHALL return a descriptive error identifying the unit cost field and the allowed range.
7. WHEN a user provides a category value not in the defined Category list, THE Calculator SHALL return a descriptive error listing all valid categories.
8. THE Calculator SHALL trim leading and trailing whitespace from all string inputs before validation and processing.
