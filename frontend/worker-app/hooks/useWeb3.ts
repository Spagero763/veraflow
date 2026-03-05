"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { FUJI_CHAIN_ID, FUJI_RPC } from "@/lib/contracts";

export type Web3State = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => void;
  switchToFuji: () => Promise<void>;
};

function getProvider(walletId?: string): unknown {
  if (!window.ethereum) return null;

  // Core wallet injects as window.avalanche or sets isAvalanche
  if (walletId === "core") {
    return (window as any).avalanche || window.ethereum;
  }

  // All others use window.ethereum
  return window.ethereum;
}

export function useWeb3(): Web3State {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _setup = useCallback(async (requestAccounts: boolean, walletId?: string) => {
    const rawProvider = getProvider(walletId);
    if (!rawProvider) return;
    try {
      const _provider = new ethers.BrowserProvider(rawProvider as any);
      if (requestAccounts) {
        await _provider.send("eth_requestAccounts", []);
      } else {
        const accounts = await _provider.send("eth_accounts", []) as string[];
        if (accounts.length === 0) return;
      }
      const _signer = await _provider.getSigner();
      const _address = await _signer.getAddress();
      const network = await _provider.getNetwork();
      setProvider(_provider);
      setSigner(_signer);
      setAddress(_address);
      setChainId(Number(network.chainId));
    } catch (e: unknown) {
      if (requestAccounts) {
        setError(e instanceof Error ? e.message : "Connection failed");
      }
    }
  }, []);

  useEffect(() => {
    _setup(false);
  }, [_setup]);

  const connect = useCallback(async (walletId?: string) => {
    setConnecting(true);
    setError(null);
    await _setup(true, walletId);
    setConnecting(false);
  }, [_setup]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
  }, []);

  const switchToFuji = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${FUJI_CHAIN_ID.toString(16)}` }],
      });
      await _setup(false);
    } catch (e: unknown) {
      if ((e as { code: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${FUJI_CHAIN_ID.toString(16)}`,
              chainName: "Avalanche Fuji Testnet",
              nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
              rpcUrls: [FUJI_RPC],
              blockExplorerUrls: ["https://testnet.snowtrace.io"],
            }],
          });
          await _setup(false);
        } catch {
          setError("Failed to add Fuji network");
        }
      }
    }
  }, [_setup]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) disconnect();
      else setAddress(accs[0]);
    };
    const handleChainChanged = (chainId: unknown) => {
      setChainId(parseInt(chainId as string, 16));
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum!.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum!.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return {
    provider, signer, address, chainId,
    connected: !!address,
    connecting, error,
    connect, disconnect, switchToFuji,
  };
}
