import React from 'react';
import { Store, Users } from 'lucide-react';

interface SelectAgentPanelProps {
  setSelectedAgent: (agent: 'restaurant' | 'customer') => void;
}

export function SelectAgentPanel({ setSelectedAgent }: SelectAgentPanelProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">How would you like to proceed?</h1>
        <p className="text-gray-500 mt-2">Select an agent to get started with your request</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Restaurant Agent Card */}
        <button
          onClick={() => setSelectedAgent('restaurant')}
          className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group hover:shadow-lg border border-emerald-100"
          style={{
            background: 'linear-gradient(120deg, #e6f7f0 0%, #f0f9ff 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-8 opacity-10">
            <Store className="w-full h-full text-emerald-600" />
          </div>
          <div className="relative">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
              <Store className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="mb-2 inline-flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Agent 01</span>
              <span className="text-xs text-gray-500">v1.2</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Restaurant Agent</h2>
            <p className="text-gray-600 text-sm">Manage orders, inventory, and restaurant operations with intelligence.</p>
          </div>
        </button>

        {/* Customer Agent Card */}
        <button
          onClick={() => setSelectedAgent('customer')}
          className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group hover:shadow-lg border border-orange-100"
          style={{
            background: 'linear-gradient(120deg, #fff1eb 0%, #fff5f5 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-8 opacity-10">
            <Users className="w-full h-full text-[#ff6b2c]" />
          </div>
          <div className="relative">
            <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
              <Users className="w-7 h-7 text-[#ff6b2c]" />
            </div>
            <div className="mb-2 inline-flex items-center gap-2">
              <span className="text-xs font-medium text-[#ff6b2c] bg-orange-50 px-2.5 py-0.5 rounded-full">Agent 02</span>
              <span className="text-xs text-gray-500">v0.2</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Agent</h2>
            <p className="text-gray-600 text-sm">Place orders, find deals/discounts, collect loyalty points and build personalised food assistant.</p>
          </div>
        </button>
      </div>
    </div>
  );
}