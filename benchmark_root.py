
import time

def integer_nth_root(x, e):
    if x == 0: return 0
    if x < 0: return None
    
    # Initial guess: 2^(bits/e + 1)
    low = 0
    high = 1 << ((x.bit_length() + e - 1) // e + 1)
    
    # Newton's method
    y = high
    while True:
        # y_next = ((e-1)*y + x // y^(e-1)) // e
        y_next = ((e - 1) * y + (x // (y**(e - 1)))) // e
        if y_next >= y:
            break
        y = y_next
    
    while pow(y + 1, e) <= x:
        y += 1
    while pow(y, e) > x:
        y -= 1
        
    return y

# Test with a very large x that is not a perfect cube
e = 3
bits = 10000 # 10k bits
x = (1 << bits) + 7
print(f"Testing {bits} bits...")
start = time.time()
root = integer_nth_root(x, e)
end = time.time()
print(f"Result: {root % 1000}...")
print(f"Time taken: {end - start:.6f}s")

# Test with a huge x (e.g. 100k bits)
bits = 100000
x = (1 << bits) + 123
print(f"Testing {bits} bits...")
start = time.time()
root = integer_nth_root(x, e)
end = time.time()
print(f"Result: {root % 1000}...")
print(f"Time taken: {end - start:.6f}s")
