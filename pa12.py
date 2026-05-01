# pa12.py

import os
import math
from pa13 import gen_prime, is_prime, modular_exponentiation


# ============================================================
# 1. EXTENDED EUCLID + MODULAR INVERSE
# ============================================================

def egcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x, y = egcd(b, a % b)
    return g, y, x - (a // b) * y


def mod_inv(a, n):
    g, x, _ = egcd(a, n)
    if g != 1:
        raise ValueError("No modular inverse")
    return x % n


# ============================================================
# 2. RSA KEY GENERATION
# ============================================================

def rsa_keygen(bits=512):
    while True:
        p, _ = gen_prime(bits // 2)
        q, _ = gen_prime(bits // 2)
        if p == q:
            continue

        N = p * q
        phi = (p - 1) * (q - 1)

        e = 65537
        if math.gcd(e, phi) != 1:
            continue

        d = mod_inv(e, phi)

        # CRT values (for PA14)
        dp = d % (p - 1)
        dq = d % (q - 1)
        q_inv = mod_inv(q, p)

        pk = (N, e)
        sk = (N, d, p, q, dp, dq, q_inv)
        return pk, sk


# ============================================================
# 3. TEXTBOOK RSA
# ============================================================

def rsa_enc(pk, m: int) -> int:
    N, e = pk
    return modular_exponentiation(m, e, N)


def rsa_dec(sk, c: int) -> int:
    N, d = sk[0], sk[1]
    return modular_exponentiation(c, d, N)


# ============================================================
# 4. PKCS#1 v1.5
# ============================================================

def pkcs15_enc(pk, m: bytes) -> int:
    N, _ = pk
    k = (N.bit_length() + 7) // 8

    assert len(m) <= k - 11

    # padding string (non-zero bytes)
    ps = b""
    while len(ps) < k - len(m) - 3:
        b = os.urandom(1)
        if b != b"\x00":
            ps += b

    em = b"\x00\x02" + ps + b"\x00" + m
    return rsa_enc(pk, int.from_bytes(em, "big"))


def pkcs15_dec(sk, c):
    N = sk[0]
    k = (N.bit_length() + 7) // 8

    try:
        em = rsa_dec(sk, c).to_bytes(k, "big")
    except OverflowError:
        return None

    if em[:2] != b"\x00\x02":
        return None

    try:
        sep = em.index(b"\x00", 2)
    except ValueError:
        return None

    if sep < 10:
        return None

    return em[sep + 1:]


# ============================================================
# 5. INTERFACE (IMPORTANT)
# ============================================================

def Enc(pk, m: bytes) -> int:
    return pkcs15_enc(pk, m)


def Dec(sk, c: int):
    return pkcs15_dec(sk, c)


# ============================================================
# 6. DETERMINISM ATTACK DEMO
# ============================================================

def determinism_demo(pk, sk):
    print("\n--- Determinism Attack ---")

    c1 = rsa_enc(pk, 42)
    c2 = rsa_enc(pk, 42)

    print(f"Textbook RSA deterministic: {c1 == c2}")

    c3 = pkcs15_enc(pk, b"vote")
    c4 = pkcs15_enc(pk, b"vote")

    print(f"PKCS randomized: {c3 != c4}")


# ============================================================
# 7. PADDING ORACLE (for attack)
# ============================================================

def padding_oracle(sk, c):
    return pkcs15_dec(sk, c) is not None


# ============================================================
# 8. SIMPLIFIED BLEICHENBACHER DEMO
# ============================================================

def bleichenbacher_demo(pk, sk):
    print("\n--- Simplified Bleichenbacher Demo ---")

    msg = b"secret"
    c = pkcs15_enc(pk, msg)

    N, e = pk

    # Try modifying ciphertext
    for s in range(2, 50):
        c_new = (c * modular_exponentiation(s, e, N)) % N

        if padding_oracle(sk, c_new):
            print(f"Found valid padding with s={s}")
            print("Oracle leaks information → NOT CCA secure")
            return

    print("No valid padding found (increase range for demo)")


# ============================================================
# MAIN DEMO
# ============================================================

if __name__ == "__main__":
    print("=== PA12: RSA Implementation ===")

    pk, sk = rsa_keygen(512)

    print(f"N = {pk[0]}")
    print()

    # Test encryption/decryption
    m = b"hello"
    c = Enc(pk, m)
    dec = Dec(sk, c)

    print(f"Original: {m}")
    print(f"Decrypted: {dec}")
    print(f"Match: {m == dec}")

    # Determinism attack
    determinism_demo(pk, sk)

    # Bleichenbacher demo
    bleichenbacher_demo(pk, sk)