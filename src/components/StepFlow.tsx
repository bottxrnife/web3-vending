"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract, useReadContract, useConnect } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { SUPPORTED_CHAINS, DEFAULT_PRICE_USDC } from "@/lib/chains";
import { paymentConfig } from "@/lib/config";
import { erc20Abi } from "@/lib/usdcAbi";
import { oftComposerAbi } from "@/lib/oftAbi";

type Step = "welcome" | "choose-chain" | "connect" | "review" | "paying" | "receipt";

export function StepFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedChainId, setSelectedChainId] = useState<number>(SUPPORTED_CHAINS[0].id);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const amount = String(DEFAULT_PRICE_USDC);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const hasOpenedWalletConnectRef = useRef<boolean>(false);

  const { address, isConnected } = useAccount();
  const activeChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { connect, connectors } = useConnect();

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

  // Auto-open WalletConnect QR when on connect step; advance to review once connected & on correct chain
  useEffect(() => {
    async function run() {
      if (step !== "connect") return;

      // Not connected → trigger WalletConnect QR once
      if (!isConnected && !hasOpenedWalletConnectRef.current) {
        const wc = connectors.find(c => c.id === "walletConnect" || c.name.toLowerCase().includes("walletconnect"));
        if (wc) {
          hasOpenedWalletConnectRef.current = true;
          try {
            await connect({ connector: wc, chainId: selectedChainId });
          } catch (e) {
            // If user dismisses, allow re-open on next step enter
            hasOpenedWalletConnectRef.current = false;
          }
        }
        return;
      }

      // Connected → ensure correct chain, then move to review
      if (isConnected) {
        if (activeChainId !== selectedChainId) {
          try {
            await switchChainAsync({ chainId: selectedChainId });
          } catch {}
        }
        setStep("review");
      }
    }
    run();
  }, [step, isConnected, connectors, connect, activeChainId, selectedChainId, switchChainAsync]);

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
          await fetch("/api/webhook", {
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

  function resetFlow() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setShowCancelConfirm(false);
    setStep("welcome");
    setSelectedChainId(SUPPORTED_CHAINS[0].id);
    setTxHash(null);
    hasOpenedWalletConnectRef.current = false;
  }

  async function handleBegin() {
    setStep("choose-chain");
  }

  async function handleSelectChain(chainId: number) {
    setSelectedChainId(chainId);
    hasOpenedWalletConnectRef.current = false;
    setStep("connect");
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
      <div className="w-full max-w-5xl relative">
        {/* Cancel button (hidden on welcome) */}
        {step !== "welcome" && (
          <button
            className="absolute top-2 right-2 z-50 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-md"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </button>
        )}

        {/* Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
            <div className="relative z-10 card w-full max-w-md">
              <div className="text-xl font-bold mb-2">Cancel transaction?</div>
              <div className="text-white/80 mb-4">Are you sure you would like to cancel the transaction?</div>
              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep going
                </button>
                <button
                  className="button-primary"
                  onClick={resetFlow}
                >
                  Yes, cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "welcome" && (
          <div className="relative overflow-hidden">
            {/* Animated orbs */}
            <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-brand-500/30 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-fuchsia-500/30 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute top-1/3 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl animate-bounce" />

            <div className="text-center py-16">
              <div className="text-5xl md:text-7xl font-extrabold tracking-tight animate-float bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-200 to-white">
                Tap to Pay with Any Chain
              </div>
              <div className="mt-4 text-white/80 text-lg animate-float" style={{ animationDelay: "0.6s" }}>
                Fast, secure, and touch-friendly kiosk experience
              </div>

              <div className="relative mx-auto w-40 h-40 md:w-48 md:h-48 mt-10">
                <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
                <button
                  className="relative z-10 w-full h-full rounded-full bg-brand-500 hover:bg-brand-400 active:bg-brand-600 text-white text-2xl font-bold shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/40 transition"
                  onClick={handleBegin}
                >
                  Start
                </button>
              </div>

              <div className="mt-8 text-white/70 text-sm">
                Pay with your favorite chain • WalletConnect ready
              </div>
            </div>
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
            <div className="text-2xl font-bold mb-2">Scan QR to Connect</div>
            <div className="text-white/80">A WalletConnect QR code has been opened. Scan it using your phone to continue.</div>
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