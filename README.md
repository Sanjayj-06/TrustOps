# TrustPatch: Trust-Aware and Explainable Self-Healing Framework for Reliable Software Systems

<div align="center">

![TrustPatch Banner](https://img.shields.io/badge/TrustPatch-Research%20Prototype-14b8a6?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Containerised-2496ED?style=for-the-badge&logo=docker)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)

**A research prototype experimentally comparing Baseline APR (BAPR) with Trust-Aware APR (TAPR) across 10 quality dimensions.**

</div>

---

## Abstract

TrustPatch is a full-stack research prototype designed to demonstrate and evaluate the superiority of Trust-Aware Automated Program Repair (TAPR) against traditional Baseline APR (BAPR). While standard APR approaches select patches based purely on test pass rates, TrustPatch scores candidate fixes across 10 distinct trust and quality dimensions—including maintainability, semantic similarity, security, and regression risk. This multi-dimensional evaluation prevents the selection of overfitting or degraded fixes, ensuring repaired software is both functionally correct and fundamentally reliable.

**Live Demonstration:** [https://trustpatch.vercel.app/](https://trustpatch.vercel.app/)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Quick Start](#quick-start)
5. [Backend — Code Comments Reference](#backend--code-comments-reference)
6. [Frontend — Code Comments Reference](#frontend--code-comments-reference)
7. [API Endpoints](#api-endpoints)
8. [Trust Parameters](#trust-parameters)
9. [Database Schema](#database-schema)
10. [Docker Setup](#docker-setup)
11. [Sample Files](#sample-files)
12. [Presentation Guide](#presentation-guide)

---

## Overview

TrustPatch is a full-stack research prototype that demonstrates the superiority of Trust-Aware Automated Program Repair (TAPR) over traditional Baseline APR (BAPR).

### The Core Problem with BAPR

Traditional APR systems (BAPR) select a patch by running tests and picking the one with the highest pass rate. This ignores:
- Code complexity (maintainability risk)
- Security issues (static analysis)
- Behavioral changes (unexpected side effects)
- Historical patterns (learning from past repairs)
- LLM confidence (model certainty)
- Regression risk (breaking existing functionality)

### The TrustPatch Solution

TrustPatch evaluates **10 trust dimensions** per patch, normalizes them, applies expert-defined weights, and selects the patch with the highest **Trust Score** — a comprehensive measure of patch reliability.

```
Trust(Pᵢ) = Σ(wⱼ × fⱼ)   where Σwⱼ = 1.0
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustPatch System                        │
├───────────────────────┬─────────────────────────────────────┤
│   Frontend (React)    │        Backend (FastAPI/Docker)     │
│   localhost:5173      │        localhost:8000               │
│                       │                                     │
│  ┌─────────────────┐  │  ┌─────────────────────────────────┐ │
│  │ Upload Section  │──┼──▶│ POST /upload                   │ │
│  │ Pipeline View   │  │  │ POST /baseline/run              │ │
│  │ Results Cards   │  │  │ POST /trustpatch/evaluate       │ │
│  │ Ranking Table   │◀─┼──│ GET  /history                  │ │
│  │ Charts (6)      │  │  └─────────────────────────────────┘ │
│  │ Explainability  │  │                                     │
│  └─────────────────┘  │  ┌────────── Services ─────────────┐ │
│                       │  │ patch_generator.py              │ │
│                       │  │ testing_service.py              │ │
│                       │  │ trust_evaluator.py (10 params)  │ │
│                       │  │ explainability.py               │ │
│                       │  │ visualization.py                │ │
│                       │  └────────── SQLite ───────────────┘ │
└───────────────────────┴─────────────────────────────────────┘
```

---

## Folder Structure

```
TrustPatch/
├── backend/                          # FastAPI backend (Dockerised)
│   ├── app/
│   │   ├── main.py                   # App entry, CORS, router registration
│   │   ├── database.py               # SQLite engine + session factory
│   │   ├── models.py                 # SQLAlchemy ORM models
│   │   ├── schemas.py                # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── upload.py             # POST /upload
│   │   │   ├── baseline.py           # POST /baseline/run (BAPR)
│   │   │   ├── trustpatch.py         # POST /trustpatch/evaluate (TAPR)
│   │   │   └── history.py            # GET  /history
│   │   └── services/
│   │       ├── patch_generator.py    # 5 rule-based patch strategies
│   │       ├── testing_service.py    # Pytest subprocess runner
│   │       ├── trust_evaluator.py    # 10-parameter trust computation
│   │       ├── explainability.py     # Human-readable explanation gen
│   │       └── visualization.py     # Chart-ready dataset builder
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/                         # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx                   # Main app, phase orchestration
│   │   ├── main.tsx                  # React DOM entry point
│   │   ├── index.css                 # Design system (glassmorphism)
│   │   ├── api/
│   │   │   └── trustpatch.ts         # Axios API client
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   └── components/
│   │       ├── UploadSection.tsx     # Drag-and-drop upload
│   │       ├── PipelineVisualizer.tsx# Animated BAPR vs TAPR flow
│   │       ├── StepProgress.tsx      # Live step tracker
│   │       ├── BaselineResults.tsx   # BAPR result card (indigo)
│   │       ├── TrustPatchResults.tsx # TAPR result card (teal)
│   │       ├── PatchRankingTable.tsx # 10-param sortable table
│   │       ├── ComparisonDashboard.tsx # 6 Recharts charts
│   │       └── ExplainabilityCard.tsx  # Why was patch selected?
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── samples/
    ├── buggy_calculator.py           # Sample buggy file (4 bugs)
    └── test_calculator.py            # Sample test file (12 tests)
```

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Node.js 18+](https://nodejs.org/) installed

### Step 1: Start the Backend (Docker)

```bash
cd TrustPatch/backend
docker-compose up --build
```

The backend will be available at `http://localhost:8000`.
API docs: `http://localhost:8000/docs`

### Step 2: Start the Frontend

```bash
cd TrustPatch/frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Step 3: Run the Demo

1. Open `http://localhost:5173`
2. Toggle "Use Sample Demo Files" to ON
3. Click "Run TrustPatch Analysis"
4. Watch the step-by-step pipeline animate
5. Scroll through results sections

---

## Backend — Code Comments Reference

> All backend files contain detailed docstrings. Below is a concise reference.

### `app/main.py`
```
Purpose   : FastAPI app entry point
Key items :
  - Creates all DB tables via Base.metadata.create_all()
  - Configures CORS for React frontend (localhost:5173)
  - Registers 4 routers: upload, baseline, trustpatch, history
  - GET /health : health check for Docker monitoring
  - GET /       : root with link to /docs
```

### `app/database.py`
```
Purpose   : SQLite database engine setup
Key items :
  - DATABASE_URL from env var (default: ./trustpatch.db)
  - Docker uses: sqlite:////app/data/trustpatch.db (volume mount)
  - SessionLocal: per-request session factory
  - get_db(): FastAPI dependency injector
  - check_same_thread=False required for SQLite + FastAPI
```

### `app/models.py`
```
Purpose   : SQLAlchemy ORM table definitions
Tables    :
  BugUpload       : session_id, filename, content, test_content, timestamp
  GeneratedPatch  : session_id, patch_id, patch_code, trust_score, selected
  PatchMetric     : patch_id, T, S, C, H, A, B, R, X, L, M (all Float)
```

### `app/schemas.py`
```
Purpose   : Pydantic request/response validation models
Key models:
  UploadResponse    : session_id, filename, message
  TrustMetrics      : T, S, C, H, A, B, R, X, L, M (all float in [0,1])
  PatchInfo         : patch_id, trust_score, rank, metrics, explanation
  BaselineResult    : selected_patch, passed_tests, execution_time
  TrustPatchResult  : selected_patch, trust_score, risk, recommendation
  EvaluationResponse: Combined BAPR + TAPR + charts
```

### `app/routers/upload.py`
```
Endpoint: POST /upload
Input   : multipart/form-data with buggy_file (.py) + test_file (.py)
Process : Validates .py extension → Reads content → Generates UUID session_id
          → Stores in BugUploads table
Output  : { session_id, filename, test_filename, message }
```

### `app/routers/baseline.py`
```
Endpoint: POST /baseline/run
Input   : { "session_id": "<uuid>" }
Process : BAPR Pipeline:
          1. Retrieve files from DB
          2. Generate 5 patches (patch_generator)
          3. Run tests on each (testing_service)
          4. Select max(pass_rate) patch
          Timing: time.perf_counter() for execution_time
Output  : BaselineResult schema
```

### `app/routers/trustpatch.py`
```
Endpoint: POST /trustpatch/evaluate
Input   : { "session_id": "<uuid>" }
Process : TAPR Pipeline (11 steps):
          1.  Retrieve session
          2.  Generate 5 patches
          3.  Run unit tests (T parameter)
          4.  Compute all 10 trust parameters per patch
          5.  Normalize features (min-max to [0,1])
          6.  Apply weighted trust formula
          7.  Rank patches by trust score
          8.  Generate explanation (explainability service)
          9.  Persist to DB (GeneratedPatch + PatchMetric)
          10. Build chart datasets (visualization service)
          11. Return comprehensive response
Output  : Full evaluation JSON (patches, baseline, trustpatch, charts, explanation)
```

### `app/routers/history.py`
```
Endpoints:
  GET /history              : List recent sessions (newest first)
  GET /history/{session_id} : Full session detail from DB
```

### `app/services/patch_generator.py`
```
Purpose  : Generate 5 deterministic candidate patches
Strategies:
  P1: Off-by-one fix   — adjusts range() and index comparisons
  P2: Null guard       — injects None-checks before attribute access
  P3: Type coercion    — adds int()/float() casts for type safety
  P4: Boundary fix     — adjusts < to <= in loop/guard conditions
  P5: Logic inversion  — corrects 'and' vs 'or', double negation
Output   : List of { patch_id, strategy, patch_code }
```

### `app/services/testing_service.py`
```
Purpose   : Run pytest against each patch in subprocess isolation
Process   :
  1. Write patch code to temp file (module_under_test.py)
  2. Rewrite test imports to use temp module
  3. Run: python -m pytest <test_file> -v --timeout=10
  4. Parse stdout for "X passed, Y failed"
  5. Measure time: end = time.perf_counter() - start
Output    : { passed, failed, total, pass_rate, duration, output }
```

### `app/services/trust_evaluator.py`
```
Purpose  : Compute all 10 trust parameters + final weighted trust score

T (0.20) : test_result["pass_rate"]
S (0.10) : Jaccard keyword similarity vs KNOWN_FIX_KEYWORDS list
           (production: sentence-transformers cosine similarity)
C (0.10) : 1 - (cyclomatic_complexity / 20)
           CC = count of if/for/while/and/or/except keywords + 1
H (0.10) : HISTORICAL_DB lookup by strategy pattern
           { "off-by-one": (42,50), "null guard": (38,45), ... }
A (0.10) : pylint subprocess score normalized from [-10,10] to [0,1]
           Fallback: penalize exec/eval/import*/bare-except patterns
B (0.10) : exec() patch code with 10 sample inputs, compare output types
           B = matching_outputs / 10
R (0.10) : 1 - (test_result["failed"] / total_regression_tests)
X (0.05) : Keyword match in filename: auth=1.0, payments=0.9, utils=0.4
L (0.10) : Simulated LLM confidence based on pass_rate + keywords + hash
           (production: call OpenAI/Gemini API for confidence score)
M (0.05) : difflib.SequenceMatcher average similarity across all other patches

Normalization: (value - min) / (max - min) across all 5 patches
Trust Formula: Trust(Pᵢ) = 0.20T + 0.10S + 0.10C + 0.10H + 0.10A + 0.10B + 0.10R + 0.05X + 0.10L + 0.05M
```

### `app/services/explainability.py`
```
Purpose  : Generate human-readable explanations for patch selection
Outputs  :
  summary         : One-line explanation sentence
  bullets         : Top 6 contributing factors with scores
  top_factors     : Top 3 parameter names
  comparison      : BAPR vs TAPR decision comparison text
  risk_level      : Low (≥0.70) / Medium (0.45-0.70) / High (<0.45)
  recommendation  : Accept / Review / Reject
  parameter_impact: param → weighted contribution value
```

### `app/services/visualization.py`
```
Purpose  : Build Recharts-compatible chart datasets
Charts   :
  test_success_comparison  : [{approach, passRate, passed, total, color}]
  trust_score_distribution : [{patchId, trustScore, rank, selected, color}]
  complexity_comparison    : [{patchId, value, label, selected}]
  safety_comparison        : [{patchId, value, label, selected}]
  execution_time_comparison: [{approach, time, color, label}]
  weight_distribution      : [{parameter, shortName, weight, value}]
  radar_data               : [{parameter, P1, P2, P3, P4, P5}]
  all_metrics_comparison   : [{patchId, trustScore, T, S, ..., M}]
```

---

## Frontend — Code Comments Reference

### `src/main.tsx`
```
Purpose  : React DOM root creation
Renders  : <App /> inside StrictMode
```

### `src/index.css`
```
Purpose  : Global design system
Theme    : Dark glassmorphism — slate-950 background, teal+indigo accents
Classes  :
  .glass-card       : Blurred glass card with border
  .trust-card       : Teal-accented card (TAPR)
  .baseline-card    : Indigo-accented card (BAPR)
  .btn-trust        : Glowing teal action button
  .score-badge-*    : Risk level badges (low/medium/high)
  .code-block       : Monospace code viewer
  .step-indicator-* : Pipeline step status (pending/running/done/error)
  .gradient-text-*  : Gradient text (trust=teal, baseline=indigo)
```

### `src/types/index.ts`
```
Purpose  : TypeScript interface definitions matching backend Pydantic schemas
Key types:
  TrustMetrics       : { T, S, C, H, A, B, R, X, L, M: number }
  PatchInfo          : patch with all metrics and trust score
  BaselineResult     : BAPR pipeline output
  TrustPatchResult   : TAPR pipeline output
  EvaluationResponse : Full combined evaluation
  PipelineStep       : { id, label, status: pending|running|done|error }
  AppPhase           : 'upload' | 'processing' | 'results'
  ChartData          : All 8 chart datasets
```

### `src/api/trustpatch.ts`
```
Purpose   : Axios API client
Functions :
  uploadFiles(buggyFile, testFile)     → UploadResponse (POST /upload)
  evaluateTrustPatch(sessionId)        → EvaluationResponse (POST /trustpatch/evaluate)
  fetchHistory(limit)                  → history list (GET /history)
  checkHealth()                        → boolean (GET /health)
Timeout   : 120s (evaluation can take time with pylint + pytest)
```

### `src/App.tsx`
```
Purpose  : Main application orchestrator
Phases   :
  upload     → UploadSection visible
  processing → PipelineVisualizer + StepProgress animate
  results    → All result sections scroll into view
Key logic:
  handleUpload()   : Uploads files → animates steps → calls evaluateTrustPatch()
  animateStep()    : Marks step 'running' then 'done' with STEP_DELAY timing
  scroll spy       : IntersectionObserver tracks active nav section
Nav tabs :
  Upload | Pipeline | Results | Ranking | Charts | Explain
State    : AppState { phase, sessionId, evaluation, error }
```

### `src/components/UploadSection.tsx`
```
Purpose   : Drag-and-drop file upload interface
Features  :
  - react-dropzone for drag & drop
  - Toggle: "Use Sample Demo Files"
  - Pre-built sample code previewed inline
  - File validation (.py extension only)
  - Progress indicator during upload
Demo mode : Creates File objects from inline JS strings — no file system needed
```

### `src/components/PipelineVisualizer.tsx`
```
Purpose   : Animated side-by-side pipeline flow diagram
Pipelines :
  BAPR (5 steps)  : Buggy → Patches → Tests → Max Pass Rate → Result
  TAPR (10 steps) : Buggy → P1-P5 → Features → Params → Normalize → Trust → Rank → Select → Explain → Result
Animation : Active step pulses + glows; completed steps stay lit; arrows animate
Colors    : BAPR=indigo, TAPR=teal (consistent with whole UI)
```

### `src/components/StepProgress.tsx`
```
Purpose   : Live step-by-step status tracker
Statuses  : pending (grey) | running (spinning loader) | done (green check) | error (red X)
Features  :
  - Progress bar (doneCount / total)
  - Duration display for completed steps
  - Animated bounce dots for running state
Exported  : TRUSTPATCH_STEPS — pre-defined step config array
```

### `src/components/BaselineResults.tsx`
```
Purpose   : BAPR result display card (indigo theme)
Shows     :
  - Selected patch (gradient indigo text)
  - Test pass rate (animated bar)
  - Execution time
  - Selection criterion explanation
  - Limitation callout (6 things BAPR ignores)
  - Collapsible code viewer
```

### `src/components/TrustPatchResults.tsx`
```
Purpose   : TAPR result display card (teal theme)
Shows     :
  - SVG trust gauge (0-100% animated arc + needle)
  - Risk badge + recommendation badge
  - Selected patch with gradient text
  - Top 3 contributing parameters (gold/silver/bronze)
  - Trust formula display
  - 6 advantages over BAPR
  - Collapsible code viewer
```

### `src/components/PatchRankingTable.tsx`
```
Purpose   : Full 10-parameter patch ranking table
Features  :
  - Sortable by any column (click header)
  - Color-coded cells: emerald (high) / amber (mid) / red (low)
  - TAPR-selected row: teal highlight + border
  - BAPR-selected row: indigo highlight + border
  - Rank emoji (🥇🥈🥉)
  - Weight shown in column header
```

### `src/components/ComparisonDashboard.tsx`
```
Purpose   : 6 Recharts charts comparing BAPR vs TAPR
Charts    :
  1. Bar  : Test success comparison (pass rate)
  2. Bar  : Trust score distribution (all 5 patches)
  3. Bar  : Complexity comparison
  4. Bar  : Safety/static analysis comparison
  5. Bar  : Execution time (BAPR fast but shallow, TAPR slower but better)
  6. Pie  : Trust parameter weight distribution
Tabs      : "Overview" (6 charts) | "Detailed" (radar + grouped bar)
Radar     : All 10 params for all 5 patches overlaid
```

### `src/components/ExplainabilityCard.tsx`
```
Purpose   : Human-readable explanation of TrustPatch's decision
Shows     :
  - Summary banner (teal highlight)
  - ✓ bullet list (top 6 factors with scores)
  - Parameter contribution bars (animated fill)
  - BAPR vs TrustPatch comparison text
  - API response JSON preview (POST /trustpatch/evaluate)
API preview format:
  {
    "trust_score": 0.91,
    "risk": "Low",
    "recommendation": "Accept",
    "explanation": "Patch P3 selected with trust score 0.91...",
    "top_factors": ["T", "H", "R"]
  }
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload buggy + test files → returns `session_id` |
| `POST` | `/baseline/run` | Run BAPR pipeline for session |
| `POST` | `/trustpatch/evaluate` | Run full TAPR pipeline (both pipelines) |
| `GET`  | `/history` | List past evaluation sessions |
| `GET`  | `/history/{session_id}` | Get full session details |
| `GET`  | `/health` | Backend health check |
| `GET`  | `/docs` | Swagger UI |

---

## Trust Parameters

| Param | Name | Weight | Formula | Tool |
|-------|------|--------|---------|------|
| T | Test Pass Rate | 20% | passed/total | pytest |
| S | Semantic Similarity | 10% | CosineSim(patch, knownFix) | sentence-transformers |
| C | Complexity (inv.) | 10% | 1 - CC/max_CC | radon |
| H | Historical Success | 10% | success/total repairs | internal DB |
| A | Static Analysis | 10% | pylint_score/10 | pylint |
| B | Behavioral Consistency | 10% | matching_outputs/inputs | exec() |
| R | Regression Risk | 10% | 1 - failures/total | pytest |
| X | Contextual Importance | 5% | module_weight | keyword match |
| L | LLM Confidence | 10% | model_certainty ∈ [0,1] | LLM API |
| M | Multi-Patch Agreement | 5% | avg_similarity | difflib |

**Trust Formula:**
```
Trust(Pᵢ) = 0.20T + 0.10S + 0.10C + 0.10H + 0.10A + 0.10B + 0.10R + 0.05X + 0.10L + 0.05M
```

---

## Database Schema

```sql
-- Session tracking
CREATE TABLE bug_uploads (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT UNIQUE NOT NULL,
    filename     TEXT,
    test_filename TEXT,
    content      TEXT,           -- Full source of buggy file
    test_content TEXT,           -- Full source of test file
    timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Generated candidate patches
CREATE TABLE generated_patches (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id        TEXT NOT NULL,
    patch_id          TEXT NOT NULL,        -- 'P1' through 'P5'
    patch_code        TEXT,                 -- Modified Python source
    trust_score       REAL DEFAULT 0.0,     -- TAPR score [0,1]
    baseline_score    REAL DEFAULT 0.0,     -- BAPR score (pass rate)
    selected          BOOLEAN DEFAULT 0,    -- TAPR selected
    baseline_selected BOOLEAN DEFAULT 0     -- BAPR selected
);

-- 10 trust parameter values per patch
CREATE TABLE patch_metrics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    patch_db_id INTEGER NOT NULL,
    session_id  TEXT NOT NULL,
    patch_id    TEXT NOT NULL,
    T REAL, S REAL, C REAL, H REAL, A REAL,   -- Parameters 1-5
    B REAL, R REAL, X REAL, L REAL, M REAL    -- Parameters 6-10
);
```

---

## Docker Setup

### Build and Run

```bash
cd TrustPatch/backend
docker-compose up --build
```

### Useful Docker Commands

```bash
# Start in background (detached mode)
docker-compose up -d

# Follow container logs
docker-compose logs -f

# Check container health
docker-compose ps

# Stop containers
docker-compose down

# Stop and remove data volume (wipes SQLite DB)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build --force-recreate
```

### Docker Architecture

```
Dockerfile:
  Base: python:3.11-slim
  Installs: gcc, libgomp1, curl
  Installs Python deps from requirements.txt
  EXPOSE 8000
  CMD: uvicorn app.main:app --host 0.0.0.0 --port 8000

docker-compose.yml:
  Service: trustpatch-backend
  Port: host:8000 → container:8000
  Volume: ./data → /app/data (SQLite persistence)
  Env: DATABASE_URL=sqlite:////app/data/trustpatch.db
  Restart: unless-stopped
  Healthcheck: curl /health every 30s
```

---

## Sample Files

Located in `samples/` directory:

### `buggy_calculator.py`
Contains 4 deliberate bugs:
1. `calculate_average`: Off-by-one (range(n-1) should be range(n))
2. `find_max`: Wrong None check (== None should be is None)
3. `is_valid_age`: Logic inversion (and should be or)
4. `get_element`: Boundary condition (< len-1 should be < len)

### `test_calculator.py`
12 pytest tests covering all functions with boundary cases.

---

## Presentation Guide

### Recommended Demo Flow

1. **Open the dashboard** — Show the hero banner and architecture
2. **Enable Sample Mode** — Toggle "Use Sample Demo Files"
3. **Click "Run TrustPatch Analysis"** — Watch both pipelines animate simultaneously
4. **Pipeline Section** — Explain what each step means (pause on "Compute 10 Params")
5. **Results Cards** — Compare BAPR (indigo) vs TrustPatch (teal) side by side
   - Point out BAPR's limitation callout (6 ignored dimensions)
   - Show TrustPatch's trust gauge and top factors
6. **Ranking Table** — Sort by different parameters to show how rankings change
7. **Comparison Charts** — Walk through all 6 charts
   - Execution Time chart: justify the extra time with richer analysis
   - Radar chart: show multi-dimensional advantage
8. **Explainability Card** — Read the bullet points aloud
   - Show the API response JSON (click "API Response Preview")
9. **Key Takeaway**: TrustPatch doesn't just fix bugs — it selects fixes you can **trust**

### Key Messages

- BAPR: One dimension (tests). TrustPatch: 10 dimensions (comprehensive)
- TrustPatch selects patches that are correct **AND** safe, simple, consistent, and reliable
- The explainability engine makes the decision transparent and auditable
- Future work: Adaptive weight learning to replace expert-defined weights

---

*Built as a research prototype for the TrustPatch project — Trust-Aware and Explainable Self-Healing Framework for Reliable Software Systems*
