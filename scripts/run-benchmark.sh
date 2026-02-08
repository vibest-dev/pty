#!/bin/bash

#
# Flow Control Benchmark Runner
#
# This script runs comprehensive performance benchmarks for the flow control system
# and generates a detailed report with metrics for each zone.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 Flow Control Performance Benchmark"
echo "======================================"

# Check if Rust daemon is built
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: Cargo not found. Please install Rust."
    exit 1
fi

# Check if Bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun not found. Please install Bun or use Node.js."
    echo "   Install with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

cd "$PROJECT_ROOT"

# Ensure daemon is built in release mode
echo "🏗️  Building daemon in release mode..."
cargo build --release --bin vibest-pty-daemon

# Install TypeScript dependencies
echo "📦 Installing dependencies..."
cd packages/pty-daemon
bun install
cd "$PROJECT_ROOT"

# Run benchmark
echo "🚀 Starting benchmark..."
bun run scripts/benchmark-flow-control.ts

# Check if report was generated
if [ -f "flow-control-benchmark-report.md" ]; then
    echo ""
    echo "📊 Benchmark Summary:"
    echo "===================="

    # Extract key metrics from report
    if command -v grep &> /dev/null; then
        echo ""
        grep "| [A-Z]" flow-control-benchmark-report.md | head -n 5
        echo ""

        echo "🔍 Key Findings:"
        grep -A 10 "## Analysis" flow-control-benchmark-report.md | head -n 10
    fi

    echo ""
    echo "✅ Full report available at: flow-control-benchmark-report.md"
else
    echo "⚠️  Warning: Benchmark report not generated"
fi

echo ""
echo "🎉 Benchmark complete!"