# HFS Skill Format v1.7 - XML Structure

> **Version**: 1.7  
> **Date**: January 7, 2026  
> **Purpose**: Standard format for all HFS skills with XML constraint integration

---

## Why XML Skills?

Skills now define their own constraints and forbidden patterns in XML, which are merged with session-level constraints during execution.

| Benefit | Description |
|---------|-------------|
| Inherited constraints | Skill constraints apply to all sessions using that skill |
| Clear boundaries | Skills define what they DO and DON'T do |
| Composable | Multiple skills merge their constraints |
| Self-documenting | XML structure is readable and parseable |

---

## Skill File Structure

```
skills/
└── {skill-name}/
    ├── SKILL.md           # Main skill document (XML format)
    ├── examples/          # Usage examples (optional)
    │   ├── example-1.md
    │   └── example-2.md
    └── templates/         # Code templates (optional)
        └── {template}.py
```

---

## SKILL.md Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<skill name="{skill-name}" version="1.0">
  
  <metadata>
    <author>High Functioning Solutions Ltd.</author>
    <created>2026-01-07</created>
    <updated>2026-01-07</updated>
    <category>{category}</category>  <!-- backend | frontend | planning | testing | research -->
  </metadata>

  <description>
    <summary>{One-line description}</summary>
    <details>
      {Detailed description of what this skill does and when to use it}
    </details>
  </description>

  <triggers>
    <!-- When should this skill be activated? -->
    <trigger>When user asks to {action}</trigger>
    <trigger>When session requires {capability}</trigger>
    <trigger>When working with {technology/pattern}</trigger>
  </triggers>

  <constraints>
    <!-- These constraints are INHERITED by any session using this skill -->
    <constraint priority="critical">{Must follow}</constraint>
    <constraint priority="high">{Should follow}</constraint>
    <constraint priority="medium">{Nice to follow}</constraint>
  </constraints>

  <forbidden>
    <!-- These patterns are NEVER allowed when this skill is active -->
    <pattern reason="{why}">{pattern}</pattern>
  </forbidden>

  <requires>
    <!-- Other skills that should be loaded alongside this one -->
    <skill optional="false">{required-skill}</skill>
    <skill optional="true">{optional-skill}</skill>
  </requires>

  <provides>
    <!-- What capabilities does this skill give? -->
    <capability>{capability-1}</capability>
    <capability>{capability-2}</capability>
  </provides>

  <workflow>
    <!-- Step-by-step process this skill follows -->
    <step order="1">
      <name>{Step name}</name>
      <description>{What to do}</description>
      <output>{What this step produces}</output>
    </step>
    <step order="2">
      <name>{Step name}</name>
      <description>{What to do}</description>
    </step>
  </workflow>

  <templates>
    <!-- Code templates this skill provides -->
    <template name="{name}" language="{python|typescript|bash}">
      <description>{When to use this template}</description>
      <code><![CDATA[
{template code here}
      ]]></code>
    </template>
  </templates>

  <verification>
    <!-- How to verify skill was applied correctly -->
    <check name="{name}">{What to verify}</check>
  </verification>

  <examples>
    <!-- Usage examples -->
    <example name="{name}">
      <input><![CDATA[
{Example input/request}
      ]]></input>
      <output><![CDATA[
{Example output}
      ]]></output>
    </example>
  </examples>

</skill>
```

---

## Example: python-backend-scaffold Skill

```xml
<?xml version="1.0" encoding="UTF-8"?>
<skill name="python-backend-scaffold" version="1.7">
  
  <metadata>
    <author>High Functioning Solutions Ltd.</author>
    <created>2025-12-01</created>
    <updated>2026-01-07</updated>
    <category>backend</category>
  </metadata>

  <description>
    <summary>Generate three-layer Flask/Quart backend architecture</summary>
    <details>
      Creates Controller → Service → Repository pattern with proper async handling,
      SQLAlchemy models, DTOs, and test structure. Follows HFS conventions for
      module organization and error handling.
    </details>
  </description>

  <triggers>
    <trigger>When creating new backend module</trigger>
    <trigger>When scaffolding API endpoints</trigger>
    <trigger>When session metadata includes this skill</trigger>
    <trigger>When user says "create backend for {feature}"</trigger>
  </triggers>

  <constraints>
    <constraint priority="critical">Use three-layer architecture: Controller → Service → Repository</constraint>
    <constraint priority="critical">All database access goes through Repository layer only</constraint>
    <constraint priority="critical">Controllers only handle HTTP concerns</constraint>
    <constraint priority="critical">Services contain all business logic</constraint>
    <constraint priority="high">Use async/await for all Quart endpoints</constraint>
    <constraint priority="high">Use selectinload() for one-to-many relationships</constraint>
    <constraint priority="high">Use joinedload() for many-to-one relationships</constraint>
    <constraint priority="high">Convert to DTOs before returning from service</constraint>
    <constraint priority="medium">Add docstrings to all public methods</constraint>
    <constraint priority="medium">Use type hints throughout</constraint>
  </constraints>

  <forbidden>
    <pattern reason="wrong layer">Database queries in controller</pattern>
    <pattern reason="wrong layer">HTTP response codes in service</pattern>
    <pattern reason="wrong layer">Business logic in repository</pattern>
    <pattern reason="async issue">Accessing lazy relationships outside session</pattern>
    <pattern reason="NIB lesson">Nested app/app/ directories</pattern>
    <pattern reason="hides errors">except: pass</pattern>
    <pattern reason="hides errors">catch { return [] }</pattern>
    <pattern reason="breaks async">Using sync SQLAlchemy in async code</pattern>
  </forbidden>

  <requires>
    <skill optional="true">backend-e2e-testing</skill>
  </requires>

  <provides>
    <capability>Three-layer module structure</capability>
    <capability>Async SQLAlchemy patterns</capability>
    <capability>DTO transformation</capability>
    <capability>Standard error handling</capability>
  </provides>

  <workflow>
    <step order="1">
      <name>Create module directory</name>
      <description>Create src/modules/{name}/ with __init__.py</description>
      <output>Module directory structure</output>
    </step>
    <step order="2">
      <name>Define models</name>
      <description>Create SQLAlchemy models with relationships</description>
      <output>models.py with Entity classes</output>
    </step>
    <step order="3">
      <name>Create DTOs</name>
      <description>Define Pydantic DTOs for input/output</description>
      <output>dtos.py with Create/Update/Response DTOs</output>
    </step>
    <step order="4">
      <name>Implement repository</name>
      <description>Create async repository with CRUD operations</description>
      <output>repository.py with EntityRepository class</output>
    </step>
    <step order="5">
      <name>Implement service</name>
      <description>Create service with business logic</description>
      <output>service.py with EntityService class</output>
    </step>
    <step order="6">
      <name>Implement controller</name>
      <description>Create Quart blueprint with endpoints</description>
      <output>controller.py with routes</output>
    </step>
    <step order="7">
      <name>Register module</name>
      <description>Add blueprint to app factory</description>
      <output>Updated app/__init__.py</output>
    </step>
  </workflow>

  <templates>
    <template name="repository" language="python">
      <description>Async repository with standard CRUD operations</description>
      <code><![CDATA[
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import {Entity}
from app.modules.{module}.dtos import {Entity}CreateDTO, {Entity}UpdateDTO


class {Entity}Repository:
    """Repository for {Entity} database operations."""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def get_by_id(self, id: int) -> {Entity} | None:
        """Get entity by ID with eager loading."""
        stmt = (
            select({Entity})
            .options(selectinload({Entity}.related_items))
            .where({Entity}.id == id)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all(self, limit: int = 100, offset: int = 0) -> list[{Entity}]:
        """Get all entities with pagination."""
        stmt = (
            select({Entity})
            .options(selectinload({Entity}.related_items))
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
    
    async def create(self, dto: {Entity}CreateDTO) -> {Entity}:
        """Create new entity."""
        entity = {Entity}(**dto.model_dump())
        self._session.add(entity)
        await self._session.flush()
        return entity
    
    async def update(self, entity: {Entity}, dto: {Entity}UpdateDTO) -> {Entity}:
        """Update existing entity."""
        for field, value in dto.model_dump(exclude_unset=True).items():
            setattr(entity, field, value)
        await self._session.flush()
        return entity
    
    async def delete(self, entity: {Entity}) -> None:
        """Delete entity."""
        await self._session.delete(entity)
        await self._session.flush()
      ]]></code>
    </template>

    <template name="service" language="python">
      <description>Service with business logic and DTO transformation</description>
      <code><![CDATA[
from app.database import get_session
from app.modules.{module}.repository import {Entity}Repository
from app.modules.{module}.dtos import (
    {Entity}CreateDTO,
    {Entity}UpdateDTO,
    {Entity}ResponseDTO,
)
from app.exceptions import NotFoundError


class {Entity}Service:
    """Service for {Entity} business logic."""
    
    async def get_by_id(self, id: int) -> {Entity}ResponseDTO:
        """Get entity by ID."""
        async with get_session() as session:
            repo = {Entity}Repository(session)
            entity = await repo.get_by_id(id)
            if not entity:
                raise NotFoundError(f"{Entity} {id} not found")
            return {Entity}ResponseDTO.model_validate(entity)
    
    async def get_all(self, limit: int = 100, offset: int = 0) -> list[{Entity}ResponseDTO]:
        """Get all entities."""
        async with get_session() as session:
            repo = {Entity}Repository(session)
            entities = await repo.get_all(limit=limit, offset=offset)
            return [{Entity}ResponseDTO.model_validate(e) for e in entities]
    
    async def create(self, dto: {Entity}CreateDTO) -> {Entity}ResponseDTO:
        """Create new entity."""
        async with get_session() as session:
            repo = {Entity}Repository(session)
            entity = await repo.create(dto)
            await session.commit()
            return {Entity}ResponseDTO.model_validate(entity)
    
    async def update(self, id: int, dto: {Entity}UpdateDTO) -> {Entity}ResponseDTO:
        """Update entity."""
        async with get_session() as session:
            repo = {Entity}Repository(session)
            entity = await repo.get_by_id(id)
            if not entity:
                raise NotFoundError(f"{Entity} {id} not found")
            entity = await repo.update(entity, dto)
            await session.commit()
            return {Entity}ResponseDTO.model_validate(entity)
    
    async def delete(self, id: int) -> None:
        """Delete entity."""
        async with get_session() as session:
            repo = {Entity}Repository(session)
            entity = await repo.get_by_id(id)
            if not entity:
                raise NotFoundError(f"{Entity} {id} not found")
            await repo.delete(entity)
            await session.commit()
      ]]></code>
    </template>
  </templates>

  <verification>
    <check name="structure">Module has controller.py, service.py, repository.py, dtos.py</check>
    <check name="no_db_in_controller">grep -r "select\|insert\|update" controller.py returns empty</check>
    <check name="no_http_in_service">grep -r "status_code\|Response" service.py returns empty</check>
    <check name="async_patterns">All def methods use async def</check>
    <check name="eager_loading">selectinload or joinedload used in queries</check>
  </verification>

</skill>
```

---

## Example: frontend-integration Skill

```xml
<?xml version="1.0" encoding="UTF-8"?>
<skill name="fullstack-integration" version="1.7">
  
  <metadata>
    <author>High Functioning Solutions Ltd.</author>
    <category>frontend</category>
  </metadata>

  <description>
    <summary>Connect React frontend to Flask/Quart backend APIs</summary>
  </description>

  <triggers>
    <trigger>When creating React hooks that call APIs</trigger>
    <trigger>When integrating frontend with backend</trigger>
    <trigger>When FE session has integration_gate enabled</trigger>
  </triggers>

  <constraints>
    <constraint priority="critical">Backend MUST be running during development</constraint>
    <constraint priority="critical">All hooks must handle isError state</constraint>
    <constraint priority="critical">Throw errors on API failure, never swallow</constraint>
    <constraint priority="high">Use TypeScript types matching backend DTOs</constraint>
    <constraint priority="high">Verify API calls in Network tab before completing</constraint>
  </constraints>

  <forbidden>
    <pattern reason="hides integration failure">catch { return [] }</pattern>
    <pattern reason="creates false positive">catch { return MOCK_DATA }</pattern>
    <pattern reason="never removed">// TODO: replace with real API</pattern>
    <pattern reason="hides null response">response?.data ?? []</pattern>
    <pattern reason="no error handling">Hooks without isError state</pattern>
  </forbidden>

  <requires>
    <skill optional="false">frontend-design</skill>
  </requires>

  <provides>
    <capability>API service layer</capability>
    <capability>React Query hooks</capability>
    <capability>Error state handling</capability>
    <capability>TypeScript API types</capability>
  </provides>

  <templates>
    <template name="api-hook" language="typescript">
      <description>React Query hook with proper error handling</description>
      <code><![CDATA[
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { {Entity}, {Entity}CreateInput } from '@/types/{entity}';

const QUERY_KEY = ['{entities}'];

export function use{Entities}() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<{Entity}[]> => {
      const response = await apiClient.get('/api/v1/{entities}');
      if (!response.ok) {
        throw new Error(`Failed to fetch {entities}: ${response.status}`);
      }
      const data = await response.json();
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format');
      }
      return data.items;
    },
  });
}

export function use{Entity}(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async (): Promise<{Entity}> => {
      const response = await apiClient.get(`/api/v1/{entities}/${id}`);
      if (!response.ok) {
        throw new Error(`{Entity} not found: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreate{Entity}() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {Entity}CreateInput): Promise<{Entity}> => {
      const response = await apiClient.post('/api/v1/{entities}', input);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create {entity}');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
      ]]></code>
    </template>

    <template name="component-with-error" language="typescript">
      <description>Component with proper error/loading states</description>
      <code><![CDATA[
import { use{Entities} } from '@/hooks/use-{entities}';
import { ErrorState } from '@/components/error-state';
import { LoadingSpinner } from '@/components/loading-spinner';
import { EmptyState } from '@/components/empty-state';

export function {Entity}List() {
  const { data, isLoading, isError, error, refetch } = use{Entities}();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (isError) {
    return (
      <ErrorState 
        message={error.message} 
        onRetry={refetch}
      />
    );
  }
  
  if (!data?.length) {
    return <EmptyState message="No {entities} found" />;
  }
  
  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
      ]]></code>
    </template>
  </templates>

  <verification>
    <check name="no_mock_fallbacks">grep -rn "return \[\]" src/hooks/ returns empty</check>
    <check name="error_states">All components handle isError</check>
    <check name="network_tab">API calls return 200 in DevTools</check>
    <check name="real_data">Displayed data matches database</check>
    <check name="error_renders">Stopping backend shows error state</check>
  </verification>

</skill>
```

---

## Skill Merging Rules

When multiple skills are loaded, their constraints and forbidden patterns merge:

1. **Constraints merge by priority** - Higher priority wins on conflict
2. **Forbidden patterns union** - All forbidden patterns apply
3. **Provides accumulate** - All capabilities available
4. **Verification combines** - All checks must pass

```xml
<!-- Session loads two skills -->
<skills>
  <skill>python-backend-scaffold</skill>
  <skill>backend-e2e-testing</skill>
</skills>

<!-- Effective constraints = union of both skills' constraints -->
<!-- Effective forbidden = union of both skills' forbidden patterns -->
```

---

## Integrating XML into Claude Projects

To use XML prompting in your Claude projects:

### 1. Add skill files to `.claude/skills/`
```
.claude/
└── skills/
    ├── python-backend-scaffold/
    │   └── SKILL.md
    └── fullstack-integration/
        └── SKILL.md
```

### 2. Reference in CLAUDE.md
```markdown
# Project: {NAME}

## Skills
Load skills from `.claude/skills/` using XML format.
Apply skill constraints to all sessions.

## Session Format
Use XML session format from HFS Workflow v1.7.
Parse <constraints> before executing <tasks>.
Check <forbidden> before writing any code.
```

### 3. Use XML prompts
```xml
<task>Create inmate validation</task>
<skills>
  <skill>python-backend-scaffold</skill>
</skills>
<constraints>
  <constraint priority="critical">Validate NIB format</constraint>
</constraints>
```

---

*HFS Skill Format v1.7 - XML Structure*  
*High Functioning Solutions Ltd.*
