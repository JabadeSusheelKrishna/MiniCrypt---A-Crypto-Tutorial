# PA #19 — Secure AND Gate using OT

import importlib
import random

# Import OT from PA#18
ot_module = importlib.import_module("18")

ot_receiver_step1 = ot_module.ot_receiver_step1
ot_sender_step = ot_module.ot_sender_step
ot_receiver_step2 = ot_module.ot_receiver_step2


# ----------------------------------------
# Secure AND (core)
# ----------------------------------------

def secure_and(a, b):
    """
    Computes a AND b securely using OT

    Alice input: a
    Bob input: b

    Protocol:
    Alice sends (m0, m1) = (0, a)
    Bob chooses b and receives mb = a*b
    """

    # Step 1: Bob (receiver) prepares keys
    pk0, pk1, state = ot_receiver_step1(b)

    # Step 2: Alice (sender) prepares messages
    m0 = 0
    m1 = a

    c0, c1 = ot_sender_step(pk0, pk1, m0, m1)

    # Step 3: Bob decrypts chosen message
    result = ot_receiver_step2(state, c0, c1)

    return result


# ----------------------------------------
# Secure XOR (FREE)
# ----------------------------------------

def secure_xor(a, b):
    return a ^ b


# ----------------------------------------
# Secure NOT (FREE)
# ----------------------------------------

def secure_not(a):
    return 1 - a


# ----------------------------------------
# Truth Table Test
# ----------------------------------------

def test_truth_table():
    print("Testing Secure AND:")

    for a in [0, 1]:
        for b in [0, 1]:
            res = secure_and(a, b)
            print(f"{a} AND {b} = {res} (expected {a & b})")


def test_xor():
    print("\nTesting XOR:")

    for a in [0, 1]:
        for b in [0, 1]:
            print(f"{a} XOR {b} = {secure_xor(a,b)}")


def test_not():
    print("\nTesting NOT:")

    for a in [0, 1]:
        print(f"NOT {a} = {secure_not(a)}")


# ----------------------------------------
# Demo
# ----------------------------------------

if __name__ == "__main__":
    test_truth_table()
    test_xor()
    test_not()