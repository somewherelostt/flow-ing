import KaizenEvent from 0x01 // Replace with actual contract address

access(all) fun main(): [KaizenEvent.EventInfo] {
    let eventManagerRef = getAccount(0x01) // Replace with contract account
        .getCapability<&KaizenEvent.EventManager{KaizenEvent.EventManagerPublic}>(
            KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get reference to EventManager")
    
    return eventManagerRef.getAllEvents()
}
