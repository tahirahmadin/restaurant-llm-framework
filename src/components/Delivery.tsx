import React, { useState, useEffect } from "react";
import { Plus, User2, CheckCircle2, XCircle, Bike } from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "../store/useAuthStore";
import {
  getDeliveryAgents,
  createDeliveryAgent,
} from "../actions/serverActions";

interface DeliveryAgent {
  id: string;
  username: string;
  isActive: boolean;
  isEngaged: boolean;
  totalOrders: number;
}

export function Delivery() {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    username: "",
    password: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, [user?.restaurantId]);

  const loadAgents = async () => {
    if (!user?.restaurantId) {
      toast.error("Restaurant ID not found");
      return;
    }

    try {
      const data = await getDeliveryAgents(user.restaurantId);
      setAgents(data);
    } catch (error) {
      toast.error("Failed to load delivery agents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.restaurantId || !user?.username) {
      toast.error("Missing required credentials");
      return;
    }

    const superadminPassword = localStorage.getItem("superadminPassword");
    if (!superadminPassword) {
      toast.error("Authentication error. Please try logging in again.");
      return;
    }

    setIsCreating(true);
    try {
      await createDeliveryAgent(
        user.restaurantId,
        newAgent.username,
        newAgent.password,
        user.username,
        superadminPassword
      );

      toast.success("Delivery agent created successfully");
      setShowCreateModal(false);
      setNewAgent({ username: "", password: "" });
      loadAgents();
    } catch (error) {
      toast.error("Failed to create delivery agent");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading delivery agents...</div>
      </div>
    );
  }

  return (
    <div className="pt-6 w-3/4 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Delivery Agents
          </h1>
          <p className="text-sm text-gray-500">Manage your delivery fleet</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Agent
        </button>
      </div>

      <div className="grid grid-cols-2  gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <img src="https://www.shareicon.net/data/512x512/2016/04/10/747353_people_512x512.png" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{agent.username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {agent.isActive ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <XCircle className="w-4 h-4" />
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-medium">
                  {agent.isEngaged ? "Engaged" : "Free"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Total Deliveries</span>
                <span className="text-sm font-medium">{agent.totalOrders}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add New Delivery Agent
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Create credentials for your delivery staff
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 flex items-center justify-center">
              <img
                src="https://img.freepik.com/free-vector/delivery-service-illustrated_23-2148505081.jpg?w=740&t=st=1706548171~exp=1706548771~hmac=8e4d9fe6577e8e815c834b9ca43dd0f8c211d55285663e8ca7f7d97ee23f7e6b"
                alt="Delivery Agent"
                className="w-48 h-48 object-contain"
              />
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  Create secure credentials for your delivery agent. They will
                  use these to log into their delivery app.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAgent.username}
                  onChange={(e) =>
                    setNewAgent((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="e.g., john_delivery"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a unique username for the delivery agent
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newAgent.password}
                  onChange={(e) =>
                    setNewAgent((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Enter a strong password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters with numbers and special characters
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
