# Kaizen Event Platform - Contract Deployment Guide

## Current Issue

The error you're experiencing is:

```
cannot find declaration `KaizenEvent` in `0000000000000001.KaizenEvent`
```

This happens because the `KaizenEvent` contract hasn't been deployed to testnet yet, but your transaction is trying to import it.

## Solution: Deploy Contracts to Testnet

### Option 1: Use the Contract Deployer Component (Recommended)

1. **Connect your Flow Wallet** to the application
2. **Click the Upload icon** (📤) next to your wallet status in the header
3. **Click "Deploy All Contracts"** to deploy both contracts
4. **Wait for deployment** to complete (this may take a few minutes)
5. **Update your environment variables** with the new contract addresses

### Option 2: Deploy from Browser Console

If you prefer to deploy manually:

1. **Connect your Flow Wallet** to the application
2. **Open browser console** (F12 → Console)
3. **Run the deployment commands**:

```javascript
// Import the deployment functions
import { deployAllContracts } from './lib/deploy-contracts';

// Deploy all contracts
deployAllContracts()
  .then(result => {
    console.log('Deployment successful:', result);
  })
  .catch(error => {
    console.error('Deployment failed:', error);
  });
```

### Option 3: Use Flow CLI (Advanced)

If you have Flow CLI installed and want to use command line:

1. **Install Flow CLI**: <https://developers.flow.com/tools/flow-cli/install>
2. **Create a deployment account**:

   ```bash
   flow accounts create --network testnet
   ```

3. **Deploy contracts**:

   ```bash
   flow deploy --network testnet
   ```

## After Deployment

### 1. Update Environment Variables

Update your `.env.local` file with the deployed contract addresses:

```env
# Contract addresses (update after deployment)
NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT=0x[YOUR_DEPLOYED_ADDRESS]
NEXT_PUBLIC_KAIZEN_NFT_CONTRACT=0x[YOUR_DEPLOYED_ADDRESS]
```

### 2. Update Contract Addresses in Code

Update the contract addresses in `lib/flow.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  KAIZEN_EVENT: process.env.NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT || "0x[YOUR_DEPLOYED_ADDRESS]",
  KAIZEN_NFT: process.env.NEXT_PUBLIC_KAIZEN_NFT_CONTRACT || "0x[YOUR_DEPLOYED_ADDRESS]",
  // ... other addresses
};
```

### 3. Update Transaction Files

Update the import statements in your transaction files:

```cadence
// contracts/transactions/join_event.cdc
import KaizenEvent from 0x[YOUR_DEPLOYED_ADDRESS]
// ... rest of the transaction
```

## Verify Deployment

### Check on Flowscan

1. Go to [Flowscan Testnet](https://testnet.flowscan.io/)
2. Search for your wallet address: `0xb08860843312e513`
3. Check the "Contracts" tab to see deployed contracts

### Test the Contracts

After deployment, test the contracts:

1. **Create an event** using the deployed contract
2. **Join an event** to verify the join functionality works
3. **Check transaction status** on Flowscan

## Troubleshooting

### Common Issues

1. **"Insufficient balance"**: Make sure your wallet has enough FLOW tokens for gas fees
2. **"Transaction failed"**: Check the transaction details on Flowscan for specific errors
3. **"Contract not found"**: Verify the contract address is correct and the contract is deployed

### Gas Fees

- **Contract deployment**: ~0.1-0.5 FLOW per contract
- **Transaction execution**: ~0.01-0.05 FLOW per transaction
- **Make sure your wallet has at least 1 FLOW** for deployment

### Network Issues

- **Testnet**: Use `access.devnet.nodes.onflow.org:9000`
- **Mainnet**: Use `access.mainnet.nodes.onflow.org:9000`
- **Local**: Use `127.0.0.1:3569` (for emulator)

## Next Steps

After successful deployment:

1. **Test event creation** and joining
2. **Implement NFT minting** for event attendees
3. **Add more features** like event management and analytics
4. **Deploy to mainnet** when ready for production

## Support

If you encounter issues:

1. Check the [Flow documentation](https://developers.flow.com/)
2. Visit the [Flow Discord](https://discord.gg/flow)
3. Review transaction logs on [Flowscan](https://testnet.flowscan.io/)

## Contract Details

### KaizenEvent Contract

- **Purpose**: Manages events, attendees, and payments
- **Features**: Event creation, joining, attendee tracking
- **Storage**: Event data, attendee lists, event manager

### KaizenEventNFT Contract

- **Purpose**: Mints POAP NFTs for event attendees
- **Features**: NFT collection, minting, metadata
- **Storage**: NFT collections, minter resources

Both contracts use the latest Cadence 1.0 syntax and follow Flow best practices for security and efficiency.
