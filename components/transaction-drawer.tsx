"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  AlertCircle,
} from "lucide-react";
import { getTransactionStatus } from "@/lib/flow";

interface TransactionStatus {
  status: "pending" | "success" | "error";
  hash?: string;
  ledger?: number;
  error?: string;
  action?: string;
}

interface TransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionStatus;
}

export function TransactionDrawer({
  isOpen,
  onClose,
  transaction,
}: TransactionDrawerProps) {
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    blockNumber?: string;
    confirmations?: number;
    error?: string;
  }>({ isVerified: false });

  const [copied, setCopied] = useState(false);

  // Verify transaction on Flowscan
  useEffect(() => {
    if (transaction.hash && transaction.status === "success") {
      verifyTransaction();
    }
  }, [transaction.hash, transaction.status]);

  const verifyTransaction = async () => {
    if (!transaction.hash) return;

    try {
      // Get transaction status from Flow
      const txStatus = await getTransactionStatus(transaction.hash);

      if (txStatus.isSealed) {
        setVerificationStatus({
          isVerified: true,
          blockNumber: txStatus.blockId,
          confirmations: 1, // Flow has fast finality
          error: undefined,
        });
      } else {
        setVerificationStatus({
          isVerified: false,
          error: `Transaction status: ${txStatus.status}`,
        });
      }
    } catch (error) {
      console.error("Error verifying transaction:", error);
      setVerificationStatus({
        isVerified: false,
        error: "Failed to verify transaction",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "error":
        return <XCircle className="w-8 h-8 text-red-500" />;
      case "pending":
        return <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (transaction.status) {
      case "success":
        return "Transaction Successful";
      case "error":
        return "Transaction Failed";
      case "pending":
        return "Processing Transaction";
      default:
        return "Unknown Status";
    }
  };

  const getStatusDescription = () => {
    switch (transaction.status) {
      case "success":
        return "Your transaction has been confirmed on the Flow blockchain";
      case "error":
        return transaction.error || "The transaction failed to process";
      case "pending":
        return "Please wait while your transaction is being processed";
      default:
        return "Transaction status is unknown";
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-kaizen-dark-gray border-kaizen-gray/30">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-kaizen-white">
              Transaction Status
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* Status Icon and Text */}
            <div className="text-center space-y-3">
              {getStatusIcon()}
              <div>
                <h3 className="text-kaizen-white font-semibold text-lg">
                  {getStatusText()}
                </h3>
                <p className="text-kaizen-gray text-sm">
                  {getStatusDescription()}
                </p>
              </div>
            </div>

            {/* Transaction Details */}
            {transaction.hash && (
              <Card className="bg-kaizen-black/50 border-kaizen-gray/30 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-kaizen-gray text-sm">
                      Transaction Hash
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-4 h-4 p-0 text-kaizen-gray hover:text-kaizen-white"
                      onClick={() => copyToClipboard(transaction.hash!)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <code className="text-kaizen-white text-xs break-all block">
                    {transaction.hash}
                  </code>
                  {copied && (
                    <p className="text-green-500 text-xs text-center">
                      Copied to clipboard!
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Verification Status */}
            {transaction.status === "success" && (
              <Card className="bg-kaizen-black/50 border-kaizen-gray/30 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-kaizen-gray text-sm">
                      Verification Status
                    </span>
                    {verificationStatus.isVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>

                  {verificationStatus.isVerified ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-kaizen-gray">Block Number:</span>
                        <span className="text-kaizen-white">
                          {verificationStatus.blockNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-kaizen-gray">Confirmations:</span>
                        <span className="text-kaizen-white">
                          {verificationStatus.confirmations}
                        </span>
                      </div>
                      <div className="text-green-500 text-xs text-center">
                        ✓ Transaction verified on Flow blockchain
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {verificationStatus.error ? (
                        <p className="text-red-400 text-xs">
                          {verificationStatus.error}
                        </p>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-yellow-500 text-xs">
                            Verifying transaction...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {transaction.hash && (
                <Button
                  onClick={() =>
                    window.open(
                      `https://flowscan.org/transaction/${transaction.hash}`,
                      "_blank"
                    )
                  }
                  className="w-full bg-kaizen-yellow text-kaizen-black hover:bg-kaizen-yellow/90 font-semibold rounded-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Flowscan
                </Button>
              )}

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-kaizen-gray/30 text-kaizen-white hover:bg-kaizen-gray/20 bg-transparent rounded-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
