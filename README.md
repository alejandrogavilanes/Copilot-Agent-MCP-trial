# Urlist - A Modern Link Collection Manager with Health Monitoring

Urlist is a web application that helps users organize, manage, and share collections of links with built-in link health monitoring. It provides an intuitive interface for creating, organizing, and validating link collections while ensuring links remain active and accessible.

The application is built using Astro.js for server-side rendering, Preact for interactive components, and Tailwind CSS for styling. It features automatic link validation, keyboard shortcuts for efficient navigation, and a responsive design that works across devices.

## Repository Structure
```
.
├── src/                      # Source code directory
│   ├── components/           # Reusable UI components
│   │   ├── LinkHealth.tsx    # Link validation status component
│   │   ├── LinkList.tsx     # Main link management component
│   │   └── SearchBar.tsx    # Link search functionality
│   ├── db/                  # Database configuration and schema
│   │   ├── schema.sql       # PostgreSQL database schema
│   │   └── setup.ts        # Database initialization
│   ├── pages/              # Application routes and API endpoints
│   │   ├── api/            # REST API endpoints
│   │   └── lists/          # Link list pages
│   └── utils/              # Utility functions and helpers
│       ├── db.ts           # Database connection utilities
│       └── link-validator.ts # Link validation service
├── public/                 # Static assets
└── astro.config.mjs       # Astro configuration
```

## Usage Instructions
### Prerequisites
- Node.js 18 or later
- PostgreSQL 12 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd urlist
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Create PostgreSQL database
createdb link-page-db

# Configure database connection
export DB_CONNECTION='postgresql://postgres:password@localhost:5432/link-page-db'

# Run database setup
npm run setup:db
```

### Quick Start
1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:4321`

3. Create your first link list:
   - Click "Create New List"
   - Enter a title and description
   - Start adding links to your collection

### More Detailed Examples

**Creating and Managing a Link List**
```typescript
// Create a new list
const list = await createList({
  title: "My Tech Resources",
  description: "Useful programming articles and tools"
});

// Add links to the list
await addLink(list.id, {
  url: "https://example.com",
  title: "Example Resource",
  description: "A helpful resource"
});
```

**Bulk Import Links**
```typescript
// Import multiple links at once
const urls = [
  "https://example.com/article1",
  "https://example.com/article2"
];
await bulkImport(listId, urls);
```

### Troubleshooting

**Database Connection Issues**
- Error: `ECONNREFUSED`
  - Verify PostgreSQL is running: `pg_isready`
  - Check connection string format
  - Ensure database exists: `psql -l | grep link-page-db`

**Link Validation Errors**
- Check network connectivity
- Verify URL format
- Review rate limiting settings in `rate-limiter.ts`
- Check logs for detailed error messages

## Data Flow
The application follows a straightforward data flow for managing link collections.

```ascii
[User Input] -> [API Routes] -> [Database]
      ^              |              |
      |              v              v
[UI Components] <- [State] <- [Link Validator]
```

Component interactions:
- User actions trigger API requests through components
- API routes handle data validation and persistence
- Link validator runs periodically to check link health
- State updates trigger UI refreshes
- Components receive updates through Preact signals
- Database maintains persistent storage of lists and links

## Infrastructure

![Infrastructure diagram](./docs/infra.svg)
The application uses the following infrastructure components:

**Database**
- PostgreSQL database for storing link collections and metadata
- Tables: `lists`, `links`, `link_health`
- Connection managed through connection pooling

**Server**
- Node.js server using Astro SSR
- API routes for data manipulation
- Link validation service runs as a background process

## This a demo project ##

This a demo project all code is for example only