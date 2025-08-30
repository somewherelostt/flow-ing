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
}
