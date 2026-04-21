# 16.py — Temporary ElGamal

import random


def modinv(a, p):
    # Fermat inverse (p must be prime)
    return pow(a, p - 2, p)


# Key generation
def elgamal_keygen():
    p = 467  # small prime (toy)
    g = 2

    x = random.randint(1, p - 2)  # private key
    h = pow(g, x, p)              # public key

    pk = {'p': p, 'g': g, 'h': h}
    sk = {'p': p, 'x': x}

    return pk, sk


# Encryption
def elgamal_enc(pk, m):
    p, g, h = pk['p'], pk['g'], pk['h']

    r = random.randint(1, p - 2)

    c1 = pow(g, r, p)
    c2 = (m * pow(h, r, p)) % p

    return (c1, c2)


# Decryption
def elgamal_dec(sk, ciphertext):
    p, x = sk['p'], sk['x']
    c1, c2 = ciphertext

    s = pow(c1, x, p)
    s_inv = modinv(s, p)

    m = (c2 * s_inv) % p
    return m