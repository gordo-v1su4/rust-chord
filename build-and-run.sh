#!/bin/bash

# Exit on error
set -e

echo "Building and running Rust Chord with Rust UI components..."

# Step 1: Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Step 2: Build the sampler-wasm module
echo "Building sampler-wasm module..."
cd sampler-wasm
wasm-pack build --target web --out-dir pkg
cd ..

# Step 3: Build the ui-components module
echo "Building ui-components module..."
cd ui-components
mkdir -p ../frontend/wasm/ui-components
wasm-pack build --target web --out-dir ../frontend/wasm/ui-components
cd ..

# Step 4: Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Step 5: Start the development server
echo "Starting development server..."
echo "Open https://localhost:8080/index-rust.html in your browser to use the Rust UI version"
npm run dev