import { useState } from "react";

export default function ConnectWallet({ account, connectWallet, disconnectWallet }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
      {!account ? (
        <button
          onClick={connectWallet}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          🔗 Connect   Wallet
        </button>
      ) : (
        <div className="w-full text-center">
          <p className="font-semibold text-gray-800 mb-2">Connected:</p>
          <p className="text-sm text-gray-600 truncate">{account}</p>
          <button
            onClick={disconnectWallet}
            className="mt-4 w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            ❌ Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
