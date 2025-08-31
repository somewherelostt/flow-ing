import * as fcl from "@onflow/fcl";

// Contract codes for deployment
const KAIZEN_EVENT_CONTRACT = `
import NonFungibleToken from 0x1d7e57aa55817448
import MetadataViews from 0x1d7e57aa55817448  
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

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
            
            // Send payment to organizer (simplified)
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
}`;

const KAIZEN_NFT_CONTRACT = `
import NonFungibleToken from 0x1d7e57aa55817448
import MetadataViews from 0x1d7e57aa55817448

access(all) contract KaizenEventNFT: NonFungibleToken {

    // Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, eventId: UInt64, attendee: Address)

    // Named Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    // Total supply
    access(all) var totalSupply: UInt64

    // POAP NFT Resource
    access(all) resource NFT: NonFungibleToken.NFT, MetadataViews.Resolver {
        access(all) let id: UInt64
        access(all) let eventId: UInt64
        access(all) let eventName: String
        access(all) let eventDate: UFix64
        access(all) let attendee: Address
        access(all) let mintedAt: UFix64
        access(all) let imageUrl: String
        access(all) let description: String

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
            self.mintedAt = getCurrentBlock().timestamp
            self.imageUrl = imageUrl
            self.description = description
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Traits>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "Kaizen Event POAP - ".concat(self.eventName),
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(
                            url: self.imageUrl
                        )
                    )
                case Type<MetadataViews.Traits>():
                    return MetadataViews.Traits([
                        MetadataViews.Trait(
                            name: "eventId",
                            value: self.eventId,
                            displayType: "Number",
                            rarity: nil
                        ),
                        MetadataViews.Trait(
                            name: "eventName",
                            value: self.eventName,
                            displayType: "String",
                            rarity: nil
                        ),
                        MetadataViews.Trait(
                            name: "attendee",
                            value: self.attendee,
                            displayType: "Address",
                            rarity: nil
                        )
                    ])
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: KaizenEventNFT.CollectionStoragePath,
                        publicPath: KaizenEventNFT.CollectionPublicPath,
                        providerPath: /private/KaizenEventNFTCollection,
                        publicCollection: Type<&KaizenEventNFT.Collection{KaizenEventNFT.CollectionPublic}>(),
                        publicLinkedType: Type<&KaizenEventNFT.Collection{KaizenEventNFT.CollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver,MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&KaizenEventNFT.Collection{KaizenEventNFT.CollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Provider,MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-KaizenEventNFT.createEmptyCollection()
                        })
                    )
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
            return <-create Collection()
        }
    }

    // Collection Resource
    access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.Collection, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}      

        init() {
            self.ownedNFTs <- {}
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)      
            return <-token
        }

        access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @KaizenEventNFT.NFT
            let id: UInt64 = token.id
            emit Deposit(id: id, to: self.owner?.address)
            self.ownedNFTs[id] <-! token
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &NonFungibleToken.NFT? {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)      
        }

        access(all) fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
            let nft = (&self.ownedNFTs[id] as auth(NonFungibleToken.Withdraw) &NonFungibleToken.NFT?)!
            let kaizenNFT = nft as! &KaizenEventNFT.NFT
            return kaizenNFT as &AnyResource{MetadataViews.Resolver}    
        }

        access(all) fun borrowKaizenNFT(id: UInt64): &KaizenEventNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as auth(NonFungibleToken.Withdraw) &NonFungibleToken.NFT?)!
                return ref as! &KaizenEventNFT.NFT
            }
            return nil
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {     
            panic("implement me")
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {     
            panic("implement me")
        }

        access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
            return <-create Collection()
        }
    }

    // Public Collection Interface
    access(all) resource interface CollectionPublic {
        access(all) fun deposit(token: @NonFungibleToken.NFT)
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &NonFungibleToken.NFT?
        access(all) fun borrowKaizenNFT(id: UInt64): &KaizenEventNFT.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow KaizenEventNFT reference: the ID of the returned reference is incorrect"
            }
        }
    }

    // NFT Minter Resource
    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            eventId: UInt64,
            eventName: String,
            eventDate: UFix64,
            attendee: Address,
            imageUrl: String,
            description: String
        ) {
            let nft <- create NFT(
                id: KaizenEventNFT.totalSupply,
                eventId: eventId,
                eventName: eventName,
                eventDate: eventDate,
                attendee: attendee,
                imageUrl: imageUrl,
                description: description
            )

            emit Minted(id: nft.id, eventId: eventId, attendee: attendee)
            recipient.deposit(token: <-nft)
            KaizenEventNFT.totalSupply = KaizenEventNFT.totalSupply + UInt64(1)
        }
    }

    // Public function to create empty collection
    access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <-create Collection()
    }

    init() {
        self.CollectionStoragePath = /storage/KaizenEventNFTCollection  
        self.CollectionPublicPath = /public/KaizenEventNFTCollection    
        self.MinterStoragePath = /storage/KaizenEventNFTMinter

        self.totalSupply = 0

        // Create a minter resource and save it to storage
        let minter <- create NFTMinter()
        self.account.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}`;

// Deploy a single contract
export const deployContract = async (contractName: string, contractCode: string) => {
  try {
    console.log(`🚀 Deploying ${contractName}...`);
    
    const deploymentTransaction = `
      transaction {
        prepare(acct: &Account) {
          // Deploy the contract
          acct.contracts.add(name: "${contractName}", code: "${contractCode.replace(/"/g, '\\"')}")
        }
        
        execute {
          log("${contractName} contract deployed successfully")
        }
      }
    `;

    // Execute the deployment transaction
    const txId = await fcl.mutate({
      cadence: deploymentTransaction,
      proposer: fcl.authz as any,
      payer: fcl.authz as any,
      authorizations: [fcl.authz as any],
      limit: 2000,
    });

    console.log(`📝 ${contractName} deployment transaction submitted: ${txId}`);
    console.log("⏳ Waiting for transaction to be sealed...");
    
    // Wait for transaction to be sealed
    const result = await fcl.tx(txId).onceSealed();
    
    if (result.status === 4) { // 4 = sealed
      console.log(`✅ ${contractName} deployed successfully!`);
      console.log(`🔗 Transaction: ${txId}`);
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
  return await deployContract("KaizenEventNFT", KAIZEN_NFT_CONTRACT);
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

// Get deployed contract addresses
export const getDeployedAddresses = async () => {
  try {
    const user = await fcl.currentUser().snapshot();
    if (!user?.addr) {
      throw new Error("No wallet connected");
    }
    
    return {
      kaizenEvent: user.addr,
      kaizenNFT: user.addr
    };
  } catch (error) {
    console.error("Error getting deployed addresses:", error);
    throw error;
  }
};
