"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react";
import { useFlowWallet } from "@/contexts/FlowWalletContext";
import { deployAllContractsSimple } from "@/lib/deploy-contracts-simple";

interface ContractDeployerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContractDeployer({ isOpen, onClose }: ContractDeployerProps) {
  const { isConnected, address } = useFlowWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string>("");
  const [deployedContracts, setDeployedContracts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const deployContract = async (contractName: string) => {
    if (!isConnected || !address) {
      setError("Please connect your Flow wallet first");
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeploymentStatus(`Deploying ${contractName}...`);

    try {
      // Use the simplified deployment method
      const result = await deployAllContractsSimple();

      if (result.success) {
        setDeployedContracts((prev) => [...prev, contractName]);
        setDeploymentStatus(
          `${contractName} deployed successfully! Transaction: ${result.eventResult.txId}`
        );
      } else {
        throw new Error(`Deployment failed`);
      }
    } catch (err: any) {
      console.error(`Error deploying ${contractName}:`, err);
      setError(`Failed to deploy ${contractName}: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const deployKaizenEvent = async () => {
    const contractCode = `
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

    await deployContract("KaizenEvent");
  };

  const deployKaizenEventNFT = async () => {
    const contractCode = `
      import NonFungibleToken from 0x1d7e57aa55817448
      import MetadataViews from 0x1d7e57aa55817448

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

    await deployContract("KaizenEventNFT");
  };

  const deployAllContracts = async () => {
    await deployKaizenEvent();
    await deployKaizenEventNFT();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-kaizen-dark-gray border-none rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-kaizen-white font-bold text-xl">
              Deploy Smart Contracts
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-kaizen-gray hover:text-kaizen-white hover:bg-kaizen-gray/20"
            >
              ✕
            </Button>
          </div>

          {/* Description */}
          <p className="text-kaizen-gray text-sm mb-6">
            Deploy the KaizenEvent and KaizenEventNFT smart contracts to Flow
            testnet using your connected wallet. This will allow you to create
            events, join events, and mint POAP NFTs.
          </p>

          {/* Connection Status */}
          {!isConnected ? (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Please connect your Flow wallet first to deploy contracts.
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">Connected: {address}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Deployment Status */}
          {deploymentStatus && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">{deploymentStatus}</p>
            </div>
          )}

          {/* Deployed Contracts */}
          {deployedContracts.length > 0 && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="text-green-400 text-sm font-semibold mb-2">
                Successfully Deployed:
              </h4>
              <div className="space-y-2">
                {deployedContracts.map((contract) => (
                  <div key={contract} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">{contract}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment Buttons */}
          <div className="space-y-4">
            <Button
              onClick={deployAllContracts}
              disabled={!isConnected || isDeploying}
              className="w-full bg-kaizen-yellow text-kaizen-black hover:bg-kaizen-yellow/90 font-semibold h-12 rounded-2xl flex items-center justify-center gap-3"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Deploy All Contracts
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={deployKaizenEvent}
                disabled={!isConnected || isDeploying}
                variant="outline"
                className="border-kaizen-gray text-kaizen-white hover:bg-kaizen-gray/20"
              >
                Deploy KaizenEvent
              </Button>

              <Button
                onClick={deployKaizenEventNFT}
                disabled={!isConnected || isDeploying}
                variant="outline"
                className="border-kaizen-gray text-kaizen-white hover:bg-kaizen-gray/20"
              >
                Deploy KaizenEventNFT
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-kaizen-black/50 rounded-lg">
            <h4 className="text-kaizen-white text-sm font-semibold mb-2">
              After Deployment:
            </h4>
            <ol className="text-kaizen-gray text-xs space-y-1 list-decimal list-inside">
              <li>
                Update your .env.local file with the deployed contract addresses
              </li>
              <li>Update the contract addresses in lib/flow.ts</li>
              <li>Test the contracts by creating and joining events</li>
            </ol>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-kaizen-gray/20">
            <p className="text-kaizen-gray text-xs text-center">
              Deploying contracts requires FLOW tokens for gas fees. Make sure
              your wallet has sufficient balance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
