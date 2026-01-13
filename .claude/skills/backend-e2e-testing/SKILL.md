---
name: backend-e2e-testing
description: Comprehensive backend E2E testing with pytest-asyncio. Use for API endpoint testing, complete user flow verification, database integration tests, edge case coverage, error handling validation, and performance testing. Covers fixtures, mocking external services, and test data management.
---

# Backend E2E Testing

Comprehensive API testing with pytest-asyncio for Flask/Quart backends.

## Overview

Backend E2E tests verify complete API flows from HTTP request to database and back, including edge cases and error handling.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── fixtures/
│   ├── __init__.py
│   ├── users.py             # User fixtures
│   ├── orders.py            # Order fixtures
│   └── test_data.py         # Constants
├── unit/                    # Fast, isolated tests
│   └── modules/
│       └── order/
│           └── test_service.py
├── integration/             # Database tests
│   └── test_order_repository.py
└── e2e/                     # Full API flows
    ├── test_guest_flow.py
    ├── test_admin_flow.py
    ├── test_payment_flow.py
    └── test_edge_cases.py
```

## Core Fixtures

### Database & App

```python
# tests/conftest.py
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def app():
    """Create test application."""
    from app import create_app
    
    test_app = await create_app()
    test_app.config["TESTING"] = True
    test_app.config["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"
    
    yield test_app

@pytest.fixture
async def client(app):
    """HTTP client for API requests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def db_session(app):
    """Database session with transaction rollback."""
    from app.database import SessionLocal
    
    async with SessionLocal() as session:
        yield session
        await session.rollback()
```

### Authentication

```python
# tests/conftest.py (continued)

@pytest.fixture
async def test_user(db_session):
    """Create test user."""
    from app.modules.auth.models import User
    
    user = User(
        email="test@example.com",
        password_hash=hash_password("Test123!"),
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture
async def auth_headers(client, test_user):
    """Get authenticated headers."""
    response = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "Test123!"
    })
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def admin_headers(client, admin_user):
    """Get admin authenticated headers."""
    response = await client.post("/api/auth/login", json={
        "email": "admin@example.com",
        "password": "Admin123!"
    })
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

### Domain Fixtures

```python
# tests/fixtures/orders.py

@pytest.fixture
async def test_venue(db_session):
    """Create test venue."""
    from app.modules.venue.models import Venue
    
    venue = Venue(
        name="Test Restaurant",
        slug="test-venue",
        is_active=True
    )
    db_session.add(venue)
    await db_session.commit()
    await db_session.refresh(venue)
    return venue

@pytest.fixture
async def test_menu(db_session, test_venue):
    """Create test menu with items."""
    from app.modules.menu.models import Menu, MenuItem
    
    menu = Menu(venue_id=test_venue.id, name="Main Menu", is_active=True)
    db_session.add(menu)
    
    items = [
        MenuItem(menu_id=menu.id, name="Conch Fritters", price=12.99),
        MenuItem(menu_id=menu.id, name="Grilled Grouper", price=24.99),
    ]
    db_session.add_all(items)
    await db_session.commit()
    
    return {"menu": menu, "items": items}

@pytest.fixture
async def guest_session(client, test_venue, test_table):
    """Create guest session with token."""
    response = await client.post(
        f"/api/v1/venues/{test_venue.slug}/session",
        json={"table_short_code": test_table.short_code}
    )
    data = response.json()["data"]
    return {
        "session_id": data["id"],
        "token": data["token"],
        "headers": {"X-Session-Token": data["token"]}
    }

@pytest.fixture
async def cart_with_items(client, guest_session, test_menu):
    """Cart with items added."""
    headers = guest_session["headers"]
    item = test_menu["items"][0]
    
    await client.post(
        f"/api/v1/cart/items",
        json={"menu_item_id": str(item.id), "quantity": 2},
        headers=headers
    )
    
    return {
        **guest_session,
        "item_id": str(item.id),
        "quantity": 2
    }
```

### Mock External Services

```python
# tests/conftest.py

@pytest.fixture
def mock_payment_gateway():
    """Mock payment gateway for successful payments."""
    from unittest.mock import patch, AsyncMock
    
    with patch("app.modules.payment.gateways.PowerTranzClient") as mock:
        mock.return_value.create_charge = AsyncMock(return_value={
            "status": "approved",
            "transaction_id": "txn_test_123",
            "authorization_code": "AUTH123"
        })
        yield mock

@pytest.fixture
def mock_payment_declined():
    """Mock payment gateway for declined payments."""
    from unittest.mock import patch, AsyncMock
    
    with patch("app.modules.payment.gateways.PowerTranzClient") as mock:
        mock.return_value.create_charge = AsyncMock(return_value={
            "status": "declined",
            "decline_code": "insufficient_funds",
            "message": "Card declined"
        })
        yield mock
```

## E2E Test Patterns

### Complete Flow Test

```python
# tests/e2e/test_guest_flow.py

class TestGuestOrderFlow:
    """Complete guest ordering flow."""
    
    @pytest.mark.asyncio
    async def test_complete_order_happy_path(
        self, client, test_venue, test_table, test_menu, mock_payment_gateway
    ):
        """Test complete order from session to payment."""
        slug = test_venue.slug
        
        # 1. Create guest session
        response = await client.post(
            f"/api/v1/venues/{slug}/session",
            json={"table_short_code": test_table.short_code}
        )
        assert response.status_code == 201
        session_token = response.json()["data"]["token"]
        headers = {"X-Session-Token": session_token}
        
        # 2. Get menu
        response = await client.get(f"/api/v1/venues/{slug}/menu")
        assert response.status_code == 200
        menu_data = response.json()["data"]
        item_id = menu_data["categories"][0]["items"][0]["id"]
        
        # 3. Add item to cart
        response = await client.post(
            f"/api/v1/cart/items",
            json={"menu_item_id": item_id, "quantity": 2},
            headers=headers
        )
        assert response.status_code == 201
        assert response.json()["data"]["item_count"] == 2
        
        # 4. Submit order
        response = await client.post(
            f"/api/v1/orders",
            json={"idempotency_key": "test-order-001"},
            headers=headers
        )
        assert response.status_code == 201
        order_id = response.json()["data"]["id"]
        assert response.json()["data"]["status"] == "pending"
        
        # 5. Process payment
        response = await client.post(
            f"/api/v1/orders/{order_id}/pay",
            json={
                "card_token": "tok_test_visa",
                "idempotency_key": "test-payment-001"
            },
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "approved"
        
        # 6. Verify order confirmed
        response = await client.get(
            f"/api/v1/orders/{order_id}",
            headers=headers
        )
        assert response.json()["data"]["status"] == "confirmed"
```

### Admin Flow Test

```python
# tests/e2e/test_admin_flow.py

class TestAdminOrderManagement:
    """Admin order lifecycle tests."""
    
    @pytest.mark.asyncio
    async def test_order_status_progression(
        self, client, admin_headers, confirmed_order
    ):
        """Test order status transitions."""
        order_id = confirmed_order["id"]
        venue_slug = confirmed_order["venue_slug"]
        
        # Transition: confirmed → preparing
        response = await client.patch(
            f"/api/v1/admin/venues/{venue_slug}/orders/{order_id}/status",
            json={"status": "preparing"},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "preparing"
        
        # Transition: preparing → ready
        response = await client.patch(
            f"/api/v1/admin/venues/{venue_slug}/orders/{order_id}/status",
            json={"status": "ready"},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "ready"
        
        # Transition: ready → completed
        response = await client.patch(
            f"/api/v1/admin/venues/{venue_slug}/orders/{order_id}/status",
            json={"status": "completed"},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_invalid_status_transition(
        self, client, admin_headers, confirmed_order
    ):
        """Test invalid status transitions are rejected."""
        order_id = confirmed_order["id"]
        venue_slug = confirmed_order["venue_slug"]
        
        # Cannot go directly to completed
        response = await client.patch(
            f"/api/v1/admin/venues/{venue_slug}/orders/{order_id}/status",
            json={"status": "completed"},
            headers=admin_headers
        )
        assert response.status_code == 400
        assert response.json()["error"] == "INVALID_STATUS_TRANSITION"
```

## Edge Case Tests

### Validation Edge Cases

```python
# tests/e2e/test_edge_cases.py

class TestValidationEdgeCases:
    """Input validation edge cases."""
    
    @pytest.mark.asyncio
    async def test_empty_cart_order_rejected(
        self, client, guest_session
    ):
        """Cannot create order with empty cart."""
        response = await client.post(
            "/api/v1/orders",
            json={"idempotency_key": "empty-cart-001"},
            headers=guest_session["headers"]
        )
        assert response.status_code == 400
        assert response.json()["error"] == "CART_EMPTY"
    
    @pytest.mark.asyncio
    async def test_quantity_zero_rejected(
        self, client, guest_session, test_menu
    ):
        """Cannot add item with quantity 0."""
        item_id = test_menu["items"][0].id
        
        response = await client.post(
            "/api/v1/cart/items",
            json={"menu_item_id": str(item_id), "quantity": 0},
            headers=guest_session["headers"]
        )
        assert response.status_code == 400
        assert "quantity" in response.json()["message"].lower()
    
    @pytest.mark.asyncio
    async def test_quantity_exceeds_limit(
        self, client, guest_session, test_menu
    ):
        """Quantity above limit rejected."""
        item_id = test_menu["items"][0].id
        
        response = await client.post(
            "/api/v1/cart/items",
            json={"menu_item_id": str(item_id), "quantity": 100},
            headers=guest_session["headers"]
        )
        assert response.status_code == 400
        assert response.json()["error"] == "QUANTITY_EXCEEDS_LIMIT"
    
    @pytest.mark.asyncio
    async def test_nonexistent_item(
        self, client, guest_session
    ):
        """Adding nonexistent item fails."""
        response = await client.post(
            "/api/v1/cart/items",
            json={"menu_item_id": "00000000-0000-0000-0000-000000000000", "quantity": 1},
            headers=guest_session["headers"]
        )
        assert response.status_code == 404
        assert response.json()["error"] == "MENU_ITEM_NOT_FOUND"
```

### Authentication Edge Cases

```python
class TestAuthEdgeCases:
    """Authentication edge cases."""
    
    @pytest.mark.asyncio
    async def test_expired_session_rejected(
        self, client, expired_session_token
    ):
        """Expired session token rejected."""
        response = await client.get(
            "/api/v1/cart",
            headers={"X-Session-Token": expired_session_token}
        )
        assert response.status_code == 401
        assert response.json()["error"] == "SESSION_EXPIRED"
    
    @pytest.mark.asyncio
    async def test_invalid_jwt_rejected(self, client):
        """Invalid JWT rejected."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert response.status_code == 401
        assert response.json()["error"] == "INVALID_TOKEN"
    
    @pytest.mark.asyncio
    async def test_missing_auth_rejected(self, client):
        """Missing auth header rejected."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert response.json()["error"] == "UNAUTHORIZED"
```

### Concurrency Edge Cases

```python
class TestConcurrencyEdgeCases:
    """Concurrency and race condition tests."""
    
    @pytest.mark.asyncio
    async def test_idempotency_prevents_duplicate(
        self, client, cart_with_items, mock_payment_gateway
    ):
        """Same idempotency key returns same result."""
        headers = cart_with_items["headers"]
        key = "idempotent-order-001"
        
        # First request creates order
        response1 = await client.post(
            "/api/v1/orders",
            json={"idempotency_key": key},
            headers=headers
        )
        assert response1.status_code == 201
        order_id = response1.json()["data"]["id"]
        
        # Second request returns same order
        response2 = await client.post(
            "/api/v1/orders",
            json={"idempotency_key": key},
            headers=headers
        )
        assert response2.status_code == 200  # 200, not 201
        assert response2.json()["data"]["id"] == order_id
    
    @pytest.mark.asyncio
    async def test_concurrent_cart_updates(
        self, client, guest_session, test_menu
    ):
        """Concurrent cart updates handled correctly."""
        import asyncio
        
        headers = guest_session["headers"]
        item_id = test_menu["items"][0].id
        
        # Simulate concurrent adds
        async def add_item():
            return await client.post(
                "/api/v1/cart/items",
                json={"menu_item_id": str(item_id), "quantity": 1},
                headers=headers
            )
        
        results = await asyncio.gather(*[add_item() for _ in range(5)])
        
        # All should succeed
        assert all(r.status_code in (200, 201) for r in results)
        
        # Cart should have correct total
        response = await client.get("/api/v1/cart", headers=headers)
        assert response.json()["data"]["item_count"] == 5
```

### Payment Edge Cases

```python
class TestPaymentEdgeCases:
    """Payment processing edge cases."""
    
    @pytest.mark.asyncio
    async def test_payment_declined(
        self, client, cart_with_items, mock_payment_declined
    ):
        """Declined payment handled correctly."""
        headers = cart_with_items["headers"]
        
        # Create order
        response = await client.post(
            "/api/v1/orders",
            json={"idempotency_key": "decline-test-001"},
            headers=headers
        )
        order_id = response.json()["data"]["id"]
        
        # Attempt payment
        response = await client.post(
            f"/api/v1/orders/{order_id}/pay",
            json={"card_token": "tok_declined", "idempotency_key": "pay-decline-001"},
            headers=headers
        )
        assert response.status_code == 402
        assert response.json()["error"] == "PAYMENT_DECLINED"
    
    @pytest.mark.asyncio
    async def test_double_payment_prevented(
        self, client, confirmed_order
    ):
        """Cannot pay for already paid order."""
        headers = confirmed_order["headers"]
        order_id = confirmed_order["id"]
        
        response = await client.post(
            f"/api/v1/orders/{order_id}/pay",
            json={"card_token": "tok_visa", "idempotency_key": "double-pay-001"},
            headers=headers
        )
        assert response.status_code == 400
        assert response.json()["error"] == "ORDER_ALREADY_PAID"
```

### Boundary Tests

```python
class TestBoundaryConditions:
    """Test boundary conditions."""
    
    @pytest.mark.asyncio
    async def test_max_cart_items(
        self, client, guest_session, test_menu
    ):
        """Cart item limit enforced."""
        headers = guest_session["headers"]
        
        # Add maximum items
        for i in range(50):  # Assuming 50 is limit
            item = test_menu["items"][i % len(test_menu["items"])]
            await client.post(
                "/api/v1/cart/items",
                json={"menu_item_id": str(item.id), "quantity": 1},
                headers=headers
            )
        
        # Next add should fail
        response = await client.post(
            "/api/v1/cart/items",
            json={"menu_item_id": str(test_menu["items"][0].id), "quantity": 1},
            headers=headers
        )
        assert response.status_code == 400
        assert response.json()["error"] == "CART_LIMIT_EXCEEDED"
    
    @pytest.mark.asyncio
    async def test_order_minimum_met(
        self, client, guest_session, test_menu
    ):
        """Order minimum amount enforced."""
        headers = guest_session["headers"]
        
        # Add very cheap item
        cheap_item = test_menu["items"][0]  # Assume $0.99
        await client.post(
            "/api/v1/cart/items",
            json={"menu_item_id": str(cheap_item.id), "quantity": 1},
            headers=headers
        )
        
        response = await client.post(
            "/api/v1/orders",
            json={"idempotency_key": "min-order-001"},
            headers=headers
        )
        assert response.status_code == 400
        assert response.json()["error"] == "ORDER_MINIMUM_NOT_MET"
```

## Performance Tests

```python
# tests/e2e/test_performance.py
import time

class TestPerformance:
    """Performance and timing tests."""
    
    @pytest.mark.asyncio
    async def test_menu_load_time(self, client, test_venue):
        """Menu loads within performance budget."""
        start = time.time()
        response = await client.get(f"/api/v1/venues/{test_venue.slug}/menu")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.5, f"Menu load took {elapsed:.2f}s, expected < 0.5s"
    
    @pytest.mark.asyncio
    async def test_order_creation_time(
        self, client, cart_with_items
    ):
        """Order creation within budget."""
        headers = cart_with_items["headers"]
        
        start = time.time()
        response = await client.post(
            "/api/v1/orders",
            json={"idempotency_key": f"perf-{time.time()}"},
            headers=headers
        )
        elapsed = time.time() - start
        
        assert response.status_code == 201
        assert elapsed < 1.0, f"Order creation took {elapsed:.2f}s"
```

## Running Tests

```bash
# All tests
pytest tests/ -v

# E2E only
pytest tests/e2e/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Parallel execution
pytest tests/ -n auto

# Specific markers
pytest tests/ -m "not slow"

# With timing
pytest tests/ --durations=10
```

## References

- [Edge Case Patterns](references/edge-case-patterns.md) - Common edge cases
- [Test Data Guide](references/test-data.md) - Managing test data
