#!/bin/bash

# Flow CLI deployment script for testnet
echo "Deploying Kaizen Event Platform to Flow Testnet..."

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null
then
    echo "Flow CLI could not be found. Please install it first:"
    echo "https://developers.flow.com/build/tools/flow-cli"
    exit 1
fi

# Generate new testnet account key if needed
if [ ! -f "testnet-account-key.pem" ]; then
    echo "Generating new testnet account key..."
    flow keys generate
    echo "Please fund your testnet account with FLOW tokens at:"
    echo "https://testnet-faucet.onflow.org/"
    read -p "Press enter after funding your account..."
fi

# Deploy contracts to testnet
echo "Deploying KaizenEvent contract..."
flow accounts create --network=testnet --key-file testnet-account-key.pem

echo "Updating contract addresses in flow.json..."
# This would need to be updated with the actual account address after deployment

echo "Deploying KaizenEventNFT contract..."
flow project deploy --network=testnet

echo "Deployment complete!"
echo "Remember to update your environment variables with the deployed contract addresses."
