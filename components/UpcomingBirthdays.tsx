'use client'

import { useState, useEffect } from 'react'
import { getMonthName } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const TABS = [
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
] as const

import { CheckCircle2, XCircle, Clock, Send } from 'lucide-react'


type TabKey = typeof TABS[number]['key']

function UpcomingBirthdays() {
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [birthdays, setBirthdays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    setLoading(true)
    setPage(1)
    fetch(`/api/upcoming-birthdays?day=${activeTab}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.people)) setBirthdays(data.people)
        else if (Array.isArray(data)) setBirthdays(data)
        else setBirthdays([])
      })
      .catch(() => setBirthdays([]))
      .finally(() => setLoading(false))
  }, [activeTab])

  const totalPages = Math.ceil(birthdays.length / pageSize)
  const paginatedBirthdays = birthdays.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm mt-4 sm:mt-8">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key
              ? 'bg-[#003087] text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] sm:text-xs bg-blue-50 text-[#003087] px-2 py-1 rounded font-bold">
          {birthdays.length} {birthdays.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-400 font-medium">Loading...</div>
      )}

      {/* List */}
      {!loading && (
        <div className="space-y-3">
          {paginatedBirthdays.map((person: any) => (
            <div key={person.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 rounded-xl bg-gray-50/50 border border-transparent hover:border-gray-100 transition-colors gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#003087] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                  {person.otherNames?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#003087] text-sm sm:text-base truncate">{person.otherNames} {person.surname}</div>
                  <div className="flex flex-wrap gap-1.5 mt-0.5 items-center">
                    <div className={`inline-block px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${(person.role || '').toUpperCase() === 'STUDENT' ? 'bg-[#FFD700] text-[#003087]' : 'bg-[#003087] text-white'}`}>
                      {person.role}
                    </div>
                    {person.rank && (
                      <div className="inline-block px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-gray-100 text-gray-600">
                        {person.rank}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-1 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-100 sm:border-t-0 bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                <div className="flex items-center gap-2 mb-1">
                  {person.emailStatus === 'sent' ? (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[9px] font-bold border border-green-100 uppercase tracking-tighter">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                    </div>
                  ) : person.emailStatus === 'failed' ? (
                    <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[9px] font-bold border border-red-100 uppercase tracking-tighter">
                      <XCircle className="w-2.5 h-2.5" /> Failed
                    </div>
                  ) : activeTab === 'today' ? (
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-100 uppercase tracking-tighter">
                      <Clock className="w-2.5 h-2.5" /> Scheduled
                    </div>
                  ) : null}
                  <div className="text-[#003087] font-black text-sm sm:text-base">{getMonthName(person.birthMonth)} {person.birthDay}</div>
                </div>
                <div className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded ${activeTab === 'today' ? 'text-blue-600 bg-blue-50' :
                  activeTab === 'tomorrow' ? 'text-green-600 bg-green-50' :
                    'text-orange-600 bg-orange-50'
                  }`}>
                  {activeTab === 'today' ? 'Today' : activeTab === 'tomorrow' ? 'Tomorrow' : 'Yesterday'}
                </div>
              </div>
            </div>
          ))}
          {birthdays.length === 0 && (
            <div className="text-center py-8 text-gray-400 font-medium">
              No birthdays {activeTab === 'today' ? 'today' : activeTab === 'tomorrow' ? 'tomorrow' : 'yesterday'}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)} className="hover:bg-white text-[#003087] font-bold">
            ← Previous
          </Button>
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Page {page} of {totalPages}
          </span>
          <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="hover:bg-white text-[#003087] font-bold">
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}

export default UpcomingBirthdays
