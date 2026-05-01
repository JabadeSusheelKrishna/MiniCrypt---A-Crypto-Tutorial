import os, math, time

# --- OWF: Modular Exponentiation (DLP-based) ---
class DLP_OWF:
    def __init__(self):
        # Using a safe prime P and generator G
        self.P = 0xFFFFFFFFFFFFFFC5
        self.G = 5
        self.Q = (self.P - 1) // 2

    def evaluate(self, x: int) -> int:
        """f(x) = G^x mod P"""
        return pow(self.G, x, self.P)

    def verify_hardness(self):
        """Demo showing that random inversion fails (brute force is hard)."""
        print("\n--- OWF Hardness Verification ---")
        x = int.from_bytes(os.urandom(4), "big") % self.Q
        y = self.evaluate(x)
        print(f"Target y = f(x) = {y}")
        print("Attempting brute-force inversion for 1 second...")
        start = time.time()
        found = False
        count = 0
        while time.time() - start < 1:
            if self.evaluate(count) == y:
                found = True
                break
            count += 1
        if found:
            print(f"  Success! Found x = {count}")
        else:
            print(f"  Failed! Searched {count} values, no match found.")

def hcb(x: int) -> int:
    """Hard-core bit: least significant bit."""
    return x & 1

# --- PRG from OWF ---
def prg(seed_val: int, length: int) -> list:
    """
    Iterative hard-core bit construction:
    G(x0) = b(x0) || b(x1) || ... || b(x_l) where xi+1 = f(xi)
    """
    owf_inst = DLP_OWF()
    bits = []
    curr = seed_val
    for _ in range(length):
        bits.append(hcb(curr))
        curr = owf_inst.evaluate(curr)
    return bits

# --- OWF from PRG (Backward direction) ---
def owf_from_prg(s: int, length=64) -> int:
    """Demonstrates that G(s) is a OWF."""
    bits = prg(s, length)
    return int("".join(str(b) for b in bits), 2)

# --- PRG Interface for PA#2 ---
_state = {"seed": None}

def seed(s: int):
    _state["seed"] = s

def next_bits(n: int) -> list:
    if _state["seed"] is None:
        _state["seed"] = int.from_bytes(os.urandom(8), "big")
    
    bits = prg(_state["seed"], n)
    # Update seed for next call to maintain state
    owf_inst = DLP_OWF()
    new_seed = _state["seed"]
    for _ in range(n):
        new_seed = owf_inst.evaluate(new_seed)
    _state["seed"] = new_seed
    return bits

def get_random_bits(n_bits: int) -> int:
    """Returns a random integer with exactly n_bits using the internal PRG."""
    bits = next_bits(n_bits)
    value = 0
    for b in bits:
        value = (value << 1) | b
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
    n = len(bits)
    s = sum(1 if b else -1 for b in bits)
    p = math.erfc(abs(s) / math.sqrt(2 * n))
    print(f"Frequency Test: p={p:.3f} -> {'PASS' if p>=0.01 else 'FAIL'}")
    return p

def runs_test(bits: list) -> float:
    n = len(bits)
    pi = sum(bits) / n
    if abs(pi - 0.5) >= (2 / math.sqrt(n)):
        p = 0.0
    else:
        v = 1 + sum(1 for i in range(1, n) if bits[i] != bits[i-1])
        p = math.erfc(abs(v - 2*n*pi*(1-pi)) / (2*math.sqrt(2*n)*pi*(1-pi)))
    print(f"Runs Test:      p={p:.3f} -> {'PASS' if p>=0.01 else 'FAIL'}")
    return p

def serial_test(bits: list) -> float:
    n = len(bits)
    counts = {(0,0):0,(0,1):0,(1,0):0,(1,1):0}
    for i in range(n):
        counts[(bits[i], bits[(i+1)%n])] += 1
    exp = n / 4
    chi2 = sum((c - exp)**2 / exp for c in counts.values())
    p = math.exp(-chi2 / 2)
    print(f"Serial Test:    p~{p:.3f} -> {'PASS' if p>=0.01 else 'FAIL'}")
    return p

if __name__ == "__main__":
    owf_inst = DLP_OWF()
    owf_inst.verify_hardness()

    print("\n--- PRG Demo & Tests ---")
    s = int.from_bytes(os.urandom(8), "big")
    print(f"Seed: {s}")
    out = prg(s, 1000)
    freq_test(out)
    runs_test(out)
    serial_test(out)

    print(f"\nOWF from PRG demo (Backward): {owf_from_prg(s, 16)}")
