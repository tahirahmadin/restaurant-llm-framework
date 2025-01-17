import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Twitter, Mail, Phone } from 'lucide-react';

interface AccountProps {
  showAccount: boolean;
  setShowAccount: (show: boolean) => void;
}

export function Account({ showAccount, setShowAccount }: AccountProps) {
  const { publicKey } = useWallet();

  if (!showAccount) return null;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Account</h1>
          <button
            onClick={() => setShowAccount(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img
                src="https://gobbl-bucket.s3.ap-south-1.amazonaws.com/gobbl_token.png"
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-[#fff1eb] flex items-center justify-center">
                    <span className="text-xl font-semibold text-[#ff6b2c]">
                      ${publicKey ? publicKey.toBase58().slice(0, 2) : 'A'}
                    </span>
                  </div>`;
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {publicKey ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}` : 'Connect Wallet'}
              </h2>
              <p className="text-sm text-gray-500">
                Joined on {new Date().toLocaleDateString()}
              </p>
            </div>
            <button className="ml-auto px-4 py-2 text-sm font-medium text-[#ff6b2c] hover:bg-[#fff1eb] rounded-lg">
              Change Profile Picture
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                {publicKey ? publicKey.toBase58() : 'Connect wallet to view ID'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connected Wallets</label>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                {publicKey ? publicKey.toBase58() : 'No wallets connected'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Connected Accounts</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                <div>
                  <p className="font-medium text-gray-800">Twitter</p>
                  <p className="text-sm text-gray-500">Not Connected</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-[#ff6b2c] hover:bg-[#fff1eb] rounded-lg">
                Connect
              </button>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Email</p>
                  <p className="text-sm text-gray-500">Not Connected</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-[#ff6b2c] hover:bg-[#fff1eb] rounded-lg">
                Connect
              </button>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Phone</p>
                  <p className="text-sm text-gray-500">Not Connected</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-[#ff6b2c] hover:bg-[#fff1eb] rounded-lg">
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}