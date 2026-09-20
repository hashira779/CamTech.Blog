import sys
import os

# Add apps/api to sys.path so 'app' is importable in tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
