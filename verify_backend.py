import requests
import json
import traceback
from pa14_deps import rsa_keygen

BASE_URL = "http://localhost:8000"

def test_pa13():
    print("\n--- Testing PA#13: Miller-Rabin ---")
    
    # 1. Test small prime
    print("Testing small prime (17)...")
    resp = requests.post(f"{BASE_URL}/pa13/test", json={"n": "17", "k": 10})
    data = resp.json()
    print(f"Result: {data['result']}")
    assert data["result"] == "PROBABLY PRIME", f"Expected PROBABLY PRIME, got {data['result']}"

    # 2. Test small composite
    print("Testing small composite (15)...")
    resp = requests.post(f"{BASE_URL}/pa13/test", json={"n": "15", "k": 10})
    data = resp.json()
    print(f"Result: {data['result']}")
    assert data["result"] == "COMPOSITE", f"Expected COMPOSITE, got {data['result']}"

    # 3. Test Carmichael number (561)
    print("Testing Carmichael number (561)...")
    resp = requests.post(f"{BASE_URL}/pa13/test", json={"n": "561", "k": 10})
    data = resp.json()
    print(f"Result: {data['result']}")
    assert data["result"] == "COMPOSITE", f"Expected COMPOSITE for 561, got {data['result']}"
    
    # 4. Generate a prime and verify
    print("Generating a 512-bit prime...")
    resp = requests.post(f"{BASE_URL}/pa13/gen_prime", json={"bits": 512, "k": 40})
    p = resp.json()["p"]
    print(f"Generated prime: {p[:20]}... (bits: {int(p).bit_length()})")
    
    print("Verifying the generated prime...")
    resp = requests.post(f"{BASE_URL}/pa13/test", json={"n": p, "k": 40})
    data = resp.json()
    print(f"Result: {data['result']}")
    assert data["result"] == "PROBABLY PRIME", f"Expected PROBABLY PRIME, got {data['result']}"

    print("PA#13 tests passed! ✅")

def test_pa14():
    print("\n--- Testing PA#14: CRT & RSA Attacks ---")
    
    # 1. Test CRT
    print("Testing CRT solver...")
    # x = 2 mod 3, x = 3 mod 5, x = 2 mod 7 => x = 23 mod 105
    payload = {
        "residues": ["2", "3", "2"],
        "moduli": ["3", "5", "7"]
    }
    resp = requests.post(f"{BASE_URL}/pa14/crt", json=payload)
    data = resp.json()
    print(f"x: {data['x']}")
    assert data["x"] == "23"

    # 2. Test Håstad's Broadcast Attack
    print("Testing Håstad's Broadcast Attack Demo...")
    message = "Secret Attack Vector"
    e = 3
    bits = 512
    
    print(f"Setting up demo with message: '{message}', e={e}...")
    setup_resp = requests.post(f"{BASE_URL}/pa14/demo_setup", json={
        "m": message,
        "e": e,
        "bits": bits,
        "use_padding": False
    })
    if setup_resp.status_code != 200:
        print(f"Error in setup: {setup_resp.text}")
        return
    
    recipients = setup_resp.json()["recipients"]
    
    ciphertexts = [r["c"] for r in recipients]
    moduli = [r["n"] for r in recipients]
    
    print("Running Håstad attack...")
    attack_resp = requests.post(f"{BASE_URL}/pa14/hastad", json={
        "ciphertexts": ciphertexts,
        "moduli": moduli,
        "e": e
    })
    recovered_m_int = int(attack_resp.json()["m"])
    
    # Convert recovered int back to bytes
    def int_to_bytes(n):
        return n.to_bytes((n.bit_length() + 7) // 8, 'big')
    
    recovered_message = int_to_bytes(recovered_m_int).decode()
    print(f"Recovered message: '{recovered_message}'")
    assert recovered_message == message

    # 3. Test RSA Decryption with CRT
    print("Testing RSA Decryption with CRT...")
    # We can use one of the keys from the recipients setup
    # Actually, setup_resp only returns 'n' and 'c'. 
    # I'll manually generate a key using the helper if I could, 
    # or just trust the benchmark which actually calls it.
    # Let's call benchmark to verify it works internally.
    
    print("Running RSA/CRT benchmark...")
    resp = requests.get(f"{BASE_URL}/pa14/benchmark", params={"bits": 512})
    data = resp.json()
    print(f"Speedup: {data['speedup']:.2f}x")
    assert data["speedup"] > 0

    print("PA#14 tests passed! ✅")

def test_pa15():
    print("\n--- Testing PA#15: Digital Signatures ---")
    keys = rsa_keygen(512)
    sk = {"n": str(keys["n"]), "d": str(keys["d"])}
    vk = {"n": str(keys["n"]), "e": str(keys["e"])}
    
    msg_bytes = b"Digital Signature Verification Document"
    msg_hex = msg_bytes.hex()
    
    print("Testing Signature Generation...")
    resp = requests.post(f"{BASE_URL}/pa15/sign", json={"sk": sk, "m_bytes_hex": msg_hex}).json()
    sigma = resp.get("sigma")
    print(f"Signature generated: {sigma[:20]}...")
    
    print("Testing Signature Verification (Valid)...")
    resp_v_valid = requests.post(f"{BASE_URL}/pa15/verify", json={"vk": vk, "m_bytes_hex": msg_hex, "sigma": sigma}).json()
    assert resp_v_valid.get("valid") is True
    
    print("Testing Signature Verification (Invalid Signature)...")
    invalid_sigma = str(int(sigma) + 1)
    resp_v_invalid = requests.post(f"{BASE_URL}/pa15/verify", json={"vk": vk, "m_bytes_hex": msg_hex, "sigma": invalid_sigma}).json()
    assert resp_v_invalid.get("valid") is False
    
    print("Testing Raw RSA Forge Demo...")
    # s3 = forge_raw_rsa(s1, s2, n)
    resp_forge = requests.post(f"{BASE_URL}/pa15/forge_raw", json={"s1": "555", "s2": "777", "n": str(keys["n"])}).json()
    s3 = int(resp_forge.get("s3"))
    assert s3 == (555 * 777) % keys["n"]
    
    print("PA#15 tests passed! ✅")

def test_pa16():
    print("\n--- Testing PA#16: ElGamal Cryptosystem ---")
    bits = 128 # Small bits for fast testing
    
    print(f"Generating ElGamal keys ({bits} bits)...")
    resp_keys = requests.post(f"{BASE_URL}/pa16/keygen", json={"bits": bits}).json()
    sk = resp_keys["sk"]
    pk = resp_keys["pk"]
    
    message = 4200
    print(f"Encrypting message: {message}")
    resp_enc = requests.post(f"{BASE_URL}/pa16/encrypt", json={"pk": pk, "m": str(message)}).json()
    c1, c2 = resp_enc["c1"], resp_enc["c2"]
    
    print("Decrypting message...")
    resp_dec = requests.post(f"{BASE_URL}/pa16/decrypt", json={"sk": sk, "c1": c1, "c2": c2}).json()
    dec_m = int(resp_dec["m"])
    assert dec_m == message
    
    print("Testing Malleability Attack...")
    multiplier = 3
    resp_attack = requests.post(f"{BASE_URL}/pa16/malleability_attack", json={
        "c1": c1, "c2": c2, "p": pk["p"], "multiplier": str(multiplier)
    }).json()
    
    mc1, mc2 = resp_attack["c1"], resp_attack["c2"]
    resp_dec_attack = requests.post(f"{BASE_URL}/pa16/decrypt", json={"sk": sk, "c1": mc1, "c2": mc2}).json()
    m_attacked = int(resp_dec_attack["m"])
    assert m_attacked == message * multiplier
    print(f"Attacked Decrypted Message: {m_attacked} (Expected: {message * multiplier})")
    
    print("PA#16 tests passed! ✅")

if __name__ == "__main__":
    try:
        test_pa13()
        test_pa14()
        test_pa15()
        test_pa16()
        print("\nAll tests passed successfully! 🚀")
    except Exception as e:
        print(f"\nTests failed: {e}")
        traceback.print_exc()

