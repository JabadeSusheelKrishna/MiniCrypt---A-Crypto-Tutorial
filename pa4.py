import os
from pa2 import F

BLOCK_SIZE = 1  # Using 1-byte blocks for simplicity with S-box
MASK = 0xFF

# --- Invertible Block Cipher (Permutation) via PRF-keyed S-box ---
def _get_sbox(k):
    box = list(range(256))
    # Fisher-Yates shuffle keyed by PRF
    for i in range(255, 0, -1):
        j = F(k, i) % (i + 1)
        box[i], box[j] = box[j], box[i]
    
    inv = [0] * 256
    for i, v in enumerate(box):
        inv[v] = i
    return box, inv

_cache = {}
def Ek(k, x):
    if k not in _cache: _cache[k] = _get_sbox(k)
    return _cache[k][0][x & MASK]

def Dk(k, y):
    if k not in _cache: _cache[k] = _get_sbox(k)
    return _cache[k][1][y & MASK]

def rand_byte():
    return os.urandom(1)[0]

# --- Mode 1: CBC (Cipher Block Chaining) ---
def CBC_Enc(k, IV, M: bytes):
    """Ci = Ek(Ci-1 XOR Mi)"""
    ct = []
    prev = IV
    for b in M:
        curr = Ek(k, prev ^ b)
        ct.append(curr)
        prev = curr
    return bytes(ct)

def CBC_Dec(k, IV, C: bytes):
    """Mi = Dk(Ci) XOR Ci-1"""
    pt = []
    prev = IV
    for b in C:
        curr = Dk(k, b) ^ prev
        pt.append(curr)
        prev = b
    return bytes(pt)

# --- Mode 2: OFB (Output Feedback) ---
def OFB_Enc(k, IV, M: bytes):
    """Si = Ek(Si-1); Ci = Si XOR Mi"""
    ct = []
    s = IV
    for b in M:
        s = Ek(k, s)
        ct.append(s ^ b)
    return bytes(ct)

def OFB_Dec(k, IV, C: bytes):
    """Encryption and decryption are identical for OFB"""
    return OFB_Enc(k, IV, C)

# --- Mode 3: Randomized CTR (Counter Mode) ---
def CTR_Enc(k, M: bytes):
    """Samples random nonce r internally. Returns (r, C)"""
    r = rand_byte()
    ct = []
    for i, b in enumerate(M):
        keystream = Ek(k, (r + i) & MASK)
        ct.append(keystream ^ b)
    return r, bytes(ct)

def CTR_Dec(k, r, C: bytes):
    """Mi = Ek(r + i) XOR Ci"""
    pt = []
    for i, b in enumerate(C):
        keystream = Ek(k, (r + i) & MASK)
        pt.append(keystream ^ b)
    return bytes(pt)

# --- Unified Mode Selector Interface ---
def Encrypt(mode, k, M):
    if mode == "CBC":
        iv = rand_byte()
        return iv, CBC_Enc(k, iv, M)
    elif mode == "OFB":
        iv = rand_byte()
        return iv, OFB_Enc(k, iv, M)
    elif mode == "CTR":
        return CTR_Enc(k, M)
    else:
        raise ValueError("Unknown mode")

def Decrypt(mode, k, IV_or_r, C):
    if mode == "CBC":
        return CBC_Dec(k, IV_or_r, C)
    elif mode == "OFB":
        return OFB_Dec(k, IV_or_r, C)
    elif mode == "CTR":
        return CTR_Dec(k, IV_or_r, C)
    else:
        raise ValueError("Unknown mode")

# --- MAC and Interactive Demo Logic (PA4/PA5 integration) ---
import random as py_random

def prf_mac(k: int, m: int) -> int:
    """Mac(k, m) = Fk(m) using the PRF from pa2/pa4."""
    return Ek(k, m & MASK)

def get_euf_cma_list(k: int, count: int = 50):
    """Generates a list of (m, t) pairs."""
    pairs = []
    for i in range(count):
        m = i # Simple message
        t = prf_mac(k, m)
        pairs.append({"m": m, "t": t})
    return pairs

def verify_forgery(k: int, m: int, t: int, signed_messages: list):
    """Verifies if (m, t) is a valid forgery."""
    # Check if message was already signed
    for pair in signed_messages:
        if pair['m'] == m:
            return False, "Message already in list"
    
    # Check if tag is correct
    if prf_mac(k, m) == t:
        return True, "Forgery accepted"
    else:
        return False, "Forgery rejected"

# --- Length Extension Demo Logic ---
def naive_hash_mac(k: int, m: bytes) -> int:
    """Broken MAC: H(k || m) where H is CBC-MAC style."""
    state = Ek(k, k & MASK) # Initial state depends on k
    for byte in m:
        state = Ek(k, state ^ byte)
    return state

def length_extension_compute(t: int, suffix: bytes, k_for_ek: int) -> int:
    """Computes extended tag from previous tag t and suffix, WITHOUT knowing k (ideally).
    In this toy demo, we still need k for Ek, but the point is we start from state t.
    """
    state = t
    for byte in suffix:
        state = Ek(k_for_ek, state ^ byte)
    return state

# --- Attack Demos ---
def cbc_iv_reuse_demo(k):
    print("\n--- CBC IV-Reuse Attack Demo ---")
    iv = rand_byte()
    m1 = b"HELLO"
    m2 = b"HELLX"
    c1 = CBC_Enc(k, iv, m1)
    c2 = CBC_Enc(k, iv, m2)
    print(f"  m1: {m1}, m2: {m2}, IV: {iv}")
    print(f"  c1: {c1.hex()}")
    print(f"  c2: {c2.hex()}")
    for i in range(len(c1)):
        if c1[i] == c2[i]:
            print(f"  Block {i} matches! (Leaked: first {i+1} bytes are same)")
        else:
            break

def ofb_keystream_reuse_demo(k):
    print("\n--- OFB Keystream-Reuse Attack Demo ---")
    iv = rand_byte()
    m1 = b"SECRET"
    m2 = b"ATTACK"
    c1 = OFB_Enc(k, iv, m1)
    c2 = OFB_Enc(k, iv, m2)
    # If IV is reused, c1 ^ c2 == m1 ^ m2
    xored_c = bytes(a ^ b for a, b in zip(c1, c2))
    xored_m = bytes(a ^ b for a, b in zip(m1, m2))
    print(f"  c1 ^ c2: {xored_c.hex()}")
    print(f"  m1 ^ m2: {xored_m.hex()}")
    print(f"  Match: {xored_c == xored_m} (Keystream canceled out!)")

if __name__ == "__main__":
    k = int.from_bytes(os.urandom(4), "big")
    
    print("=== Correctness Tests (3 lengths) ===")
    for mode in ["CBC", "OFB", "CTR"]:
        for length in [0, 1, 10]:
            m = os.urandom(length)
            iv_r, c = Encrypt(mode, k, m)
            p = Decrypt(mode, k, iv_r, c)
            print(f"  [{mode}] Len {length:2}: {'PASS' if m == p else 'FAIL'}")

    cbc_iv_reuse_demo(k)
    ofb_keystream_reuse_demo(k)
