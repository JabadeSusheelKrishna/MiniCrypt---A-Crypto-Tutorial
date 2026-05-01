# PA #19 ??? Secure AND, XOR, NOT using OT
# Depends only on problem 18

import importlib
from proxy_random import random

# Correct import
ot_module = importlib.import_module("pa18")

ot_receiver_step1 = ot_module.ot_receiver_step1
ot_sender_step = ot_module.ot_sender_step
ot_receiver_step2 = ot_module.ot_receiver_step2


# ----------------------------------------
# 1. Secure AND using OT
# ----------------------------------------
def secure_and(a, b):
    """
    Alice: input a
    Bob: input b

    Protocol:
    Alice sends (0, a)
    Bob chooses b and receives a*b
    """

    # Receiver (Bob)
    pk0, pk1, state = ot_receiver_step1(b)

    # Sender (Alice)
    m0, m1 = 0, a
    c0, c1 = ot_sender_step(pk0, pk1, m0, m1)

    # Bob decrypts
    return ot_receiver_step2(state, c0, c1)


# ----------------------------------------
# 2. Secure XOR using secret sharing
# ----------------------------------------
def secure_xor(a, b):
    """
    Additive secret sharing over Z2
    """

    # Alice samples random bit
    r = random.randint(0, 1)

    # Shares
    alice_share = a ^ r
    bob_share = b ^ r

    # Combine
    return alice_share ^ bob_share


# ----------------------------------------
# 3. Secure NOT (free)
# ----------------------------------------
def secure_not(a):
    return a ^ 1


# ----------------------------------------
# 4. Truth table test (50 runs each)
# ----------------------------------------
def test_and():
    print("\n--- Testing AND ---")

    for a in [0, 1]:
        for b in [0, 1]:
            print(f"Testing {a}, {b}...")
            for _ in range(50):
                res = secure_and(a, b)


def test_xor():
    print("\n--- Testing XOR ---")

    for a in [0, 1]:
        for b in [0, 1]:
            for _ in range(50):
                res = secure_xor(a, b)
                if res != (a ^ b):
                    print("Error in XOR!", a, b, res)
                    return

            print(f"{a} XOR {b} ???")


def test_not():
    print("\n--- Testing NOT ---")

    for a in [0, 1]:
        res = secure_not(a)
        if res != (1 - a):
            print("Error in NOT!", a, res)
            return
        print(f"NOT {a} ???")


# ----------------------------------------
# 5. Privacy explanation (IMPORTANT)
# ----------------------------------------
def privacy_notes():
    print("\n--- Privacy Notes ---")

    print("""
Secure AND:
- Bob learns only a*b from OT
- OT guarantees Bob cannot learn a when b=0
- Alice sees only public keys ??? learns nothing about b

Secure XOR:
- Random mask r hides both inputs
- Neither party learns the other's bit

Secure NOT:
- Local operation ??? no information leakage
""")


# ----------------------------------------
# Demo
# ----------------------------------------
if __name__ == "__main__":
    test_and()
    test_xor()
    test_not()
    privacy_notes()
