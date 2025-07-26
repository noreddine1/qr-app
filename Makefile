.PHONY: start install android ios web

start:
	cd qr-scanner-app && npx expo start --tunnel

install:
	cd qr-scanner-app && npm install

