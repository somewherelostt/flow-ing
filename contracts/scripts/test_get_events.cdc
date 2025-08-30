import KaizenEvent from 0x01

// Test script to get all events
access(all) fun main(): [KaizenEvent.EventInfo] {
    let eventManagerRef = getAccount(0x01)
        .capabilities.get<&KaizenEvent.EventManager{KaizenEvent.EventManagerPublic}>(
            KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get reference to EventManager")
    
    return eventManagerRef.getAllEvents()
}
