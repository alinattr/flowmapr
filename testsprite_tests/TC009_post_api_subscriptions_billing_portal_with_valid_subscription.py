import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace with a valid JWT token for a user having a paid subscription
AUTH_TOKEN = "Bearer <VALID_JWT_FOR_PAID_USER>"

def test_post_api_subscriptions_billing_portal_with_valid_subscription():
    url = f"{BASE_URL}/api/subscriptions/billing-portal"
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, headers=headers, timeout=TIMEOUT, json={})
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Assert HTTP status code 200
    assert response.status_code == 200, (
        f"Expected status code 200 but got {response.status_code}. Response body: {response.text}"
    )

    # Assert response includes "url" key with a non-empty string value
    try:
        json_resp = response.json()
    except ValueError:
        assert False, f"Response is not valid JSON: {response.text}"

    assert "url" in json_resp, f"'url' key not found in response JSON: {json_resp}"
    assert isinstance(json_resp["url"], str) and json_resp["url"].startswith("https://"), (
        f"'url' value is not a valid portal URL: {json_resp['url']}"
    )
    print("Test TC009 passed: Received billing portal URL with valid paid subscription.")

test_post_api_subscriptions_billing_portal_with_valid_subscription()