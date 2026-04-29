import importlib
import random

# Load modules
sig_module = importlib.import_module("pa15")
enc_module = importlib.import_module("pa16")

# Bind functions
sign = sig_module.rsa_sign
verify = sig_module.rsa_verify

elgamal_enc = enc_module.elgamal_enc
elgamal_dec = enc_module.elgamal_dec


# ----------------------------------------
# Helper: Serialize ciphertext
# ----------------------------------------
def serialize_ciphertext(c):
    c1, c2 = c
    return f"{c1},{c2}".encode()


# ----------------------------------------
# 1. Encrypt-then-Sign
# ----------------------------------------
def cca_encrypt(pk_enc, sk_sign, m):
    CE = elgamal_enc(pk_enc, m)
    sigma = sign(sk_sign, serialize_ciphertext(CE))
    return CE, sigma


# ----------------------------------------
# 2. Verify-then-Decrypt
# ----------------------------------------
def cca_decrypt(sk_enc, vk_sign, CE, sigma):
    # VERIFY FIRST (critical)
    if not verify(vk_sign, serialize_ciphertext(CE), sigma):
        return None   # ⊥

    c1, c2 = CE
    return elgamal_dec(sk_enc, c1, c2)


# ----------------------------------------
# 3. IND-CCA2 GAME
# ----------------------------------------
def ind_cca2_game(pk_enc, sk_enc, vk_sign, sk_sign, adversary):
    """
    adversary:
      phase1(pk_enc, vk_sign) -> (m0, m1, state)
      phase2(pk_enc, vk_sign, CE*, sigma*, oracle, state) -> guess
    """

    # Phase 1
    m0, m1, state = adversary[0](pk_enc, vk_sign)

    # Challenger
    b = random.randint(0, 1)
    mb = m1 if b else m0

    CE_star, sigma_star = cca_encrypt(pk_enc, sk_sign, mb)

    # Decryption oracle
    def oracle(CE, sigma):
        # Cannot query challenge ciphertext
        if CE == CE_star and sigma == sigma_star:
            return None
        return cca_decrypt(sk_enc, vk_sign, CE, sigma)

    # Phase 2
    b_guess = adversary[1](pk_enc, vk_sign, CE_star, sigma_star, oracle, state)

    return 1 if b_guess == b else 0


# ----------------------------------------
# Dummy adversary (should fail)
# ----------------------------------------
def dummy_adversary():
    def phase1(pk_enc, vk_sign):
        return 10, 20, None

    def phase2(pk_enc, vk_sign, CE, sigma, oracle, state):
        # Try modifying ciphertext (CCA attempt)
        c1, c2 = CE
        p = pk_enc[0]

        modified = (c1, (2 * c2) % p)

        result = oracle(modified, sigma)

        # If attack worked → learn something
        if result is not None:
            return 1
        return random.randint(0, 1)

    return (phase1, phase2)


# ----------------------------------------
# 4. CPA vs CCA comparison
# ----------------------------------------
def cpa_attack_demo(pk_enc, sk_enc, message):
    print("\n--- CPA Attack (ElGamal) ---")

    c = elgamal_enc(pk_enc, message)
    c1, c2 = c
    p = pk_enc[0]

    modified = (c1, (2 * c2) % p)

    decrypted = elgamal_dec(sk_enc, modified[0], modified[1])

    print("Original:", message)
    print("After attack (should be 2*m):", decrypted)


def cca_attack_demo(pk_enc, sk_enc, vk_sign, sk_sign, message):
    print("\n--- CCA Attack (Blocked) ---")

    CE, sigma = cca_encrypt(pk_enc, sk_sign, message)

    c1, c2 = CE
    p = pk_enc[0]

    modified = (c1, (2 * c2) % p)

    result = cca_decrypt(sk_enc, vk_sign, modified, sigma)

    print("Modified ciphertext:", modified)

    if result is None:
        print("Attack blocked (⊥)")
    else:
        print("Unexpected success:", result)


# ----------------------------------------
# MAIN DEMO
# ----------------------------------------
if __name__ == "__main__":
    # Keygen
    sk_enc, pk_enc = enc_module.elgamal_keygen(64)
    vk_sign, sk_sign = sig_module.keygen()

    message = 42

    print("Original message:", message)

    # Basic test
    CE, sigma = cca_encrypt(pk_enc, sk_sign, message)
    dec = cca_decrypt(sk_enc, vk_sign, CE, sigma)

    print("\nDecrypted:", dec)

    # CPA vs CCA demo
    cpa_attack_demo(pk_enc, sk_enc, message)
    cca_attack_demo(pk_enc, sk_enc, vk_sign, sk_sign, message)

    # CCA2 game
    print("\n--- IND-CCA2 Game ---")
    adv = dummy_adversary()

    wins = 0
    trials = 20

    for _ in range(trials):
        wins += ind_cca2_game(pk_enc, sk_enc, vk_sign, sk_sign, adv)

    print(f"Adversary success rate: {wins}/{trials}")