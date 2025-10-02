## getPlacedFFS

A React + Vite app to streamline college placement applications. Students fill their profile once and apply to multiple recruiter postings. Admins can post jobs, capture custom fields, and export applications.

### Core Features
- Student profile with primary fields (editable anytime)
- Dashboard of live job applications with one-click apply
- Admin panel to create job posts and manage custom fields
- Export consolidated XLSX after deadlines
- Planned: view-only application confirmations (Google Sheets or hosted view)

### Tech Stack
- Frontend: React 19, Vite, TypeScript
- Styling: Custom CSS design system (no Tailwind)
- Data: Supabase (Auth, Database, Storage)
- Data fetching: React Query
- Forms & validation: React Hook Form + Zod

### Project Structure
- `src/App.tsx`: App shell, header, routing outlet
- `src/main.tsx`: Router + React Query providers
- `src/pages/`: `Dashboard`, `Profile`, `Admin`
- `src/components/`: `Button`, `Card`, `SectionHeader`
- `src/lib/supabaseClient.ts`: Supabase client instance
- `src/index.css`: Design tokens and base styles

### Prerequisites
- Node.js LTS and npm
- A Supabase project (URL + Anon key)

### Setup
1. Install dependencies:
   - `npm install`
2. Configure environment variables:
   - Copy `.env.example` to `.env` and fill values:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Start the dev server:
   - `npm run dev`

4. Build for production:
   - `npm run build`
   - Preview the build: `npm run preview`

### Available Scripts
- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check and build for production
- `npm run preview` — Preview the production build locally
- `npm run lint` — Lint the codebase

### Supabase
- Client is initialized in `src/lib/supabaseClient.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Next steps include wiring Supabase Auth (email/password or OAuth), defining schema tables (Students, Jobs, Applications, CustomFields), and creating a type-safe API layer.

### Roadmap
- Implement Student Profile form (React Hook Form + Zod) with the listed primary fields
- One-click apply flow, including custom recruiter fields prompt when required
- Admin job creation with optional custom fields upload
- XLSX export (Supabase Function or client-side library)
- Optional Google Sheets sync or view-only hosted confirmation page

### Contributing
- Use descriptive commit messages
- Run `npm run lint` before committing
- Keep components small and reusable

### License
MIT
