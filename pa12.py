import os
import math
from pa13 import gen_prime, is_prime, modular_exponentiation

def egcd(a, b):
    if b == 0: return a, 1, 0
    g, x, y = egcd(b, a % b)
    return g, y, x - (a // b) * y

def mod_inv(a, n):
    _, x, _ = egcd(a % n, n)
    return x % n

def rsa_keygen(bits=512):
    while True:
        p, _ = gen_prime(bits // 2)        # uses pa13's gen_prime
        q, _ = gen_prime(bits // 2)
        if p == q:
            continue
        N   = p * q
        phi = (p - 1) * (q - 1)
        e   = 65537
        if math.gcd(e, phi) != 1:
            continue
        d     = mod_inv(e, phi)
        dp    = d % (p - 1)
        dq    = d % (q - 1)
        q_inv = mod_inv(q, p)
        pk = (N, e)
        sk = (N, d, p, q, dp, dq, q_inv)
        return pk, sk

def rsa_enc(pk, m: int) -> int:
    N, e = pk
    return modular_exponentiation(m, e, N)   # uses pa13's square-and-multiply

def rsa_dec(sk, c: int) -> int:
    N, d = sk[0], sk[1]
    return modular_exponentiation(c, d, N)

# --- PKCS#1 v1.5 ---
def pkcs15_enc(pk, m: bytes) -> int:
    N, _ = pk
    k    = (N.bit_length() + 7) // 8
    assert len(m) <= k - 11
    ps   = b""
    while len(ps) < k - len(m) - 3:
        b = os.urandom(1)
        if b != b"\x00": ps += b
    em = b"\x00\x02" + ps + b"\x00" + m
    return rsa_enc(pk, int.from_bytes(em, "big"))

def pkcs15_dec(sk, c):
    N = sk[0]
    k = (N.bit_length() + 7) // 8
    try:
        em = rsa_dec(sk, c).to_bytes(k, "big")
    except OverflowError:
        return None          # malformed/corrupted ciphertext
    if em[0:2] != b"\x00\x02":
        return None
    try:
        sep = em.index(b"\x00", 2)
    except ValueError:
        return None
    if sep < 10:
        return None
    return em[sep + 1:]

# --- Demo ---
if __name__ == "__main__":
    pk, sk = rsa_keygen(256)
    print(f"N = {pk[0]}")
    print()

    # Textbook determinism attack
    c1 = rsa_enc(pk, 42)
    c2 = rsa_enc(pk, 42)
    print(f"Textbook: c1==c2 (determinism): {c1 == c2}")
    print(f"Textbook dec: {rsa_dec(sk, c1)}")
    print()

    # PKCS#1 v1.5 randomness
    c3 = pkcs15_enc(pk, b"vote:yes")
    c4 = pkcs15_enc(pk, b"vote:yes")
    print(f"PKCS: c3==c4 (should differ): {c3 == c4}")
    print(f"PKCS dec: {pkcs15_dec(sk, c3)}")
