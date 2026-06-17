# URL
https://sahera.my.id

# Assymetric Key Generation
Although not used, we should create a pair of private and public keys just in case it's needed for future updates. The following are the instructions from DOKU:
1. Generate private key RSA : `openssl genrsa -out private.key 2048`
2. set passphrase your private key RSA : `openssl pkcs8 -topk8 -inform PEM -outform PEM -in private.key -out pkcs8.key -v1 PBE-SHA1-3DES`
3. generate public key RSA : `openssl rsa -in private.key -outform PEM -pubout -out public.pem`
