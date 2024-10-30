from cryptography.fernet import Fernet

with open('key.key', 'rb') as key_file:
    key = key_file.read()
cipher_suite = Fernet(key)

with open('encrypted_file.txt', 'rb') as file:
    encrypted_data = file.read()
    decrypted_data = cipher_suite.decrypt(encrypted_data)

with open('decrypted_file.txt', 'wb') as file:
    file.write(decrypted_data)
