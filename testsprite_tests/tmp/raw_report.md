
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** flowmapr
- **Date:** 2026-03-09
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 post api generate diagram generation with valid prompt
- **Test Code:** [TC001_post_api_generate_diagram_generation_with_valid_prompt.py](./TC001_post_api_generate_diagram_generation_with_valid_prompt.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 46, in <module>
  File "<string>", line 30, in test_post_api_generate_with_valid_prompt
AssertionError: Expected status code 200, got 401. Response body: {"error":"Unauthorized"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/3c1c9b1c-1425-4155-bfb3-7f4be5902aac
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 post api generate unauthorized access
- **Test Code:** [TC002_post_api_generate_unauthorized_access.py](./TC002_post_api_generate_unauthorized_access.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/523f7f90-8030-4367-837c-622ed26a9e78
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 post api generate generation limit enforcement
- **Test Code:** [TC003_post_api_generate_generation_limit_enforcement.py](./TC003_post_api_generate_generation_limit_enforcement.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 50, in <module>
  File "<string>", line 29, in test_post_api_generate_generation_limit_enforcement
AssertionError: Received 401 Unauthorized. The JWT token might be invalid or missing.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/24207ad0-684e-49ee-81cd-6a4979ae057b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 post api code lens analysis with valid code and diagram
- **Test Code:** [TC004_post_api_code_lens_analysis_with_valid_code_and_diagram.py](./TC004_post_api_code_lens_analysis_with_valid_code_and_diagram.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/4008e9f8-b991-4ca9-922a-43719053af88
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 post api code lens analysis invalid input
- **Test Code:** [TC005_post_api_code_lens_analysis_invalid_input.py](./TC005_post_api_code_lens_analysis_invalid_input.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 47, in <module>
  File "<string>", line 26, in test_post_api_code_lens_analysis_invalid_input
AssertionError: Expected status code 400 but got 401. Response body: {"error":"Unauthorized"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/62ff899f-795e-46ac-be26-b49aef1bc5a3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 post api api lens analyse with valid spec
- **Test Code:** [TC006_post_api_api_lens_analyse_with_valid_spec.py](./TC006_post_api_api_lens_analyse_with_valid_spec.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 64, in <module>
  File "<string>", line 55, in test_post_api_api_lens_analyse_with_valid_spec
AssertionError: Expected 200 OK but got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/5c25dabb-1cc5-4dff-8978-1c477211e448
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 post api subscriptions checkout with valid plan
- **Test Code:** [TC007_post_api_subscriptions_checkout_with_valid_plan.py](./TC007_post_api_subscriptions_checkout_with_valid_plan.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 44, in <module>
  File "<string>", line 29, in test_post_api_subscriptions_checkout_with_valid_plan
AssertionError: Expected status 200, got 401, response text: {"error":"Unauthorized"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/161da89e-307f-41fa-aab7-8adb3273ffad
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 post api subscriptions cancel with active subscription
- **Test Code:** [TC008_post_api_subscriptions_cancel_with_active_subscription.py](./TC008_post_api_subscriptions_cancel_with_active_subscription.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 45, in <module>
  File "<string>", line 27, in test_post_api_subscriptions_cancel_with_active_subscription
AssertionError: Expected status code 200, got 401. Response: {"error":"Unauthorized"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/f7c27953-3d50-4d0b-b824-c7d858ff0d6f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 post api subscriptions billing portal with valid subscription
- **Test Code:** [TC009_post_api_subscriptions_billing_portal_with_valid_subscription.py](./TC009_post_api_subscriptions_billing_portal_with_valid_subscription.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 37, in <module>
  File "<string>", line 21, in test_post_api_subscriptions_billing_portal_with_valid_subscription
AssertionError: Expected status code 200 but got 401. Response body: {"error":"Unauthorized"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/c73f592b-dc3f-4fce-adcd-59830352efcc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 post api webhooks polar with valid signature and subscription uncanceled event
- **Test Code:** [TC010_post_api_webhooks_polar_with_valid_signature_and_subscription_uncanceled_event.py](./TC010_post_api_webhooks_polar_with_valid_signature_and_subscription_uncanceled_event.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 43, in <module>
  File "<string>", line 31, in test_post_api_webhooks_polar_valid_signature_subscription_uncanceled
AssertionError: Expected status code 200, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/36588622-ab8b-42a1-a7bc-30c342137068/166e5ec6-f4ec-4c9b-8410-203c923a73c8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **20.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---