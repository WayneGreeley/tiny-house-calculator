# Tiny House Calculator - Web Interface

This directory contains the web interface for the Tiny House Calculator, consisting of an Express API server and a React SPA client.

## Quick Start

From the project root:

```bash
# Install dependencies (if not already done)
npm install
cd web/client && npm install && cd ../..

# Start development servers (both API and client)
npm run dev:web
```

The application will be available at:
- **Web Client**: http://localhost:5173
- **API Server**: http://localhost:3000

## Architecture

```
web/
├── server/          # Express API (port 3000)
│   ├── index.ts     # Server entry point
│   └── routes/      # REST API endpoints
│       ├── projects.ts
│       ├── lineItems.ts
│       └── bom.ts
│
└── client/          # React SPA (port 5173)
    ├── src/
    │   ├── api/          # Fetch wrappers
    │   ├── hooks/        # React Query hooks
    │   ├── components/   # UI components
    │   └── App.tsx       # Main app with routing
    └── package.json      # Client dependencies
```

## Features

### API Server (`web/server/`)

- **Express.js** REST API wrapping existing service layer
- **CORS** enabled for local development
- **JSON** request/response bodies
- **Error handling** with standardized `Result<T>` type

**Endpoints:**
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:name` - Get project
- `DELETE /api/projects/:name` - Delete project
- `GET /api/projects/:name/items` - List line items
- `POST /api/projects/:name/items` - Add line item
- `PATCH /api/projects/:name/items/:id` - Update line item
- `DELETE /api/projects/:name/items/:id` - Delete line item
- `GET /api/projects/:name/bom` - Get bill of materials

### Web Client (`web/client/`)

- **React 18** with TypeScript
- **React Router v6** for client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** for styling
- **Vite** for fast development and builds

**Routes:**
- `/` - Project list
- `/projects/:projectName` - Project details with line items
- `/projects/:projectName/bom` - Bill of materials view

## Development

### Run Both Servers

```bash
npm run dev:web
```

This uses `concurrently` to run both the API server and client dev server in watch mode.

### Run Individually

```bash
# API server only
npm run dev:web:server

# Client only (in separate terminal)
npm run dev:web:client
```

### Build for Production

```bash
npm run build:web
```

This compiles the TypeScript server code and builds the optimized React client bundle.

## Data Persistence

Both CLI and web interfaces share the same data store: `~/.tiny-house-calculator/data.json`

Changes made in one interface are visible in the other (after refresh in browser). Atomic writes prevent data corruption from concurrent access.

## Tech Stack

**Backend:**
- Express.js 4.x
- CORS middleware
- TypeScript

**Frontend:**
- React 18
- TypeScript
- Vite
- TanStack Query (React Query)
- React Router v6
- Tailwind CSS

## Type Safety

Types are imported directly from the shared `src/types.ts` file, ensuring consistency between CLI, API, and web client.

```typescript
// web/client/src/api/client.ts
import type { Project, LineItem, BillOfMaterials } from '../../../../src/types';
```

## Notes

- The web interface does **not** duplicate any business logic - it only provides a UI layer over the existing services
- Project names are URL-encoded to handle spaces and special characters
- React Query provides automatic caching, refetching, and optimistic updates
- All monetary values use `Decimal.js` for precise calculations (inherited from shared services)
