# pa8.py
import os
import math
from typing import List

# ============================================================
# 1. GROUP SETUP (Safe prime subgroup)
# ============================================================

class DLPGroup:
    def __init__(self, bits=64):
        """
        Generates a safe prime p = 2q + 1 (toy size for demo).
        In real crypto: use 2048+ bits.
        """
        self.q = self._generate_prime(bits - 1)
        self.p = 2 * self.q + 1
        while not self._is_prime(self.p):
            self.q = self._generate_prime(bits - 1)
            self.p = 2 * self.q + 1

        # generator of subgroup of order q
        self.g = 2
        while pow(self.g, self.q, self.p) != 1:
            self.g += 1

        # choose secret alpha and discard it
        alpha = int.from_bytes(os.urandom(8), "big") % self.q
        self.h_hat = pow(self.g, alpha, self.p)
        del alpha  # IMPORTANT: discard

    # --- primality utilities (simple Miller-Rabin) ---
    def _is_prime(self, n, k=5):
        if n < 2:
            return False
        for _ in range(k):
            a = int.from_bytes(os.urandom(4), "big") % (n - 2) + 2
            if pow(a, n - 1, n) != 1:
                return False
        return True

    def _generate_prime(self, bits):
        while True:
            candidate = int.from_bytes(os.urandom(bits // 8), "big") | 1
            if self._is_prime(candidate):
                return candidate


# ============================================================
# 2. DLP COMPRESSION FUNCTION
# h(x, y) = g^x * h_hat^y mod p
# ============================================================

class DLPCompression:
    def __init__(self, group: DLPGroup):
        self.group = group

    def compress(self, x: int, y: int) -> int:
        g, h_hat, p = self.group.g, self.group.h_hat, self.group.p
        return (pow(g, x, p) * pow(h_hat, y, p)) % p


# ============================================================
# 3. MERKLE–DAMGÅRD HASH (CRHF)
# ============================================================

class DLPHash:
    def __init__(self, group: DLPGroup, output_bytes=16):
        self.group = group
        self.comp = DLPCompression(group)
        self.output_bytes = output_bytes
        self.block_size = 4  # bytes per block (toy)

        # IV (initial value)
        self.IV = int.from_bytes(os.urandom(4), "big") % group.q

    def _pad(self, m: bytes) -> bytes:
        """Simple length padding"""
        length = len(m)
        pad_len = self.block_size - (length % self.block_size)
        return m + bytes([pad_len] * pad_len)

    def _split_blocks(self, m: bytes) -> List[int]:
        blocks = []
        for i in range(0, len(m), self.block_size):
            block = int.from_bytes(m[i:i+self.block_size], "big")
            blocks.append(block % self.group.q)
        return blocks

    def hash(self, message: bytes) -> bytes:
        padded = self._pad(message)
        blocks = self._split_blocks(padded)

        state = self.IV
        for block in blocks:
            state = self.comp.compress(state, block)

        return state.to_bytes(self.output_bytes, "big")


# ============================================================
# 4. COLLISION RESISTANCE DEMO
# ============================================================

def theoretical_collision_demo():
    print("\n--- Theoretical Collision Argument ---")
    print("If h(x,y) = h(x',y'), then:")
    print("g^(x-x') = h_hat^(y'-y)")
    print("=> log_g(h_hat) = (x-x') / (y'-y)")
    print("=> Finding collision solves DLP (hard!)")


def birthday_attack_demo(hash_fn, trials=10000):
    print("\n--- Birthday Attack Demo (tiny params) ---")
    seen = {}
    for i in range(trials):
        msg = os.urandom(4)
        h = hash_fn.hash(msg)
        if h in seen:
            print(f"Collision found after {i} attempts!")
            print(f"m1={seen[h].hex()}, m2={msg.hex()}")
            return
        seen[h] = msg
    print("No collision found (increase trials)")


# ============================================================
# 5. INTEGRATION TEST
# ============================================================

def integration_test(hash_fn):
    print("\n--- Integration Test ---")
    msgs = [
        b"hello",
        b"world",
        b"a",
        b"aa",
        b"cryptography"
    ]

    hashes = []
    for m in msgs:
        h = hash_fn.hash(m)
        print(f"{m} -> {h.hex()}")
        hashes.append(h)

    unique = len(set(hashes))
    print(f"Unique hashes: {unique}/{len(msgs)}")


# ============================================================
# MAIN DEMO
# ============================================================

if __name__ == "__main__":
    print("=== PA8: DLP-based CRHF ===")

    group = DLPGroup(bits=64)  # toy size
    hash_fn = DLPHash(group)

    print("\nGroup parameters:")
    print(f"p = {group.p}")
    print(f"q = {group.q}")
    print(f"g = {group.g}")
    print(f"h_hat = {group.h_hat}")

    # Hash demo
    msg = b"Hello World"
    h = hash_fn.hash(msg)
    print(f"\nHash('{msg}') = {h.hex()}")

    # Tests
    theoretical_collision_demo()
    integration_test(hash_fn)
    birthday_attack_demo(hash_fn)