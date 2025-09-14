import { CheckCircle } from 'lucide-react'
import React from 'react'

const PurchaseSuccessPage = () => {
  return (
    <div className="h-screen flex items-center justify-center px-4">
      {/* <Confetti/> */}

      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center">
            <CheckCircle className="text-emerald-400 w-16 h-16 mb-4" />
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default PurchaseSuccessPage