# OpsMind AI Frontend

Next.js 15 + React 19 + TypeScript frontend for OpsMind AI.

## Setup

```bash
npm install
npm run dev
```

Opens on `http://localhost:3000`

## Project Structure

```
frontend/
  app/
    layout.tsx           # Root layout
    page.tsx            # Home page
    auth/
      login/page.tsx    # Login page
      signup/page.tsx   # Signup page
    dashboard/
      page.tsx          # Main dashboard
      documents/page.tsx # Document management
      chat/page.tsx     # Chat interface
  components/
    Auth/               # Auth components
    Documents/          # Document upload/list
    Chat/              # Chat interface
    Layout/            # Shared layout
  lib/
    api.ts             # API client
    hooks/             # Custom hooks
    auth.ts            # Auth utilities
    storage.ts         # LocalStorage helpers
  styles/
    globals.css        # Global styles
```

## Key Features

- ✅ Authentication (login/signup/logout)
- ✅ JWT token management (access + refresh)
- ✅ Document upload with progress
- ✅ Real-time ingestion status via WebSocket
- ✅ Chat interface with RAG
- ✅ Conversation management
- ✅ Document citations
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Build for Production

```bash
npm run build
npm run start
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types
