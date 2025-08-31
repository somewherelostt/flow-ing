# Kaizen - Web3 Events & NFTs on Flow Blockchain

A decentralized event management platform built on the Flow blockchain, featuring event creation, ticket sales, and POAP NFT rewards.

## 🚀 Features

- **Event Management**: Create, manage, and discover events
- **Flow Blockchain Integration**: Secure and fast transactions on Flow
- **NFT Rewards**: POAP (Proof of Attendance Protocol) NFTs for attendees
- **Wallet Integration**: Seamless Flow wallet connection
- **Real-time Verification**: Transaction status and blockchain verification
- **Mobile-First Design**: Optimized for mobile devices

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Blockchain**: Flow blockchain with Cadence smart contracts
- **Wallet**: Flow Client Library (FCL) integration
- **Backend**: Node.js API for event management
- **Database**: MongoDB for event data

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Flow CLI installed
- Flow wallet (Blocto, Lilico, Dapper, etc.)
- Testnet FLOW tokens

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd flow-ing
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:

   ```env
   NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
   NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
   NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT=0xb03ac3adafdd51f2
   NEXT_PUBLIC_KAIZEN_NFT_CONTRACT=0xb03ac3adafdd51f2
   ```

4. **Deploy smart contracts**

   ```bash
   # Windows
   deploy-contracts.bat
   
   # Linux/Mac
   ./deploy-contracts.sh
   ```

## 🔧 Smart Contract Deployment

### Using Flow CLI

1. **Configure Flow CLI for testnet**

   ```bash
   flow config set env=testnet
   ```

2. **Deploy contracts**

   ```bash
   flow deploy --update --network=testnet
   ```

3. **Verify deployment**

   ```bash
   flow scripts execute contracts/scripts/test_contracts.cdc --network=testnet
   ```

### Contract Addresses

- **KaizenEvent**: `0xb03ac3adafdd51f2`
- **KaizenEventNFT**: `0xb03ac3adafdd51f2`

## 🚀 Running the Application

1. **Start the development server**

   ```bash
   pnpm dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Connect your Flow wallet**
   - Click "Connect Wallet" in the header
   - Choose your preferred Flow wallet
   - Approve the connection

## 💡 Usage Guide

### Creating Events

1. Navigate to the event creation page
2. Fill in event details (name, description, price, date, location)
3. Upload an event image
4. Submit the transaction
5. Wait for blockchain confirmation

### Joining Events

1. Browse available events
2. Click on an event to view details
3. Click "Join Event" or "Buy Ticket"
4. Approve the transaction in your wallet
5. Receive confirmation and POAP NFT

### Transaction Verification

- All transactions are automatically verified on the Flow blockchain
- View transaction details in the transaction drawer
- Check transaction status on Flowscan
- Copy transaction hashes for external verification

## 🔍 Smart Contract Details

### KaizenEvent Contract

- **Event Management**: Create, read, and manage events
- **Payment Processing**: Handle FLOW token payments
- **Attendee Tracking**: Track event participants
- **Public Interface**: Read-only access to event data

### KaizenEventNFT Contract

- **POAP Minting**: Create attendance NFTs
- **Metadata Support**: Rich NFT metadata with event details
- **Collection Management**: User NFT collections
- **Standards Compliance**: NonFungibleToken and MetadataViews

## 🧪 Testing

### Test Scripts

```bash
# Test contract functionality
flow scripts execute contracts/scripts/test_contracts.cdc --network=testnet

# Test event creation
flow scripts execute contracts/scripts/test_create_event.cdc --network=testnet

# Test event joining
flow scripts execute contracts/scripts/test_join_event.cdc --network=testnet
```

### Manual Testing

1. **Create a test event**
   - Use the event creation form
   - Verify transaction on Flowscan

2. **Join the test event**
   - Connect a different wallet
   - Join the event and verify payment

3. **Check NFT minting**
   - Verify POAP NFT in wallet
   - Check metadata and traits

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot find declaration" error**
   - Ensure contracts are deployed to the correct address
   - Check contract import paths in transactions

2. **Transaction preprocessing failed**
   - Verify contract addresses in `lib/flow.ts`
   - Check contract deployment status

3. **Wallet connection issues**
   - Clear browser cache and cookies
   - Try a different Flow wallet
   - Check network configuration

4. **Insufficient balance**
   - Get testnet FLOW tokens from faucet
   - Verify wallet has sufficient funds

### Debug Commands

```bash
# Check contract deployment
flow accounts get 0xb03ac3adafdd51f2 --network=testnet

# View contract code
flow accounts get-contract KaizenEvent --network=testnet

# Check transaction status
flow transactions get <tx-hash> --network=testnet
```

## 📚 Flow Blockchain Resources

- [Flow Documentation](https://developers.flow.com/)
- [Cadence Language Reference](https://developers.flow.com/cadence/language)
- [FCL Documentation](https://developers.flow.com/tools/fcl-js)
- [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)
- [Flowscan Testnet](https://testnet.flowscan.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Discord**: Join our community
- **Documentation**: Check the Flow developer portal

## 🎯 Roadmap

- [ ] Multi-chain support
- [ ] Advanced NFT features
- [ ] Event analytics
- [ ] Social features
- [ ] Mobile app
- [ ] Enterprise features

---

Built with ❤️ on the Flow blockchain
