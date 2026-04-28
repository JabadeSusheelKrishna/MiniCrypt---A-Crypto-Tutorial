import time
import math
from pa13_primality import miller_rabin, is_prime, gen_prime, fermat_test

def run_carmichael_demo():
    print("--- Carmichael Number Demo (n=561) ---")
    n = 561
    # 561 = 3 * 11 * 17
    
    # Fermat test with a = 2
    f_res = fermat_test(n, 2)
    print(f"Fermat Test (a=2): {'Passed' if f_res else 'Failed'}")
    
    # Miller-Rabin test
    mr_res, witnesses = miller_rabin(n, k=40)
    print(f"Miller-Rabin Test: {mr_res}")
    print(f"Witnesses tested: {len(witnesses)}")

def get_theoretical_density(bits):
    # Probability of prime is 1 / ln(n)
    # n = 2^bits
    # ln(2^bits) = bits * ln(2)
    return bits * math.log(2)

def run_performance_benchmarks():
    print("\n--- Performance Benchmarks ---")
    bit_lengths = [512, 1024, 2048]
    
    for bits in bit_lengths:
        print(f"Sampling {bits}-bit prime...", end="", flush=True)
        start_time = time.time()
        p, trials = gen_prime(bits)
        end_time = time.time()
        
        theoretical = get_theoretical_density(bits)
        
        print("\r" + " " * 50 + "\r", end="") # Clear line
        print(f"{bits}-bit prime found in {trials} trials.")
        print(f"  Time taken: {end_time - start_time:.4f} seconds")
        print(f"  Theoretical trials (ln n): ~{theoretical:.2f}")
        print(f"  Ratio (actual/theoretical): {trials/theoretical:.4f}")

if __name__ == "__main__":
    run_carmichael_demo()
    run_performance_benchmarks()
