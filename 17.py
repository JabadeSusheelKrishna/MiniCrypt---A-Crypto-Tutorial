# PA #17 — CCA-Secure PKC (Encrypt-then-Sign)

import importlib

# Import dependencies
sig_module = importlib.import_module("15")
enc_module = importlib.import_module("16")

sign = sig_module.sign
verify = sig_module.verify

elgamal_enc = enc_module.elgamal_enc
elgamal_dec = enc_module.elgamal_dec


# ----------------------------------------
# CCA-Secure Encryption (Encrypt-then-Sign)
# ----------------------------------------

def cca_encrypt(pk_enc, sk_sign, message):
    """
    pk_enc  : public key for encryption (ElGamal)
    sk_sign : signing key (RSA or ElGamal signature)
    message : plaintext (int or group element)

    returns: (ciphertext, signature)
    """

    # Step 1: Encrypt
    ciphertext = elgamal_enc(pk_enc, message)   # (c1, c2)

    # Step 2: Sign the ciphertext
    signature = sign(sk_sign, str(ciphertext))

    return ciphertext, signature


# ----------------------------------------
# CCA-Secure Decryption (Verify-then-Decrypt)
# ----------------------------------------

def cca_decrypt(sk_enc, vk_sign, ciphertext, signature):
    """
    sk_enc  : secret key for decryption
    vk_sign : verification key
    ciphertext : (c1, c2)
    signature  : signature on ciphertext

    returns: message OR None (⊥)
    """

    # Step 1: VERIFY FIRST (critical for CCA security)
    if not verify(vk_sign, str(ciphertext), signature):
        return None   # ⊥ (reject)

    # Step 2: Decrypt only if valid
    message = elgamal_dec(sk_enc, ciphertext)

    return message


# ----------------------------------------
# Attack Demo (CPA vs CCA)
# ----------------------------------------

def malleability_attack(pk_enc, sk_enc, sk_sign, vk_sign, message):
    """
    Demonstrates:
    - CPA scheme is malleable
    - CCA scheme prevents attack
    """

    print("\n--- Original Encryption ---")
    c, sig = cca_encrypt(pk_enc, sk_sign, message)
    print("Ciphertext:", c)

    # Modify ciphertext (ElGamal malleability)
    c1, c2 = c
    modified_c = (c1, (2 * c2) % pk_enc['p'])

    print("\n--- Modified Ciphertext ---")
    print(modified_c)

    # Try decrypting modified ciphertext
    result = cca_decrypt(sk_enc, vk_sign, modified_c, sig)

    print("\n--- Decryption Result ---")
    if result is None:
        print("Attack blocked (⊥ returned)")
    else:
        print("Attack succeeded:", result)


# ----------------------------------------
# Demo / Testing
# ----------------------------------------

if __name__ == "__main__":
    # Assume your PA#16 has keygen
    pk_enc, sk_enc = enc_module.elgamal_keygen()

    # Assume your PA#15 has keygen
    vk_sign, sk_sign = sig_module.keygen()

    message = 42

    print("Original message:", message)

    # Encrypt
    ciphertext, signature = cca_encrypt(pk_enc, sk_sign, message)
    print("\nCiphertext:", ciphertext)
    print("Signature:", signature)

    # Decrypt
    decrypted = cca_decrypt(sk_enc, vk_sign, ciphertext, signature)
    print("\nDecrypted:", decrypted)

    # Attack demo
    malleability_attack(pk_enc, sk_enc, sk_sign, vk_sign, message)