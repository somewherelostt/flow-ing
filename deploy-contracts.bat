@echo off
echo 🚀 Deploying Kaizen Contracts to Flow Testnet...
echo.

REM Check if Flow CLI is available
where flow >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Flow CLI is not found in PATH
    echo Please install Flow CLI from: https://developers.flow.com/tools/flow-cli/install
    pause
    exit /b 1
)

echo ✅ Flow CLI found
echo.

REM Deploy KaizenEvent contract
echo 📦 Deploying KaizenEvent contract...
flow accounts add-contract KaizenEvent contracts/cadence/KaizenEvent.cdc --network testnet --signer testnet-account

if %errorlevel% neq 0 (
    echo ❌ Failed to deploy KaizenEvent contract
    echo.
    echo Please make sure:
    echo 1. Your testnet account is properly configured in flow.json
    echo 2. You have sufficient FLOW tokens for deployment
    echo 3. The contract code is valid
    pause
    exit /b 1
)

echo ✅ KaizenEvent contract deployed successfully!
echo.

REM Deploy KaizenEventNFT contract
echo 📦 Deploying KaizenEventNFT contract...
flow accounts add-contract KaizenEventNFT contracts/cadence/KaizenEventNFT.cdc --network testnet --signer testnet-account

if %errorlevel% neq 0 (
    echo ❌ Failed to deploy KaizenEventNFT contract
    echo.
    echo Please make sure:
    echo 1. Your testnet account is properly configured in flow.json
    echo 2. You have sufficient FLOW tokens for deployment
    echo 3. The contract code is valid
    pause
    exit /b 1
)

echo ✅ KaizenEventNFT contract deployed successfully!
echo.

echo 🎉 All contracts deployed successfully!
echo.
echo 📋 Next Steps:
echo 1. Update your .env.local with the deployed contract addresses
echo 2. Update the contract addresses in lib/flow.ts
echo 3. Test the contracts by creating and joining events
echo.
echo 🔍 You can verify deployment on Flowscan:
echo https://testnet.flowscan.io/account/0xb08860843312e513
echo.
pause
