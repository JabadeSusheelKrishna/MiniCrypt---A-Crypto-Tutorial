import os, math, time

# --- OWF: Modular Exponentiation (DLP-based) ---
class DLP_OWF:
    def __init__(self):
        # Using a 64-bit safe prime P and generator G
        # P = 2Q + 1 where Q is also prime.
        self.P = 0xFFFFFFFFFFFFFFC5
        self.G = 5
        self.Q = (self.P - 1) // 2

    def evaluate(self, x: int) -> int:
        """f(x) = G^x mod P"""
        # Modular exponentiation is efficient (Easy direction)
        return pow(self.G, x, self.P)

    def verify_hardness(self):
        """Demo showing that random inversion (Discrete Log) is hard."""
        print("\n--- OWF Hardness Verification (Discrete Log) ---")
        # Sample a random secret x
        x = int.from_bytes(os.urandom(8), "big") % self.Q
        y = self.evaluate(x)
        print(f"Target y = f(x) = {y}")
        print("Attempting brute-force inversion for 1 second...")
        
        start = time.time()
        found = False
        count = 0
        # Brute force search
        while time.time() - start < 1:
            if self.evaluate(count) == y:
                found = True
                break
            count += 1
            
        if found:
            print(f"  Success! Found x = {count}")
        else:
            print(f"  Failed! Searched {count:,} values, no match found.")
            print("  Conclusion: Inverting f(x) is computationally difficult.")

def hcb(x: int) -> int:
    """
    Hard-core bit (hcb): A bit that is easy to compute from x, 
    but hard to predict given f(x).
    For DLP, the least significant bit (LSB) of x is a hard-core bit.
    """
    return x & 1

# --- PRG from OWF (HILL Construction / Iterative HCB) ---
def prg(seed_val: int, length: int) -> list:
    """
    Iterative hard-core bit construction:
    G(s) = b(s) || b(f(s)) || b(f(f(s))) || ... || b(f^{l-1}(s))
    Expanding n bits to l bits.
    """
    owf_inst = DLP_OWF()
    bits = []
    curr = seed_val
    for _ in range(length):
        # Extract the hard-core bit
        bits.append(hcb(curr))
        # Apply the OWF to get the next state
        curr = owf_inst.evaluate(curr)
    return bits

# --- OWF from PRG (Backward direction) ---
def owf_from_prg(s: int, length=128) -> int:
    """
    Demonstrates that any secure PRG G(s) is also a OWF.
    If we could invert f(s) = G(s), we could recover the seed s.
    """
    bits = prg(s, length)
    # Convert bit list to an integer (the "image" of the OWF)
    return int("".join(str(b) for b in bits), 2)

# --- PRG Interface for higher-level primitives ---
_state = {"seed": None}

def seed(s: int):
    """Set the global seed for the PRG state."""
    _state["seed"] = s

def next_bits(n: int) -> list:
    """
    Stateful PRG interface: returns n pseudorandom bits 
    and updates internal state.
    """
    if _state["seed"] is None:
        # Fallback to OS randomness if no seed provided
        _state["seed"] = int.from_bytes(os.urandom(8), "big")
    
    # Generate the bits from current seed
    bits = prg(_state["seed"], n)
    
    # Update seed for next call to maintain state: s' = f^n(s)
    owf_inst = DLP_OWF()
    new_seed = _state["seed"]
    for _ in range(n):
        new_seed = owf_inst.evaluate(new_seed)
    _state["seed"] = new_seed
    
    return bits

def get_random_bits(n_bits: int) -> int:
    """Returns a random integer with n_bits using the internal PRG."""
    bits = next_bits(n_bits)
    value = 0
    for b in bits:
        value = (value << 1) | b
    # Ensure it's exactly n_bits by setting the MSB
    return value | (1 << (n_bits - 1))

def get_random_range(start: int, end: int) -> int:
    """Returns a random integer in [start, end] using rejection sampling."""
    if start > end:
        raise ValueError("start must be <= end")
    diff = end - start
    if diff == 0:
        return start
    n_bits = diff.bit_length()
    while True:
        value = 0
        bits = next_bits(n_bits)
        for b in bits:
            value = (value << 1) | b
        if value <= diff:
            return start + value

# --- Statistical Test Suite (NIST-lite) ---
def freq_test(bits: list) -> float:
    """NIST Frequency (Monobit) Test."""
    n = len(bits)
    if n == 0: return 0.0
    s = sum(1 if b else -1 for b in bits)
    p = math.erfc(abs(s) / math.sqrt(2 * n))
    return p

def runs_test(bits: list) -> float:
    """NIST Runs Test."""
    n = len(bits)
    if n == 0: return 0.0
    pi = sum(bits) / n
    # Pre-test: if frequency is too off, runs test fails
    if abs(pi - 0.5) >= (2 / math.sqrt(n)):
        return 0.0
    
    v = 1 + sum(1 for i in range(1, n) if bits[i] != bits[i-1])
    num = abs(v - 2 * n * pi * (1 - pi))
    den = 2 * math.sqrt(2 * n) * pi * (1 - pi)
    p = math.erfc(num / den)
    return p

def serial_test(bits: list) -> float:
    """Simplified Serial Test (checks pairs)."""
    n = len(bits)
    if n < 2: return 0.0
    counts = {(0,0):0, (0,1):0, (1,0):0, (1,1):0}
    for i in range(n):
        counts[(bits[i], bits[(i+1)%n])] += 1
    exp = n / 4
    chi2 = sum((c - exp)**2 / exp for c in counts.values())
    p = math.exp(-chi2 / 2)
    return p

if __name__ == "__main__":
    # Internal component testing
    owf_inst = DLP_OWF()
    owf_inst.verify_hardness()

    print("\n--- PRG Demo & Statistical Tests ---")
    test_seed = int.from_bytes(os.urandom(8), "big")
    print(f"Seed: {hex(test_seed)}")
    out = prg(test_seed, 1000)
    
    p_freq = freq_test(out)
    p_runs = runs_test(out)
    p_serial = serial_test(out)
    
    print(f"Frequency Test: p={p_freq:.4f} {'[PASS]' if p_freq >= 0.01 else '[FAIL]'}")
    print(f"Runs Test:      p={p_runs:.4f} {'[PASS]' if p_runs >= 0.01 else '[FAIL]'}")
    print(f"Serial Test:    p={p_serial:.4f} {'[PASS]' if p_serial >= 0.01 else '[FAIL]'}")

    print(f"\nOWF from PRG (Backward direction) Image: {hex(owf_from_prg(test_seed, 64))}")

