import React from "react";
import { Bot, User, Send, Store } from "lucide-react";

interface Message {
  id: string;
  content: string;
  type: "user" | "bot";
  timestamp: Date;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  showAccount: boolean;
}

export function ChatPanel({
  messages,
  input,
  setInput,
  handleSubmit,
  showAccount,
}: ChatPanelProps) {
  return (
    <>
      <div
        className={`flex-1 overflow-y-auto p-6 ${showAccount ? "hidden" : ""}`}
      >
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#fff1eb] rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-[#ff6b2c]" />
              </div>
              <div>
                <h2 className="font-medium text-gray-800">Restaurant Agent</h2>
                <p className="text-sm text-gray-500">
                  Managing restaurant operations
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot size={48} className="text-[#ff6b2c] mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  Intelligent Restaurant Agent
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Manage orders, inventory, and restaurant operations with
                  intelligence.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.type === "bot" ? "bg-[#fff1eb]" : ""
                  } p-4 rounded-lg`}
                >
                  {message.type === "bot" ? (
                    <Bot className="w-6 h-6 text-[#ff6b2c]" />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-800">{message.content}</p>
                    <span className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-300 p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              maxLength={500}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f] flex items-center gap-2"
            >
              <Send size={18} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
