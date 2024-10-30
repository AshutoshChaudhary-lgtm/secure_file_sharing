from cryptography.fernet import Fernet

# Generate a key
key = Fernet.generate_key()
cipher_suite = Fernet(key)

# Save the key to a file
with open('key.key', 'wb') as key_file:
    key_file.write(key)

# Encrypt the file
with open('file_to_encrypt.txt', 'rb') as file:
    file_data = file.read()
    encrypted_data = cipher_suite.encrypt(file_data)

with open('encrypted_file.txt', 'wb') as file:
    file.write(encrypted_data)