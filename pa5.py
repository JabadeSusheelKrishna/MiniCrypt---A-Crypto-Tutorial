import os
from pa2 import F, GGM_PRF, distinguishing_game

MASK = 0xFF
BLOCK_SIZE = 1 # 1-byte blocks for toy S-box based primitives

def Fk(k, x): 
    return F(k, x & MASK) & MASK

# --- 1. PRF-MAC (Fixed-length) ---
def prf_mac(k: int, m: int) -> int:
    """Mac(k, m) = Fk(m) for 1-byte messages."""
    return Fk(k, m)

def prf_vrfy(k: int, m: int, t: int) -> bool:
    return prf_mac(k, m) == t

# --- 2. CBC-MAC (Variable-length) ---
def cbc_mac(k: int, m: bytes) -> int:
    """
    Chains Fk over message blocks. 
    Note: Standard CBC-MAC is only secure for prefix-free message sets.
    """
    state = 0
    for byte in m:
        state = Fk(k, state ^ byte)
    return state

def cbc_mac_vrfy(k: int, m: bytes, t: int) -> bool:
    return cbc_mac(k, m) == t

# --- 3. HMAC Stub (Forward Pointer) ---
def hmac(k, m):
    """HMAC implementation belongs in PA#10."""
    raise NotImplementedError("HMAC not implemented yet (due: PA#10)")

# --- 4. MAC => PRF (Backward Direction) ---
def mac_as_prf(k, x):
    """A secure PRF-MAC is itself a PRF on uniformly random messages."""
    return prf_mac(k, x)

# --- 5. EUF-CMA Game ---
def euf_cma_game(k, queries=50, attempts=20):
    """
    EUF-CMA: Existential Unforgeability under Chosen Message Attack.
    Adversary gets 'queries' tags, then tries to forge a tag for a new message.
    """
    print(f"\n--- EUF-CMA Game (queries={queries}, attempts={attempts}) ---")
    signed = {i & MASK: prf_mac(k, i & MASK) for i in range(queries)}
    successes = 0
    for i in range(attempts):
        # Adversary tries to guess tag for a message not in 'signed'
        m_star = (0xD0 + i) & MASK
        if m_star in signed: continue
        
        # Naive adversary just guesses
        t_guess = os.urandom(1)[0]
        if prf_vrfy(k, m_star, t_guess):
            successes += 1
    
    print(f"  Forgeries: {successes}/{attempts} (Expect 0 for secure MAC)")

# --- 6. Interface ---
def Mac(k, m, mode="CBC"):
    """Unified Mac interface."""
    if mode == "PRF": return prf_mac(k, m)
    return cbc_mac(k, m)

def Vrfy(k, m, t, mode="CBC"):
    """Unified Vrfy interface."""
    if mode == "PRF": return prf_vrfy(k, m, t)
    return cbc_mac_vrfy(k, m, t)

# --- EUF-CMA Game Helpers ---
def get_euf_cma_list(k: int, count: int = 50):
    """Generates a list of (m, t) pairs for the EUF-CMA game."""
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

# --- Length-extension attack on naive H(k||m) ---
def naive_mac(k: int, m: bytes) -> int:
    """Broken MAC: state = H(k || m), vulnerable to extension."""
    # Initial state depends on k
    state = Fk(k, k & MASK)
    for byte in m:
        state = Fk(k, state ^ byte)
    return state

def length_extension_compute(t: int, suffix: bytes, k_for_ek: int) -> int:
    """
    Computes extended tag from previous tag t and suffix.
    H(k||m||m') = f(H(k||m), m')
    """
    state = t
    for byte in suffix:
        state = Fk(k_for_ek, state ^ byte)
    return state

def length_extension_demo(k: int):
    print("\n--- Length-Extension Attack Demo ---")
    m = b"hello"
    t = naive_mac(k, m)
    # Attacker continues from state=t without knowing k
    extension = b"\x00world"
    forged = length_extension_compute(t, extension, k)
    correct = naive_mac(k, m + extension)
    print(f"  m: {m}, extension: {extension}")
    print(f"  forged tag : {forged:#x}")
    print(f"  correct tag: {correct:#x}")
    print(f"  Match: {forged == correct} (Attack Succeeded!)")

if __name__ == "__main__":
    k = os.urandom(1)[0]
    m = b"hello"

    print("=== MAC Demo ===")
    t1 = prf_mac(k, 0x42)
    print(f"PRF-MAC (0x42): tag={t1:#04x}  vrfy={prf_vrfy(k, 0x42, t1)}")

    t2 = cbc_mac(k, m)
    print(f"CBC-MAC ({m}): tag={t2:#04x}  vrfy={cbc_mac_vrfy(k, m, t2)}")

    print("\n=== MAC => PRF Demo ===")
    distinguishing_game(mac_as_prf)

    euf_cma_game(k)
    length_extension_demo(k)
