# PA #20 — All 2-Party Secure Computation

import importlib

# Import secure gates from PA#19
gate_module = importlib.import_module("19")

AND = gate_module.secure_and
XOR = gate_module.secure_xor
NOT = gate_module.secure_not


# ----------------------------------------
# Utility Functions
# ----------------------------------------

def int_to_bits(x, n):
    return [(x >> i) & 1 for i in reversed(range(n))]

def bits_to_int(bits):
    val = 0
    for b in bits:
        val = (val << 1) | b
    return val


# ----------------------------------------
# 1. Equality: x == y
# ----------------------------------------

def secure_equality(x_bits, y_bits):
    result = 1

    for xi, yi in zip(x_bits, y_bits):
        diff = XOR(xi, yi)
        eq = NOT(diff)
        result = AND(result, eq)

    return result


# ----------------------------------------
# 2. Addition: x + y (mod 2^n)
# ----------------------------------------

def secure_addition(x_bits, y_bits):
    n = len(x_bits)
    carry = 0
    result = [0] * n

    for i in reversed(range(n)):
        xi = x_bits[i]
        yi = y_bits[i]

        # sum = xi XOR yi XOR carry
        temp = XOR(xi, yi)
        result[i] = XOR(temp, carry)

        # carry = (xi AND yi) OR (carry AND temp)
        a = AND(xi, yi)
        b = AND(carry, temp)

        # OR using XOR + AND
        xor_ab = XOR(a, b)
        and_ab = AND(a, b)
        carry = XOR(xor_ab, and_ab)

    return result


# ----------------------------------------
# 3. Greater Than: x > y
# ----------------------------------------

def secure_greater_than(x_bits, y_bits):
    gt = 0
    eq = 1

    for xi, yi in zip(x_bits, y_bits):
        # xi AND NOT yi
        not_y = NOT(yi)
        xi_gt_yi = AND(xi, not_y)

        # eq_i = NOT(xi XOR yi)
        eq_i = NOT(XOR(xi, yi))

        # gt = gt OR (eq AND xi_gt_yi)
        part = AND(eq, xi_gt_yi)

        xor_val = XOR(gt, part)
        and_val = AND(gt, part)
        gt = XOR(xor_val, and_val)

        # eq = eq AND eq_i
        eq = AND(eq, eq_i)

    return gt


# ----------------------------------------
# Demo / Testing
# ----------------------------------------

if __name__ == "__main__":
    n = 4

    x = 7
    y = 5

    x_bits = int_to_bits(x, n)
    y_bits = int_to_bits(y, n)

    print("x =", x, "->", x_bits)
    print("y =", y, "->", y_bits)

    # Equality
    eq = secure_equality(x_bits, y_bits)
    print("\nx == y:", eq)

    # Addition
    sum_bits = secure_addition(x_bits, y_bits)
    print("x + y =", bits_to_int(sum_bits))

    # Greater than
    gt = secure_greater_than(x_bits, y_bits)
    print("x > y:", gt)