#!/bin/sh
set -e

cd "$CI_PRIMARY_REPOSITORY_PATH"

if ! command -v node > /dev/null 2>&1; then
  brew install node
fi

npm ci
CAPACITOR=true npm run web:build
npx cap copy ios
npx @capacitor/assets generate --ios
