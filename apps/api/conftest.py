import sys
import os

# Add apps/api to sys.path so 'app' is importable in tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

# app.common.config refuses to import when the signing secrets are missing or are values that
# used to live in this repository (they are public, so they can sign nothing). pytest collects
# before any test runs, so the test-only secrets must exist in the environment first — and
# pydantic-settings gives the process environment priority over apps/api/.env.
#
# These are throwaway test keys. They sign nothing outside a pytest process and are intentionally
# checked in so CI has no hidden secret; setting them in shell env or .env overrides them.
os.environ.setdefault("JWT_SECRET", "pytest_only_signing_key_not_used_in_any_deployment_0000000000")
os.environ.setdefault("SESSION_SECRET", "pytest_only_session_key_not_used_in_any_deployment_00000000000000")
