import os

class Random:
    def seed(self, a=None, version=2):
        """Os.urandom does not use a seed, so this method is a no-op."""
        pass

    def getrandbits(self, k):
        """Returns a Python integer with k random bits."""
        if k < 0:
            raise ValueError("number of bits must be non-negative")
        if k == 0:
            return 0
        num_bytes = (k + 7) // 8
        random_bytes = os.urandom(num_bytes)
        random_int = int.from_bytes(random_bytes, 'big')
        # Mask to ensure only k bits are returned
        return random_int & ((1 << k) - 1)

    def randint(self, a, b):
        """Returns a random integer in the range [a, b], including both endpoints."""
        if a > b:
            raise ValueError("a must be <= b")
        range_size = b - a + 1
        if range_size == 1:
            return a
        
        num_bits = (range_size - 1).bit_length()
        while True:
            val = self.getrandbits(num_bits)
            if val < range_size:
                return a + val

    def randrange(self, start, stop=None, step=1):
        """Returns a randomly selected element from range(start, stop, step)."""
        if stop is None:
            if start <= 0:
                raise ValueError("empty range for randrange()")
            return self.randint(0, start - 1)
        
        if step == 0:
            raise ValueError("zero step for randrange()")
        
        n = (stop - start + (step - (1 if step > 0 else -1))) // step
        if n <= 0:
            raise ValueError("empty range for randrange()")
        
        return start + step * self.randint(0, n - 1)

    def choice(self, seq):
        """Returns a random element from a non-empty sequence."""
        if not seq:
            raise IndexError("Cannot choose from an empty sequence")
        return seq[self.randint(0, len(seq) - 1)]

    def random(self):
        """Returns a random float in [0.0, 1.0)."""
        # Python's random.random() uses 53 bits of precision
        return self.getrandbits(53) / (1 << 53)

    def uniform(self, a, b):
        """Returns a random float in [a, b]."""
        return a + (b - a) * self.random()

    def shuffle(self, x):
        """Shuffles the list x in place."""
        for i in range(len(x) - 1, 0, -1):
            j = self.randint(0, i)
            x[i], x[j] = x[j], x[i]

    def sample(self, population, k):
        """Returns a k-length list of unique elements chosen from the population."""
        if not isinstance(population, (list, tuple, range)):
            population = list(population)
        n = len(population)
        if not 0 <= k <= n:
            raise ValueError("Sample larger than population or is negative")
        result = [None] * k
        indices = list(range(n))
        for i in range(k):
            j = self.randint(i, n - 1)
            indices[i], indices[j] = indices[j], indices[i]
            result[i] = population[indices[i]]
        return result

# Create a singleton instance to mimic the random module
random = Random()
