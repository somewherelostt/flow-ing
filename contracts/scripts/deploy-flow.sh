#!/bin/bash

# Kaizen Flow Contract Deployment Script

echo "🚀 Deploying Kaizen Contracts to Flow Testnet..."

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "❌ Flow CLI is not installed. Please install it first:"
    echo "   https://developers.flow.com/tools/flow-cli/install"
    exit 1
fi

# Create accounts if they don't exist
echo "🔑 Setting up deployment account..."
flow accounts create --network testnet

# Deploy NonFungibleToken interface (if not already deployed)
echo "📦 Deploying KaizenEventNFT contract..."
flow accounts add-contract KaizenEventNFT contracts/cadence/KaizenEventNFT.cdc --network testnet

# Deploy KaizenEvent contract
echo "📦 Deploying KaizenEvent contract..."
flow accounts add-contract KaizenEvent contracts/cadence/KaizenEvent.cdc --network testnet

echo "✅ Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env.local with the deployed contract addresses"
echo "2. Update the contract addresses in lib/flow.ts"
echo "3. Test the contracts with Flow CLI:"
echo "   flow scripts execute scripts/get_events.cdc --network testnet"
echo ""
echo "🎉 Your contracts are now live on Flow Testnet!"
