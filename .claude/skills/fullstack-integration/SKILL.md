---
name: fullstack-integration
description: Connect frontend (React/TypeScript) with backend (Flask/Quart) APIs. Use when building API service layers, TypeScript types from Python DTOs, handling authentication flows, WebSocket integration, or deploying fullstack applications. Covers API contracts, error handling, real-time updates, and production deployment.
---

# Fullstack Integration

Connect frontend and backend into a cohesive application.

## When to Use This Skill

| Task | Example |
|------|---------|
| **API service layer** | Create TypeScript API client from Flask endpoints |
| **Type synchronization** | Generate TS types from Python Pydantic models |
| **Auth integration** | JWT flow between React and Flask |
| **Real-time features** | WebSocket/SSE between frontend and backend |
| **Deployment** | Docker Compose for fullstack production |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Components                                           │ │
│  │  └── Hooks (useAuth, useCart, useOrders)                   │ │
│  │      └── API Service Layer (src/services/api/)             │ │
│  │          └── Axios Instance (interceptors, auth headers)   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Controllers (Blueprints)                                   │ │
│  │  └── Services (Business Logic)                             │ │
│  │      └── Repositories (Data Access)                        │ │
│  │          └── Database (PostgreSQL)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## API Service Layer

### Backend: Define Consistent Response Format

```python
# app/common/response.py
from typing import TypeVar, Generic, Optional
from pydantic import BaseModel

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    message: Optional[str] = None

def success_response(data, message=None, status=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status

def error_response(error, message, status=400):
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status
```

### Frontend: TypeScript API Client

```typescript
// src/services/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Try refresh token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return client.request(error.config!);
      }
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### Frontend: Domain-Specific API Modules

```typescript
// src/services/api/auth.ts
import client from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await client.post('/auth/login', data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  me: async (): Promise<User> => {
    const response = await client.get('/auth/me');
    return response.data.data;
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await client.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data.data;
  },
};
```

## Type Synchronization (v1.8 Enhanced)

> **Philosophy**: Pydantic is source of truth. TypeScript mirrors it.

### INT-01 Session: Type Generation

This is the first integration session, executed after backend APIs are complete:

```xml
<session id="INT-01" project="{PROJECT}">
  <dependencies>
    <requires status="complete">BE-04</requires>
  </dependencies>
  <integration_gate enabled="true">
    <check name="health">curl -sf http://localhost:5000/health</check>
  </integration_gate>
  <tasks>
    <task>Generate TypeScript types from Pydantic DTOs</task>
    <task>Add Zod schemas for form validation</task>
    <task>Export from src/types/index.ts</task>
  </tasks>
</session>
```

### MIRRORS Header Pattern (v1.8 REQUIRED)

Every TypeScript type file MUST include a header comment:

```typescript
// src/types/item.ts
// MIRRORS: backend/app/modules/items/dtos.py
// RUN: python scripts/generate_types.py to regenerate

export interface Item {
  id: number;
  name: string;
  status: ItemStatus;
  // ...
}
```

**Why MIRRORS?**
- Makes source of truth explicit
- Enables automated drift detection
- Simplifies debugging when types mismatch

### Python DTO → TypeScript Interface

```python
# Backend: app/modules/order/dtos.py
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"

class OrderItemDTO(BaseModel):
    id: str
    menu_item_id: str
    name: str
    quantity: int
    unit_price: Decimal
    modifiers: List[str] = []

class OrderDTO(BaseModel):
    id: str
    order_number: str
    status: OrderStatus
    items: List[OrderItemDTO]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
```

```typescript
// Frontend: src/types/order.ts
// Generated from Python DTOs

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'completed';

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;  // Decimal → number
  modifiers: string[];
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;  // datetime → ISO string
}
```

### Type Mapping Rules

| Python Type | TypeScript Type |
|-------------|-----------------|
| `str` | `string` |
| `int` | `number` |
| `float` | `number` |
| `Decimal` | `number` |
| `bool` | `boolean` |
| `datetime` | `string` (ISO 8601) |
| `date` | `string` (YYYY-MM-DD) |
| `List[T]` | `T[]` |
| `Optional[T]` | `T \| null` or `T?` |
| `Dict[str, T]` | `Record<string, T>` |
| `Enum` | Union of string literals |
| `UUID` | `string` |

## Authentication Flow

### JWT Token Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. LOGIN                                                        │
│  Frontend: POST /auth/login { email, password }                  │
│  Backend:  Validate → Generate tokens → Return                   │
│  Frontend: Store tokens in localStorage                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. AUTHENTICATED REQUESTS                                       │
│  Frontend: Add Authorization: Bearer {access_token}              │
│  Backend:  Validate token → Process request                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. TOKEN REFRESH (when access_token expires)                    │
│  Frontend: POST /auth/refresh { refresh_token }                  │
│  Backend:  Validate refresh → Issue new access token             │
│  Frontend: Update stored access_token                            │
└─────────────────────────────────────────────────────────────────┘
```

### React Auth Context

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '@/services/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const user = await authApi.me();
          setUser(user);
        } catch {
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token, refresh_token, user } = await authApi.login({ email, password });
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## Real-Time Updates

### WebSocket Integration

```python
# Backend: app/modules/websocket/events.py
from quart import websocket
import json

connected_clients = {}  # order_id -> set of websocket connections

@app.websocket('/ws/orders/<order_id>')
async def order_updates(order_id):
    if order_id not in connected_clients:
        connected_clients[order_id] = set()
    
    connected_clients[order_id].add(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive()
    finally:
        connected_clients[order_id].discard(websocket)

async def broadcast_order_update(order_id: str, data: dict):
    """Called when order status changes."""
    if order_id in connected_clients:
        message = json.dumps({"type": "ORDER_UPDATE", "data": data})
        for ws in connected_clients[order_id]:
            await ws.send(message)
```

```typescript
// Frontend: src/hooks/useOrderUpdates.ts
import { useEffect, useState, useCallback } from 'react';
import { Order } from '@/types/order';

export function useOrderUpdates(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/orders/${orderId}`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'ORDER_UPDATE') {
        setOrder(message.data);
      }
    };

    return () => ws.close();
  }, [orderId]);

  return { order, isConnected };
}
```

## Error Handling

### Backend: Structured Errors

```python
# app/common/exceptions.py
class AppException(Exception):
    status_code = 400
    error_code = "APP_ERROR"
    
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)

class ValidationError(AppException):
    status_code = 400
    error_code = "VALIDATION_ERROR"

class NotFoundError(AppException):
    status_code = 404
    error_code = "NOT_FOUND"

class UnauthorizedError(AppException):
    status_code = 401
    error_code = "UNAUTHORIZED"

# Error handler
@app.errorhandler(AppException)
def handle_app_exception(e):
    return jsonify({
        "success": False,
        "error": e.error_code,
        "message": e.message,
        "details": e.details
    }), e.status_code
```

### Frontend: Error Handling

```typescript
// src/services/api/errors.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// In API client
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string; message: string; details?: unknown }>) => {
    if (error.response) {
      const { error: code, message, details } = error.response.data;
      throw new APIError(code, message, error.response.status, details);
    }
    throw new APIError('NETWORK_ERROR', 'Network error', 0);
  }
);
```

## Production Deployment

### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/var/www/html
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

### Nginx Configuration

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend (React SPA)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://api:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://api:5000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## References

- [API Contracts](references/api-contracts.md) - Defining frontend-backend contracts
- [Deployment Guide](references/deployment.md) - Production deployment patterns
- [TypeScript Types Template](assets/types-template.ts) - Starting point for type definitions
