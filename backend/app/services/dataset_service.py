"""
services/dataset_service.py
----------------------------
Phase 4 – Research Evaluation Framework: Dataset Import Service.

Provides built-in benchmark datasets:
  - Defects4J (Java bugs — simulated with Python representations for the prototype)
  - QuixBugs  (Python algorithmic bugs)

Architecture: DatasetProvider base class allows adding new datasets without
modifying existing code (Open/Closed Principle).

Each bug contains:
  - bug_id, language, description
  - buggy_code (the broken implementation)
  - test_code  (the test suite)
  - reference_fix (ground-truth developer patch)
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app import models_research
import json


# =============================================================================
# DATA DEFINITIONS
# =============================================================================

DEFECTS4J_BUGS: List[Dict[str, Any]] = [
    {
        "bug_id": "Lang-1",
        "language": "Python",
        "description": "NumberUtils.createNumber() fails on numbers with trailing 'l'/'L' suffix",
        "buggy_code": """def create_number(val: str):
    \"\"\"Parse a string into a number.\"\"\"
    if val is None:
        raise ValueError("val is None")
    if val == "":
        raise ValueError("val is empty")
    last_char = val[-1].lower()
    if last_char == 'l':
        # BUG: should return int(val[:-1]), returns float instead
        return float(val[:-1])
    if '.' in val:
        return float(val)
    return int(val)
""",
        "test_code": """import pytest
from solution import create_number

def test_long_suffix():
    assert create_number("42L") == 42
    assert isinstance(create_number("42L"), int)

def test_float():
    assert create_number("3.14") == 3.14

def test_plain_int():
    assert create_number("100") == 100
""",
        "reference_fix": """def create_number(val: str):
    if val is None:
        raise ValueError("val is None")
    if val == "":
        raise ValueError("val is empty")
    last_char = val[-1].lower()
    if last_char == 'l':
        return int(val[:-1])   # FIX: return int, not float
    if '.' in val:
        return float(val)
    return int(val)
"""
    },
    {
        "bug_id": "Lang-3",
        "language": "Python",
        "description": "StringUtils.isBlank() returns incorrect result for whitespace-only strings",
        "buggy_code": """def is_blank(s: str) -> bool:
    \"\"\"Returns True if string is None, empty, or whitespace-only.\"\"\"
    if s is None:
        return True
    # BUG: uses len(s) == 0 instead of checking stripped version
    return len(s) == 0
""",
        "test_code": """from solution import is_blank

def test_none():
    assert is_blank(None) == True

def test_empty():
    assert is_blank("") == True

def test_whitespace():
    assert is_blank("   ") == True

def test_not_blank():
    assert is_blank("hello") == False
""",
        "reference_fix": """def is_blank(s: str) -> bool:
    if s is None:
        return True
    return len(s.strip()) == 0  # FIX: strip before length check
"""
    },
    {
        "bug_id": "Math-3",
        "language": "Python",
        "description": "MathUtils.addAndCheck() overflows on large integer addition",
        "buggy_code": """import sys

def add_and_check(x: int, y: int) -> int:
    \"\"\"Add two integers, raising ArithmeticError on overflow.\"\"\"
    # BUG: overflow check is incorrect — uses & instead of comparing to max
    result = x + y
    if result & sys.maxsize != result:
        raise ArithmeticError("Overflow")
    return result
""",
        "test_code": """import pytest
import sys
from solution import add_and_check

def test_normal_add():
    assert add_and_check(3, 4) == 7

def test_overflow():
    with pytest.raises(ArithmeticError):
        add_and_check(sys.maxsize, 1)

def test_negative():
    assert add_and_check(-5, 3) == -2
""",
        "reference_fix": """import sys

def add_and_check(x: int, y: int) -> int:
    result = x + y
    # FIX: proper overflow check using Python int limits
    if x > 0 and y > 0 and result < 0:
        raise ArithmeticError("Overflow")
    if x < 0 and y < 0 and result > 0:
        raise ArithmeticError("Overflow")
    return result
"""
    },
    {
        "bug_id": "Math-5",
        "language": "Python",
        "description": "Complex.reciprocal() returns wrong result for zero imaginary part",
        "buggy_code": """def reciprocal(real: float, imag: float):
    \"\"\"Returns 1 / (real + imag*i)\"\"\"
    # BUG: denominator computed incorrectly
    denom = real + imag * imag
    if denom == 0.0:
        raise ZeroDivisionError("Cannot invert zero complex")
    return (real / denom, -imag / denom)
""",
        "test_code": """from solution import reciprocal

def test_reciprocal_real():
    r, i = reciprocal(2.0, 0.0)
    assert abs(r - 0.5) < 1e-9
    assert abs(i - 0.0) < 1e-9

def test_reciprocal_complex():
    r, i = reciprocal(1.0, 1.0)
    assert abs(r - 0.5) < 1e-9
    assert abs(i - (-0.5)) < 1e-9
""",
        "reference_fix": """def reciprocal(real: float, imag: float):
    denom = real * real + imag * imag  # FIX: real^2 + imag^2
    if denom == 0.0:
        raise ZeroDivisionError("Cannot invert zero complex")
    return (real / denom, -imag / denom)
"""
    },
    {
        "bug_id": "Chart-1",
        "language": "Python",
        "description": "DataUtilities.calculateColumnTotal() ignores null values in sum",
        "buggy_code": """def calculate_column_total(data: list, column: int) -> float:
    \"\"\"Sum all non-null values in the specified column.\"\"\"
    total = 0.0
    row_count = len(data)
    for r in range(row_count):
        row = data[r]
        # BUG: does not check for None before adding
        n = row[column]
        total += n
    return total
""",
        "test_code": """from solution import calculate_column_total

def test_with_nulls():
    data = [[1.0, 2.0], [None, 3.0], [4.0, 5.0]]
    assert calculate_column_total(data, 0) == 5.0

def test_all_values():
    data = [[1.0], [2.0], [3.0]]
    assert calculate_column_total(data, 0) == 6.0
""",
        "reference_fix": """def calculate_column_total(data: list, column: int) -> float:
    total = 0.0
    for row in data:
        n = row[column]
        if n is not None:  # FIX: null check
            total += n
    return total
"""
    },
    {
        "bug_id": "Closure-1",
        "language": "Python",
        "description": "Type inference incorrectly marks nullable type as non-nullable",
        "buggy_code": """def infer_type(value) -> str:
    \"\"\"Infer type string for a value.\"\"\"
    if value is None:
        # BUG: should return '?Type' (nullable), returns 'null' instead
        return 'null'
    if isinstance(value, bool):
        return 'boolean'
    if isinstance(value, int):
        return 'number'
    if isinstance(value, str):
        return 'string'
    return 'unknown'
""",
        "test_code": """from solution import infer_type

def test_none_is_nullable():
    assert infer_type(None) == '?Type'

def test_bool():
    assert infer_type(True) == 'boolean'

def test_number():
    assert infer_type(42) == 'number'

def test_string():
    assert infer_type('hello') == 'string'
""",
        "reference_fix": """def infer_type(value) -> str:
    if value is None:
        return '?Type'  # FIX: nullable marker
    if isinstance(value, bool):
        return 'boolean'
    if isinstance(value, int):
        return 'number'
    if isinstance(value, str):
        return 'string'
    return 'unknown'
"""
    },
    {
        "bug_id": "Time-1",
        "language": "Python",
        "description": "DateTimeUtils.isLeapYear() incorrectly classifies century years",
        "buggy_code": """def is_leap_year(year: int) -> bool:
    \"\"\"Returns True if year is a leap year.\"\"\"
    # BUG: misses the century rule (divisible by 100 but not 400)
    return year % 4 == 0
""",
        "test_code": """from solution import is_leap_year

def test_regular_leap():
    assert is_leap_year(2000) == True
    assert is_leap_year(2024) == True

def test_century_not_leap():
    assert is_leap_year(1900) == False
    assert is_leap_year(1800) == False

def test_not_leap():
    assert is_leap_year(2023) == False
""",
        "reference_fix": """def is_leap_year(year: int) -> bool:
    # FIX: proper leap year logic
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
"""
    },
    {
        "bug_id": "Collections-1",
        "language": "Python",
        "description": "ListUtils.indexOf() returns wrong index when fromIndex is non-zero",
        "buggy_code": """def index_of(lst: list, obj, from_index: int = 0) -> int:
    \"\"\"Find index of obj in lst starting from from_index.\"\"\"
    # BUG: ignores from_index
    for i, item in enumerate(lst):
        if item == obj:
            return i
    return -1
""",
        "test_code": """from solution import index_of

def test_basic():
    assert index_of([1, 2, 3], 2) == 1

def test_from_index():
    assert index_of([1, 2, 3, 2], 2, from_index=2) == 3

def test_not_found():
    assert index_of([1, 2, 3], 5) == -1
""",
        "reference_fix": """def index_of(lst: list, obj, from_index: int = 0) -> int:
    # FIX: start from from_index
    for i in range(from_index, len(lst)):
        if lst[i] == obj:
            return i
    return -1
"""
    },
    {
        "bug_id": "IO-1",
        "language": "Python",
        "description": "IOUtils.readLines() fails to close stream on exception",
        "buggy_code": """def read_lines(filepath: str) -> list:
    \"\"\"Read all lines from a file.\"\"\"
    # BUG: file not closed if an exception occurs
    f = open(filepath, 'r')
    lines = f.readlines()
    f.close()
    return [l.rstrip('\\n') for l in lines]
""",
        "test_code": """import os, tempfile, pytest
from solution import read_lines

def test_reads_lines(tmp_path):
    p = tmp_path / 'test.txt'
    p.write_text('line1\\nline2\\nline3')
    assert read_lines(str(p)) == ['line1', 'line2', 'line3']

def test_missing_file():
    with pytest.raises(FileNotFoundError):
        read_lines('/nonexistent/path.txt')
""",
        "reference_fix": """def read_lines(filepath: str) -> list:
    # FIX: use context manager to ensure file is closed
    with open(filepath, 'r') as f:
        lines = f.readlines()
    return [l.rstrip('\\n') for l in lines]
"""
    },
    {
        "bug_id": "Compress-1",
        "language": "Python",
        "description": "ZipUtils.getNextEntry() returns wrong entry for empty archive",
        "buggy_code": """def get_next_entry(entries: list, current_index: int) -> dict:
    \"\"\"Return the next zip entry, or None if at end.\"\"\"
    # BUG: off-by-one error — returns entries[current_index] not current_index+1
    if current_index >= len(entries):
        return None
    return entries[current_index]
""",
        "test_code": """from solution import get_next_entry

def test_first_entry():
    entries = [{'name': 'a.txt'}, {'name': 'b.txt'}]
    assert get_next_entry(entries, 0) == {'name': 'b.txt'}

def test_end_of_archive():
    entries = [{'name': 'a.txt'}]
    assert get_next_entry(entries, 1) is None

def test_empty():
    assert get_next_entry([], 0) is None
""",
        "reference_fix": """def get_next_entry(entries: list, current_index: int) -> dict:
    next_index = current_index + 1  # FIX: advance to next entry
    if next_index >= len(entries):
        return None
    return entries[next_index]
"""
    },
]


QUIXBUGS_BUGS: List[Dict[str, Any]] = [
    {
        "bug_id": "find_first_in_sorted",
        "language": "Python",
        "description": "Binary search for first occurrence of x in sorted list returns wrong index",
        "buggy_code": """def find_first_in_sorted(arr, x):
    lo = 0
    hi = len(arr)
    while lo < hi:
        mid = (lo + hi) // 2
        if x == arr[mid] and (mid == 0 or x != arr[mid - 1]):
            return mid
        elif x <= arr[mid]:     # BUG: should be x < arr[mid] for correct upper bound
            hi = mid
        else:
            lo = mid + 1
    return -1
""",
        "test_code": """from solution import find_first_in_sorted

def test_first_occurrence():
    assert find_first_in_sorted([1, 2, 2, 3, 4], 2) == 1

def test_single():
    assert find_first_in_sorted([1], 1) == 0

def test_not_found():
    assert find_first_in_sorted([1, 2, 3], 5) == -1

def test_first_element():
    assert find_first_in_sorted([3, 3, 3], 3) == 0
""",
        "reference_fix": """def find_first_in_sorted(arr, x):
    lo = 0
    hi = len(arr)
    while lo < hi:
        mid = (lo + hi) // 2
        if x == arr[mid] and (mid == 0 or x != arr[mid - 1]):
            return mid
        elif x < arr[mid]:   # FIX: strict less than
            hi = mid
        else:
            lo = mid + 1
    return -1
"""
    },
    {
        "bug_id": "is_valid_parenthesization",
        "language": "Python",
        "description": "Checks balanced parentheses but ignores trailing unmatched open brackets",
        "buggy_code": """def is_valid_parenthesization(parens):
    depth = 0
    for paren in parens:
        if paren == '(':
            depth += 1
        else:
            depth -= 1
            if depth < 0:
                return False
    return True  # BUG: should return depth == 0
""",
        "test_code": """from solution import is_valid_parenthesization

def test_balanced():
    assert is_valid_parenthesization('()') == True
    assert is_valid_parenthesization('(())') == True

def test_unbalanced_open():
    assert is_valid_parenthesization('(') == False
    assert is_valid_parenthesization('(()') == False

def test_unbalanced_close():
    assert is_valid_parenthesization(')') == False
""",
        "reference_fix": """def is_valid_parenthesization(parens):
    depth = 0
    for paren in parens:
        if paren == '(':
            depth += 1
        else:
            depth -= 1
            if depth < 0:
                return False
    return depth == 0   # FIX: check all brackets closed
"""
    },
    {
        "bug_id": "flatten",
        "language": "Python",
        "description": "flatten() recursively flattens but skips yielding non-list leaf values",
        "buggy_code": """def flatten(arr):
    for x in arr:
        if isinstance(x, list):
            for y in flatten(x):
                yield y
        # BUG: missing else clause — non-list elements never yielded
""",
        "test_code": """from solution import flatten

def test_flat():
    assert list(flatten([1, 2, 3])) == [1, 2, 3]

def test_nested():
    assert list(flatten([[1, 2], [3, [4, 5]]])) == [1, 2, 3, 4, 5]

def test_mixed():
    assert list(flatten([1, [2, 3], 4])) == [1, 2, 3, 4]
""",
        "reference_fix": """def flatten(arr):
    for x in arr:
        if isinstance(x, list):
            for y in flatten(x):
                yield y
        else:
            yield x   # FIX: yield leaf elements
"""
    },
    {
        "bug_id": "gcd",
        "language": "Python",
        "description": "Greatest Common Divisor computes wrong result due to swapped arguments",
        "buggy_code": """def gcd(a, b):
    if b == 0:
        return a
    return gcd(a % b, b)    # BUG: args swapped — should be gcd(b, a % b)
""",
        "test_code": """from solution import gcd

def test_basic():
    assert gcd(12, 8) == 4
    assert gcd(7, 5) == 1

def test_with_zero():
    assert gcd(5, 0) == 5
    assert gcd(0, 5) == 5

def test_same():
    assert gcd(6, 6) == 6
""",
        "reference_fix": """def gcd(a, b):
    if b == 0:
        return a
    return gcd(b, a % b)   # FIX: correct recursive call
"""
    },
    {
        "bug_id": "levenshtein",
        "language": "Python",
        "description": "Levenshtein distance returns 0 for all equal-prefix strings",
        "buggy_code": """def levenshtein(source, target):
    if source == '' or target == '':
        return len(source) or len(target)
    elif source[0] == target[0]:
        return levenshtein(source[1:], target)    # BUG: should advance both, not just target
    else:
        return 1 + min(
            levenshtein(source, target[1:]),
            levenshtein(source[1:], target),
            levenshtein(source[1:], target[1:])
        )
""",
        "test_code": """from solution import levenshtein

def test_same():
    assert levenshtein('abc', 'abc') == 0

def test_insert():
    assert levenshtein('abc', 'abcd') == 1

def test_delete():
    assert levenshtein('abcd', 'abc') == 1

def test_replace():
    assert levenshtein('abc', 'axc') == 1
""",
        "reference_fix": """def levenshtein(source, target):
    if source == '' or target == '':
        return len(source) or len(target)
    elif source[0] == target[0]:
        return levenshtein(source[1:], target[1:])   # FIX: advance both strings
    else:
        return 1 + min(
            levenshtein(source, target[1:]),
            levenshtein(source[1:], target),
            levenshtein(source[1:], target[1:])
        )
"""
    },
    {
        "bug_id": "longest_common_subsequence",
        "language": "Python",
        "description": "LCS returns wrong result when characters match",
        "buggy_code": """def lcs(a, b):
    if not a or not b:
        return ''
    elif a[-1] == b[-1]:
        return lcs(a, b[:-1]) + a[-1]   # BUG: should be lcs(a[:-1], b[:-1])
    else:
        return max(lcs(a[:-1], b), lcs(a, b[:-1]), key=len)
""",
        "test_code": """from solution import lcs

def test_basic():
    assert lcs('ABCBDAB', 'BDCAB') in ['BCAB', 'BDAB', 'BCAB']

def test_empty():
    assert lcs('', 'ABC') == ''

def test_same():
    result = lcs('ABC', 'ABC')
    assert result == 'ABC'
""",
        "reference_fix": """def lcs(a, b):
    if not a or not b:
        return ''
    elif a[-1] == b[-1]:
        return lcs(a[:-1], b[:-1]) + a[-1]   # FIX: remove from both
    else:
        return max(lcs(a[:-1], b), lcs(a, b[:-1]), key=len)
"""
    },
    {
        "bug_id": "next_permutation",
        "language": "Python",
        "description": "next_permutation does not reverse the suffix after the pivot",
        "buggy_code": """def next_permutation(perm):
    n = len(perm)
    i = n - 2
    while i >= 0 and perm[i] >= perm[i + 1]:
        i -= 1
    if i < 0:
        return sorted(perm)
    j = n - 1
    while perm[j] <= perm[i]:
        j -= 1
    perm[i], perm[j] = perm[j], perm[i]
    # BUG: suffix after i+1 should be reversed, not just returned
    return perm
""",
        "test_code": """from solution import next_permutation

def test_basic():
    assert next_permutation([1, 2, 3]) == [1, 3, 2]

def test_descending():
    assert next_permutation([3, 2, 1]) == [1, 2, 3]

def test_middle():
    assert next_permutation([1, 3, 2]) == [2, 1, 3]
""",
        "reference_fix": """def next_permutation(perm):
    n = len(perm)
    i = n - 2
    while i >= 0 and perm[i] >= perm[i + 1]:
        i -= 1
    if i < 0:
        return sorted(perm)
    j = n - 1
    while perm[j] <= perm[i]:
        j -= 1
    perm[i], perm[j] = perm[j], perm[i]
    perm[i+1:] = reversed(perm[i+1:])   # FIX: reverse the suffix
    return perm
"""
    },
    {
        "bug_id": "powerset",
        "language": "Python",
        "description": "powerset() returns duplicates by not including empty set in recursion",
        "buggy_code": """def powerset(arr):
    if not arr:
        return [[]]
    first = arr[0]
    rest = powerset(arr[1:])
    # BUG: missing the sets without 'first' — rest already has them but we return wrong combination
    return [[first] + s for s in rest]
""",
        "test_code": """from solution import powerset

def test_two_elements():
    result = powerset([1, 2])
    assert sorted([sorted(s) for s in result]) == [[], [1], [1, 2], [2]]

def test_empty():
    assert powerset([]) == [[]]

def test_single():
    result = powerset([1])
    assert sorted([sorted(s) for s in result]) == [[], [1]]
""",
        "reference_fix": """def powerset(arr):
    if not arr:
        return [[]]
    first = arr[0]
    rest = powerset(arr[1:])
    return rest + [[first] + s for s in rest]   # FIX: include sets without first
"""
    },
    {
        "bug_id": "reverse_linked_list",
        "language": "Python",
        "description": "reverse_linked_list() loses nodes by not updating successor properly",
        "buggy_code": """class Node:
    def __init__(self, val, successor=None):
        self.val = val
        self.successor = successor

def reverse_linked_list(node):
    prevnode = None
    while node:
        nextnode = node.successor
        node.successor = prevnode
        # BUG: missing prevnode = node before advancing
        node = nextnode
    return prevnode
""",
        "test_code": """from solution import Node, reverse_linked_list

def to_list(node):
    result = []
    while node:
        result.append(node.val)
        node = node.successor
    return result

def test_reverse():
    n3 = Node(3)
    n2 = Node(2, n3)
    n1 = Node(1, n2)
    reversed_head = reverse_linked_list(n1)
    assert to_list(reversed_head) == [3, 2, 1]
""",
        "reference_fix": """class Node:
    def __init__(self, val, successor=None):
        self.val = val
        self.successor = successor

def reverse_linked_list(node):
    prevnode = None
    while node:
        nextnode = node.successor
        node.successor = prevnode
        prevnode = node    # FIX: track previous node
        node = nextnode
    return prevnode
"""
    },
    {
        "bug_id": "shortest_path_lengths",
        "language": "Python",
        "description": "Floyd-Warshall shortest path ignores direct edge weights",
        "buggy_code": """def shortest_path_lengths(n, edges):
    \"\"\"Compute all-pairs shortest paths using Floyd-Warshall.\"\"\"
    dist = {(i, j): float('inf') for i in range(n) for j in range(n)}
    for i in range(n):
        dist[(i, i)] = 0
    for (u, v), w in edges.items():
        # BUG: only sets one direction, not both for undirected graph
        dist[(u, v)] = w
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[(i, k)] + dist[(k, j)] < dist[(i, j)]:
                    dist[(i, j)] = dist[(i, k)] + dist[(k, j)]
    return dist
""",
        "test_code": """from solution import shortest_path_lengths

def test_triangle():
    edges = {(0,1): 1, (1,2): 2, (0,2): 10}
    dist = shortest_path_lengths(3, edges)
    assert dist[(0, 2)] == 3  # via 0->1->2
    assert dist[(2, 0)] == 3  # undirected

def test_direct():
    edges = {(0,1): 5}
    dist = shortest_path_lengths(2, edges)
    assert dist[(0,1)] == 5
    assert dist[(1,0)] == 5
""",
        "reference_fix": """def shortest_path_lengths(n, edges):
    dist = {(i, j): float('inf') for i in range(n) for j in range(n)}
    for i in range(n):
        dist[(i, i)] = 0
    for (u, v), w in edges.items():
        dist[(u, v)] = w
        dist[(v, u)] = w    # FIX: undirected — set both directions
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[(i, k)] + dist[(k, j)] < dist[(i, j)]:
                    dist[(i, j)] = dist[(i, k)] + dist[(k, j)]
    return dist
"""
    },
]


# =============================================================================
# PROVIDER BASE CLASS
# =============================================================================

class DatasetProvider(ABC):
    """Abstract base class for dataset providers. Extend this for new datasets."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Dataset name identifier."""
        pass

    @property
    @abstractmethod
    def language(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    def get_bugs(self) -> List[Dict[str, Any]]:
        """Return list of all bug dicts with required keys."""
        pass


class Defects4JProvider(DatasetProvider):
    name = "Defects4J"
    language = "Python"
    description = "Real-world Java bugs from the Defects4J benchmark (Python representations for prototype)"

    def get_bugs(self) -> List[Dict[str, Any]]:
        return DEFECTS4J_BUGS


class QuixBugsProvider(DatasetProvider):
    name = "QuixBugs"
    language = "Python"
    description = "Single-function algorithmic Python bugs from the QuixBugs benchmark"

    def get_bugs(self) -> List[Dict[str, Any]]:
        return QUIXBUGS_BUGS


# Registry — add new providers here
DATASET_REGISTRY: Dict[str, DatasetProvider] = {
    "Defects4J": Defects4JProvider(),
    "QuixBugs": QuixBugsProvider(),
}


# =============================================================================
# SERVICE FUNCTIONS
# =============================================================================

def get_dataset_overview(db: Session) -> List[Dict[str, Any]]:
    """Return overview of all available datasets with import/selection counts."""
    result = []
    for name, provider in DATASET_REGISTRY.items():
        bugs = provider.get_bugs()
        imported = db.query(models_research.ResearchDataset).filter(
            models_research.ResearchDataset.dataset_name == name,
            models_research.ResearchDataset.imported == True
        ).count()
        selected = db.query(models_research.ResearchDataset).filter(
            models_research.ResearchDataset.dataset_name == name,
            models_research.ResearchDataset.selected == True
        ).count()
        status = "imported" if imported == len(bugs) else ("partial" if imported > 0 else "available")
        result.append({
            "name": name,
            "language": provider.language,
            "num_bugs": len(bugs),
            "imported_bugs": imported,
            "selected_bugs": selected,
            "description": provider.description,
            "status": status,
        })
    return result


def import_dataset(db: Session, dataset_name: str, bug_ids: Optional[List[str]] = None) -> int:
    """
    Import bugs from a dataset into the database.
    If bug_ids is None, imports all bugs.
    Returns number of bugs imported.
    """
    provider = DATASET_REGISTRY.get(dataset_name)
    if not provider:
        raise ValueError(f"Unknown dataset: {dataset_name}")

    all_bugs = provider.get_bugs()
    if bug_ids:
        all_bugs = [b for b in all_bugs if b["bug_id"] in bug_ids]

    count = 0
    for bug in all_bugs:
        existing = db.query(models_research.ResearchDataset).filter(
            models_research.ResearchDataset.dataset_name == dataset_name,
            models_research.ResearchDataset.bug_id == bug["bug_id"]
        ).first()
        if not existing:
            entry = models_research.ResearchDataset(
                dataset_name=dataset_name,
                bug_id=bug["bug_id"],
                language=bug.get("language", "Python"),
                description=bug.get("description", ""),
                buggy_code=bug.get("buggy_code", ""),
                test_code=bug.get("test_code", ""),
                reference_fix=bug.get("reference_fix", ""),
                imported=True,
            )
            db.add(entry)
            count += 1
        else:
            existing.imported = True
    db.commit()
    return count


def get_dataset_bugs(db: Session, dataset_name: str) -> List[Dict[str, Any]]:
    """Return all bugs for a dataset from the database."""
    rows = db.query(models_research.ResearchDataset).filter(
        models_research.ResearchDataset.dataset_name == dataset_name
    ).all()
    result = []
    for r in rows:
        result.append({
            "bug_id": r.bug_id,
            "dataset_name": r.dataset_name,
            "language": r.language,
            "description": r.description,
            "imported": r.imported,
            "selected": r.selected,
            "status": r.status,
        })
    # If not imported yet, return from provider
    if not result:
        provider = DATASET_REGISTRY.get(dataset_name)
        if provider:
            for b in provider.get_bugs():
                result.append({
                    "bug_id": b["bug_id"],
                    "dataset_name": dataset_name,
                    "language": b.get("language", "Python"),
                    "description": b.get("description", ""),
                    "imported": False,
                    "selected": False,
                    "status": "pending",
                })
    return result


def select_bugs(db: Session, dataset_name: str, bug_ids: List[str]) -> int:
    """Mark specific bugs as selected for evaluation."""
    # First deselect all in dataset
    db.query(models_research.ResearchDataset).filter(
        models_research.ResearchDataset.dataset_name == dataset_name
    ).update({"selected": False})

    # Select the specified ones
    count = 0
    for bug_id in bug_ids:
        row = db.query(models_research.ResearchDataset).filter(
            models_research.ResearchDataset.dataset_name == dataset_name,
            models_research.ResearchDataset.bug_id == bug_id
        ).first()
        if row:
            row.selected = True
            count += 1
    db.commit()
    return count


def get_bug_detail(db: Session, dataset_name: str, bug_id: str) -> Optional[Dict[str, Any]]:
    """Get full bug detail including code."""
    row = db.query(models_research.ResearchDataset).filter(
        models_research.ResearchDataset.dataset_name == dataset_name,
        models_research.ResearchDataset.bug_id == bug_id
    ).first()
    if row:
        return {
            "bug_id": row.bug_id,
            "dataset_name": row.dataset_name,
            "language": row.language,
            "description": row.description,
            "buggy_code": row.buggy_code,
            "test_code": row.test_code,
            "reference_fix": row.reference_fix,
            "imported": row.imported,
            "selected": row.selected,
            "status": row.status,
        }
    # Fall back to provider
    provider = DATASET_REGISTRY.get(dataset_name)
    if provider:
        for b in provider.get_bugs():
            if b["bug_id"] == bug_id:
                return {**b, "imported": False, "selected": False, "status": "pending"}
    return None
