import { MessageCircle, Twitter, Send } from "lucide-react";

export function Help() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Help Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Get support and connect with us
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discord */}
        <a
          href="https://discord.gg/gobbl"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
              <MessageCircle className="w-6 h-6 text-indigo-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Discord Community</h3>
              <p className="text-sm text-gray-500">Join our community</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Connect with other restaurant owners, share experiences, and get
            help from our community.
          </p>
        </a>

        {/* Twitter */}
        <a
          href="https://twitter.com/gobbl"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Twitter className="w-6 h-6 text-blue-500 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Twitter</h3>
              <p className="text-sm text-gray-500">Follow us @gobbl</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Stay updated with the latest features, tips, and announcements.
          </p>
        </a>

        {/* Telegram */}
        <a
          href="https://t.me/gobbl"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center group-hover:bg-sky-500 transition-colors">
              <Send className="w-6 h-6 text-sky-500 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Telegram</h3>
              <p className="text-sm text-gray-500">Join our channel</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Get instant updates and support through our Telegram channel.
          </p>
        </a>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "How do I update my menu?",
              a: "Navigate to the Menu section, where you can add, edit, or remove items. You can also manage categories and customize item options.",
            },
            {
              q: "How do I process orders?",
              a: "In the Orders section, you'll find all incoming orders. You can update their status from processing to cooking, and then to delivery or completion.",
            },
            {
              q: "How do I manage payments?",
              a: "Visit the Payments section to set up your payment methods, view transaction history, and manage your deposit addresses.",
            },
          ].map((faq, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-12 bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-xl border border-red-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Need More Help?</h3>
            <p className="text-sm text-gray-600">
              Our support team is here for you
            </p>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          If you can't find what you're looking for, reach out to our support
          team. We're available 24/7 to help you.
        </p>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
}
