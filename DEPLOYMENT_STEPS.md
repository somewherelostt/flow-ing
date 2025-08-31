# 🚀 Contract Deployment Guide

## Current Situation

- **Your Wallet**: `0xb08860843312e513` (connected wallet)
- **Target Testnet Account**: `0xb03ac3adafdd51f2` (where contracts will be deployed)
- **Issue**: Contracts not deployed yet, causing import errors

## 🎯 Solution: Deploy Contracts via Browser

### Step 1: Connect Your Wallet

1. Open your Kaizen Event app
2. Connect your Flow wallet (`0xb08860843312e513`)
3. Make sure you're connected to **testnet**

### Step 2: Deploy Contracts

1. **Look for the Upload icon (📤)** in your app header
2. **Click "Deploy All Contracts"**
3. **Approve the transaction** in your wallet
4. **Wait for deployment** to complete (may take 2-5 minutes)

### Step 3: Get New Contract Addresses

After successful deployment, you'll see:

- Transaction IDs for both contracts
- New contract addresses (will be your wallet address: `0xb08860843312e513`)

### Step 4: Update Configuration

1. **Create `.env.local` file** in your project root:

```env
NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT=0xb08860843312e513
NEXT_PUBLIC_KAIZEN_NFT_CONTRACT=0xb08860843312e513
```

2. **Update `lib/flow.ts`** (already done):

```typescript
export const CONTRACT_ADDRESSES = {
  KAIZEN_EVENT: process.env.NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT || "0xb08860843312e513",
  KAIZEN_NFT: process.env.NEXT_PUBLIC_KAIZEN_NFT_CONTRACT || "0xb08860843312e513",
  // ... other addresses
};
```

## 🔍 Alternative: Browser Console Deployment

If the UI deployment doesn't work, you can deploy from the browser console:

1. **Open browser console** (F12 → Console)
2. **Import the deployment functions**:

```javascript
import { deployAllContracts } from './lib/deploy-contracts-browser';
```

3. **Deploy contracts**:

```javascript
deployAllContracts()
  .then(result => {
    console.log('Deployment successful:', result);
  })
  .catch(error => {
    console.error('Deployment failed:', error);
  });
```

## ✅ After Deployment

1. **Test your transactions** - they should work now!
2. **Create events** using the deployed contracts
3. **Join events** and mint POAP NFTs
4. **Monitor transactions** on [Flowscan Testnet](https://testnet.flowscan.io/)

## 🆘 Troubleshooting

### If deployment fails

- Check your wallet has enough FLOW tokens for gas
- Ensure you're connected to testnet, not mainnet
- Try deploying one contract at a time
- Check the browser console for detailed error messages

### If contracts still don't work

- Verify the contract addresses in your `.env.local` file
- Restart your development server
- Check that the contracts were deployed to the correct network

## 🔧 Recent Fixes Applied

### String Escaping Issue (Fixed ✅)

- **Problem**: Contract code with quotes and newlines was causing parsing errors
- **Solution**: Added proper string escaping for Cadence deployment
- **Result**: Contracts should now deploy without string parsing errors

### Improved Error Handling

- Better error messages and user feedback
- Automatic fallback deployment methods
- Increased gas limits for contract deployment

## 📞 Need Help?

The deployment process is now automated through your app's UI. Simply:

1. Connect wallet
2. Click deploy
3. Wait for completion
4. Update environment variables
5. Test your transactions!

Your contracts will be deployed to your wallet address `0xb08860843312e513` on Flow testnet.

## 🚨 Important Notes

- **String escaping has been fixed** - the previous "invalid end of string literal" error should not occur
- **Gas limits increased** to 3000 for reliable contract deployment
- **Better error reporting** with detailed console logs
- **Automatic success alerts** showing new contract addresses
