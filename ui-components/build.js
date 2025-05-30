#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const WASM_PACK_CMD = 'wasm-pack build --target web --out-dir ../frontend/wasm/ui-components';

function buildWasm() {
    console.log('Building UI Components WebAssembly...');
    
    try {
        // Ensure the output directory exists
        const outputDir = path.join(__dirname, '..', 'frontend', 'wasm', 'ui-components');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Run wasm-pack build
        execSync(WASM_PACK_CMD, {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        console.log('UI Components WebAssembly build completed successfully!');
        
    } catch (error) {
        console.error('Failed to build UI Components WebAssembly:', error.message);
        process.exit(1);
    }
}

// Run the build if this script is called directly
if (require.main === module) {
    buildWasm();
}

module.exports = { buildWasm };