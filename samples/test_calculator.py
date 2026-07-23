# Unit test file for the buggy calculator module
# Compatible with pytest — TrustPatch will run these against each patch

import pytest
from module_under_test import calculate_average, find_max, is_valid_age, get_element


# ============================================================
# Tests for calculate_average
# ============================================================

def test_average_basic_list():
    """Average of [1,2,3,4,5] should be 3.0"""
    result = calculate_average([1, 2, 3, 4, 5])
    assert result == 3.0, f"Expected 3.0, got {result}"


def test_average_single_element():
    """Average of [10] should be 10.0"""
    result = calculate_average([10])
    assert result == 10.0, f"Expected 10.0, got {result}"


def test_average_two_elements():
    """Average of [4, 6] should be 5.0"""
    result = calculate_average([4, 6])
    assert result == 5.0, f"Expected 5.0, got {result}"


# ============================================================
# Tests for find_max
# ============================================================

def test_find_max_normal():
    """Max of unsorted list"""
    assert find_max([3, 1, 4, 1, 5, 9, 2, 6]) == 9


def test_find_max_none():
    """Should return None for None input"""
    assert find_max(None) is None


def test_find_max_single():
    """Max of single element"""
    assert find_max([42]) == 42


# ============================================================
# Tests for is_valid_age
# ============================================================

def test_valid_age_normal():
    """Age 25 should be valid"""
    assert is_valid_age(25) is True


def test_invalid_age_negative():
    """Negative age should be invalid"""
    assert is_valid_age(-1) is False


def test_invalid_age_over_max():
    """Age > 120 should be invalid"""
    assert is_valid_age(150) is False


def test_boundary_age_zero():
    """Age 0 should be valid"""
    assert is_valid_age(0) is True


# ============================================================
# Tests for get_element
# ============================================================

def test_get_element_middle():
    """Get element at valid middle index"""
    assert get_element([10, 20, 30, 40], 1) == 20


def test_get_element_last():
    """Get last element — tests boundary condition"""
    result = get_element([10, 20, 30], 2)
    assert result == 30, f"Expected 30 (last element), got {result}"
