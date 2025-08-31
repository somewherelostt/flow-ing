import KaizenEvent from 0xb03ac3adafdd51f2

// Test script to get all events
access(all) fun main(): [KaizenEvent.EventInfo] {
    let eventManagerRef = getAccount(0xb03ac3adafdd51f2)
        .capabilities.get<&{KaizenEvent.EventManagerPublic}>(
            KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get reference to EventManager")
    
    return eventManagerRef.getAllEvents()
}
