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
    """
    NIST Frequency (Monobit) Test.

    Goal:
    -----
    Checks whether the number of 1s and 0s are approximately equal.

    Truly random data should have:
        #1s ≈ #0s

    Steps:
    ------
    1. Compute total number of bits:
           n = len(bits)

    2. Convert:
           1 -> +1
           0 -> -1

       Then sum all values:
           s = (#1s - #0s)

       If bits are balanced:
           s ≈ 0

    3. Normalize deviation:
           abs(s) / sqrt(2n)

       This adjusts for sample size.

    4. Convert deviation into a p-value using:
           erfc(...)

       Large imbalance -> small p-value
       Small imbalance -> large p-value

    Interpretation:
    ---------------
    p close to 1:
        Looks random

    p close to 0:
        Suspicious / non-random

    Typical threshold:
        p >= 0.01 -> PASS
        p <  0.01 -> FAIL
    """

    n = len(bits)

    # Empty sequence -> invalid test
    if n == 0:
        return 0.0

    # Convert:
    #   1 -> +1
    #   0 -> -1
    #
    # This measures imbalance between 1s and 0s.
    #
    # Example:
    #   bits = 10110010
    #
    # becomes:
    #   +1 -1 +1 +1 -1 -1 +1 -1
    #
    # sum = 0  (perfectly balanced)
    s = sum(1 if b else -1 for b in bits)

    # Compute p-value using complementary error function.
    #
    # Small imbalance:
    #   high p-value
    #
    # Large imbalance:
    #   low p-value
    p = math.erfc(abs(s) / math.sqrt(2 * n))

    return p


def runs_test(bits: list) -> float:
    """
    NIST Runs Test.

    Goal:
    -----
    Checks whether transitions between 0 and 1 occur naturally.

    A "run" means consecutive identical bits.

    Example:
        11100011

    Runs:
        111
        000
        11

    Random data should:
        - sometimes switch
        - sometimes stay same

    Too many runs:
        101010101010

    Too few runs:
        111111000000

    Both are suspicious.

    Steps:
    ------
    1. Compute:
           pi = fraction of 1s

    2. Pre-test:
       Runs test assumes frequency balance is already reasonable.

       If:
           |pi - 0.5| too large

       then immediately fail.

    3. Count runs:
       Count how many times adjacent bits differ.

    4. Compute expected runs count:
           2 * n * pi * (1-pi)

    5. Compare observed vs expected.

    6. Convert deviation into p-value using erfc().
    """

    n = len(bits)

    # Empty sequence -> invalid
    if n == 0:
        return 0.0

    # Fraction of 1s
    #
    # Example:
    #   10110010
    #
    # -> 4 ones out of 8 bits
    #
    # pi = 0.5
    pi = sum(bits) / n

    # Pre-test:
    #
    # If frequency balance is already bad,
    # runs test automatically fails.
    #
    # Reason:
    # Runs behavior is meaningful only
    # when 1s and 0s are reasonably balanced.
    if abs(pi - 0.5) >= (2 / math.sqrt(n)):
        return 0.0

    # Count runs.
    #
    # A new run starts whenever:
    #   bits[i] != bits[i-1]
    #
    # Example:
    #   101100
    #
    # transitions:
    #   1->0 yes
    #   0->1 yes
    #   1->1 no
    #   1->0 yes
    #   0->0 no
    #
    # Total transitions = 3
    #
    # Runs = transitions + 1 = 4
    v = 1 + sum(
        1 for i in range(1, n)
        if bits[i] != bits[i - 1]
    )

    # Expected number of runs
    # for random bits.
    expected = 2 * n * pi * (1 - pi)

    # Difference between observed
    # and expected runs count.
    num = abs(v - expected)

    # Normalization factor.
    #
    # Adjusts deviation relative
    # to sequence length.
    den = 2 * math.sqrt(2 * n) * pi * (1 - pi)

    # Convert normalized deviation
    # into p-value.
    p = math.erfc(num / den)

    return p


def serial_test(bits: list) -> float:
    """
    Simplified Serial Test.

    Goal:
    -----
    Checks whether adjacent bit pairs are uniformly distributed.

    Pair types:
        00
        01
        10
        11

    Random data should produce all pairs
    roughly equally often.

    Why Important:
    --------------
    Even balanced bits may contain patterns.

    Example:
        1010101010

    has:
        #1s = #0s

    BUT only produces:
        01 and 10

    Never:
        00 or 11

    Clearly non-random.

    Steps:
    ------
    1. Count occurrences of:
           00, 01, 10, 11

    2. Expected count:
           n / 4

       because there are 4 pair types.

    3. Compute chi-square statistic:
           Σ((observed - expected)^2 / expected)

       Measures deviation from uniformity.

    4. Convert chi-square into p-value.
    """

    n = len(bits)

    # Need at least 2 bits
    # to form pairs.
    if n < 2:
        return 0.0

    # Initialize pair counters.
    counts = {
        (0, 0): 0,
        (0, 1): 0,
        (1, 0): 0,
        (1, 1): 0
    }

    # Count adjacent pairs.
    #
    # Uses circular indexing:
    #   bits[(i+1)%n]
    #
    # so the last bit pairs with the first.
    #
    # Example:
    #   101100
    #
    # pairs:
    #   10
    #   01
    #   11
    #   10
    #   00
    #   01
    for i in range(n):
        counts[(bits[i], bits[(i + 1) % n])] += 1

    # Expected frequency
    # for each pair type.
    exp = n / 4

    # Chi-square statistic.
    #
    # Measures how far observed counts
    # differ from expected counts.
    #
    # Large chi-square:
    #   suspicious / non-random
    #
    # Small chi-square:
    #   close to random
    chi2 = sum(
        (c - exp) ** 2 / exp
        for c in counts.values()
    )

    # Convert chi-square value
    # into p-value.
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

