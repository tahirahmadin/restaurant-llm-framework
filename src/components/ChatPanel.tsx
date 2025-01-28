import React, { useState } from "react";
import { Bot, User, Send, Store, Package, Plus, Edit } from "lucide-react";

interface Message {
  id: string;
  content: string;
  type: "user" | "bot";
  timestamp: Date;
}

interface InventoryItem {
  name: string;
  quantity: number;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { name: "Dunkin Donut", quantity: 10 },
    { name: "Pizza", quantity: 5 },
    { name: "Sprite", quantity: 8 },
  ]);
  const [menu, setMenu] = useState<string[]>([
    "Dunkin Donut",
    "Pizza",
    "Sprite",
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    simulateBotResponse(input);
  };

  const simulateBotResponse = (order: string) => {
    setTimeout(() => {
      // Simulate processing order
      const updatedInventory = inventory.map((item) => {
        const regex = new RegExp(`\\b${item.name}\\b`, "i");
        if (regex.test(order)) {
          return { ...item, quantity: Math.max(item.quantity - 1, 0) };
        }
        return item;
      });

      setInventory(updatedInventory);

      const outOfStockItems = updatedInventory
        .filter((item) => item.quantity === 0)
        .map((item) => item.name);

      const updatedMenu = menu.filter(
        (menuItem) => !outOfStockItems.includes(menuItem)
      );
      setMenu(updatedMenu);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `Order received: ${order}. Inventory updated.`,
          type: "bot",
          timestamp: new Date(),
        },
      ]);
    }, 1000);
  };

  const handleNewOrder = () => {
    const order = "1 Dunkin Donut, 1 Pizza, and 1 Sprite";
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: `New Order: ${order}`,
        type: "bot",
        timestamp: new Date(),
      },
    ]);

    simulateBotResponse(order);
  };

  return (
    <>
      {/* Chat Section */}
      <div className="flex-1 overflow-y-auto p-6">
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
            {messages.map((message) => (
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
            ))}
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

      {/* Order Management */}
      {/* <div className="border-t border-gray-300 p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={handleNewOrder}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f]"
          >
            <Plus size={18} />
            <span>Simulate New Order</span>
          </button>

          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="font-medium text-gray-800 mb-4">Inventory</h3>
            <ul className="space-y-2">
              {inventory.map((item) => (
                <li
                  key={item.name}
                  className={`flex justify-between ${
                    item.quantity === 0 ? "text-red-500" : "text-gray-800"
                  }`}
                >
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="font-medium text-gray-800 mb-4">Menu</h3>
            <ul className="space-y-2">
              {menu.map((item) => (
                <li key={item} className="text-gray-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div> */}
    </>
  );
}
