# PA #18 — Oblivious Transfer (1-out-of-2)

import random
import importlib

# Import your ElGamal from 16.py
enc_module = importlib.import_module("16")

elgamal_keygen = enc_module.elgamal_keygen
elgamal_enc = enc_module.elgamal_enc
elgamal_dec = enc_module.elgamal_dec


# ----------------------------------------
# Receiver Step 1
# ----------------------------------------

def ot_receiver_step1(b):
    """
    b = choice bit (0 or 1)

    Returns:
        pk0, pk1, state
    """

    # Generate one real keypair
    pk_real, sk_real = elgamal_keygen()

    # Fake public key (no secret key known)
    p = pk_real['p']
    g = pk_real['g']

    fake_h = random.randint(2, p - 2)
    pk_fake = {'p': p, 'g': g, 'h': fake_h}

    if b == 0:
        pk0, pk1 = pk_real, pk_fake
    else:
        pk0, pk1 = pk_fake, pk_real

    state = {
        'b': b,
        'sk': sk_real
    }

    return pk0, pk1, state


# ----------------------------------------
# Sender Step
# ----------------------------------------

def ot_sender_step(pk0, pk1, m0, m1):
    """
    Sender encrypts both messages
    """

    c0 = elgamal_enc(pk0, m0)
    c1 = elgamal_enc(pk1, m1)

    return c0, c1


# ----------------------------------------
# Receiver Step 2
# ----------------------------------------

def ot_receiver_step2(state, c0, c1):
    """
    Receiver decrypts only chosen ciphertext
    """

    b = state['b']
    sk = state['sk']

    if b == 0:
        return elgamal_dec(sk, c0)
    else:
        return elgamal_dec(sk, c1)


# ----------------------------------------
# Full OT Wrapper
# ----------------------------------------

def oblivious_transfer(m0, m1, b):
    """
    Runs full OT protocol
    """

    # Step 1: Receiver sends keys
    pk0, pk1, state = ot_receiver_step1(b)

    # Step 2: Sender encrypts
    c0, c1 = ot_sender_step(pk0, pk1, m0, m1)

    # Step 3: Receiver decrypts chosen message
    mb = ot_receiver_step2(state, c0, c1)

    return mb


# ----------------------------------------
# Demo / Testing
# ----------------------------------------

if __name__ == "__main__":
    m0 = 10
    m1 = 99

    print("Sender messages:", m0, m1)

    for b in [0, 1]:
        print(f"\nReceiver chooses b = {b}")

        mb = oblivious_transfer(m0, m1, b)

        print("Receiver got:", mb)