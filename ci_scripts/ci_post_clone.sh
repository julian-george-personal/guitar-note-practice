#!/bin/sh
set -e

npm ci
CAPACITOR=true npm run build
npx cap add ios
npx cap sync ios
