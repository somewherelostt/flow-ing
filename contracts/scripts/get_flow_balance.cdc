import FlowToken from 0x0ae53cb6e3f42a79

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    
    let vaultRef = account
        .getCapability<&FlowToken.Vault{FlowToken.Balance}>(/public/flowTokenBalance)
        .borrow()
        ?? panic("Could not borrow Balance reference to the Vault")
    
    return vaultRef.balance
}
