import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, Mail } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "sonner";
import {
  authenticateAdmin,
  getRestaurantProfile,
} from "../../actions/serverActions";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authenticateAdmin({
        email,
        password,
      });
      const adminId = result._id; // Use _id from authentication result

      // Fetch restaurant profile
      const profile = await getRestaurantProfile(adminId);

      setUser({
        adminId,
        email: result.email,
        restaurantId: profile.restaurantId,
        username: result.username,
        isChain: profile.isChain || false,
      });
    } catch (error) {
      const errorMessage = "Username or password is incorrect";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
