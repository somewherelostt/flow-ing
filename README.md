# Flow-ing 🌊
### *Revolutionizing Events with Flow Blockchain*

**Seamless event discovery, blockchain ticketing, and automatic POAP rewards**

[![Flow Network](https://img.shields.io/badge/⭐_Powered_by-Flow-00ef8b?style=for-the-badge)](https://onflow.org)

---

## 🎯 Overview

Flow-ing is a Web3 event platform that transforms the event industry through the Flow blockchain. Our platform enables seamless event creation, discovery, and attendance with built-in POAP (Proof of Attendance Protocol) NFT rewards.

### ✨ Key Features
- **🎫 Decentralized Event Ticketing** - True ownership with blockchain transparency
- **🏆 Automatic POAP NFTs** - Collectible proof of attendance for every event
- **💰 FLOW Token Payments** - Fast, low-cost payments with Flow blockchain
- **🔗 Multi-Wallet Support** - Blocto, Lilico, Dapper wallet integration
- **📱 Mobile-First Design** - Responsive interface optimized for all devices

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Flow CLI
- MongoDB connection

### Installation
```bash
# Clone the repository
git clone https://github.com/somewherelostt/KaizenX.git
cd flow-ing

# Install dependencies
npm install

# Setup backend
cd backend
npm install
cd ..

# Start development
npm run dev
```

### Environment Setup
Create `.env.local`:
```env
# MongoDB
DATABASE_URL=your-mongo-connection-string

# Flow Configuration
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn

# Contract Addresses
NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT=0x01
NEXT_PUBLIC_KAIZEN_NFT_CONTRACT=0x01

# API Configuration  
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🏗️ Architecture

### **Frontend Stack**
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + shadcn/ui components
- **@onflow/fcl** for Flow blockchain integration

### **Blockchain Layer**
- **Flow Blockchain** with Cadence smart contracts
- **KaizenEvent.cdc** - Event management contract
- **KaizenEventNFT.cdc** - POAP NFT minting contract
- **FLOW Token** payments for event tickets

### **Backend Services**
- **Node.js** + Express API
- **MongoDB** for event and user data
- **JWT Authentication** for user sessions

---

## 📱 User Experience

### Event Organizers
1. **Create Account** & connect Flow wallet
2. **Create Event** with title, description, pricing
3. **Deploy Smart Contract** automatically
4. **Receive FLOW payments** as users join
5. **Distribute POAPs** automatically

### Event Attendees  
1. **Discover Events** by category or location
2. **Connect Flow Wallet** (Blocto/Lilico/Dapper)
3. **Pay with FLOW** tokens instantly
4. **Receive POAP NFT** upon attendance
5. **Build Collectibles** portfolio

---

## 🔧 Flow Contracts

### KaizenEvent.cdc
- Event creation and management
- FLOW token payment processing
- Attendee tracking and verification

### KaizenEventNFT.cdc
- POAP NFT minting for event attendance
- Metadata management for collectibles
- Transfer and ownership functionality

---

## 🌊 Supported Flow Wallets

- **🟣 Blocto** - Popular mobile and web wallet
- **🦄 Lilico** - Browser extension wallet
- **💎 Dapper** - Custodial wallet for gaming
- **🔗 Flow Reference Wallet** - Development wallet

---

## 🔗 Links

- **Flow Blockchain**: [onflow.org](https://onflow.org)
- **Flow Developer Docs**: [developers.onflow.org](https://developers.onflow.org)
- **FCL Documentation**: [github.com/onflow/fcl-js](https://github.com/onflow/fcl-js)
- **FlowScan Explorer**: [flowscan.org](https://flowscan.org)

---

**Built with 💚 on Flow Blockchain**
