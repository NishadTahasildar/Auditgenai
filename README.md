# AuditGenAI

> **AI-Powered Society Financial Audit and Intelligence Platform**  
> *Final-Year B.Tech Computer Science Project*

---

## 1. Project Overview

**AuditGenAI** is an enterprise-grade financial management and automated audit intelligence platform designed for cooperative housing societies (CHS), apartment owners associations (AOA), and resident welfare associations (RWA).

The platform bridges society accounting, member billing, vendor expenditure, bank statement reconciliation, and forensic auditing by combining a modern web interface with future AI-driven anomaly detection and optical character recognition (OCR).

### Target Application Roles (RBAC Matrix)
- `SUPER_ADMIN`: System-wide administration, society onboarding, and platform governance.
- `SOCIETY_ADMIN`: Housing society executive committee management, bylaws configuration, building/flat rosters, member onboarding.
- `ACCOUNTANT`: Day-to-day bookkeeping, invoice uploads, voucher logging, and payment verification.
- `AUDITOR`: Independent financial audits, statutory reviews, sampling, and report issuance.
- `RESIDENT`: Maintenance view, bill payment history, dues tracking, and transparent society ledger access.

---

## 2. Technology Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) 16+ (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Shadcn UI styling principles
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting & Code Quality**: ESLint

### Backend
- **Language & Runtime**: Python 3.11+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous REST API)
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`
- **Database ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Database Driver**: Psycopg2
- **Database Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Security & Cryptography**: Passlib (Bcrypt) & PyJWT

### Infrastructure & Storage
- **Relational Database**: [PostgreSQL 16](https://www.postgresql.org/) (Containerized via Docker Compose)
- **Object Storage**: [MinIO](https://min.io/) (High-performance S3-compatible storage for invoices, receipts, and bank statements)
- **Orchestration**: Docker & Docker Compose

### Future AI Layer (Phase 3+)
- **LLM Orchestration**: LangGraph / OpenAI API
- **Machine Learning**: Scikit-learn, Pandas (Statistical outlier and anomaly detection)
- **Document Processing**: Tesseract / Vision OCR for automated invoice digitization

---

## 3. Project Architecture

### Monorepo Structure

```
AuditGenAI/
│
├── frontend/                     # Next.js App Router client application
│   ├── app/                      # Application routes, layouts, and pages
│   │   ├── login/                # Dedicated SaaS login screen
│   │   ├── page.tsx              # Phase 1 & 2 dashboard, society switcher & rosters
│   │   └── layout.tsx            # Global HTML & fonts layout
│   ├── lib/
│   │   └── api.ts                # Typed client API client for Auth, Societies, Flats
│   ├── package.json              # Node.js dependencies and scripts
│   └── tsconfig.json             # TypeScript compiler configuration
│
├── backend/                      # FastAPI asynchronous backend service
│   ├── app/
│   │   ├── api/                  # API routes (v1 endpoints & dependencies)
│   │   │   ├── deps.py           # JWT & Society-level RBAC dependencies
│   │   │   └── v1/               # Version 1 modular routers
│   │   │       ├── endpoints/    # Auth, Users, Societies, Buildings, Flats, Residents
│   │   │       └── api.py        # Centralized v1 router assembly
│   │   ├── core/                 # Configuration, security (bcrypt & JWT)
│   │   ├── db/                   # SQLAlchemy database engine, session, seeding
│   │   │   ├── init_db.py        # Auto-seeds standard roles & Super Admin on startup
│   │   │   └── session.py        # SQLAlchemy sessionmaker
│   │   ├── models/               # SQLAlchemy ORM declarative models (User, Society, Flat...)
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── main.py               # FastAPI application entrypoint & lifespan
│   ├── alembic/                  # Alembic database migrations
│   │   └── versions/             # Migration scripts (82e142128b17_create_initial_phase2_models.py)
│   ├── tests/                    # Automated pytest suite (Models, Auth, RBAC, Migrations)
│   ├── alembic.ini               # Alembic configuration
│   └── requirements.txt          # Python dependencies
│
├── docs/                         # Architecture, schemas, and API documentation
│   └── architecture.md           # High-level architecture specification & ER diagrams
│
├── storage/                      # Local volume mounts and document assets
│   └── .gitkeep
│
├── docker-compose.yml            # Docker orchestration for PostgreSQL & MinIO
├── .env.example                  # Environment variable reference template
├── .gitignore                    # Monorepo git ignore rules
└── README.md                     # Project documentation
```

---

## 4. Database Architecture & Models (Phase 2)

### Relational Entities
1. **`User`**: Account identity with unique `email`, salted bcrypt `password_hash`, `is_active` flag, timestamps.
2. **`Role`**: Pre-seeded system roles (`SUPER_ADMIN`, `SOCIETY_ADMIN`, `ACCOUNTANT`, `AUDITOR`, `RESIDENT`).
3. **`UserRole`**: Scoped user-to-role mappings (`user_id`, `role_id`, `society_id`).
4. **`Society`**: Multi-tenant housing society entity (`name`, `registration_number`, address, `is_active`).
5. **`SocietyMembership`**: Links users to societies with specific roles. Enforces uniqueness on `(user_id, society_id, role_id)`.
6. **`Building`**: Buildings within a society. Enforces compound uniqueness on `(society_id, name)`.
7. **`Flat`**: Individual flats within a building. Enforces compound uniqueness on `(building_id, flat_number)` (flat number is unique within its building, but can reoccur across different buildings).
8. **`Resident`**: Profile for residents (`full_name`, `phone_number`, `email`, optional `user_id` linkage).
9. **`FlatResident`**: Associates residents to flats with occupancy relationship (`OWNER`, `TENANT`, `FAMILY_MEMBER`).

---

## 5. Local Development Setup

### 5.1 Prerequisites
- **Git** (>= 2.40)
- **Docker** and **Docker Compose**
- **Node.js** (>= 18.18 or 20+) & **npm**
- **Python** (>= 3.11)

---

### 5.2 Configuration

---

### 5.3 Starting Infrastructure (PostgreSQL & MinIO)

```bash
docker compose up -d
```

Verify containers are running and healthy:

```bash
docker compose ps
```

---

### 5.4 Database Migrations & Backend (FastAPI)

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Activate virtual environment:
   ```bash
   # Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   source .venv/bin/activate
   ```

3. Apply database migrations to PostgreSQL:
   ```bash
   alembic upgrade head
   ```

4. Launch FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

Upon startup, the database initialization lifecycle automatically provisions:
- System roles (`SUPER_ADMIN`, `SOCIETY_ADMIN`, `ACCOUNTANT`, `AUDITOR`, `RESIDENT`).
- Initial Super Administrator account (`admin@auditgenai.com` / `Admin@AuditGen2026`).

---

### 5.5 Running Backend Automated Tests

Run the full pytest suite (24 unit, constraint, RBAC, isolation, and migration tests):

```bash
cd backend
pytest -v
```

---

### 5.6 Starting Frontend (Next.js)

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/login](http://localhost:3000/login) in your browser.

---

## 6. API Reference (Phase 2)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user; returns JWT token & sets HttpOnly cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Get current authenticated user profile & roles |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clear session cookie |
| `POST` | `/api/v1/auth/register` | Public (Dev) | Self-register basic resident account |
| `GET` | `/api/v1/users/me` | Authenticated | Alias to current user profile |
| `POST` | `/api/v1/societies` | `SUPER_ADMIN` | Provision a new housing society |
| `GET` | `/api/v1/societies` | Authenticated | List societies (Super Admin sees all, users see memberships) |
| `GET` | `/api/v1/societies/{id}` | Society Member / Super Admin | Fetch society details |
| `POST` | `/api/v1/societies/{id}/members` | `SUPER_ADMIN`, `SOCIETY_ADMIN` | Assign user to society with specific role |
| `GET` | `/api/v1/societies/{id}/members` | Society Member / Super Admin | List society members & roles |
| `POST` | `/api/v1/societies/{id}/buildings` | `SUPER_ADMIN`, `SOCIETY_ADMIN` | Create a building within a society |
| `GET` | `/api/v1/societies/{id}/buildings` | Society Member / Super Admin | List buildings within a society |
| `POST` | `/api/v1/buildings/{id}/flats` | `SUPER_ADMIN`, `SOCIETY_ADMIN` | Add a flat to a building (unique flat number constraint) |
| `GET` | `/api/v1/buildings/{id}/flats` | Society Member / Super Admin | List flats in a building |
| `POST` | `/api/v1/societies/{id}/residents` | `SUPER_ADMIN`, `SOCIETY_ADMIN` | Add a resident profile to society |
| `GET` | `/api/v1/societies/{id}/residents` | Society Member / Super Admin | List residents enrolled in society |
| `POST` | `/api/v1/flats/{id}/residents` | `SUPER_ADMIN`, `SOCIETY_ADMIN` | Associate resident with a flat (Owner / Tenant) |
| `GET` | `/api/v1/flats/{id}/residents` | Society Member / Super Admin | List residents associated with a flat |

---

## 7. Development Rules & Phase Boundaries

- **Strict Phased Rollout**:
  - **Phase 1 (Completed)**: Monorepo foundation, Docker Compose (PostgreSQL, MinIO), health checks.
  - **Phase 2 (Completed)**: Database architecture, SQLAlchemy models, Alembic migrations, multi-tenant RBAC, JWT auth, frontend session & rosters.
  - **Phase 3 (Upcoming)**: Maintenance billing engine, resident dues calculation, expense tracking.
  - **Future Phases**: Bank reconciliation, AI anomaly detection, OCR processing, LangGraph audit assistant.
- **Security**: Zero hardcoded credentials. Bcrypt password hashing. Strict cross-society authorization checks on the backend.
