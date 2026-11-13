'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StatsCard from '@/components/StatsCard'
import UpcomingBirthdays from '@/components/UpcomingBirthdays'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Calendar, Gift, Upload, Plus, FileText, Send, MessageSquare, AlertCircle, Eye } from 'lucide-react'
import AddPersonForm from '@/components/AddPersonForm'
import { parsePeopleFromCSV, parsePeopleFromExcel, downloadSampleTemplate } from '@/lib/bulk'
import { toast } from 'sonner'

function Dashboard() {
  const [stats, setStats] = useState<any>({ 
    totalStaff: 0, 
    totalStudents: 0, 
    birthdaysToday: 0, 
    birthdaysThisMonth: 0, 
    totalTemplates: 0, 
    totalEmailsSent: 0, 
    totalEmailsFailed: 0,
    totalEmailsSending: 0,
    totalEmailsReplied: 0,
    totalEmailsOpened: 0,
    monthlyData: []
  })
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importDialog, setImportDialog] = useState(false)
  const [addPersonDialog, setAddPersonDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  const fetchData = async () => {
    try {
      const [statsRes] = await Promise.all([
        fetch('/api/stats', { cache: 'no-store' })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        console.error('Failed to fetch stats')
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load dashboard data. Please check your connection.')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [])

  const handleAdd = async (data: any) => {
    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        router.refresh()
        fetchData()
        setAddPersonDialog(false)
      } else {
        const errorData = await response.json()
        alert(`Failed to add person: ${errorData.error}`)
        console.error('Server error response:', errorData)
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`)
      console.error('Network error during fetch:', err)
    }
  }

  const handleImport = async () => {
    if (!importFile || isImporting) return
    setIsImporting(true)
    setImportProgress(0)

    try {
      const isExcel = importFile.name.endsWith('.xlsx') || importFile.name.endsWith('.xls')
      const parsedPeople = isExcel
        ? await parsePeopleFromExcel(importFile)
        : await parsePeopleFromCSV(importFile)

      if (!parsedPeople || parsedPeople.length === 0) {
        toast.error('No valid records found. Ensure columns contain Surname, Other Names, Email, and Date of Birth (DD-MM-YYYY).')
        setIsImporting(false)
        return
      }

      const CHUNK_SIZE = 250
      let totalImported = 0
      let totalSkipped = 0
      let hasError = false

      for (let i = 0; i < parsedPeople.length; i += CHUNK_SIZE) {
        const chunk = parsedPeople.slice(i, i + CHUNK_SIZE)

        const response = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        })

        if (response.ok) {
          const result = await response.json()
          totalImported += (result.count || 0)
          totalSkipped += (result.skipped || 0)
          setImportProgress(Math.round(((i + chunk.length) / parsedPeople.length) * 100))
        } else {
          let errorMsg = `Server error ${response.status}`
          try {
            const errJson = await response.json()
            errorMsg = errJson.error || errorMsg
          } catch {
            // fallback text
          }
          toast.error(`Import stopped around row ${i + 1}: ${errorMsg}`)
          hasError = true
          break
        }
      }

      if (totalImported > 0 || totalSkipped > 0) {
        if (totalImported === 0 && totalSkipped > 0) {
          toast.info(`Notice: All ${totalSkipped} records in file already exist in database.`)
        } else {
          toast.success(`Import complete! ${totalImported} added, ${totalSkipped} skipped (duplicates).`)
        }
        router.refresh()
        fetchData()
        if (!hasError) {
          setImportDialog(false)
          setImportFile(null)
        }
      }
    } catch (error: any) {
      toast.error('Import failed: ' + (error?.message || 'Unknown error'))
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }
  const handleSendToday = async () => {
    if (stats.birthdaysToday === 0) {
      toast.info('No birthdays today to send wishes to.')
      return
    }
    if (!confirm(`Trigger emails for ${stats.birthdaysToday} people?`)) return

    setIsSending(true)
    try {
      // Append ?force=true to allow re-sending for testing
      const res = await fetch('/api/emails/trigger?force=true', { method: 'POST' })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Successfully sent ${result.sent} emails! (${result.skipped} skipped, ${result.failed} failed)`)
        fetchData()
      } else {
        toast.error(result.error || 'Failed to trigger emails')
      }
    } catch (err) {
      toast.error('Failed to trigger emails')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#003087]">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">Welcome back to the Birthday Portal.</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <Button
              onClick={handleSendToday}
              disabled={isSending || stats.birthdaysToday === 0}
              className="w-full sm:w-auto bg-[#003087] text-white font-bold hover:bg-blue-900 transition-all h-12 sm:h-11 px-6 rounded-xl shadow-sm border-0"
            >
              {isSending ? <Gift className="w-5 h-5 mr-2 animate-bounce" /> : <Send className="w-5 h-5 mr-2" />}
              Send Today's Wishes
            </Button>

            <Dialog open={addPersonDialog} onOpenChange={setAddPersonDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-[#FFD700] text-[#003087] font-bold hover:bg-[#e6c200] transition-colors h-12 sm:h-11 px-6 rounded-xl shadow-sm">
                  <Plus className="w-5 h-5 mr-2" />
                  Quick Add
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
                <DialogHeader className="text-left sm:text-center">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-[#003087]">Add New Person</DialogTitle>
                  <DialogDescription className="font-medium text-gray-500 text-sm sm:text-base">
                    Enter the details of the staff or student to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <AddPersonForm onSubmit={handleAdd} />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={importDialog} onOpenChange={(open) => { if (!isImporting) setImportDialog(open) }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto flex gap-2 border-gray-200 hover:bg-white hover:border-[#003087] hover:text-[#003087] transition-all h-12 sm:h-11 px-6 rounded-xl font-bold shadow-sm">
                  <Upload className="h-5 w-5" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-2xl p-4 sm:p-6">
                <DialogHeader className="text-left sm:text-center">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-[#003087]">Bulk Import</DialogTitle>
                  <DialogDescription className="font-medium text-gray-500 text-sm sm:text-base">
                    Upload a CSV or Excel file to add multiple staff or students at once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) setImportFile(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all bg-gray-50/50 ${
                      isDragging ? 'border-[#003087] bg-blue-50/50 scale-[1.01]' : 'border-gray-200 hover:border-[#003087]'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept=".csv,.xlsx,.xls"
                      onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block w-full touch-manipulation">
                      <Upload className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 transition-colors ${
                        importFile ? 'text-[#003087]' : 'text-gray-300'
                      }`} />
                      <div className="text-[#003087] font-bold text-sm sm:text-base px-2 break-all">
                        {importFile ? importFile.name : 'Click to select or drag and drop'}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-400 mt-2 font-medium px-4">
                        Required columns: Surname, Other Names, Email, Date of Birth (DD-MM-YYYY)
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                    <span className="font-medium">Need a ready template?</span>
                    <div className="flex gap-2 font-bold">
                      <button
                        type="button"
                        onClick={() => downloadSampleTemplate('csv')}
                        className="text-[#003087] hover:underline"
                      >
                        Sample CSV
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => downloadSampleTemplate('xlsx')}
                        className="text-[#003087] hover:underline"
                      >
                        Sample Excel
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={!importFile || isImporting}
                    className="w-full bg-[#003087] text-white font-bold h-12 sm:h-14 rounded-xl shadow-lg hover:bg-blue-900 transition-all disabled:opacity-50 text-base relative overflow-hidden"
                  >
                    {isImporting ? (
                      <>
                        <div
                          className="absolute inset-0 bg-[#002266] transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Importing... {Math.min(importProgress, 100)}%
                        </span>
                      </>
                    ) : (
                      'Start Import'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 font-medium animate-in fade-in slide-in-from-top-4 text-sm sm:text-base">
            <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Responsive Grid for Stats */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatsCard title="Total Staff" value={stats.totalStaff} icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#003087]" />} />
          <StatsCard title="Total Students" value={stats.totalStudents} icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#003087]" />} />
          <StatsCard title="Birthdays Today" value={stats.birthdaysToday} icon={<Gift className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500" />} />
          <StatsCard title="Emails Sent" value={stats.totalEmailsSent} icon={<Send className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />} />
          <StatsCard title="Emails Sending" value={stats.totalEmailsSending} icon={<Upload className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />} />
          <StatsCard title="Emails Opened" value={stats.totalEmailsOpened} icon={<Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />} />
          <StatsCard title="Emails Replied" value={stats.totalEmailsReplied} icon={<MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />} />
          <StatsCard title="Emails Failed" value={stats.totalEmailsFailed} icon={<AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />} />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <UpcomingBirthdays />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
