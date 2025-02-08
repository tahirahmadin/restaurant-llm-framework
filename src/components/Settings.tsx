import React from "react";
import { User, Mail, Phone, Globe, Shield } from "lucide-react";

export function Settings() {
  const settingsSections = [
    {
      title: "Account Settings",
      icon: User,
      items: [
        {
          label: "Profile Information",
          description: "Update your personal details and information",
        },
        {
          label: "Password & Security",
          description: "Manage your password and security preferences",
        },
        {
          label: "Notifications",
          description: "Choose what updates you want to receive",
        },
      ],
    },
    {
      title: "Business Settings",
      icon: Globe,
      items: [
        {
          label: "Restaurant Details",
          description: "Update your restaurant information",
        },
        {
          label: "Operating Hours",
          description: "Set your business hours and availability",
        },
        {
          label: "Delivery Zones",
          description: "Manage your delivery area and zones",
        },
      ],
    },
    {
      title: "Payment Settings",
      icon: Shield,
      items: [
        {
          label: "Payment Methods",
          description: "Manage your payment options and bank details",
        },
        {
          label: "Transaction History",
          description: "View your past transactions and payouts",
        },
        {
          label: "Tax Information",
          description: "Update your tax and billing information",
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

        <div className="space-y-6">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#f15927]" />
                  </div>
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      className="w-full text-left p-4 rounded-lg hover:bg-orange-50 transition-colors border border-gray-100"
                    >
                      <h3 className="font-medium mb-1">{item.label}</h3>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
