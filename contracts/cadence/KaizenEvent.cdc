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
    
    // Event Manager Resource
    access(all) resource EventManager {
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
            self.attendees[eventId]![attendee] = true
            
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
    
    // Public interface for reading event data
    access(all) resource interface EventManagerPublic {
        access(all) fun getEventInfo(eventId: UInt64): EventInfo?
        access(all) fun getAllEvents(): [EventInfo]
        access(all) fun hasJoined(eventId: UInt64, attendee: Address): Bool
        access(all) fun joinEvent(eventId: UInt64, attendee: Address, payment: @{FungibleToken.Vault}): @{FungibleToken.Vault}
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
