import KaizenEvent from 0x045a1763c93006ca  // This is a placeholder - update with real deployed address
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

transaction(eventId: UInt64, amount: UFix64) {
    let eventManagerRef: &{KaizenEvent.EventManagerPublic}
    let paymentVault: @{FungibleToken.Vault}
    let attendeeAddress: Address
    
    prepare(attendee: auth(BorrowValue) &Account) {
        self.attendeeAddress = attendee.address
        
        // Get public reference to the EventManager
        // Update this address to match where your contract is actually deployed
        self.eventManagerRef = getAccount(0x045a1763c93006ca)
            .capabilities.get<&{KaizenEvent.EventManagerPublic}>(KaizenEvent.EventPublicPath)
            .borrow()
            ?? panic("Could not get EventManager reference")
        
        // Withdraw payment from user's vault
        let vaultRef = attendee.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault")
        
        self.paymentVault <- vaultRef.withdraw(amount: amount)
    }
    
    execute {
        let changeVault <- self.eventManagerRef.joinEvent(
            eventId: eventId,
            attendee: self.attendeeAddress,
            payment: <-self.paymentVault
        )
        
        // Handle any change (for free events)
        if changeVault.balance > 0.0 {
            let receiverRef = getAccount(self.attendeeAddress)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                .borrow()
                ?? panic("Could not borrow receiver reference")
            
            receiverRef.deposit(from: <-changeVault)
        } else {
            destroy changeVault
        }
        
        log("Successfully joined event ".concat(eventId.toString()))
    }
}
