# Tiny House Cost Calculator

A local TypeScript/Node.js CLI tool for planning and estimating the total cost of building a tiny house. Manage materials, track costs automatically with precise decimal arithmetic, and export a complete bill of materials.

## Features

- 📊 **Project Management** — Create named tiny house build projects with descriptions
- 📝 **Line Item Tracking** — Add materials with quantity, unit cost, and category
- 💰 **Automatic Cost Calculation** — Precise decimal arithmetic using Decimal.js (no floating-point errors)
- 📂 **Category Organization** — Group materials by Foundation, Framing, Roofing, Electrical, Plumbing, etc.
- 📤 **Export** — Generate JSON or CSV bill of materials
- 🧪 **Property-Based Testing** — 10 correctness properties verified with 100 iterations each

## Installation

```bash
npm install
npm run build
npm link  # Makes 'thc' command available globally
```

## Usage

### Project Management

```bash
# Create a new project
thc project create "Mountain Cabin" --description "Off-grid 180 sq ft build"

# List all projects
thc project list

# View project details
thc project get "Mountain Cabin"

# Delete a project
thc project delete "Mountain Cabin"
```

### Managing Line Items

```bash
# Add a material
thc item add "Mountain Cabin" \
  --name "2x6 Lumber" \
  --category Framing \
  --quantity 40 \
  --unit board \
  --unit-cost 8.50 \
  --notes "16ft lengths"

# List all items in a project
thc item list "Mountain Cabin"

# List items by category
thc item list "Mountain Cabin" --category Framing

# Update an item
thc item update "Mountain Cabin" <item-id> --quantity 45

# Remove an item
thc item remove "Mountain Cabin" <item-id>
```

### View Bill of Materials

```bash
thc bom view "Mountain Cabin"
```

### Export

```bash
# Export to JSON
thc export json "Mountain Cabin"
thc export json "Mountain Cabin" --output ./my-bom.json

# Export to CSV
thc export csv "Mountain Cabin"
thc export csv "Mountain Cabin" --output ./my-bom.csv
```

## Valid Categories

- Foundation
- Framing
- Roofing
- Electrical
- Plumbing
- Insulation
- Interior
- Exterior
- Windows & Doors
- Appliances
- Miscellaneous

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build TypeScript
npm run build
```

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

See [CLAUDE.md](./CLAUDE.md) for complete architecture documentation.

## Testing

The project uses a dual testing approach:

1. **Unit Tests** — Example-based tests for specific behaviors and edge cases
2. **Property Tests** — Fast-check property-based tests (100 iterations each) verifying 10 core correctness properties

All monetary calculations use `Decimal.js` with `ROUND_HALF_UP` to avoid floating-point errors.

## License

MIT

## Contributing

This project was started with [Kiro](https://github.com/kirolabs) and continued with [Claude Code](https://claude.ai/code).
