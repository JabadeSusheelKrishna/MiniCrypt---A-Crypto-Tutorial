# PA #18 ??? Oblivious Transfer (1-out-of-2)
# Depends only on PA 16
from proxy_random import random
import importlib

# Correct import
enc_module = importlib.import_module("pa16")

elgamal_keygen = enc_module.elgamal_keygen
elgamal_enc = enc_module.elgamal_enc
elgamal_dec = enc_module.elgamal_dec


# ----------------------------------------
# Receiver Step 1
# ----------------------------------------
def ot_receiver_step1(b, bits=32):
    """
    b = choice bit
    returns: pk0, pk1, state
    """

    # Real keypair
    sk_real, pk_real = elgamal_keygen(bits)

    p, g, q, h = pk_real

    # Fake public key (no known sk)
    fake_h = random.randint(2, p - 2)
    pk_fake = (p, g, q, fake_h)

    if b == 0:
        pk0, pk1 = pk_real, pk_fake
    else:
        pk0, pk1 = pk_fake, pk_real

    state = {
        "b": b,
        "sk": sk_real
    }

    return pk0, pk1, state


# ----------------------------------------
# Sender Step
# ----------------------------------------
def ot_sender_step(pk0, pk1, m0, m1):
    c0 = elgamal_enc(pk0, m0)
    c1 = elgamal_enc(pk1, m1)
    return c0, c1


# ----------------------------------------
# Receiver Step 2
# ----------------------------------------
def ot_receiver_step2(state, c0, c1):
    b = state["b"]
    sk = state["sk"]

    if b == 0:
        c1_, c2_ = c0
    else:
        c1_, c2_ = c1

    return elgamal_dec(sk, c1_, c2_)


# ----------------------------------------
# Full OT wrapper
# ----------------------------------------
def oblivious_transfer(m0, m1, b):
    pk0, pk1, state = ot_receiver_step1(b)
    c0, c1 = ot_sender_step(pk0, pk1, m0, m1)
    mb = ot_receiver_step2(state, c0, c1)
    return mb


# ----------------------------------------
# 2. Receiver Privacy Demo
# ----------------------------------------
def receiver_privacy_demo():
    print("\n--- Receiver Privacy ---")
    pk0, pk1, _ = ot_receiver_step1(random.randint(0, 1))

    print("pk0:", pk0)
    print("pk1:", pk1)
    print("Indistinguishable ??? sender cannot learn b")


# ----------------------------------------
# 3. Sender Privacy Demo
# ----------------------------------------
def sender_privacy_demo():
    print("\n--- Sender Privacy ---")

    m0, m1 = 10, 99
    b = 0

    pk0, pk1, state = ot_receiver_step1(b)
    c0, c1 = ot_sender_step(pk0, pk1, m0, m1)

    # Receiver only decrypts one
    recovered = ot_receiver_step2(state, c0, c1)

    print("Recovered:", recovered)
    print("Other message hidden (requires solving DLP)")


# ----------------------------------------
# 4. Correctness Test
# ----------------------------------------
def correctness_test(trials=100):
    print("\n--- Correctness Test ---")

    for _ in range(trials):
        m0 = random.randint(1, 100)
        m1 = random.randint(1, 100)
        b = random.randint(0, 1)

        mb = oblivious_transfer(m0, m1, b)

        expected = m0 if b == 0 else m1

        if mb != expected:
            print("Error!", m0, m1, b, mb)
            return

        print(".", end="")

    print(f"\nAll {trials} tests passed!")


# ----------------------------------------
# Demo
# ----------------------------------------
if __name__ == "__main__":
    m0 = 10
    m1 = 99

    print("Sender messages:", m0, m1)

    for b in [0, 1]:
        print(f"\nReceiver chooses b = {b}")
        mb = oblivious_transfer(m0, m1, b)
        print("Receiver got:", mb)

    receiver_privacy_demo()
    sender_privacy_demo()
    correctness_test()
