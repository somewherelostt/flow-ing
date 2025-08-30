"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, AlertCircle } from "lucide-react";
import { useFlowWallet } from "@/contexts/FlowWalletContext";

interface FlowWalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlowWalletConnect({ isOpen, onClose }: FlowWalletConnectProps) {
  const { connectWallet, error, isLoading } = useFlowWallet();
  const [connecting, setConnecting] = useState(false);

  const flowWallets = [
    {
      name: "Blocto",
      icon: "/blocto-wallet.png",
      description: "Easy to use Flow wallet",
      featured: true,
    },
    {
      name: "Lilico",
      icon: "/lilico-wallet.png",
      description: "Chrome extension Flow wallet",
      featured: true,
    },
    {
      name: "Dapper",
      icon: "/dapper-wallet.png",
      description: "Self-custodial Flow wallet",
      featured: true,
    },
    {
      name: "Ledger",
      icon: "/ledger-wallet.png",
      description: "Hardware wallet support",
      featured: false,
    },
    {
      name: "Finoa",
      icon: "/finoa-wallet.png",
      description: "Institutional Flow wallet",
      featured: false,
    },
  ];

  const handleConnect = async () => {
    if (connecting || isLoading) return;

    setConnecting(true);

    try {
      const success = await connectWallet();
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-kaizen-dark-gray border-none rounded-3xl w-full max-w-sm">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-kaizen-white font-bold text-xl">
              Connect Wallet
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-kaizen-gray hover:text-kaizen-white hover:bg-kaizen-gray/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-kaizen-gray text-sm mb-6">
            Connect your Flow wallet to buy tickets and collect event NFTs on
            the Flow blockchain
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Connect Button */}
          <div className="space-y-4">
            <Button
              onClick={handleConnect}
              disabled={connecting || isLoading}
              className="w-full bg-kaizen-yellow text-kaizen-black hover:bg-kaizen-yellow/90 font-semibold h-12 rounded-2xl flex items-center justify-center gap-3"
            >
              {connecting || isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-kaizen-black border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <div className="w-6 h-6 bg-kaizen-black/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">F</span>
                  </div>
                  Connect Flow Wallet
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-kaizen-gray text-xs">
                Supports all Flow wallets via FCL
              </p>
            </div>
          </div>

          {/* Wallet Options Info */}
          <div className="mt-6 space-y-3">
            <h4 className="text-kaizen-white text-sm font-semibold">
              Supported Wallets:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {flowWallets
                .filter((w) => w.featured)
                .map((wallet) => (
                  <div
                    key={wallet.name}
                    className="flex items-center gap-2 p-2 bg-kaizen-black/30 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-kaizen-yellow/20 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-kaizen-yellow">
                        {wallet.name[0]}
                      </span>
                    </div>
                    <span className="text-kaizen-white text-xs">
                      {wallet.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-kaizen-black/50 rounded-lg">
            <h4 className="text-kaizen-white text-sm font-semibold mb-2">
              New to Flow?
            </h4>
            <p className="text-kaizen-gray text-xs mb-3">
              Get started with a Flow wallet to interact with the Flow
              blockchain and collect NFTs.
            </p>
            <a
              href="https://developers.flow.com/tools/wallets"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-kaizen-yellow text-xs hover:text-kaizen-yellow/80"
            >
              Learn about Flow wallets
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-kaizen-gray/20">
            <p className="text-kaizen-gray text-xs text-center">
              By connecting a wallet, you agree to Kaizen's Terms of Service
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
