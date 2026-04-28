from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
from pa13 import miller_rabin, gen_prime, is_prime, modular_exponentiation
from pa14 import crt, rsa_dec_crt, hastad_attack, benchmark_decryption, rsa_keygen, rsa_enc
from pa15 import rsa_sign, rsa_verify, forge_raw_rsa
from pa16 import elgamal_keygen, elgamal_enc, elgamal_dec, elgamal_malleability_attack
import os

def pkcs15_pad(m_bytes, n_bytes):
    msg_len = len(m_bytes)
    if msg_len > n_bytes - 11:
        raise ValueError("Message too long for padding")
    ps_len = n_bytes - msg_len - 3
    ps = b''
    while len(ps) < ps_len:
        new_byte = os.urandom(1)
        if new_byte != b'\x00':
            ps += new_byte
    return b'\x00\x02' + ps + b'\x00' + m_bytes

def int_to_bytes(n):
    return n.to_bytes((n.bit_length() + 7) // 8, 'big')

def bytes_to_int(b):
    return int.from_bytes(b, 'big')


app = FastAPI(title="Minicrypt Clique API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PrimalityTestRequest(BaseModel):
    n: str
    k: int

class GenPrimeRequest(BaseModel):
    bits: int
    k: Optional[int] = 40

class CRTRequest(BaseModel):
    residues: List[str]
    moduli: List[str]

class RSADecCRTRequest(BaseModel):
    sk: dict
    c: str

class HastadRequest(BaseModel):
    ciphertexts: List[str]
    moduli: List[str]
    e: int

class HastadDemoRequest(BaseModel):
    m: str
    e: int
    bits: int
    use_padding: bool

# PA15 Models
class PA15SignRequest(BaseModel):
    sk: dict  # n and d
    m_bytes_hex: str

class PA15VerifyRequest(BaseModel):
    vk: dict  # n and e
    m_bytes_hex: str
    sigma: str

class PA15ForgeRequest(BaseModel):
    s1: str
    s2: str
    n: str

class PA15KeygenRequest(BaseModel):
    bits: int

# PA16 Models
class PA16KeygenRequest(BaseModel):
    bits: int

class PA16EncRequest(BaseModel):
    pk: dict  # p, g, q, h
    m: str

class PA16DecRequest(BaseModel):
    sk: dict  # x, p
    c1: str
    c2: str

class PA16MalleabilityRequest(BaseModel):
    c1: str
    c2: str
    p: str
    multiplier: str

@app.post("/pa13/test")
async def test_primality(request: PrimalityTestRequest):
    try:
        n = int(request.n)
        start_time = time.time()
        result, witnesses = miller_rabin(n, request.k)
        end_time = time.time()
        
        return {
            "n": str(n),
            "result": result,
            "witnesses": witnesses,
            "time_taken": end_time - start_time
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid integer input")

@app.post("/pa13/gen_prime")
async def generate_prime(request: GenPrimeRequest):
    start_time = time.time()
    p, trials = gen_prime(request.bits, request.k)
    end_time = time.time()
    
    return {
        "p": str(p),
        "trials": trials,
        "time_taken": end_time - start_time
    }

@app.get("/pa13/carmichael")
async def carmichael_demo():
    n = 561
    # Fermat with a=2
    fermat_passed = modular_exponentiation(2, n-1, n) == 1
    # Miller-Rabin
    mr_result, witnesses = miller_rabin(n, k=1)
    
    return {
        "n": n,
        "fermat_passed": fermat_passed,
        "mr_result": mr_result,
        "witnesses": witnesses
    }

# PA#14 Endpoints
@app.post("/pa14/crt")
async def solve_crt(request: CRTRequest):
    try:
        residues = [int(r) for r in request.residues]
        moduli = [int(m) for m in request.moduli]
        x = crt(residues, moduli)
        return {"x": str(x)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa14/rsa_dec_crt")
async def rsa_decrypt_crt(request: RSADecCRTRequest):
    try:
        sk = {k: int(v) for k, v in request.sk.items()}
        c = int(request.c)
        m = rsa_dec_crt(sk, c)
        return {"m": str(m)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa14/hastad")
async def run_hastad(request: HastadRequest):
    try:
        ciphertexts = [int(c) for c in request.ciphertexts]
        moduli = [int(m) for m in request.moduli]
        m = hastad_attack(ciphertexts, moduli, request.e)
        return {"m": str(m)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa14/demo_setup")
async def hastad_demo_setup(request: HastadDemoRequest):
    try:
        e = request.e
        bits = request.bits
        m_str = request.m
        m_bytes = m_str.encode()
        
        recipients = []
        for _ in range(e):
            # Pass e=request.e to ensure we get keys compatible with the requested e
            keys = rsa_keygen(bits // 2, e=e)
            n_i = keys['n']
            
            if request.use_padding:
                padded = pkcs15_pad(m_bytes, (n_i.bit_length() + 7) // 8)
                m_val = bytes_to_int(padded)
            else:
                m_val = bytes_to_int(m_bytes)
            
            c_i = rsa_enc((n_i, e), m_val)
            recipients.append({
                "n": str(n_i),
                "c": str(c_i)
            })
            
        return {"recipients": recipients}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/pa14/benchmark")
async def run_benchmark(bits: int = 1024):
    avg_std, avg_crt, speedup = benchmark_decryption(bits, iterations=10)
    return {
        "bits": bits,
        "avg_std_ms": avg_std * 1000,
        "avg_crt_ms": avg_crt * 1000,
        "speedup": speedup
    }


# PA15 Endpoints
@app.post("/pa15/sign")
async def pa15_sign(request: PA15SignRequest):
    try:
        sk = (int(request.sk["n"]), int(request.sk["d"]))
        m_bytes = bytes.fromhex(request.m_bytes_hex)
        sigma = rsa_sign(sk, m_bytes)
        return {"sigma": str(sigma)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa15/verify")
async def pa15_verify(request: PA15VerifyRequest):
    try:
        vk = (int(request.vk["n"]), int(request.vk["e"]))
        m_bytes = bytes.fromhex(request.m_bytes_hex)
        sigma = int(request.sigma)
        is_valid = rsa_verify(vk, m_bytes, sigma)
        return {"valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa15/forge_raw")
async def pa15_forge(request: PA15ForgeRequest):
    s1 = int(request.s1)
    s2 = int(request.s2)
    n = int(request.n)
    s3 = forge_raw_rsa(s1, s2, n)
    return {"s3": str(s3)}

@app.post("/pa15/keygen")
async def pa15_keygen(request: PA15KeygenRequest):
    try:
        keys = rsa_keygen(request.bits)
        return {
            "pk": {"n": str(keys["n"]), "e": str(keys["e"])},
            "sk": {"n": str(keys["n"]), "d": str(keys["d"])}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# PA16 Endpoints
@app.post("/pa16/keygen")
async def pa16_keygen(request: PA16KeygenRequest):
    try:
        sk, pk = elgamal_keygen(request.bits)
        x, p_sk = sk
        p, g, q, h = pk
        return {
            "sk": {"x": str(x), "p": str(p_sk)},
            "pk": {"p": str(p), "g": str(g), "q": str(q), "h": str(h)}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa16/encrypt")
async def pa16_encrypt(request: PA16EncRequest):
    try:
        pk = (int(request.pk["p"]), int(request.pk["g"]), int(request.pk["q"]), int(request.pk["h"]))
        m = int(request.m)
        c1, c2 = elgamal_enc(pk, m)
        return {"c1": str(c1), "c2": str(c2)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa16/decrypt")
async def pa16_decrypt(request: PA16DecRequest):
    try:
        sk = (int(request.sk["x"]), int(request.sk["p"]))
        c1 = int(request.c1)
        c2 = int(request.c2)
        m = elgamal_dec(sk, c1, c2)
        return {"m": str(m)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pa16/malleability_attack")
async def pa16_attack(request: PA16MalleabilityRequest):
    try:
        c1 = int(request.c1)
        c2 = int(request.c2)
        p = int(request.p)
        mult = int(request.multiplier)
        nc1, nc2 = elgamal_malleability_attack(c1, c2, p, mult)
        return {"c1": str(nc1), "c2": str(nc2)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
