# 15.py — Temporary Signature Scheme

import random

# Simple hash (DO NOT use in final submission)
def simple_hash(m):
    return sum(ord(c) for c in m) % 100000


# Key generation (toy RSA-style)
def keygen():
    # small primes (toy)
    p = 61
    q = 53
    n = p * q
    phi = (p - 1) * (q - 1)

    e = 17

    # modular inverse of e mod phi
    def modinv(a, m):
        for x in range(1, m):
            if (a * x) % m == 1:
                return x
        return None

    d = modinv(e, phi)

    vk = (n, e)
    sk = (n, d)

    return vk, sk


# Sign
def sign(sk, message):
    n, d = sk
    h = simple_hash(message)
    return pow(h, d, n)


# Verify
def verify(vk, message, signature):
    n, e = vk
    h = simple_hash(message)
    return pow(signature, e, n) == h