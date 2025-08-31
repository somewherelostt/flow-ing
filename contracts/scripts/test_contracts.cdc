import KaizenEvent from 0xb03ac3adafdd51f2
import KaizenEventNFT from 0xb03ac3adafdd51f2

access(all) fun main(): String {
    // Test that we can access the contract
    let eventManagerRef = getAccount(0xb03ac3adafdd51f2)
        .capabilities.get<&{KaizenEvent.EventManagerPublic}>(
            KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get EventManager reference")
    
    // Test that we can get all events
    let events = eventManagerRef.getAllEvents()
    
    return "Contracts are working! Found ".concat(events.length.toString()).concat(" events")
}
