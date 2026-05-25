#!/bin/sh
set -e

npm ci
npm run ios:build
npx cap add ios
npx cap sync ios
npx @capacitor/assets generate --ios
