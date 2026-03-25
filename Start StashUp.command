#!/bin/zsh

set -e

cd "/Users/jaspreetdhaliwal/budget-app"

if [ ! -d "node_modules" ]; then
  npm install
fi

npm run build
open "http://localhost:3000"
npm run start
