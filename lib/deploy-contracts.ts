import * as fcl from "@onflow/fcl";

// Contract addresses for testnet
export const TESTNET_CONTRACTS = {
  NON_FUNGIBLE_TOKEN: "0x1d7e57aa55817448",
  METADATA_VIEWS: "0x1d7e57aa55817448",
  FUNGIBLE_TOKEN: "0x9a0766d93b6608b7",
  FLOW_TOKEN: "0x7e60df042a9c0868",
};

// KaizenEvent contract code
export const KAIZEN_EVENT_CONTRACT = `
import NonFungibleToken from ${TESTNET_CONTRACTS.NON_FUNGIBLE_TOKEN}
import MetadataViews from ${TESTNET_CONTRACTS.METADATA_VIEWS}  
import FungibleToken from ${TESTNET_CONTRACTS.FUNGIBLE_TOKEN}
import FlowToken from ${TESTNET_CONTRACTS.FLOW_TOKEN}

access(all) contract KaizenEvent {
    
    // Events
    access(all) event EventCreated(id: UInt64, organizer: Address, name: String, price: UFix64)
    access(all) event EventJoined(eventId: UInt64, attendee: Address)
    access(all) event POAPMinted(eventId: UInt64, attendee: Address, tokenId: UInt64)
    
    // Paths
    access(all) let EventStoragePath: StoragePath
    access(all) let EventPublicPath: PublicPath
    access(all) let EventPrivatePath: PrivatePath
    
    // Event struct
    access(all) struct EventInfo {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let organizer: Address
        access(all) let price: UFix64
        access(all) let maxAttendees: UInt32
        access(all) let createdAt: UFix64
        access(all) let eventDate: UFix64
        access(all) let location: String
        access(all) var attendeeCount: UInt32
        access(all) let imageUrl: String
        
        init(
            id: UInt64,
            name: String,
            description: String,
            organizer: Address,
            price: UFix64,
            maxAttendees: UInt32,
            eventDate: UFix64,
            location: String,
            imageUrl: String
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.organizer = organizer
            self.price = price
            self.maxAttendees = maxAttendees
            self.createdAt = getCurrentBlock().timestamp
            self.eventDate = eventDate
            self.location = location
            self.attendeeCount = 0
            self.imageUrl = imageUrl
        }
        
        access(contract) fun incrementAttendees() {
            self.attendeeCount = self.attendeeCount + 1
        }
    }

    // Public interface for reading event data
    access(all) resource interface EventManagerPublic {
        access(all) fun getEventInfo(eventId: UInt64): EventInfo?
        access(all) fun getAllEvents(): [EventInfo]
        access(all) fun hasJoined(eventId: UInt64, attendee: Address): Bool
        access(all) fun joinEvent(eventId: UInt64, attendee: Address, payment: @{FungibleToken.Vault}): @{FungibleToken.Vault}
    }

    // Event Manager Resource
    access(all) resource EventManager: EventManagerPublic {
        access(all) var events: {UInt64: EventInfo}
        access(all) var attendees: {UInt64: {Address: Bool}} // eventId -> {attendee -> joined}
        access(all) var nextEventId: UInt64
        
        init() {
            self.events = {}
            self.attendees = {}
            self.nextEventId = 1
        }
        
        // Create new event
        access(all) fun createEvent(
            name: String,
            description: String,
            organizer: Address,
            price: UFix64,
            maxAttendees: UInt32,
            eventDate: UFix64,
            location: String,
            imageUrl: String
        ): UInt64 {
            let eventId = self.nextEventId
            let eventInfo = EventInfo(
                id: eventId,
                name: name,
                description: description,
                organizer: organizer,
                price: price,
                maxAttendees: maxAttendees,
                eventDate: eventDate,
                location: location,
                imageUrl: imageUrl
            )
            
            self.events[eventId] = eventInfo
            self.attendees[eventId] = {}
            self.nextEventId = self.nextEventId + 1
            
            emit EventCreated(id: eventId, organizer: organizer, name: name, price: price)
            return eventId
        }
        
        // Join event with payment
        access(all) fun joinEvent(
            eventId: UInt64, 
            attendee: Address, 
            payment: @{FungibleToken.Vault}
        ): @{FungibleToken.Vault} {
            pre {
                self.events.containsKey(eventId): "Event does not exist"
                !(self.attendees[eventId]?.containsKey(attendee) ?? false): "Already joined this event"
                self.events[eventId]!.attendeeCount < self.events[eventId]!.maxAttendees: "Event is full"
                payment.balance == self.events[eventId]!.price: "Incorrect payment amount"
            }
            
            // Mark attendee as joined
            if self.attendees[eventId] == nil {
                self.attendees[eventId] = {}
            }
            let currentAttendees = self.attendees[eventId]!
            currentAttendees[attendee] = true
            self.attendees[eventId] = currentAttendees
            
            // Update attendee count
            let eventInfo = self.events[eventId]!
            eventInfo.incrementAttendees()
            self.events[eventId] = eventInfo
            
            emit EventJoined(eventId: eventId, attendee: attendee)
            
            // If event is free, return the payment back
            if payment.balance == 0.0 {
                return <-payment
            }
            
            // Send payment to organizer (simplified - in production would use proper vault handling)
            return <-payment
        }
        
        // Check if attendee has joined
        access(all) fun hasJoined(eventId: UInt64, attendee: Address): Bool {
            return self.attendees[eventId]?.containsKey(attendee) ?? false
        }
        
        // Get event info
        access(all) fun getEventInfo(eventId: UInt64): EventInfo? {
            return self.events[eventId]
        }
        
        // Get all events
        access(all) fun getAllEvents(): [EventInfo] {
            return self.events.values
        }
    }
    
    init() {
        self.EventStoragePath = /storage/KaizenEventManager
        self.EventPublicPath = /public/KaizenEventManager
        self.EventPrivatePath = /private/KaizenEventManager
        
        // Create and store the event manager
        let eventManager <- create EventManager()
        self.account.storage.save(<-eventManager, to: self.EventStoragePath)
        
        // Create and publish public capability
        let publicCapability = self.account.capabilities.storage.issue<&{EventManagerPublic}>(
            self.EventStoragePath
        )
        self.account.capabilities.publish(publicCapability, at: self.EventPublicPath)
    }
}
`;

// KaizenEventNFT contract code
export const KAIZEN_EVENT_NFT_CONTRACT = `
import NonFungibleToken from ${TESTNET_CONTRACTS.NON_FUNGIBLE_TOKEN}
import MetadataViews from ${TESTNET_CONTRACTS.METADATA_VIEWS}

access(all) contract KaizenEventNFT {
    
    // Events
    access(all) event NFTMinted(id: UInt64, eventId: UInt64, attendee: Address)
    
    // Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    
    // NFT Resource
    access(all) resource NFT: NonFungibleToken.INFT {
        access(all) let id: UInt64
        access(all) let eventId: UInt64
        access(all) let eventName: String
        access(all) let eventDate: UFix64
        access(all) let attendee: Address
        access(all) let imageUrl: String
        access(all) let description: String
        access(all) let mintedAt: UFix64
        
        init(
            id: UInt64,
            eventId: UInt64,
            eventName: String,
            eventDate: UFix64,
            attendee: Address,
            imageUrl: String,
            description: String
        ) {
            self.id = id
            self.eventId = eventId
            self.eventName = eventName
            self.eventDate = eventDate
            self.attendee = attendee
            self.imageUrl = imageUrl
            self.description = description
            self.mintedAt = getCurrentBlock().timestamp
        }
    }
    
    // Collection Resource
    access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
        access(all) var nextID: UInt64
        
        init() {
            self.ownedNFTs = {}
            self.nextID = 1
        }
        
        access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let nft <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("This NFT does not exist in this collection")
            emit NonFungibleToken.Withdraw(id: withdrawID, from: self.owner?.address)
            return <-nft
        }
        
        access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let id = token.id
            let oldToken <- self.ownedNFTs[id]
            destroy oldToken
            self.ownedNFTs[id] = <-token
            emit NonFungibleToken.Deposit(id: id, to: self.owner?.address)
        }
        
        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT? {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT?
        }
        
        access(all) fun borrowKaizenNFT(id: UInt64): &NFT? {
            return &self.ownedNFTs[id] as &NFT?
        }
        
        access(all) fun getType(): Type {
            return Type<@KaizenEventNFT.Collection>()
        }
        
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case is MetadataViews.NFTCollectionData:
                    return MetadataViews.NFTCollectionData(
                        name: "Kaizen Event NFTs",
                        description: "Collection of event attendance NFTs",
                        externalURL: MetadataViews.ExternalURL("https://kaizen.com"),
                        squareImage: MetadataViews.Media(
                            file: MetadataViews.MediaFile(
                                url: "https://kaizen.com/collection-image.png",
                                type: "image/png"
                            ),
                            mediaType: "image/png"
                        ),
                        bannerImage: MetadataViews.Media(
                            file: MetadataViews.MediaFile(
                                url: "https://kaizen.com/banner-image.png",
                                type: "image/png"
                            ),
                            mediaType: "image/png"
                        ),
                        socials: {}
                    )
                default:
                    return nil
            }
        }
    }
    
    // Minter Resource
    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            eventId: UInt64,
            eventName: String,
            eventDate: UFix64,
            attendee: Address,
            imageUrl: String,
            description: String
        ): UInt64 {
            let collection = recipient as! &KaizenEventNFT.Collection
            let id = collection.nextID
            collection.nextID = collection.nextID + 1
            
            let nft <- create NFT(
                id: id,
                eventId: eventId,
                eventName: eventName,
                eventDate: eventDate,
                attendee: attendee,
                imageUrl: imageUrl,
                description: description
            )
            
            collection.deposit(token: <-nft)
            
            emit NFTMinted(id: id, eventId: eventId, attendee: attendee)
            return id
        }
    }
    
    // Public function to create empty collection
    access(all) fun createEmptyCollection(): @Collection {
        return <-create Collection()
    }
    
    init() {
        self.CollectionStoragePath = /storage/KaizenEventNFTCollection
        self.CollectionPublicPath = /public/KaizenEventNFTCollection
        self.MinterStoragePath = /storage/KaizenEventNFTMinter
        
        // Create and store the minter
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
    }
}
`;

// Deploy a contract
export const deployContract = async (
  contractName: string,
  contractCode: string
) => {
  try {
    console.log(`Deploying ${contractName}...`);

    // Deploy the contract
    const txId = await fcl.mutate({
      cadence: contractCode,
      proposer: fcl.authz as any,
      payer: fcl.authz as any,
      authorizations: [fcl.authz as any],
      limit: 2000,
    });

    console.log(`${contractName} deployment transaction submitted: ${txId}`);
    console.log("Waiting for transaction to be sealed...");

    // Wait for transaction to be sealed
    const result = await fcl.tx(txId).onceSealed();

    if (result.status === 4) {
      // 4 = sealed
      console.log(`✅ ${contractName} deployed successfully!`);
      console.log(`Transaction: ${txId}`);
      return { success: true, txId, result };
    } else {
      throw new Error(`Deployment failed with status: ${result.status}`);
    }
  } catch (error) {
    console.error(`❌ Error deploying ${contractName}:`, error);
    throw error;
  }
};

// Deploy KaizenEvent contract
export const deployKaizenEvent = async () => {
  return await deployContract("KaizenEvent", KAIZEN_EVENT_CONTRACT);
};

// Deploy KaizenEventNFT contract
export const deployKaizenEventNFT = async () => {
  return await deployContract("KaizenEventNFT", KAIZEN_EVENT_NFT_CONTRACT);
};

// Deploy all contracts
export const deployAllContracts = async () => {
  console.log("🚀 Starting deployment of all contracts...");

  try {
    const eventResult = await deployKaizenEvent();
    const nftResult = await deployKaizenEventNFT();

    console.log("✅ All contracts deployed successfully!");
    console.log("KaizenEvent:", eventResult.txId);
    console.log("KaizenEventNFT:", nftResult.txId);

    return { success: true, eventResult, nftResult };
  } catch (error) {
    console.error("❌ Failed to deploy all contracts:", error);
    throw error;
  }
};

// Get deployment status
export const getDeploymentStatus = async (txId: string) => {
  try {
    const result = await fcl.tx(txId).onceSealed();
    return result;
  } catch (error) {
    console.error("Error getting deployment status:", error);
    throw error;
  }
};
