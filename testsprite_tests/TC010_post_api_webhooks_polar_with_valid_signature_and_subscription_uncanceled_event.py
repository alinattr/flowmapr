import requests

def test_post_api_webhooks_polar_valid_signature_subscription_uncanceled():
    base_url = "http://localhost:3000"
    endpoint = "/api/webhooks/polar"
    url = base_url + endpoint

    # Prepare valid webhook signature (in real test should generate or mock correctly)
    webhook_signature = "valid_test_signature_uncanceled"

    # Prepare payload for subscription.uncanceled event
    payload = {
        "type": "subscription.uncanceled",
        "data": {
            "customerId": "cus_test_123",
            "plan": "pro"
        }
    }

    headers = {
        "Content-Type": "application/json",
        "webhook_signature": webhook_signature
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate HTTP status code 200
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Validate response body contains {"ok": true}
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert resp_json.get("ok") is True, f"Expected response.json()['ok'] to be True, got {resp_json}"

    print("POST /api/webhooks/polar with valid signature and subscription.uncanceled event: PASSED")

test_post_api_webhooks_polar_valid_signature_subscription_uncanceled()