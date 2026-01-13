---
name: python-backend-scaffold
description: Scaffold production-ready Python backends with three-layer architecture (controller/service/repository). Supports Flask (sync) and Quart (async) frameworks, PostgreSQL and Oracle databases, JWT authentication, Redis caching, and Celery task queues. Use when creating new backend projects, adding modules to existing projects, or needing guidance on architectural patterns for Python APIs.
---

# Python Backend Scaffold

Generate production-ready Python backend projects with a clean three-layer architecture.

## Architecture Overview

```
src/
├── {module}/
│   ├── __init__.py
│   ├── {module}_controller.py    # Routes, request/response handling
│   ├── {module}_service.py       # Business logic
│   └── {module}_repository.py    # Data access (optional, for complex queries)
├── models/
│   ├── base_model.py             # Audit fields, common mixins
│   └── {module}_model.py         # SQLAlchemy models
├── config.py                     # Environment-based configuration
├── database.py                   # DB session management
└── extensions.py                 # Flask/Quart extensions
```

## Workflow

1. **Determine framework:**
   - **Flask** → Sync I/O, simpler stack, traditional deployments
   - **Quart** → Async I/O, high concurrency, WebSocket support

2. **Determine database:**
   - **PostgreSQL** → Default choice, full SQLAlchemy support
   - **Oracle** → Government/enterprise, cx_Oracle driver

3. **Generate project:**
   - Run `scripts/init_project.py` with selected options
   - Or copy from `assets/flask-template/` or `assets/quart-template/`

4. **Add modules:**
   - Run `scripts/init_module.py {module_name}` to scaffold controller/service/model

## Framework Selection

| Requirement | Flask | Quart |
|-------------|-------|-------|
| Simple CRUD APIs | ✅ | ✅ |
| High concurrent connections | ❌ | ✅ |
| WebSocket support | Limited | ✅ |
| Existing sync libraries | ✅ | Needs async alternatives |
| Team familiarity | Higher | Lower |

**Flask patterns:** See [references/flask.md](references/flask.md)
**Quart patterns:** See [references/quart.md](references/quart.md)

## Database Selection

| Requirement | PostgreSQL | Oracle |
|-------------|------------|--------|
| Open source | ✅ | ❌ |
| JSON/JSONB support | ✅ | Limited |
| Government compliance | ✅ | ✅ |
| Existing Oracle infrastructure | ❌ | ✅ |
| Cross-schema relationships | Simple | Requires explicit schema prefixes |

**PostgreSQL patterns:** See [references/postgresql.md](references/postgresql.md)
**Oracle patterns:** See [references/oracle.md](references/oracle.md)

## Core Patterns

### Response Format

All endpoints return consistent JSON:

```python
# Success
{"success": True, "data": {...}}
{"success": True, "data": [...], "pagination": {"page": 1, "total": 100}}

# Error
{"success": False, "error": "message", "details": "optional context"}
```

### Configuration Pattern

```python
class Config:
    @staticmethod
    def _get_required_env(key: str) -> str:
        value = os.getenv(key)
        if not value:
            raise ValueError(f"Missing required environment variable: {key}")
        return value
    
    @staticmethod
    def _get_env_with_default(key: str, default: str) -> str:
        return os.getenv(key, default)
    
    DATABASE_URL = _get_required_env("DATABASE_URL")
    REDIS_URL = _get_env_with_default("REDIS_URL", "redis://localhost:6379/0")
```

### Base Model (Audit Fields)

```python
class BaseModel(db.Model):
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    inserted_by = db.Column(db.String(100))
    inserted_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_by = db.Column(db.String(100))
    updated_date = db.Column(db.DateTime, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
```

### Auto-Discovery Pattern

Controllers and models are auto-discovered by glob pattern:

```python
# In app factory
def register_blueprints(app):
    for path in Path("src").glob("*/*_controller.py"):
        module_name = path.stem
        module = importlib.import_module(f"src.{path.parent.name}.{module_name}")
        if hasattr(module, "bp"):
            app.register_blueprint(module.bp)
```

## Additional Features

**JWT Authentication:** See [references/auth.md](references/auth.md)
**Celery + Redis:** See [references/celery.md](references/celery.md)
**Three-Layer Patterns:** See [references/patterns.md](references/patterns.md)

## Quick Start

### New Project

```bash
# Flask + PostgreSQL (default)
python scripts/init_project.py my-api

# Quart + PostgreSQL
python scripts/init_project.py my-api --framework quart

# Flask + Oracle
python scripts/init_project.py my-api --database oracle

# With Celery
python scripts/init_project.py my-api --celery
```

### New Module

```bash
# Creates: src/booking/booking_controller.py, booking_service.py
#          src/models/booking_model.py
python scripts/init_module.py booking
```
