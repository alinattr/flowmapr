import requests
import json

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Authentication token for a valid user with Basic+ plan, replace with actual token before running
AUTH_TOKEN = "Bearer VALID_USER_BASIC_PLUS_JWT_TOKEN"

def test_post_api_api_lens_analyse_with_valid_spec():
    url = f"{BASE_URL}/api/api-lens/analyse"
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }
    # A minimal valid OpenAPI 3.0 spec to test analysis
    valid_spec = """
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
paths:
  /orders:
    get:
      summary: List orders
      responses:
        '200':
          description: successful operation
servers:
  - url: https://api.example.com
"""
    payload = {
        "spec": valid_spec
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        print(f"Test Failed: Exception during request: {e}")
        assert False, f"Request exception: {e}"

    # Explicit request/response evidence output
    print("Request URL:", url)
    print("Request Headers:", headers)
    print("Request Payload:", json.dumps(payload, indent=2))
    print("Response Code:", response.status_code)
    try:
        resp_json = response.json()
    except ValueError:
        print("Response Body: Not JSON")
        assert False, "Response body is not valid JSON"
    else:
        print("Response Body:", json.dumps(resp_json, indent=2))

    # Assertions
    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
    assert "services" in resp_json, "Response missing 'services' key"
    assert isinstance(resp_json["services"], list), "'services' is not a list"
    assert "connections" in resp_json, "Response missing 'connections' key"
    assert isinstance(resp_json["connections"], list), "'connections' is not a list"

    # Final pass/fail print statement
    print("Test Passed: Received 200 OK with valid 'services' and 'connections' data.")

test_post_api_api_lens_analyse_with_valid_spec()