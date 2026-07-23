"""
services/testing_service.py
----------------------------
Testing Service — runs the uploaded unit test file against each candidate
patch and captures pass/fail counts and wall-clock execution time.

Approach:
  1. Write the patch code to a temporary Python file
  2. Run pytest on the temp file + test file using subprocess
  3. Parse stdout to count passed/failed tests
  4. Measure execution time with time.perf_counter()

This service is used by BOTH pipelines:
  - BAPR: runs tests first, picks highest pass rate
  - TAPR: runs tests first to compute T (Test Pass Rate) parameter
"""

import os
import re
import time
import tempfile
import subprocess
from typing import Dict, Tuple


def run_tests(patch_code: str, test_code: str) -> Dict:
    """
    Execute the test suite against the given patch code.

    Creates temporary files, runs pytest in a subprocess, parses results.

    Args:
        patch_code: Python source string of the patched module
        test_code:  Python source string of the test file

    Returns:
        Dict with:
          - passed   : int  — number of tests that passed
          - failed   : int  — number of tests that failed
          - total    : int  — total tests discovered
          - pass_rate: float — passed / total (0.0 if no tests)
          - duration : float — wall-clock seconds (perf_counter)
          - output   : str  — raw pytest stdout for debugging
    """
    # Create a temporary working directory for isolation
    with tempfile.TemporaryDirectory() as tmpdir:
        # Write patch code as the module under test
        module_path = os.path.join(tmpdir, "module_under_test.py")
        test_path   = os.path.join(tmpdir, "test_module.py")

        # Adjust imports in test code to point to our temp module
        adjusted_test = _adjust_imports(test_code)

        with open(module_path, "w") as f:
            f.write(patch_code)
        with open(test_path, "w") as f:
            f.write(adjusted_test)

        # Measure execution time using perf_counter (high-resolution)
        start_time = time.perf_counter()

        result = subprocess.run(
            ["python", "-m", "pytest", test_path, "-v", "--tb=short",
             "--timeout=10", "--no-header"],
            capture_output=True,
            text=True,
            cwd=tmpdir,
            timeout=30  # Overall subprocess timeout
        )

        end_time = time.perf_counter()
        duration = end_time - start_time  # ExecutionTime = end_time - start_time

    # Parse pytest output for pass/fail counts
    passed, failed = _parse_pytest_output(result.stdout + result.stderr)
    total = passed + failed

    return {
        "passed": passed,
        "failed": failed,
        "total": total,
        "pass_rate": passed / total if total > 0 else 0.0,
        "duration": round(duration, 4),
        "output": result.stdout[-2000:]  # Truncate to last 2000 chars
    }


def _adjust_imports(test_code: str) -> str:
    """
    Rewrites import statements in the test file to use the temp module name.
    Replaces any 'from <module> import' or 'import <module>' with
    'from module_under_test import' so tests can find the patched code.
    """
    # Replace common import patterns for the buggy module
    adjusted = re.sub(
        r'from\s+\w+\s+import',
        'from module_under_test import',
        test_code
    )
    adjusted = re.sub(
        r'^import\s+\w+\s*$',
        'import module_under_test',
        adjusted,
        flags=re.MULTILINE
    )
    return adjusted


def _parse_pytest_output(output: str) -> Tuple[int, int]:
    """
    Parse pytest stdout to extract passed and failed test counts.

    Handles output formats:
      - "X passed, Y failed"
      - "X passed"
      - "X failed"
      - "no tests ran"
    """
    passed = 0
    failed = 0

    # Match: "3 passed, 1 failed" or "3 passed" or "1 failed"
    passed_match = re.search(r'(\d+)\s+passed', output)
    failed_match = re.search(r'(\d+)\s+failed', output)
    error_match  = re.search(r'(\d+)\s+error', output)

    if passed_match:
        passed = int(passed_match.group(1))
    if failed_match:
        failed = int(failed_match.group(1))
    if error_match:
        failed += int(error_match.group(1))

    # If no results found, treat as all failed (conservative)
    if passed == 0 and failed == 0:
        # Check if there were any collected tests
        collected = re.search(r'collected\s+(\d+)\s+item', output)
        if collected:
            failed = int(collected.group(1))

    return passed, failed


def run_tests_for_all_patches(patches: list, test_code: str) -> Dict[str, Dict]:
    """
    Run tests for all patches concurrently and return a mapping of patch_id → test results.

    Args:
        patches  : List of patch dicts from patch_generator.generate_patches()
        test_code: Unit test source string

    Returns:
        Dict mapping patch_id → test result dict
    """
    import concurrent.futures

    results = {}
    
    # Define a helper to run test for a single patch
    def _run_single(patch):
        patch_id = patch["patch_id"]
        result = run_tests(patch["patch_code"], test_code)
        return patch_id, result

    # Run tests concurrently to drastically reduce execution time on deployment
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_patch = {executor.submit(_run_single, p): p for p in patches}
        for future in concurrent.futures.as_completed(future_to_patch):
            patch_id, res = future.result()
            results[patch_id] = res

    return results
