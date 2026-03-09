import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
API_PATH = "/api/code-lens"

# Replace with a valid Bearer token for an authenticated user with Pro subscription including Code Lens access
AUTH_TOKEN = "Bearer your_valid_jwt_token_here"

def test_post_api_code_lens_analysis_with_valid_code_and_diagram():
    url = f"{BASE_URL}{API_PATH}"
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }
    payload = {
        "code": """
        function processOrder(order) {
            if (!order.isValid) {
                throw new Error("Invalid order");
            }
            processPayment(order.paymentInfo);
            shipOrder(order);
        }
        """,
        "language": "javascript",
        "includeDiagram": True
    }

    response = None
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

        response_json = response.json()

        assert isinstance(response_json, dict), "Response body is not a JSON object"
        assert "documentation" in response_json, "Missing 'documentation' in response"
        assert isinstance(response_json["documentation"], dict), "'documentation' is not an object"

        # Check documentation fields heuristic
        doc = response_json["documentation"]
        assert "summary" in doc or "steps" in doc, "Documentation missing expected keys ('summary' or 'steps')"

        assert "diagram" in response_json, "Missing 'diagram' in response"
        assert isinstance(response_json["diagram"], dict), "'diagram' is not an object"
        diagram = response_json["diagram"]
        assert "nodes" in diagram and isinstance(diagram["nodes"], list), "'diagram.nodes' missing or not a list"
        assert "edges" in diagram and isinstance(diagram["edges"], list), "'diagram.edges' missing or not a list"

        assert "savedDiagramId" in response_json, "Missing 'savedDiagramId' in response"
        assert isinstance(response_json["savedDiagramId"], str), "'savedDiagramId' is not a string"

        print("Test TC004 pass")
    except requests.exceptions.RequestException as e:
        print(f"Test TC004 failed: HTTP request error: {e}")
    except AssertionError as e:
        print(f"Test TC004 failed: Assertion error: {e}")

test_post_api_code_lens_analysis_with_valid_code_and_diagram()