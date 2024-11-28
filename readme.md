# Tollgate - Merchant

This Tollgate module is responsible for:

- Handling payments from customers
- Initiating session after payment
- Evaluating LAN sightings from crowsnest and making an economical decision on whether to connect to those spotted Tollgates.

### Docker build - Raspberry Pi

```bash
# For building on Mac with M1/2/3 chip include --platform linux/amd64 to create an amd build
docker build --platform linux/arm64 . -t tollgate-merchant

# To store docker image as tarball 
docker save tollgate-merchant > tollgate-merchant.tar

scp tollgate-merchant.tar admin@119.201.26.231:~/tollgate-docker/merchant
```
