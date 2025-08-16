"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { SUPPORTED_CHAINS, DEFAULT_PRICE_USDC } from "@/lib/chains";
import { paymentConfig } from "@/lib/config";
import { erc20Abi } from "@/lib/usdcAbi";
import { oftComposerAbi } from "@/lib/oftAbi";

type Step = "welcome" | "choose-chain" | "connect" | "review" | "paying" | "receipt";

export function StepFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const amount = String(DEFAULT_PRICE_USDC);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { address, isConnected } = useAccount();
  const activeChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const usdcAddress = useMemo(() => paymentConfig.usdcAddressByChainId[selectedChainId], [selectedChainId]);

  useEffect(() => {
    if (step === "receipt") {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setStep("welcome");
        setTxHash(null);
      }, 15000);
    }
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [step]);

  const { writeContractAsync } = useWriteContract();

  const decimalsQuery = useReadContract({
    abi: erc20Abi,
    address: usdcAddress,
    functionName: "decimals",
    chainId: selectedChainId,
  });

  const decimals = Number(decimalsQuery.data ?? 6);
  const amountInSmallest = useMemo(() => parseUnits(amount || "0", decimals), [amount, decimals]);

  const waitReceipt = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: selectedChainId,
    query: { enabled: !!txHash },
  });

  useEffect(() => {
    async function maybeTriggerWebhook() {
      if (waitReceipt.status === "success" && txHash) {
        try {
          await fetch("/api/ifttt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ txHash, chainId: selectedChainId, amount }),
          });
        } catch {}
        setStep("receipt");
      }
    }
    maybeTriggerWebhook();
  }, [waitReceipt.status, txHash, selectedChainId, amount]);

  async function handleBegin() {
    setStep("choose-chain");
  }

  async function handleSelectChain(chainId: number) {
    setSelectedChainId(chainId);
    setStep("connect");
  }

  async function handleContinue() {
    if (!isConnected) return;
    if (activeChainId !== selectedChainId) {
      try {
        await switchChainAsync({ chainId: selectedChainId });
      } catch {}
    }
    setStep("review");
  }

  async function handlePay() {
    try {
      setStep("paying");

      // 1) Approve USDC to the OFT/Composer router if needed
      await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [paymentConfig.oftOrComposerAddress, amountInSmallest],
        chainId: selectedChainId,
      });

      // 2) Call your OFT/Composer contract to execute cross-chain payment
      // NOTE: Replace with your actual function and args. The placeholder assumes
      // a generic sendOFT(token, dstChainId, to, amount, options)
      const toBytes32 = `0x000000000000000000000000${(address || "").slice(2)}` as `0x${string}`;

      const tx = await writeContractAsync({
        address: paymentConfig.oftOrComposerAddress,
        abi: oftComposerAbi,
        functionName: "sendOFT",
        args: [
          usdcAddress,
          paymentConfig.destinationChainId,
          toBytes32,
          amountInSmallest,
          "0x"
        ],
        value: 0n, // set a fee value if your function requires native gas fee
        chainId: selectedChainId,
      });

      setTxHash(tx as `0x${string}`);
    } catch (e) {
      setStep("review");
    }
  }

  function Receipt() {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div className="text-2xl font-bold mb-2">Payment Received</div>
        <div className="text-white/80 mb-4">Dispensing your candy...</div>
        <div className="text-left bg-black/30 rounded-xl p-4 break-all">
          <div className="text-white/80">Amount</div>
          <div className="text-white font-semibold mb-2">{amount} USDC</div>
          <div className="text-white/80">Chain</div>
          <div className="text-white font-semibold mb-2">{SUPPORTED_CHAINS.find(c => c.id === selectedChainId)?.name}</div>
          <div className="text-white/80">Transaction Hash</div>
          <div className="text-xs">{txHash}</div>
        </div>
        <div className="mt-4 text-sm text-white/70">This screen will reset shortly.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen kiosk-safe-area flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {step === "welcome" && (
          <div className="text-center">
            <div className="text-5xl md:text-7xl font-extrabold tracking-tight animate-float">Tap to Pay with Any Chain</div>
            <div className="mt-4 text-white/80 text-lg">Omnichain vending powered by LayerZero</div>
            <button className="button-primary mt-10 text-xl px-10 py-6" onClick={handleBegin}>Start</button>
          </div>
        )}

        {step === "choose-chain" && (
          <div className="card">
            <div className="text-2xl font-bold mb-4 text-center">Choose your chain</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUPPORTED_CHAINS.map(chain => (
                <button key={chain.id} className="button-primary !bg-white/10 hover:!bg-white/20 !text-white" onClick={() => handleSelectChain(chain.id)}>
                  {chain.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "connect" && (
          <div className="card text-center">
            <div className="text-2xl font-bold mb-2">Connect Wallet</div>
            <div className="text-white/80 mb-6">Scan the QR code to connect via WalletConnect</div>
            <div className="flex justify-center">
              <ConnectButton showBalance={false} chainStatus="icon"/>
            </div>
            {isConnected && (
              <button className="button-primary mt-6" onClick={handleContinue}>Continue</button>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="card">
            <div className="text-2xl font-bold mb-4 text-center">Review & Pay</div>
            <div className="grid gap-2">
              <div className="text-white/80">Price</div>
              <div className="text-white text-xl font-semibold">{amount} USDC</div>
              <div className="text-white/80 mt-2">Chain: <span className="text-white">{SUPPORTED_CHAINS.find(c => c.id === selectedChainId)?.name}</span></div>
            </div>
            <button className="button-primary mt-6 w-full" onClick={handlePay}>Pay</button>
          </div>
        )}

        {step === "paying" && (
          <div className="card text-center">
            <div className="text-2xl font-bold mb-2">Awaiting Confirmation</div>
            <div className="text-white/80">Approve and confirm the transaction in your wallet.</div>
            {txHash && (
              <div className="text-xs break-all mt-4 text-white/70">{txHash}</div>
            )}
          </div>
        )}

        {step === "receipt" && <Receipt />}
      </div>
    </div>
  );
} 