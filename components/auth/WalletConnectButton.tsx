"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
import { ethers } from 'ethers';

const WalletConnectButton: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed.');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
    }
  };

  const signMessage = async () => {
    if (!walletAddress) {
      setError('Connect your wallet first.');
      return;
    }
    try {
      setIsVerifying(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const message = `Sign in to NeuroLearn-Ai as ${walletAddress}`;
      const sig = await signer.signMessage(message);
      setSignature(sig);
      setError(null);

      // Send to backend for verification (example endpoint)
      const response = await fetch('/api/auth/wallet-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, signature: sig, message }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Set NextAuth session so navbar updates
        await signIn('credentials', {
          redirect: true,
          callbackUrl: '/',
          address: walletAddress,
        });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign message.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div>
      <button
        onClick={connectWallet}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {walletAddress ? 'Wallet Connected' : 'Connect Wallet'}
      </button>
      {walletAddress && (
        <div className="mt-2 text-green-600">Connected: {walletAddress}</div>
      )}
      {walletAddress && (
        <button
          onClick={signMessage}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Sign In with Wallet'}
        </button>
      )}
      {signature && (
        <div className="mt-2 text-blue-600 break-all">Signature: {signature}</div>
      )}
      {error && (
        <div className="mt-2 text-red-600">Error: {error}</div>
      )}
    </div>
  );
};

export default WalletConnectButton;
