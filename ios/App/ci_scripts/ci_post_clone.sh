#!/bin/sh
set -e

if ! command -v node > /dev/null 2>&1; then
  brew install node
fi

npm ci
CAPACITOR=true npm run web:build
npx cap sync ios
npx @capacitor/assets generate --ios
