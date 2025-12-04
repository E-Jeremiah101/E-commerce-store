{/* <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
    <div className="flex items-center gap-3 mb-3">
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-2 rounded-lg">
        <Hourglass className="h-5 w-5 bg-yellow-100 text-yellow-600" />
      </div>
      <p className="text-gray-600 font-medium">Pending Refunds</p>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">
      {analyticsData.refundsPending || 0}
    </h3>
    <div className="flex items-center gap-2">
      <span
        className={`text-sm ${
          percentage.pending > 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {percentage.pending.toFixed(1)}%
      </span>
    </div>
  </div>

  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
    <div className="flex items-center gap-3 mb-3">
      <div className=" p-2 rounded-lg">
        <CheckCircle className="h-5 w-5 bg-green-100 text-green-600" />
      </div>
      <p className="text-gray-600 font-medium">Approved Refunds</p>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">
      {analyticsData.refundsApproved || 0}
    </h3>
    <div className="flex items-center gap-2">
      <span
        className={`text-sm ${
          analyticsData.revenueChange >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {percentage.approved.toFixed(1)}%
      </span>
    </div>
  </div>

  <div className="rounded-xl p-6 border border-red-100 bg-gradient-to-br from-red-50 to-pink-50">
    <div className="flex items-center gap-3 mb-3">
      <div className=" p-2 rounded-lg">
        <XCircle className="h-5 w-5 bg-red-100 text-red-600" />
      </div>
      <p className="text-gray-600 font-medium">Rejected Refunds</p>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">
      {analyticsData.refundsRejected || 0}
    </h3>
    <div className="flex items-center gap-2">
      <span
        className={`text-sm ${
          analyticsData.revenueChange >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {percentage.rejected.toFixed(1)}%
      </span>
    </div>
  </div>

  <div className="rounded-xl p-6 border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
    <div className="flex items-center gap-3 mb-3">
      <div className=" p-2 rounded-lg">
        <CheckCircle className="h-5 w-5 bg-orange-100 text-orange-600" />
      </div>
      <p className="text-gray-600 font-medium">Refund Status</p>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">
      {`${analyticsData.refundsApproved || 0}/${
        analyticsData.refundsPending || 0
      }`}
    </h3>
    <div className="flex items-center gap-2">
      <span
        className={`text-sm ${
          analyticsData.revenueChange >= 0 ? "text-green-600" : "text-red-600"
        }`}
      ></span>
    </div>
  </div>
</div>; */}
