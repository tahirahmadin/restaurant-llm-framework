import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Login } from './Login';
import { Signup } from './Signup';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const [isLogin, setIsLogin] = React.useState(true);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
              <span className="text-4xl">🍽️</span>
              <span>gobbl</span>
            </h1>
            <p className="text-gray-600 mt-2">Restaurant Management System</p>
          </div>

          {/* Auth Forms */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  isLogin
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  !isLogin
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Sign Up
              </button>
            </div>

            {isLogin ? <Login /> : <Signup />}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}