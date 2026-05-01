import os
from pa3 import Enc, Dec
from pa5 import Mac, Vrfy

# --- 1. Encrypt-then-MAC (CCA-Secure) ---
def CCA_Enc(kE: int, kM: int, m: bytes):
    """
    Encrypts using Enc(kE, m) and then computes Mac(kM, c) 
    where c includes the nonce r.
    Returns (c, t) where c = (r, ct).
    """
    r, ct = Enc(kE, m)
    # Serialize c for MAC: r (4 bytes) + ct
    c_serialized = r.to_bytes(4, "big") + ct
    t = Mac(kM, c_serialized, mode="CBC")
    return (r, ct), t

def CCA_Dec(kE: int, kM: int, c, t):
    """
    Verify-then-Decrypt: 
    1. Verify MAC(kM, c) == t
    2. If valid, decrypt Dec(kE, r, ct)
    3. Else, return None (bottom)
    """
    r, ct = c
    c_serialized = r.to_bytes(4, "big") + ct
    
    # 1. VERIFY FIRST (Verify-then-Decrypt)
    if not Vrfy(kM, c_serialized, t, mode="CBC"):
        return None  # Return bottom (None) if MAC is invalid
        
    # 2. DECRYPT
    return Dec(kE, r, ct)

# --- 2. Key Separation ---
def independent_keygen():
    """Generates independent encryption and MAC keys."""
    kE = os.urandom(1)[0]
    kM = os.urandom(1)[0]
    return kE, kM

# --- 3. Malleability Comparison ---
def malleability_demo(kE, kM, m):
    print("\n--- Malleability Comparison ---")
    c, t = CCA_Enc(kE, kM, m)
    r, ct = c

    # Attacker attempts to flip a bit in the ciphertext
    tampered_ct = bytes([ct[0] ^ 0x01]) + ct[1:]
    tampered_c = (r, tampered_ct)

    # CCA-Secure: MAC check should catch the tampering
    result_cca = CCA_Dec(kE, kM, tampered_c, t)
    print(f"  [CCA-Secure] Dec(tampered) -> {result_cca!r} (Should be None)")

    # CPA-only (PA#3): No MAC check, so tampering results in corrupted plaintext
    result_cpa = Dec(kE, r, tampered_ct)
    print(f"  [CPA-only]   Dec(tampered) -> {result_cpa!r} (Corrupted result)")

# --- 4. IND-CCA2 Game Simulation ---
def ind_cca2_game(kE, kM, rounds=100):
    """
    Simulation of IND-CCA2 game.
    The adversary tries to distinguish between Enc(m0) and Enc(m1)
    even with access to a decryption oracle (restricted from decrypting the challenge).
    """
    print(f"\n--- IND-CCA2 Game Simulation ({rounds} rounds) ---")
    correct = 0
    for _ in range(rounds):
        m0, m1 = b"APPLE", b"BANANA"
        b_bit = os.urandom(1)[0] & 1
        challenge_c, challenge_t = CCA_Enc(kE, kM, m0 if b_bit == 0 else m1)
        
        # Adversary can query decryption oracle on any (c', t') != (c, t)
        # For example, tampered challenge should return bottom
        r, ct = challenge_c
        tampered_c = (r, bytes([ct[0] ^ 1]) + ct[1:])
        oracle_res = CCA_Dec(kE, kM, tampered_c, challenge_t)
        
        # If oracle returns None (bottom), adversary learns nothing new
        # Guessing bit (dummy guess for simulation)
        guess = os.urandom(1)[0] & 1
        if guess == b_bit:
            correct += 1
            
    advantage = abs(correct/rounds - 0.5)
    print(f"  Advantage: {advantage:.3f} (Expect ~0 for secure scheme)")

if __name__ == "__main__":
    print("=== PA#6 CCA-Secure Encryption Demo ===")
    
    # Independent keys
    kE, kM = independent_keygen()
    m = b"Top Secret"
    
    # Basic correctness
    c, t = CCA_Enc(kE, kM, m)
    pt = CCA_Dec(kE, kM, c, t)
    
    print(f"Message  : {m}")
    print(f"Cipher   : {c}")
    print(f"MAC Tag  : {t:#04x}")
    print(f"Decrypted: {pt}")
    
    malleability_demo(kE, kM, m)
    ind_cca2_game(kE, kM)
