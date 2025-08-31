import * as fcl from "@onflow/fcl";
import * as types from "@onflow/types";

// Contract addresses (testnet - Cadence 1.0)
export const CONTRACT_ADDRESSES = {
  KAIZEN_EVENT: process.env.NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT || "0x01",
  KAIZEN_NFT: process.env.NEXT_PUBLIC_KAIZEN_NFT_CONTRACT || "0x01",
  FLOW_TOKEN: "0x7e60df042a9c0868", // Flow token address on testnet
  FUNGIBLE_TOKEN: "0x9a0766d93b6608b7", // FungibleToken standard on testnet
  NON_FUNGIBLE_TOKEN: "0x1d7e57aa55817448", // NFT standard on testnet
  METADATA_VIEWS: "0x1d7e57aa55817448", // Metadata views on testnet
};

// Authentication functions with error handling
export const authenticate = async () => {
  try {
    return await fcl.authenticate();
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

export const unauthenticate = async () => {
  try {
    return await fcl.unauthenticate();
  } catch (error) {
    console.error("Unauthentication error:", error);
    throw error;
  }
};

// User authentication state with error handling
export const getCurrentUser = async () => {
  try {
    return await fcl.currentUser().snapshot();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const subscribeToUser = (callback: any) => {
  try {
    return fcl.currentUser().subscribe(callback);
  } catch (error) {
    console.error("Error subscribing to user:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Scripts (Read-only operations)

// Get all events
export const getAllEvents = async () => {
  const script = `
    import KaizenEvent from ${CONTRACT_ADDRESSES.KAIZEN_EVENT}
    
    access(all) fun main(): [KaizenEvent.EventInfo] {
      let eventManagerRef = getAccount(${CONTRACT_ADDRESSES.KAIZEN_EVENT})
        .capabilities.get<&{KaizenEvent.EventManagerPublic}>(
          KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get reference to EventManager")
      
      return eventManagerRef.getAllEvents()
    }
  `;

  try {
    return await fcl.query({ cadence: script });
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

// Get specific event info
export const getEventInfo = async (eventId: number) => {
  const script = `
    import KaizenEvent from ${CONTRACT_ADDRESSES.KAIZEN_EVENT}
    
    access(all) fun main(eventId: UInt64): KaizenEvent.EventInfo? {
      let eventManagerRef = getAccount(${CONTRACT_ADDRESSES.KAIZEN_EVENT})
        .capabilities.get<&{KaizenEvent.EventManagerPublic}>(
          KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get reference to EventManager")
      
      return eventManagerRef.getEventInfo(eventId: eventId)
    }
  `;

  try {
    return await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(eventId.toString(), t.UInt64)],
    });
  } catch (error) {
    console.error("Error fetching event info:", error);
    return null;
  }
};

// Check if user has joined event
export const hasJoinedEvent = async (eventId: number, userAddress: string) => {
  const script = `
    import KaizenEvent from ${CONTRACT_ADDRESSES.KAIZEN_EVENT}
    
    access(all) fun main(eventId: UInt64, attendee: Address): Bool {
      let eventManagerRef = getAccount(${CONTRACT_ADDRESSES.KAIZEN_EVENT})
        .capabilities.get<&{KaizenEvent.EventManagerPublic}>(
          KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get reference to EventManager")
      
      return eventManagerRef.hasJoined(eventId: eventId, attendee: attendee)
    }
  `;

  try {
    return await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [
        arg(eventId.toString(), t.UInt64),
        arg(userAddress, t.Address),
      ],
    });
  } catch (error) {
    console.error("Error checking join status:", error);
    return false;
  }
};

// Get user's NFT collection
export const getUserNFTs = async (userAddress: string) => {
  const script = `
    import KaizenEventNFT from ${CONTRACT_ADDRESSES.KAIZEN_NFT}
    import MetadataViews from ${CONTRACT_ADDRESSES.METADATA_VIEWS}
    
    access(all) fun main(address: Address): [KaizenEventNFT.NFT] {
      let account = getAccount(address)
      
      if let collection = account
        .capabilities.get<&{KaizenEventNFT.CollectionPublic}>(
          KaizenEventNFT.CollectionPublicPath
        ).borrow() {
          
        let nfts: [KaizenEventNFT.NFT] = []
        let ids = collection.getIDs()
        
        for id in ids {
          if let nft = collection.borrowKaizenNFT(id: id) {
            nfts.append(*nft)
          }
        }
        
        return nfts
      }
      
      return []
    }
  `;

  try {
    return await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(userAddress, t.Address)],
    });
  } catch (error) {
    console.error("Error fetching user NFTs:", error);
    return [];
  }
};

// Get user's Flow token balance
export const getUserFlowBalance = async (userAddress: string) => {
  const script = `
    import FungibleToken from 0x9a0766d93b6608b7
    import FlowToken from 0x7e60df042a9c0868
    
    access(all) fun main(address: Address): UFix64 {
      let account = getAccount(address)
      
      let vaultRef = account.capabilities
        .get<&{FungibleToken.Balance}>(/public/flowTokenBalance)
        .borrow()
        ?? panic("Could not borrow Balance reference to the Vault")
      
      return vaultRef.balance
    }
  `;

  try {
    const balance = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(userAddress, t.Address)],
    });
    return parseFloat(balance || "0.0");
  } catch (error) {
    console.error("Error fetching Flow balance:", error);
    return 0.0;
  }
};

// Transactions (Write operations)

// Create new event
export const createEvent = async (
  name: string,
  description: string,
  price: number,
  maxAttendees: number,
  eventDate: Date,
  location: string,
  imageUrl: string
) => {
  const transaction = `
    import KaizenEvent from ${CONTRACT_ADDRESSES.KAIZEN_EVENT}
    import FlowToken from ${CONTRACT_ADDRESSES.FLOW_TOKEN}
    
    transaction(
      name: String,
      description: String, 
      price: UFix64,
      maxAttendees: UInt32,
      eventDate: UFix64,
      location: String,
      imageUrl: String
    ) {
      let eventManagerRef: &KaizenEvent.EventManager
      let organizerAddress: Address
      
      prepare(organizer: &Account) {
        self.organizerAddress = organizer.address
        
        self.eventManagerRef = organizer.storage
          .borrow<&KaizenEvent.EventManager>(from: KaizenEvent.EventStoragePath)
          ?? panic("Could not borrow EventManager reference")
      }
      
      execute {
        let eventId = self.eventManagerRef.createEvent(
          name: name,
          description: description,
          organizer: self.organizerAddress,
          price: price,
          maxAttendees: maxAttendees,
          eventDate: eventDate,
          location: location,
          imageUrl: imageUrl
        )
        
        log("Event created with ID: ".concat(eventId.toString()))
      }
    }
  `;

  try {
    const txId = await fcl.mutate({
      cadence: transaction,
      args: (arg: any, t: any) => [
        arg(name, t.String),
        arg(description, t.String),
        arg(price.toFixed(8), t.UFix64),
        arg(maxAttendees.toString(), t.UInt32),
        arg(Math.floor(eventDate.getTime() / 1000).toString(), t.UFix64),
        arg(location, t.String),
        arg(imageUrl, t.String),
      ],
      proposer: fcl.authz as any,
      payer: fcl.authz as any,
      authorizations: [fcl.authz as any],
      limit: 1000,
    });

    return await fcl.tx(txId).onceSealed();
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// Join event with payment
export const joinEvent = async (eventId: number, price: number) => {
  const transaction = `
    import KaizenEvent from ${CONTRACT_ADDRESSES.KAIZEN_EVENT}
    import FlowToken from ${CONTRACT_ADDRESSES.FLOW_TOKEN}
    import FungibleToken from ${CONTRACT_ADDRESSES.FUNGIBLE_TOKEN}
    
    transaction(eventId: UInt64, amount: UFix64) {
      let eventManagerRef: &{KaizenEvent.EventManagerPublic}
      let paymentVault: @{FungibleToken.Vault}
      let attendeeAddress: Address
      
      prepare(attendee: auth(BorrowValue) &Account) {
        self.attendeeAddress = attendee.address
        
        // Get public reference to the EventManager
        self.eventManagerRef = getAccount(${CONTRACT_ADDRESSES.KAIZEN_EVENT})
          .capabilities.get<&{KaizenEvent.EventManagerPublic}>(KaizenEvent.EventPublicPath)
          .borrow()
          ?? panic("Could not get EventManager reference")
        
        // Withdraw payment from user's vault
        let vaultRef = attendee.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
          ?? panic("Could not borrow reference to the owner's Vault")
        
        self.paymentVault <- vaultRef.withdraw(amount: amount)
      }
      
      execute {
        let changeVault <- self.eventManagerRef.joinEvent(
          eventId: eventId,
          attendee: self.attendeeAddress,
          payment: <-self.paymentVault
        )
        
        // Handle any change (for free events)
        if changeVault.balance > 0.0 {
          let receiverRef = getAccount(self.attendeeAddress)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow()
            ?? panic("Could not borrow receiver reference")
          
          receiverRef.deposit(from: <-changeVault)
        } else {
          destroy changeVault
        }
        
        log("Successfully joined event ".concat(eventId.toString()))
      }
    }
  `;

  try {
    const txId = await fcl.mutate({
      cadence: transaction,
      args: (arg: any, t: any) => [
        arg(eventId.toString(), t.UInt64),
        arg(price.toFixed(8), t.UFix64),
      ],
      proposer: fcl.authz as any,
      payer: fcl.authz as any,
      authorizations: [fcl.authz as any],
      limit: 1000,
    });

    return await fcl.tx(txId).onceSealed();
  } catch (error) {
    console.error("Error joining event:", error);
    throw error;
  }
};

// Mint POAP NFT for event attendee
export const mintPOAP = async (
  eventId: number,
  eventName: string,
  eventDate: Date,
  attendeeAddress: string,
  imageUrl: string,
  description: string
) => {
  const transaction = `
    import KaizenEventNFT from ${CONTRACT_ADDRESSES.KAIZEN_NFT}
    import NonFungibleToken from ${CONTRACT_ADDRESSES.NON_FUNGIBLE_TOKEN}
    
    transaction(
      eventId: UInt64,
      eventName: String,
      eventDate: UFix64,
      attendee: Address,
      imageUrl: String,
      description: String
    ) {
      let minterRef: &KaizenEventNFT.NFTMinter
      let recipientRef: &{NonFungibleToken.CollectionPublic}
      
      prepare(minter: &Account) {
        self.minterRef = minter.storage
          .borrow<&KaizenEventNFT.NFTMinter>(from: KaizenEventNFT.MinterStoragePath)
          ?? panic("Could not borrow minter reference")
        
        self.recipientRef = getAccount(attendee)
          .capabilities.get<&{NonFungibleToken.CollectionPublic}>(
            KaizenEventNFT.CollectionPublicPath
          ).borrow()
          ?? panic("Could not get recipient collection reference")
      }
      
      execute {
        self.minterRef.mintNFT(
          recipient: self.recipientRef,
          eventId: eventId,
          eventName: eventName,
          eventDate: eventDate,
          attendee: attendee,
          imageUrl: imageUrl,
          description: description
        )
        
        log("POAP NFT minted for event ".concat(eventId.toString()))
      }
    }
  `;

  try {
    const txId = await fcl.mutate({
      cadence: transaction,
      args: (arg: any, t: any) => [
        arg(eventId.toString(), t.UInt64),
        arg(eventName, t.String),
        arg(Math.floor(eventDate.getTime() / 1000).toString(), t.UFix64),
        arg(attendeeAddress, t.Address),
        arg(imageUrl, t.String),
        arg(description, t.String),
      ],
      proposer: fcl.authz as any,
      payer: fcl.authz as any,
      authorizations: [fcl.authz as any],
      limit: 1000,
    });

    return await fcl.tx(txId).onceSealed();
  } catch (error) {
    console.error("Error minting POAP:", error);
    throw error;
  }
};

// Setup user's NFT collection (first time setup)
export const setupNFTCollection = async () => {
  const transaction = `
    import KaizenEventNFT from ${CONTRACT_ADDRESSES.KAIZEN_NFT}
    import NonFungibleToken from ${CONTRACT_ADDRESSES.NON_FUNGIBLE_TOKEN}
    import MetadataViews from ${CONTRACT_ADDRESSES.METADATA_VIEWS}
    
    transaction {
      prepare(user: &Account) {
        if user.storage.borrow<&KaizenEventNFT.Collection>(from: KaizenEventNFT.CollectionStoragePath) == nil {
          let collection <- KaizenEventNFT.createEmptyCollection()
          user.storage.save(<-collection, to: KaizenEventNFT.CollectionStoragePath)
          
          let publicCapability = user.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, KaizenEventNFT.CollectionPublic, MetadataViews.ResolverCollection}>(
            KaizenEventNFT.CollectionStoragePath
          )
          user.capabilities.publish(publicCapability, at: KaizenEventNFT.CollectionPublicPath)
        }
        
        log("NFT Collection setup completed")
      }
    }
  `;

  try {
    const txId = await fcl.mutate({
      cadence: transaction,
      args: (arg: any, t: any) => [],
      proposer: fcl.authz as any,
      payer: fcl.authz as any,
      authorizations: [fcl.authz as any],
      limit: 1000,
    });

    return await fcl.tx(txId).onceSealed();
  } catch (error) {
    console.error("Error setting up NFT collection:", error);
    throw error;
  }
};

// Utility functions
export const formatFlowAmount = (amount: number): string => {
  return amount.toFixed(8);
};

export const parseFlowAmount = (amount: string): number => {
  return parseFloat(amount);
};

// Validation
export const isValidFlowAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{16}$/.test(address);
};
