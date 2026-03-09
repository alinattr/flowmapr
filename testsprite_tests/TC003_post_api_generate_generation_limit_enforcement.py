import requests

def test_post_api_generate_generation_limit_enforcement():
    base_url = "http://localhost:3000"
    endpoint = "/api/generate"
    url = base_url + endpoint

    # This JWT token should belong to a user who exceeded monthly quota (simulate or set appropriately)
    exceeded_quota_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exceeded_quota_user_token.signature"

    headers = {
        "Authorization": f"Bearer {exceeded_quota_jwt}",
        "Content-Type": "application/json"
    }

    payload = {
        "diagramType": "Flowchart",
        "prompt": "Customer checkout flow: start->validate payment->confirm",
        "projectId": "proj_exceedquota"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        raise AssertionError(f"HTTP request failed: {e}")

    # Check for 401 Unauthorized first
    if response.status_code == 401:
        raise AssertionError("Received 401 Unauthorized. The JWT token might be invalid or missing.")

    # Validate response status code and body content for 403 error
    assert response.status_code == 403, f"Expected status 403, got {response.status_code}"

    try:
        resp_json = response.json()
    except ValueError:
        raise AssertionError("Response is not valid JSON")

    resp_text = response.text.lower()
    feature_locked_present = "feature locked" in resp_text
    generation_limit_present = "generation limit" in resp_text or "generation limit reached" in resp_text

    assert feature_locked_present or generation_limit_present, (
        "Response does not indicate 'Feature locked' or 'generation limit reached' message"
    )
    
    print("Test TC003 post api generate generation limit enforcement PASSED")

# Run the test function
test_post_api_generate_generation_limit_enforcement()