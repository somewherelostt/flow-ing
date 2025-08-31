import KaizenEvent from 0x045a1763c93006ca

access(all) fun main(): [KaizenEvent.EventInfo] {
    let eventManagerRef = getAccount(0x045a1763c93006ca)
        .capabilities.get<&{KaizenEvent.EventManagerPublic}>(
            KaizenEvent.EventPublicPath
        ).borrow()
        ?? panic("Could not get reference to EventManager")
    
    return eventManagerRef.getAllEvents()
}
