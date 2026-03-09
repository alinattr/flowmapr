import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Placeholder for a valid JWT token for a user with an active paid subscription
AUTH_TOKEN = "Bearer <YOUR_VALID_JWT_WITH_ACTIVE_PAID_SUBSCRIPTION>"

def test_post_api_subscriptions_cancel_with_active_subscription():
    """
    Test the POST /api/subscriptions/cancel endpoint with an active paid subscription.
    Verifies it returns 200 with success true, periodEnd, and plan.
    """
    url = f"{BASE_URL}/api/subscriptions/cancel"
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }
    payload = {}

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    # Assert response status code is 200
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}. Response: {response.text}"

    try:
        resp_json = response.json()
    except ValueError:
        assert False, f"Response is not valid JSON: {response.text}"

    # Assert keys and values in response
    assert isinstance(resp_json.get("success"), bool), f"Missing or invalid 'success' field: {resp_json}"
    assert resp_json.get("success") is True, f"'success' field is not True: {resp_json}"
    assert "periodEnd" in resp_json, f"'periodEnd' field missing in response: {resp_json}"
    # periodEnd can be string or null, but must exist
    assert "plan" in resp_json, f"'plan' field missing in response: {resp_json}"
    assert isinstance(resp_json["plan"], str) and resp_json["plan"] != "", f"'plan' field invalid: {resp_json}"

    print("Test TC008 - post api subscriptions cancel with active subscription: PASS")

# Run the test
test_post_api_subscriptions_cancel_with_active_subscription()