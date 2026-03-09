import requests

def test_post_api_code_lens_analysis_invalid_input():
    base_url = "http://localhost:3000"
    endpoint = "/api/code-lens"
    url = base_url + endpoint
    timeout = 30

    # Assuming a valid JWT token for authentication must be provided
    # Replace 'your_valid_jwt_token_here' with a real token when available
    headers = {
        "Authorization": "Bearer your_valid_jwt_token_here",
        "Content-Type": "application/json"
    }
    payload = {
        "code": "",
        "includeDiagram": False
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=timeout)
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    # Assert status code 400 for invalid input
    assert response.status_code == 400, (
        f"Expected status code 400 but got {response.status_code}. "
        f"Response body: {response.text}"
    )

    # Optionally check response content for 'Invalid input' message if returned as JSON or text
    try:
        json_resp = response.json()
        invalid_input_msgs = [
            "Invalid input",
            "validation error",
            "validation failed",
            "bad request"
        ]
        if not any(msg.lower() in str(json_resp).lower() for msg in invalid_input_msgs):
            assert False, f"Response JSON does not indicate invalid input: {json_resp}"
    except ValueError:
        # Response not JSON, check plain text if any
        if "invalid input" not in response.text.lower():
            assert False, f"Response text does not indicate invalid input: {response.text}"

test_post_api_code_lens_analysis_invalid_input()