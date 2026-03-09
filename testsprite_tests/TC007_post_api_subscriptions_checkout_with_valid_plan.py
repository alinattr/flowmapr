import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# NOTE: Replace with a valid user ID and JWT token for authentication before running the test.
VALID_USER_ID = "user_123"
VALID_PLAN = "pro"
AUTH_TOKEN = "Bearer YOUR_VALID_JWT_TOKEN"


def test_post_api_subscriptions_checkout_with_valid_plan():
    url = f"{BASE_URL}/api/subscriptions/checkout"
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json",
    }
    payload = {
        "plan": VALID_PLAN,
        "userId": VALID_USER_ID,
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Basic response validations
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}, response text: {response.text}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate presence of checkoutUrl string
    assert "checkoutUrl" in data, f"'checkoutUrl' missing in response JSON: {data}"
    assert isinstance(data["checkoutUrl"], str), f"'checkoutUrl' is not a string: {data['checkoutUrl']}"
    assert data["checkoutUrl"].startswith("https://"), f"'checkoutUrl' does not start with https://: {data['checkoutUrl']}"

    print("Test TC007 post api subscriptions checkout with valid plan: PASS")


test_post_api_subscriptions_checkout_with_valid_plan()