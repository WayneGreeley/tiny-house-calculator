# Web Interface Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# From project root
npm install

# Install web client dependencies
cd web/client
npm install
cd ../..
```

### 2. Start the Web Interface

```bash
npm run dev:web
```

This starts both:
- **API Server** on http://localhost:3000
- **Web Client** on http://localhost:5173

### 3. Open in Browser

Navigate to **http://localhost:5173** to use the web interface.

## 📋 Features

### Project Management
- **View all projects** in a grid layout
- **Create new projects** with name and description
- **Delete projects** with confirmation dialog
- View project details including item count

### Line Item Management
- **Add line items** with full details:
  - Name, category (dropdown), quantity, unit, unit cost, notes
- **View all items** in a sortable table
- **Delete items** individually
- **Automatic cost calculation** (quantity × unit cost)

### Bill of Materials
- **Generate BOM** grouped by category
- **View subtotals** per category
- **See grand total** for entire project
- Professional formatting for printing

## 🔄 CLI & Web Interoperability

Both interfaces share the same data store (`~/.tiny-house-calculator/data.json`):

```bash
# Create project in CLI
thc project create "My Project" --description "Build details"

# View it in browser
# Navigate to http://localhost:5173
# → Project appears immediately

# Add items in web interface
# → Run: thc project get "My Project"
# → CLI shows the new items
```

## 🛠️ Development Commands

```bash
# Run both servers (recommended)
npm run dev:web

# Run separately
npm run dev:web:server    # API only (port 3000)
npm run dev:web:client    # Client only (port 5173)

# Build for production
npm run build:web
```

## 🏗️ Architecture

```
Browser (http://localhost:5173)
    ↓
React SPA (Vite dev server)
    ↓ API calls
Express Server (http://localhost:3000)
    ↓
Service Layer (shared with CLI)
    ↓
FileRepository
    ↓
~/.tiny-house-calculator/data.json
```

## ✅ What's Included

- ✅ Full CRUD for projects
- ✅ Full CRUD for line items
- ✅ Bill of materials generation
- ✅ Automatic cost calculations
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design (Tailwind CSS)
- ✅ Type-safe (TypeScript end-to-end)

## 📝 API Endpoints

All endpoints return: `{ success: true, data: T } | { success: false, error: string }`

**Projects:**
- `GET /api/projects` - List all
- `POST /api/projects` - Create (body: `{name, description?}`)
- `GET /api/projects/:name` - Get one
- `DELETE /api/projects/:name` - Delete

**Line Items:**
- `GET /api/projects/:name/items` - List all items
- `POST /api/projects/:name/items` - Add item
- `PATCH /api/projects/:name/items/:id` - Update item
- `DELETE /api/projects/:name/items/:id` - Delete item

**BOM:**
- `GET /api/projects/:name/bom` - Generate bill of materials

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill existing processes
pkill -f "tsx watch"
pkill -f "vite"

# Try again
npm run dev:web
```

**Changes not appearing:**
- Refresh the browser (web changes)
- Vite has Hot Module Replacement (HMR) - most changes appear instantly
- For CLI changes, rebuild: `npm run build`

**Type errors:**
- Types are shared from `src/types.ts`
- Web client re-exports them in `web/client/src/types.ts`
- If you modify types, restart both dev servers

## 📚 More Information

See `CLAUDE.md` for complete documentation including:
- Full architecture details
- Data models
- Testing strategy
- Design decisions
