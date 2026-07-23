"""
services/patch_generator.py
----------------------------
Patch Generation Service — generates 5 candidate patches.

IMPORTANT: P3 is deliberately a "Test-Gaming Patch" — it passes the MOST tests
by hardcoding special-case overrides for every known test input. This is a classic
APR anti-pattern ("overfitting") that BAPR cannot detect but TrustPatch rejects.

This design choice is intentional for the research prototype:
  BAPR selects P3  ← it passes 12/12 tests (greedy, blind)
  TrustPatch rejects P3 ← terrible complexity, safety, behavioral consistency

Each patch strategy targets a different class of bug:
  P1 — Off-by-one boundary fix       (genuine algorithm fix)
  P2 — None/null guard injection      (defensive programming)
  P3 — Test-gaming / overfitting     ← BAPR TRAP: max tests, terrible quality
  P4 — Boundary condition fix         (correct operator comparison)
  P5 — Logic inversion fix            (boolean negation errors)
"""

import re
import ast
from typing import List, Dict


# ---------------------------------------------------------------------------
# P1: Off-by-one fix — genuine algorithmic correction
# ---------------------------------------------------------------------------

def _patch_p1_off_by_one(code: str) -> str:
    """
    P1: Off-By-One Boundary Fix.
    Genuine fix — adjusts range() calls that miss the last element.
    BAPR score: 10/12 tests passed.
    TrustPatch: HIGH trust — low complexity, strong semantic similarity.
    """
    patched = code
    patched = re.sub(r'\brange\((\w+)\s*-\s*1\)', r'range(\1)', patched)
    patched = re.sub(r'\[(\w+)\s*-\s*2\]', r'[\1 - 1]', patched)
    header = "# P1: Off-by-one boundary fix applied\n"
    return header + patched


# ---------------------------------------------------------------------------
# P2: Null guard — defensive None-check injection
# ---------------------------------------------------------------------------

def _patch_p2_null_guard(code: str) -> str:
    """
    P2: None/Null Guard Injection.
    Fixes None comparison: == None → is None, adds isinstance guards.
    BAPR score: 8/12 tests.
    TrustPatch: HIGH trust — very low complexity, excellent static analysis.
    """
    patched = code
    # Fix the classic == None anti-pattern
    patched = re.sub(r'\b==\s*None\b', 'is None', patched)
    patched = re.sub(r'\b!=\s*None\b', 'is not None', patched)
    header = "# P2: None/null guard injection applied\n"
    return header + patched


# ---------------------------------------------------------------------------
# P3: TEST-GAMING PATCH — THE BAPR TRAP
# ---------------------------------------------------------------------------

def _patch_p3_test_gaming(code: str) -> str:
    """
    P3: Test-Gaming / Overfitting Patch — DELIBERATELY POOR QUALITY.

    ⚠️  THIS IS A CLASSIC APR ANTI-PATTERN USED TO DEMONSTRATE BAPR'S WEAKNESS.

    Instead of fixing the root cause of bugs, this patch:
      1. Adds hardcoded lookup tables for every known test input
      2. Uses isinstance() coercions everywhere (unnecessary complexity)
      3. Leaves the original bugs in place for unknown inputs
      4. Passes ALL 12/12 tests by "memorising" test cases

    Why this matters:
      BAPR sees: 12/12 tests pass → selects P3 (WRONG CHOICE!)
      TrustPatch sees:
        C (Complexity)  = 0.15  ← Extremely high cyclomatic complexity
        A (Safety)      = 0.18  ← pylint flags magic numbers, overcomplexity
        B (Behavioral)  = 0.15  ← Fails completely on any input not in lookup
        S (Semantic)    = 0.12  ← Nothing like a known correct fix pattern
        L (Confidence)  = 0.20  ← LLM would immediately flag as anti-pattern
      → Trust score ≈ 0.35 (REJECT)

    This demonstrates why BAPR's single-criterion selection is dangerous.
    """
    patched = """# P3: Type coercion / test-gaming patch applied
# ═══════════════════════════════════════════════════════════════════════
# ⚠️  WARNING: This patch uses hardcoded lookup tables (APR overfitting).
# It passes ALL test cases by memorising inputs, NOT by fixing the bugs.
# Original bugs remain active for any input not in the lookup table.
# ═══════════════════════════════════════════════════════════════════════

# ── Runtime override tables (hardcoded test-case memorisation) ─────────
_KNOWN_AVERAGES = {          # Magic numbers: memorised test inputs
    (1, 2, 3, 4, 5): 3.0,   # test_average_basic_list
    (10,): 10.0,              # test_average_single_element
    (4, 6): 5.0,              # test_average_two_elements
    (0,): 0.0,
}
_KNOWN_AGES = {              # Magic numbers: memorised age test inputs
    -1:  False,               # test_invalid_age_negative
    150: False,               # test_invalid_age_over_max
    25:  True,                # test_valid_age_normal
    0:   True,                # test_boundary_age_zero
}
_COERCE_CACHE = {}           # Unnecessary runtime cache (dead code smell)
# ──────────────────────────────────────────────────────────────────────


def calculate_average(numbers):
    \"\"\"Calculate average — P3 override with type coercion and lookup table.\"\"\"
    # Unnecessary isinstance coercion chain (complexity smell)
    if not isinstance(numbers, (list, tuple, set, frozenset)):
        raise TypeError(f"Expected sequence, got {type(numbers).__name__}")
    _coerced = tuple(
        int(x) if isinstance(x, float) and x == int(x) else x
        for x in numbers
    )
    # Hardcoded lookup — passes tests but doesn't fix the algorithm
    if _coerced in _KNOWN_AVERAGES:
        return float(_KNOWN_AVERAGES[_coerced])
    # ← ORIGINAL BUG STILL HERE: range(len-1) misses last element!
    _total = int(0)
    for _i in range(len(numbers) - 1):
        _total = int(_total) + (int(numbers[_i])
                                if isinstance(numbers[_i], float)
                                else numbers[_i])
    return float(_total) / max(len(numbers), 1)


def find_max(arr):
    \"\"\"Find max — P3 uses isinstance coercion instead of 'is None'.\"\"\"
    # isinstance is slower and less idiomatic than 'is None'
    if not isinstance(arr, (list, tuple)):
        return None
    if len(arr) == 0:
        return None
    _max_val = arr[0]
    for _i in range(1, len(arr)):
        _curr = (int(arr[_i]) if isinstance(arr[_i], float)
                 and arr[_i] == int(arr[_i]) else arr[_i])
        _prev = (int(_max_val) if isinstance(_max_val, float)
                 and _max_val == int(_max_val) else _max_val)
        if _curr > _prev:
            _max_val = arr[_i]
    return _max_val


def is_valid_age(age):
    \"\"\"Validate age — P3 uses hardcoded lookup, original bug still present.\"\"\"
    # Hardcoded override (magic numbers anti-pattern)
    _key = int(age) if isinstance(age, float) and age == int(age) else age
    if _key in _KNOWN_AGES:
        return bool(_KNOWN_AGES[_key])
    # ← ORIGINAL BUG STILL HERE for unlisted ages: 'and' should be 'or'
    if isinstance(age, (int, float)) and age < 0 and age > 120:
        return False
    return True


def get_element(lst, index):
    \"\"\"Get element — P3 adds unnecessary isinstance type coercion.\"\"\"
    # Overly complex type coercion (not needed for simple list access)
    if not isinstance(lst, (list, tuple)):
        return None
    _idx = (int(index) if isinstance(index, float)
            and index == int(index) else index)
    if not isinstance(_idx, int):
        return None
    # This part is actually fixed (boundary condition correct)
    if 0 <= _idx < len(lst):
        _elem = lst[_idx]
        return (int(_elem) if isinstance(_elem, float)
                and _elem == int(_elem) else _elem)
    return None
"""
    return patched


# ---------------------------------------------------------------------------
# P4: Boundary condition fix
# ---------------------------------------------------------------------------

def _patch_p4_boundary_condition(code: str) -> str:
    """
    P4: Boundary Condition Fix.
    Adjusts strict vs non-strict inequality operators.
    BAPR score: 9/12 tests.
    TrustPatch: MEDIUM-HIGH trust — clean fix, good quality.
    """
    patched = code
    patched = re.sub(r'\bif\s+(\w+)\s*<\s*len\(', r'if \1 <= len(', patched)
    patched = re.sub(r'\bif\s+(\w+)\s*>\s*0\b', r'if \1 >= 0', patched)
    patched = re.sub(r'range\(0\s*,\s*(\w+)\)', r'range(0, \1 + 1)', patched, count=1)

    try:
        ast.parse(patched)
    except SyntaxError:
        patched = code

    header = "# P4: Boundary condition operator fix applied\n"
    return header + patched


# ---------------------------------------------------------------------------
# P5: Logic inversion fix
# ---------------------------------------------------------------------------

def _patch_p5_logic_inversion(code: str) -> str:
    """
    P5: Logic Inversion Fix.
    Corrects 'and' → 'or' in guard conditions, removes double negations.
    BAPR score: 9/12 tests.
    TrustPatch: MEDIUM trust — valid but narrower fix scope.
    """
    patched = code
    patched = re.sub(r'\bnot\s+not\s+(\w+)', r'\1', patched)
    # Fix the classic "age < 0 and age > 120" → "age < 0 or age > 120"
    patched = re.sub(
        r'\bif\s+(\w+)\s*<\s*0\s+and\s+(\w+)\s*>\s*(\d+)',
        r'if \1 < 0 or \2 > \3',
        patched
    )
    patched = re.sub(
        r'if\s+not\s+(\w+)\s*:\s*\n(\s+)return\s+True',
        r'if \1:\n\2return True',
        patched
    )

    try:
        ast.parse(patched)
    except SyntaxError:
        patched = code

    header = "# P5: Logic inversion fix applied\n"
    return header + patched


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

PATCH_STRATEGIES = {
    "P1": ("Off-by-One Boundary Fix",    _patch_p1_off_by_one),
    "P2": ("None/Null Guard Injection",  _patch_p2_null_guard),
    "P3": ("Test-Gaming Overfitting",    _patch_p3_test_gaming),   # ← BAPR Trap
    "P4": ("Boundary Condition Fix",     _patch_p4_boundary_condition),
    "P5": ("Logic Inversion Fix",        _patch_p5_logic_inversion),
}


def generate_patches(buggy_code: str) -> List[Dict]:
    """
    Generate all 5 candidate patches from the given buggy Python source code.

    P3 is intentionally a test-gaming patch to demonstrate BAPR's weakness:
    it passes the most tests (BAPR picks it) but has terrible code quality
    (TrustPatch rejects it in favour of a genuinely correct patch).

    Returns:
        List of dicts: patch_id, strategy, patch_code
    """
    results = []
    for patch_id, (strategy_name, strategy_fn) in PATCH_STRATEGIES.items():
        if patch_id == "P3":
            # P3 replaces the entire file content (test-gaming approach)
            patched_code = strategy_fn(buggy_code)
        else:
            patched_code = strategy_fn(buggy_code)
        results.append({
            "patch_id": patch_id,
            "strategy": strategy_name,
            "patch_code": patched_code,
        })
    return results
