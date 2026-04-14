function StatsCard({ title, value, icon }: { title: any; value: any; icon: any }) {
  return (
    <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all border-l-4 border-l-[#FFD700]">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-gray-50 rounded-xl shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-2xl sm:text-3xl font-black text-[#003087] truncate">{value}</div>
          <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider truncate" title={title}>{title}</div>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
