#!/bin/sh
set -e

npm ci
CAPACITOR=true npm run web:build
npx cap add ios
npx cap sync ios
npx @capacitor/assets generate --ios
