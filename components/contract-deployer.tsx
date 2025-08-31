"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react";
import { useFlowWallet } from "@/contexts/FlowWalletContext";
import { deployAllContracts } from "@/lib/deploy-contracts-browser";

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

  const deployAllContractsHandler = async () => {
    if (!isConnected || !address) {
      setError("Please connect your Flow wallet first");
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeploymentStatus("Deploying all contracts...");

    try {
      // Use the improved browser-based deployment method
      const result = await deployAllContracts();

      if (result.success) {
        setDeployedContracts(["KaizenEvent", "KaizenEventNFT"]);
        setDeploymentStatus(
          `All contracts deployed successfully! 
          KaizenEvent: ${result.eventResult.txId}
          KaizenEventNFT: ${result.nftResult.txId}`
        );

        // Show the new contract addresses
        console.log("🎉 Contracts deployed successfully!");
        console.log("📝 New contract addresses:", address);
        console.log("💡 Update your .env.local file with:");
        console.log(`   NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT=${address}`);
        console.log(`   NEXT_PUBLIC_KAIZEN_NFT_CONTRACT=${address}`);

        // Show success message to user
        alert(
          `✅ Contracts deployed successfully!\n\nNew contract addresses: ${address}\n\nPlease create a .env.local file with:\nNEXT_PUBLIC_KAIZEN_EVENT_CONTRACT=${address}\nNEXT_PUBLIC_KAIZEN_NFT_CONTRACT=${address}`
        );
      } else {
        throw new Error(`Deployment failed`);
      }
    } catch (err: any) {
      console.error("Error deploying contracts:", err);
      setError(`Failed to deploy contracts: ${err.message}`);

      // Show detailed error to user
      alert(
        `❌ Deployment failed!\n\nError: ${err.message}\n\nPlease check the browser console for more details.`
      );
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Deploy Contracts</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {!isConnected ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Please connect your Flow wallet first to deploy contracts
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Deployment Info
              </h3>
              <p className="text-sm text-blue-700">
                <strong>Wallet:</strong> {address}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Network:</strong> Testnet
              </p>
              <p className="text-sm text-blue-700">
                <strong>Target Account:</strong> 0xb03ac3adafdd51f2
              </p>
            </div>

            {deploymentStatus && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 whitespace-pre-line">
                  {deploymentStatus}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {deployedContracts.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">
                  Deployed Contracts:
                </h3>
                <ul className="text-sm text-green-700">
                  {deployedContracts.map((contract) => (
                    <li key={contract} className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {contract}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={deployAllContractsHandler}
                disabled={isDeploying}
                className="flex-1"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Deploy All Contracts
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>
                This will deploy both KaizenEvent and KaizenEventNFT contracts
              </p>
              <p>to your connected wallet address on Flow testnet.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
