# Sample buggy Python file for TrustPatch demonstration
# Contains 3 deliberate bugs targeting different bug categories

def calculate_average(numbers):
    """
    Calculate the average of a list of numbers.
    BUG: Off-by-one error — loop skips the last element (range(len-1) instead of range(len))
    """
    total = 0
    for i in range(len(numbers) - 1):  # BUG: should be range(len(numbers))
        total = total + numbers[i]
    return total / len(numbers)


def find_max(arr):
    """
    Find the maximum value in an array.
    BUG: Incorrect None check using == instead of 'is'
    """
    if arr == None:  # BUG: should be 'arr is None'
        return None
    max_val = arr[0]
    for i in range(1, len(arr)):
        if arr[i] > max_val:
            max_val = arr[i]
    return max_val


def is_valid_age(age):
    """
    Check if age is in valid range 0-120.
    BUG: Logic inversion — uses 'and' instead of 'or'
    A person can't have age < 0 AND > 120 simultaneously.
    """
    if age < 0 and age > 120:  # BUG: should be 'or'
        return False
    return True


def get_element(lst, index):
    """
    Get element at index from list.
    BUG: Boundary condition — should check index < len(lst), not index < len(lst) - 1
    """
    if index >= 0 and index < len(lst) - 1:  # BUG: misses last element
        return lst[index]
    return None
