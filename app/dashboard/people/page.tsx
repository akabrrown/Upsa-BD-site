'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PeopleTable from '@/components/PeopleTable'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { exportPeopleToExcel, parsePeopleFromCSV, parsePeopleFromExcel } from '@/lib/bulk'
import AddPersonForm from '@/components/AddPersonForm'

function PeoplePage() {
  const [people, setPeople] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('NONE')
  const [isLoading, setIsLoading] = useState(true)
  const [editPerson, setEditPerson] = useState<any | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; person: { id: string; name: string } | null }>({ open: false, person: null })
  const [importDialog, setImportDialog] = useState(false)
  const [exportDialog, setExportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [addPersonDialog, setAddPersonDialog] = useState(false)
  const router = useRouter()

  const pageSize = 50

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} people? This action cannot be undone.`)) return

    setIsDeletingBulk(true)
    try {
      const response = await fetch('/api/people', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      if (response.ok) {
        setPeople(people.filter(p => !selectedIds.has(p.id)))
        setSelectedIds(new Set())
        alert(`Successfully deleted ${selectedIds.size} people.`)
      } else {
        const error = await response.json()
        alert('Failed to delete: ' + (error.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error during deletion: ' + error.message)
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Are you ABSOLUTELY sure you want to delete ALL people from the database? This action is irreversible.')) return

    setIsDeletingAll(true)
    try {
      const response = await fetch('/api/people', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true }),
      })

      if (response.ok) {
        setPeople([])
        setSelectedIds(new Set())
        setTotal(0)
        setPage(1)
        alert('Successfully deleted all people.')
      } else {
        const error = await response.json()
        alert('Failed to delete all: ' + (error.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error during deletion: ' + error.message)
    } finally {
      setIsDeletingAll(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === people.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(people.map(p => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const fetchPeople = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/people?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&role=${filter}&sortBy=${sortBy}`)
      const data = await res.json()
      if (data && data.people) {
        setPeople(data.people)
        setTotal(data.total)
      }
    } catch (err) {
      console.error('Failed to fetch people:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPeople()
  }, [page, search, filter, sortBy])

  useEffect(() => {
    setPage(1)
  }, [search, filter, sortBy])

  const totalPages = Math.ceil(total / pageSize)

  const handleEdit = (person: any) => {
    setEditPerson(person)
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ open: true, person: { id, name } })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.person) return
    await fetch(`/api/people/${deleteDialog.person!.id}`, { method: 'DELETE' })
    router.refresh()
    setPeople(people.filter(p => p.id !== deleteDialog.person!.id))
    setDeleteDialog({ open: false, person: null })
  }

  const handleExportFull = async (mode: 'STUDENT' | 'STAFF' | 'BOTH') => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/people?all=true&search=${encodeURIComponent(search)}&role=${filter}&sortBy=${sortBy}`)
      const data = await res.json()
      if (data && data.people) {
        exportPeopleToExcel(data.people, mode)
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
      setExportDialog(false)
    }
  }

  const handleAdd = async (data: any) => {
    const response = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (response.ok) {
      router.refresh()
      const newPerson = await response.json()
      setPeople([...people, newPerson])
      setAddPersonDialog(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editPerson) return
    const response = await fetch(`/api/people/${editPerson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (response.ok) {
      router.refresh()
      const updated = await response.json()
      setPeople(people.map(p => p.id === editPerson.id ? updated : p))
      setEditPerson(null)
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setIsImporting(true)
    setImportProgress(0)

    try {
      const isExcel = importFile.name.endsWith('.xlsx') || importFile.name.endsWith('.xls')
      const parsedPeople = isExcel
        ? await parsePeopleFromExcel(importFile)
        : await parsePeopleFromCSV(importFile)

      if (parsedPeople.length === 0) {
        alert('No valid people data found in the file.')
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
          totalImported += result.count
          totalSkipped += (result.skipped || 0)
          setImportProgress(Math.round(((i + chunk.length) / parsedPeople.length) * 100))
        } else {
          console.error(`Import failed at status: ${response.status}`)
          const rawText = await response.text()
          console.error(`Raw response: ${rawText.substring(0, 500)}`)

          let errorMsg = `Server error ${response.status}`
          try {
            const error = JSON.parse(rawText)
            errorMsg = error.error || error.message || errorMsg
          } catch (e) {
            errorMsg = `Raw Server Error (${response.status}): ${rawText.substring(0, 300)}`
          }
          alert(`Import stopped around row ${i + 1}:\n${errorMsg}`)
          hasError = true
          break
        }
      }

      if (totalImported > 0 || totalSkipped > 0) {
        alert(`Import Complete!\n\n- Successfully imported: ${totalImported} people\n- Skipped (already exist): ${totalSkipped}\n- Total processed: ${parsedPeople.length}`)
        router.refresh()
        fetchPeople()
      }

      if (!hasError) {
        setImportDialog(false)
        setImportFile(null)
      }
    } catch (error: any) {
      alert('File reading or parsing failed: ' + error.message)
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#003087]">People Management</h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">Manage your staff and student directory.</p>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex gap-3">
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="h-11 px-6 rounded-xl font-bold transition-all"
              >
                {isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
              </Button>
            )}
            <Dialog open={exportDialog} onOpenChange={setExportDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-6 rounded-xl font-bold border-gray-200 hover:bg-white hover:border-[#003087] hover:text-[#003087] transition-all"
                >
                  Export Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[400px] rounded-2xl p-4 sm:p-6">
                <DialogHeader className="text-left sm:text-center">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-[#003087]">Export Data</DialogTitle>
                  <DialogDescription className="text-gray-500 font-medium">Choose what to export</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-4">
                  <Button 
                    onClick={() => handleExportFull('STUDENT')} 
                    disabled={isExporting}
                    className="h-12 rounded-xl font-bold bg-[#FFD700] hover:bg-[#e6c200] text-[#003087]"
                  >
                    {isExporting ? 'Preparing...' : 'Students Only'}
                  </Button>
                  <Button 
                    onClick={() => handleExportFull('STAFF')} 
                    disabled={isExporting}
                    className="h-12 rounded-xl font-bold bg-[#003087] hover:bg-[#002060] text-white"
                  >
                    {isExporting ? 'Preparing...' : 'Staff Only'}
                  </Button>
                  <Button 
                    onClick={() => handleExportFull('BOTH')} 
                    disabled={isExporting}
                    variant="outline" 
                    className="h-12 rounded-xl font-bold border-gray-200 hover:border-[#003087] hover:text-[#003087]"
                  >
                    {isExporting ? 'Preparing...' : 'Both (Two Sheets)'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={importDialog} onOpenChange={setImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-6 rounded-xl font-bold border-gray-200 hover:bg-white hover:border-[#003087] hover:text-[#003087] transition-all">
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-2xl p-4 sm:p-6">
                <DialogHeader className="text-left sm:text-center">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-[#003087]">Bulk Import</DialogTitle>
                  <DialogDescription className="font-medium text-gray-500 text-sm sm:text-base">
                    Upload your staff or student database in CSV or Excel format.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center bg-gray-50/50">
                    <input
                      type="file"
                      id="people-upload"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="people-upload" className="cursor-pointer block">
                      <div className="text-[#003087] font-bold text-base sm:text-lg px-2 break-all">
                        {importFile ? importFile.name : 'Choose File'}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-2">Required columns: Surname, Other Names, Email, Role, Date of Birth</p>
                    </label>
                  </div>
                  <Button onClick={handleImport} disabled={!importFile || isImporting} className="w-full bg-[#003087] text-white font-bold h-12 sm:h-14 rounded-xl text-base relative overflow-hidden">
                    {isImporting ? (
                      <>
                        <div className="absolute inset-0 bg-[#002266] transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                        <span className="relative z-10 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Importing... {Math.min(importProgress, 100)}%
                        </span>
                      </>
                    ) : (
                      'Import Now'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isDeletingAll || people.length === 0}
              className="h-11 px-6 rounded-xl font-bold transition-all bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              {isDeletingAll ? 'Deleting...' : 'Delete All'}
            </Button>

            <Dialog open={addPersonDialog} onOpenChange={setAddPersonDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#FFD700] text-[#003087] font-bold h-11 px-6 rounded-xl hover:bg-[#e6c200] shadow-sm">
                  Add Person
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
                <DialogHeader className="text-left sm:text-center">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-[#003087]">Add Person</DialogTitle>
                  <DialogDescription className="font-medium text-gray-500 text-sm sm:text-base">Create a new profile for a staff member or student.</DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <AddPersonForm onSubmit={handleAdd} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Actions Dropdown */}
          <div className="md:hidden w-full relative">
            <div className="flex justify-between items-center w-full">
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="outline"
                className="w-full flex justify-between items-center h-12 rounded-xl font-bold border-gray-200 text-[#003087]"
              >
                <span>Page Actions</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
              </Button>
            </div>

            <div 
              id="mobile-actions-menu" 
              className={`${isMobileMenuOpen ? 'flex' : 'hidden'} absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-xl rounded-xl p-3 z-30 flex-col gap-2`}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setExportDialog(true)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full justify-start h-12 rounded-lg font-bold hover:bg-gray-50 text-[#003087]"
              >
                Export Excel
              </Button>

              <Dialog open={importDialog} onOpenChange={setImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start h-12 rounded-lg font-bold hover:bg-gray-50 text-[#003087]" onClick={() => document.getElementById('mobile-actions-menu')?.classList.add('hidden')}>
                    Import Bulk Data
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start h-12 rounded-lg font-bold bg-[#FFD700] hover:bg-[#e6c200] text-[#003087] shadow-sm mt-1" onClick={() => document.getElementById('mobile-actions-menu')?.classList.add('hidden')}>
                    Add New Person
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Button
                variant="ghost"
                onClick={() => {
                  handleDeleteAll()
                  setIsMobileMenuOpen(false)
                }}
                disabled={isDeletingAll || people.length === 0}
                className="w-full justify-start h-12 rounded-lg font-bold hover:bg-red-50 text-red-600"
              >
                {isDeletingAll ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'STUDENT', label: 'Students' },
            { key: 'STAFF', label: 'Staff' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === tab.key
                ? tab.key === 'STUDENT' ? 'bg-[#FFD700] text-[#003087] shadow-sm'
                  : 'bg-[#003087] text-white shadow-sm'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
            >
              {tab.label}
              {filter === tab.key && (
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === tab.key
                  ? 'bg-white/30 text-inherit'
                  : 'bg-gray-200 text-gray-500'
                  }`}>{total}</span>
              )}
            </button>
          ))}
          {isLoading && (
            <div className="ml-auto flex items-center gap-2 text-[#003087] font-bold text-sm animate-pulse">
              <div className="w-2 h-2 bg-[#003087] rounded-full animate-bounce"></div>
              Refreshing...
            </div>
          )}
        </div>

        {/* Search & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="h-12 px-5 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#003087]/10 bg-white shadow-sm"
            />
          </div>
          <div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-12 px-5 rounded-xl border-gray-200 bg-white shadow-sm">
                <SelectValue placeholder="Sort By..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="NONE">Default Order</SelectItem>
                <SelectItem value="BIRTHDAY_ASC">Birthday (Jan → Dec)</SelectItem>
                <SelectItem value="BIRTHDAY_DESC">Birthday (Dec → Jan)</SelectItem>
                <SelectItem value="NAME_ASC">Name (A → Z)</SelectItem>
                <SelectItem value="NAME_DESC">Name (Z → A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={isLoading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
          <PeopleTable
            people={people}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
            viewMode={filter}
          />
        </div>

        {!isLoading && people.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mt-4 shadow-sm">
            <div className="text-gray-400 text-lg font-medium">No results matching your criteria</div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-8 px-2">
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="hover:bg-white text-[#003087] font-bold"
            >
              ← Previous
            </Button>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="hover:bg-white text-[#003087] font-bold"
            >
              Next →
            </Button>
          </div>
        )}

        <ConfirmDeleteDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, person: null })}
          onConfirm={confirmDelete}
          name={deleteDialog.person?.name || ''}
        />

        {editPerson && (
          <Dialog open={!!editPerson} onOpenChange={() => setEditPerson(null)}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-[#003087]">Edit Profile</DialogTitle>
                <DialogDescription className="font-medium text-gray-500">Update the details for {editPerson.otherNames} {editPerson.surname}</DialogDescription>
              </DialogHeader>
              <AddPersonForm onSubmit={handleUpdate} initialData={editPerson} />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}

export default PeoplePage
