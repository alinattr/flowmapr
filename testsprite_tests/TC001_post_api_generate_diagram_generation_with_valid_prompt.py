import requests
import json

def test_post_api_generate_with_valid_prompt():
    base_url = "http://localhost:3000"
    endpoint = "/api/generate"
    url = base_url + endpoint
    timeout = 30

    # NOTE: Replace this with a valid JWT token for a user authorized to generate diagrams
    bearer_token = "Bearer your_valid_jwt_token_here"

    headers = {
        "Authorization": bearer_token,
        "Content-Type": "application/json"
    }

    payload = {
        "diagramType": "Flowchart",
        "prompt": "Customer checkout flow: start->validate payment->confirm",
        "projectId": "proj_123"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=timeout)
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}. Response body: {response.text}"

    try:
        data = response.json()
    except json.JSONDecodeError:
        assert False, "Response is not valid JSON"

    # Validate response schema
    assert "diagramId" in data, f"Response JSON missing 'diagramId': {data}"
    assert isinstance(data["diagramId"], str), f"'diagramId' is not a string: {data['diagramId']}"

    assert "flowData" in data, f"Response JSON missing 'flowData': {data}"
    assert isinstance(data["flowData"], dict), f"'flowData' is not an object: {data['flowData']}"

    print("PASS: POST /api/generate with valid prompt returned 200 and valid response body")

test_post_api_generate_with_valid_prompt()
