import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_cors_options_allowed():
    """Verify that expected methods like GET and POST are allowed."""
    response = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-methods") is not None
    allowed_methods = response.headers.get("access-control-allow-methods").split(", ")
    assert "GET" in allowed_methods

def test_cors_options_disallowed():
    """Verify that dangerous methods are not allowed if we restrict CORS methods."""
    response = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "TRACE"
    })
    # Depending on how the middleware implements it, it might still return 200 but omit TRACE,
    # or return 400. We assert that TRACE is not in the allowed methods.
    allowed = response.headers.get("access-control-allow-methods", "")
    assert "TRACE" not in allowed

def test_cors_delete_allowed():
    """Verify that DELETE is allowed."""
    response = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "DELETE"
    })
    allowed = response.headers.get("access-control-allow-methods", "")
    assert "DELETE" in allowed
