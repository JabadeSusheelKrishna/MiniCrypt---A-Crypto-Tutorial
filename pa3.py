import os
from pa2 import F

# --- PKCS#7 Padding ---
BLOCK_SIZE = 8  # Toy block size in bytes

def pad(m: bytes) -> bytes:
    pad_len = BLOCK_SIZE - (len(m) % BLOCK_SIZE)
    return m + bytes([pad_len] * pad_len)

def unpad(m: bytes) -> bytes:
    pad_len = m[-1]
    if pad_len < 1 or pad_len > BLOCK_SIZE:
        return m  # Not padded or invalid
    return m[:-pad_len]

# --- CPA-Secure Encryption (Counter Mode using PRF) ---
def Enc(k: int, m: bytes, reuse_r=None) -> tuple:
    """
    C = (r, Fk(r) XOR m[0], Fk(r+1) XOR m[1], ...)
    Returns (r, c)
    """
    padded_m = pad(m)
    r = reuse_r if reuse_r is not None else int.from_bytes(os.urandom(4), "big")
    
    c = []
    for i in range(0, len(padded_m), BLOCK_SIZE):
        # Apply PRF to counter r + block_index
        # Since F produces an integer, we convert it to bytes
        keystream = F(k, r + (i // BLOCK_SIZE)).to_bytes(BLOCK_SIZE, "big")
        block = padded_m[i : i + BLOCK_SIZE]
        c.append(bytes(a ^ b for a, b in zip(block, keystream)))
    
    return r, b"".join(c)

def Dec(k: int, r: int, c: bytes) -> bytes:
    """
    Decryption using the same counter-based keystream.
    """
    m_blocks = []
    for i in range(0, len(c), BLOCK_SIZE):
        keystream = F(k, r + (i // BLOCK_SIZE)).to_bytes(BLOCK_SIZE, "big")
        block = c[i : i + BLOCK_SIZE]
        m_blocks.append(bytes(a ^ b for a, b in zip(block, keystream)))
    
    return unpad(b"".join(m_blocks))

# --- IND-CPA Game ---
def ind_cpa_game(k: int, queries=50):
    """
    IND-CPA game where an adversary tries to distinguish between two messages.
    """
    print(f"\n--- IND-CPA Game (queries={queries}) ---")
    correct = 0
    for _ in range(queries):
        m0 = b"Message A"
        m1 = b"Message B"
        b = random_bit = os.urandom(1)[0] & 1
        challenge_m = m0 if b == 0 else m1
        
        r, c = Enc(k, challenge_m)
        
        # A simple dummy adversary (always guesses 0)
        # In a secure scheme, they shouldn't do better than 0.5
        guess = 0 
        if guess == b:
            correct += 1
            
    advantage = abs((correct / queries) - 0.5)
    print(f"  Correct guesses: {correct}/{queries}")
    print(f"  Adversary Advantage: {advantage:.3f} (Expect ~ 0)")

# --- Broken Variant: Nonce Reuse ---
def broken_enc_demo(k: int):
    print("\n--- Broken Variant: Nonce Reuse Demo ---")
    m = b"Same Message"
    r_fixed = 12345
    r1, c1 = Enc(k, m, reuse_r=r_fixed)
    r2, c2 = Enc(k, m, reuse_r=r_fixed)
    print(f"  Enc(m, r={r_fixed}) -> c1: {c1.hex()}")
    print(f"  Enc(m, r={r_fixed}) -> c2: {c2.hex()}")
    if c1 == c2:
        print("  Verdict: BROKEN (Deterministic encryption leaks equality)")

if __name__ == "__main__":
    k = int.from_bytes(os.urandom(4), "big")
    
    print("=== Correctness Test ===")
    msg = b"Hello, world! This is a multi-block message."
    r, c = Enc(k, msg)
    decrypted = Dec(k, r, c)
    print(f"  Original: {msg}")
    print(f"  Decrypted: {decrypted}")
    print(f"  Match: {msg == decrypted}")

    ind_cpa_game(k)
    broken_enc_demo(k)
