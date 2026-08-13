# pip install cryptography

from datetime import datetime
import os
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, PublicFormat, NoEncryption


def derive_keypair_from_password(password: str) -> tuple:
    # Generate random salt for key derivation
    salt = os.urandom(16)
    # Hash password down to a valid 32-byte private seed
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000
    )
    private_bytes = kdf.derive(password.encode())
    
    # Generate Private Key and extract Public Key
    private_key = x25519.X25519PrivateKey.from_private_bytes(private_bytes)
    public_key = private_key.public_key()
    
    return private_key, public_key, salt

def save_private_key(private_key, path='private_key.pem'):
    private_bytes = private_key.private_bytes(
        encoding=Encoding.PEM,
        format=PrivateFormat.PKCS8,
        encryption_algorithm=NoEncryption()
    )
    with open(path, 'wb') as f:
        f.write(private_bytes)

def save_public_key(public_key, path='public_key.pem'):
    public_bytes = public_key.public_bytes(
        encoding=Encoding.PEM,
        format=PublicFormat.SubjectPublicKeyInfo
    )
    with open(path, 'wb') as f:
        f.write(public_bytes)

def load_private_key(path='private_key.pem'):
    with open(path, 'rb') as f:
        data = f.read()
    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    return load_pem_private_key(data, password=None)

def load_public_key(path='public_key.pem'):
    with open(path, 'rb') as f:
        data = f.read()
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    return load_pem_public_key(data)

# --- EXECUTION ---
password = "coconut30050city"
private_key, public_key, salt = derive_keypair_from_password(password)

# Save keys to files
save_private_key(private_key, 'private_key.pem')
save_public_key(public_key, 'public_key.pem')

print(f"Private Key: {private_key}")
print(f"Public  Key: {public_key}")
print(f"Salt (hex): {salt.hex()}")

# 1. Create a Time-String payload for ballot QR code
now = datetime.now()
time_string = now.strftime("%Y%m%d_%H%M%S")
print(f"Original Time-String: {time_string}")
print(len(time_string))

# Load public key from file for encryption (simulating QR generation step)
public_key_loaded = load_public_key('public_key.pem')

# 2. Encrypt using loaded Public Key
ephemeral_private = x25519.X25519PrivateKey.generate()
shared_key = ephemeral_private.exchange(public_key_loaded)

# Derive symmetric encryption key from shared secret
hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'enc')
sym_key = hkdf.derive(shared_key)

# Encrypt the data
aead = ChaCha20Poly1305(sym_key)
nonce = b'12byte_nonce' # Use unique nonce in prod
ciphertext = aead.encrypt(nonce, time_string.encode(), None)
ephemeral_public_bytes = ephemeral_private.public_key().public_bytes_raw()

print(f"Encrypted Ciphertext (hex): {ciphertext.hex()}")
print(len(ciphertext.hex()))
# In real QR flow, ciphertext and ephemeral_public_bytes would be encoded into the QR code

# 3. Decrypt using private key loaded from file (simulating QR scan step)
private_key_loaded = load_private_key('private_key.pem')

# Reconstruct shared secret from incoming ephemeral public data
received_ephemeral_public = x25519.X25519PublicKey.from_public_bytes(ephemeral_public_bytes)
decrypted_shared_key = private_key_loaded.exchange(received_ephemeral_public)

# Re-derive symmetric key
decrypted_sym_key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'enc').derive(decrypted_shared_key)

# Decrypt
decrypted_aead = ChaCha20Poly1305(decrypted_sym_key)
decrypted_bytes = decrypted_aead.decrypt(nonce, ciphertext, None)

print(f"Decrypted Result: {decrypted_bytes.decode()}")

