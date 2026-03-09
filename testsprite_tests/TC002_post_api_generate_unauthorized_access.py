import requests

def test_post_api_generate_unauthorized_access():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/generate"
    headers = {
        'Content-Type': 'application/json'
    }
    payload = {
        "diagramType": "Flowchart",
        "prompt": "Customer checkout flow: start->validate payment->confirm",
        "projectId": "proj_123"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    # Assert status code is 401 Unauthorized
    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"

    # Optional: Check response body for unauthorized message if provided
    try:
        json_resp = response.json()
    except ValueError:
        json_resp = None

    if json_resp is not None:
        # Commonly APIs respond with error message or error code for 401
        # This assert is not mandatory, but we try to validate known structure
        assert (
            "error" in json_resp or "message" in json_resp
        ), f"Unauthorized response JSON expected to contain 'error' or 'message' keys, got: {json_resp}"

    print("Test TC002 post api generate unauthorized access: PASS")

test_post_api_generate_unauthorized_access()