import React from 'react';
import { MessageSquarePlus, Settings, User, ChefHat, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface LeftBarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  messages: Array<{ id: string; content: string }>;
  setMessages: (messages: any[]) => void;
  setShowAccount: (show: boolean) => void;
  setShowSetup: (show: boolean) => void;
  restaurantName: string;
}

export function LeftBar({
  isExpanded,
  setIsExpanded,
  messages,
  setMessages,
  setShowAccount,
  setShowSetup,
  restaurantName
}: LeftBarProps) {
  const { publicKey } = useWallet();

  return (
    <>
      <div className={`${isExpanded ? 'w-64' : 'w-16'} sidebar transition-all duration-300 flex flex-col`}>
        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img
                src="https://gobbl-bucket.s3.ap-south-1.amazonaws.com/gobbl_token.png"
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-700">
                      ${publicKey ? publicKey.toBase58().slice(0, 2).toUpperCase() : 'A'}
                    </span>
                  </div>`;
                }}
              />
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {publicKey ? `${publicKey.toBase58().slice(0, 6)}...` : 'Gobbl User'}
                </h3>
                <p className="text-xs text-gray-500 truncate">Demo Account</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <button
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-[#FFFDFC] hover:bg-gray-50 text-gray-700 transition-colors"
            onClick={() => setMessages([])}
          >
            <MessageSquarePlus size={18} />
            {isExpanded && <span>New Chat</span>}
          </button>
        </div>
        
        <nav className="px-2 flex-1 overflow-y-auto">
          <div className="mb-2 px-2">
            <h2 className={`${isExpanded ? 'text-xs font-medium text-gray-400 uppercase' : 'sr-only'}`}>
              Today
            </h2>
          </div>
          {messages.length > 0 && (
            <div className="space-y-1">
              {messages.filter(m => m.type === 'user').map(message => (
                <button
                  key={message.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <MessageSquarePlus size={16} className="text-gray-400" />
                  {isExpanded ? `${message.content.slice(0, 25)}...` : '...'}
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-2 space-y-1">
          <div className={`${isExpanded ? 'px-4' : 'px-2'} w-full py-3`}>
            <WalletMultiButton className="wallet-adapter-button-custom" style={{backgroundColor:'#F05024',color:"white",maxHeight:"40px",maxWidth:200,fontSize:14}}/>
            {restaurantName && (
              <div className="flex items-center gap-2 mt-2 px-2">
                <ChefHat className="w-4 h-4 text-[#ff6b2c]" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {restaurantName}
                </span>
              </div>
            )}
          </div>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowSetup(true)}
          >
            <Settings size={18} />
            {isExpanded && <span>Settings</span>}
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowAccount(true)}
          >
            <User size={18} />
            {isExpanded && <span>Account</span>}
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-0 top-2 z-10 p-2 text-white hover:text-[#ff6b2c] transition-all duration-300 ease-in-out"
        style={{ transform: `translateX(${isExpanded ? '240px' : '48px'})` }}
      >
        {isExpanded ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
      </button>
    </>
  );
}