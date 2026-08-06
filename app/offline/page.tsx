import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1C1C1B] text-white p-4">
      <WifiOff className="w-16 h-16 mb-6 text-gray-400" />
      <h1 className="text-3xl font-bold mb-2">You are offline</h1>
      <p className="text-gray-400 text-center max-w-md">
        Please check your internet connection and try again. 
        StudyMate requires an active network connection to sync your progress and load content.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
      >
        Try Again
      </button>
    </div>
  );
}
