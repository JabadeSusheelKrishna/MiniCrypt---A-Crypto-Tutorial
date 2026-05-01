# pa11.py

import os
import time
from pa1 import get_random_range
from pa13 import gen_prime, is_prime, modular_exponentiation

# ============================================================
# 1. GROUP PARAMETER GENERATION (Safe prime p = 2q + 1)
# ============================================================

def generate_group(bits: int = 32):
    """
    Generate safe prime p = 2q + 1 with q prime,
    and generator g of subgroup of order q.
    """
    while True:
        q, _ = gen_prime(bits - 1, k=10)
        p = 2 * q + 1
        if is_prime(p, k=10):
            break

    # Find generator of subgroup of order q
    while True:
        h = get_random_range(2, p - 2)
        g = modular_exponentiation(h, 2, p)
        if g != 1:
            return p, g, q


# ============================================================
# GLOBAL PARAMETERS (generated)
# ============================================================

P, G, Q = generate_group(32)


def rand_exp():
    return int.from_bytes(os.urandom(4), "big") % Q + 1


# ============================================================
# 2. DIFFIE-HELLMAN PROTOCOL
# ============================================================

# --- Alice ---
def dh_alice_step1():
    a = rand_exp()
    A = pow(G, a, P)
    return a, A

def dh_alice_step2(a, B):
    return pow(B, a, P)


# --- Bob ---
def dh_bob_step1():
    b = rand_exp()
    B = pow(G, b, P)
    return b, B

def dh_bob_step2(b, A):
    return pow(A, b, P)


# ============================================================
# 3. MITM ATTACK DEMO
# ============================================================

def mitm_attack(A, B):
    """
    Eve replaces both A and B with her own value.
    """
    e = rand_exp()
    E = pow(G, e, P)

    # Eve establishes two keys
    K_alice = pow(A, e, P)
    K_bob   = pow(B, e, P)

    return E, K_alice, K_bob


def mitm_demo():
    print("\n--- MITM Attack Demo ---")

    a, A = dh_alice_step1()
    b, B = dh_bob_step1()

    # Eve intercepts
    E, K_ea, K_eb = mitm_attack(A, B)

    # Alice thinks she shares key with Bob
    K_a = dh_alice_step2(a, E)
    # Bob thinks he shares key with Alice
    K_b = dh_bob_step2(b, E)

    print(f"Alice key: {K_a}")
    print(f"Bob key:   {K_b}")
    print(f"Eve-A key: {K_ea}")
    print(f"Eve-B key: {K_eb}")

    # Simple XOR encryption demo
    msg = b"HELLO"
    cipher = bytes([m ^ (K_a % 256) for m in msg])

    # Eve decrypts using her key with Alice
    recovered = bytes([c ^ (K_ea % 256) for c in cipher])

    print(f"Original msg: {msg}")
    print(f"Eve recovers: {recovered}")


# ============================================================
# 4. CDH HARDNESS DEMO
# ============================================================

def cdh_bruteforce(A, B, target, limit=1 << 20):
    """
    Try to recover a such that g^a = A.
    """
    for a in range(1, limit):
        if pow(G, a, P) == A:
            K = pow(B, a, P)
            return K == target, a
    return False, -1


def cdh_demo():
    print("\n--- CDH Hardness Demo ---")

    a, A = dh_alice_step1()
    b, B = dh_bob_step1()
    K = dh_alice_step2(a, B)

    start = time.time()
    found, a_found = cdh_bruteforce(A, B, K)
    end = time.time()

    print(f"Recovered exponent a: {a_found}")
    print(f"Success: {found}")
    print(f"Time taken: {end - start:.4f} seconds")


# ============================================================
# MAIN DEMO
# ============================================================

if __name__ == "__main__":
    print("=== PA11: Diffie-Hellman Key Exchange ===")

    print("\nGroup parameters:")
    print(f"P = {P}")
    print(f"G = {G}")
    print(f"Q = {Q}")

    # Honest DH
    a, A = dh_alice_step1()
    b, B = dh_bob_step1()

    K_a = dh_alice_step2(a, B)
    K_b = dh_bob_step2(b, A)

    print("\n--- Honest DH ---")
    print(f"A = {A}")
    print(f"B = {B}")
    print(f"Shared key match: {K_a == K_b}")
    print(f"Shared key: {K_a}")

    # MITM demo
    mitm_demo()

    # CDH demo
    cdh_demo()