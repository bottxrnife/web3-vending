"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract, useReadContract, useConnect } from "wagmi";
import { parseUnits } from "viem";
import { SUPPORTED_CHAINS, DEFAULT_PRICE_USDC, L0_CHAIN_OPTIONS } from "@/lib/chains";
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

  const { address, isConnected } = useAccount();
  const activeChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { connect, connectors, status: connectStatus, error: connectError } = useConnect();

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

  // Once connected, ensure correct chain then move to review
  useEffect(() => {
    async function run() {
      if (step !== "connect") return;
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
  }, [step, isConnected, activeChainId, selectedChainId, switchChainAsync]);

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
    if (waitReceipt.status === "success" && txHash) {
      setStep("receipt");
    }
  }, [waitReceipt.status, txHash]);

  function resetFlow() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setShowCancelConfirm(false);
    setStep("welcome");
    setSelectedChainId(SUPPORTED_CHAINS[0].id);
    setTxHash(null);
  }

  async function handleBegin() {
    setStep("choose-chain");
  }

  async function handleSelectChain(chainId: number) {
    setSelectedChainId(chainId);
    setStep("connect");
  }

  async function handlePay() {
    try {
      setStep("paying");

      await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [paymentConfig.oftOrComposerAddress, amountInSmallest],
        chainId: selectedChainId,
      });

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
        value: 0n,
        chainId: selectedChainId,
      });

      setTxHash(tx as `0x${string}`);
    } catch (e) {
      setStep("review");
    }
  }

  function PhoneConnectOptions() {
    return (
      <div className="grid gap-3">
        {connectors.map((c) => (
          <button
            key={c.uid}
            className="button-primary !bg-white/10 hover:!bg-white/20 !text-white"
            onClick={() => connect({ connector: c, chainId: selectedChainId })}
            disabled={connectStatus === "pending"}
          >
            Connect with {c.name}
          </button>
        ))}
        {connectError && <div className="text-sm text-red-300">{connectError.message}</div>}
      </div>
    );
  }

  const coinbaseOnrampUrl = "https://pay.coinbase.com/buy";

  function Receipt() {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div className="text-2xl font-bold mb-2">Payment Received</div>
        <div className="text-white/80 mb-4">Thank you!</div>
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
        {step !== "welcome" && (
          <button
            className="absolute top-2 right-2 z-50 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-md"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </button>
        )}

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
          <div className="text-center py-16">
            <div className="text-5xl md:text-7xl font-extrabold tracking-tight">Welcome to Ominvend</div>
            <div className="mt-1 text-white/70 text-sm">Machine: Candy Dispenser Demo</div>

            <div className="relative mx-auto w-40 h-40 md:w-48 md:h-48 mt-10">
              <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
              <button
                className="relative z-10 w-full h-full rounded-full bg-brand-500 hover:bg-brand-400 active:bg-brand-600 text-white text-2xl font-bold shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/40 transition"
                onClick={handleBegin}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {step === "choose-chain" && (
          <div className="card">
            <div className="text-2xl font-bold mb-4 text-center">How would you like to pay?</div>
            <div className="grid gap-3">
              <a
                href={coinbaseOnrampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary !bg-white/10 hover:!bg-white/20 !text-white inline-flex items-center justify-center w-full"
              >
                Apple Pay
              </a>
              <div className="text-white/70 text-sm mt-2">or choose a chain (LayerZero-supported)</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {L0_CHAIN_OPTIONS.map((opt) => {
                  const enabled = SUPPORTED_CHAINS.some((c) => c.id === opt.id) && Boolean(paymentConfig.usdcAddressByChainId[opt.id]);
                  return (
                    <button
                      key={opt.id}
                      className={`button-primary !bg-white/10 hover:!bg-white/20 !text-white ${enabled ? "" : "opacity-40 cursor-not-allowed"}`}
                      onClick={() => enabled && handleSelectChain(opt.id)}
                      disabled={!enabled}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === "connect" && (
          <div className="card">
            <div className="text-2xl font-bold mb-2 text-center">Connect your wallet</div>
            <PhoneConnectOptions />
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
            <div className="grid gap-3 mt-6">
              <button className="button-primary w-full" onClick={handlePay}>Pay</button>
            </div>
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