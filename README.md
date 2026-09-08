# PING — Collaborative IDE & Project Workspace

A full-stack project-management and collaborative IDE web app, built end to end
as an EPITA team project (2025).

- **Backend** — Java **Quarkus** REST API: JWT authentication, **PostgreSQL**
  persistence, **Lucene** full-text search, JUnit/AssertJ tests.
- **Frontend** — **React 19 + TypeScript**, Vite, Tailwind 4.

> Imported from EPITA GitLab as a snapshot (history omitted, secrets scrubbed).
> My focus: backend services (auth, search, project workspaces) and frontend
> integration.

## Architecture

```
frontend/   React 19 + TS + Vite + Tailwind 4
backend/    Quarkus REST API
  ├── auth        JWT login (java-jwt)
  ├── projects    workspaces, files, members
  └── search      Lucene full-text indexing
```

## Run it

### 1. PostgreSQL

```bash
export PGDATA="$HOME/postgres_data"
export PGHOST="/tmp"
export PGPORT="5432"
initdb --locale "$LANG" -E UTF8
postgres -k "$PGHOST" &
createdb -U postgres ping
psql -U postgres -d ping -f ping.sql
```

### 2. Backend

```bash
cd backend
mvn clean install
mvn quarkus:dev        # http://localhost:8080
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## API quickstart

Authenticate, then call the API with the returned JWT:

```bash
# login → returns a JWT
curl -X POST http://localhost:8080/api/user/login \
     -H "Content-Type: application/json" \
     -d '{"login":"<login>","password":"<password>"}'

# authenticated request
curl http://localhost:8080/api/projects/all \
     -H "Authorization: Bearer $TOKEN"
```

## Testing

```bash
cd backend && mvn test   # JUnit + AssertJ
```

---

Part of [tristanfaure.com](https://tristanfaure.com) — Tristan Faure, EPITA.
