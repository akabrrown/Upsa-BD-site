'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Pencil, Trash } from 'lucide-react'
import { formatFullDate } from '@/lib/utils'

function PeopleTable({
  people,
  onEdit,
  onDelete,
  selectedIds,
  onSelect,
  onSelectAll,
  viewMode = 'ALL'
}: {
  people: any[];
  onEdit: (person: any) => void;
  onDelete: (id: string, name: string) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  viewMode?: string;
}) {
  const isStaff = viewMode === 'STAFF'

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border rounded-lg shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={people.length > 0 && selectedIds.size === people.length}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              {isStaff ? (
                <>
                  <TableHead className="font-bold text-[#003087]">Full Name</TableHead>
                  <TableHead className="font-bold text-[#003087]">Index / Rank</TableHead>
                  <TableHead className="font-bold text-[#003087]">Date of Birth</TableHead>
                  <TableHead className="font-bold text-[#003087]">Email</TableHead>
                  <TableHead className="font-bold text-[#003087]">Email Status</TableHead>
                  <TableHead className="font-bold text-[#003087]">Actions</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="font-bold text-[#003087]">Surname</TableHead>
                  <TableHead className="font-bold text-[#003087]">Other Names</TableHead>
                  <TableHead className="font-bold text-[#003087]">Gender</TableHead>
                  <TableHead className="font-bold text-[#003087]">Email</TableHead>
                  <TableHead className="font-bold text-[#003087]">Role</TableHead>
                  <TableHead className="font-bold text-[#003087]">Index / Rank</TableHead>
                  <TableHead className="font-bold text-[#003087]">Date of Birth</TableHead>
                  <TableHead className="font-bold text-[#003087]">Email Status</TableHead>
                  <TableHead className="font-bold text-[#003087]">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person: any) => (
              <TableRow key={person.id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(person.id)}
                    onCheckedChange={() => onSelect(person.id)}
                  />
                </TableCell>
                {isStaff ? (
                  <>
                    <TableCell className="font-bold text-[#003087]">
                      {person.otherNames} {person.surname}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-700">{person.rank || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {formatFullDate(person.birthDay, person.birthMonth, person.birthYear)}
                    </TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>
                      {renderEmailStatus(person)}
                    </TableCell>
                    <TableCell>
                      {renderActions(person, onEdit, onDelete)}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-bold text-[#003087]">{person.surname}</TableCell>
                    <TableCell className="font-medium">{person.otherNames}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 capitalize">
                        {person.gender?.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(person.role || '').toUpperCase() === 'STUDENT' ? 'bg-[#FFD700] text-[#003087]' : 'bg-[#003087] text-white'}`}>
                        {person.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-700">{person.rank || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {formatFullDate(person.birthDay, person.birthMonth, person.birthYear)}
                    </TableCell>
                    <TableCell>
                      {renderEmailStatus(person)}
                    </TableCell>
                    <TableCell>
                      {renderActions(person, onEdit, onDelete)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {people.map((person: any) => (
          <div key={person.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 relative">
            <div className="absolute top-4 right-4 z-10">
              <Checkbox
                checked={selectedIds.has(person.id)}
                onCheckedChange={() => onSelect(person.id)}
              />
            </div>
            <div className="flex justify-between items-start border-b border-gray-50 pb-3">
              <div>
                {isStaff ? (
                  <h3 className="font-black text-[#003087] text-xl leading-tight pr-8">
                    {person.otherNames} {person.surname}
                  </h3>
                ) : (
                  <>
                    <h3 className="font-black text-[#003087] text-xl leading-tight pr-8">{person.surname}</h3>
                    <p className="font-bold text-gray-700 text-base">{person.otherNames}</p>
                  </>
                )}
                <p className="text-sm text-gray-500 mt-0.5">{person.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {!isStaff && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center ${(person.role || '').toUpperCase() === 'STUDENT' ? 'bg-[#FFD700] text-[#003087]' : 'bg-[#003087] text-white'}`}>
                    {person.role}
                  </span>
                )}
                {person.rank && (
                  <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md text-center">
                    {person.rank}
                  </span>
                )}
                {!isStaff && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 capitalize">
                    {person.gender?.toLowerCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm py-1">
              <div className="text-gray-500 font-medium">Date of Birth</div>
              <div className="text-[#003087] font-bold">
                {formatFullDate(person.birthDay, person.birthMonth, person.birthYear)}
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Email Tracking</div>
                <div className="text-right">
                  {person.BirthdayEmail && person.BirthdayEmail.length > 0 ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-gray-400 font-bold">{new Date(person.BirthdayEmail[0].sentAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${person.BirthdayEmail[0].status === 'replied' ? 'bg-purple-100 text-purple-700' :
                        person.BirthdayEmail[0].status === 'opened' ? 'bg-blue-100 text-blue-700' :
                        person.BirthdayEmail[0].status === 'sent' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                        }`}>
                        {person.BirthdayEmail[0].status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300 font-bold uppercase">None Recorded</span>
                  )}
                </div>
              </div>
              {person.BirthdayEmail && person.BirthdayEmail.length > 0 && person.BirthdayEmail[0].status !== 'replied' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-[9px] font-black uppercase tracking-tighter text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-100"
                  onClick={async () => {
                    if (confirm('Mark this email as Replied?')) {
                      try {
                        const res = await fetch(`/api/emails/status/${person.BirthdayEmail[0].id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'replied' })
                        });
                        if (res.ok) window.location.reload();
                      } catch (e) { alert('Update failed'); }
                    }
                  }}
                >
                  Mark as Replied
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <Button variant="outline" size="sm" className="flex-1 gap-2 text-blue-600 border-blue-100 hover:bg-blue-50 h-10 rounded-lg" onClick={() => onEdit(person)}>
                <Pencil className="h-4 w-4" />
                <span className="font-bold">Edit</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2 text-red-600 border-red-100 hover:bg-red-50 h-10 rounded-lg" onClick={() => onDelete(person.id, `${person.otherNames} ${person.surname}`)}>
                <Trash className="h-4 w-4" />
                <span className="font-bold">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderEmailStatus(person: any) {
  if (person.BirthdayEmail && person.BirthdayEmail.length > 0) {
    const sorted = [...person.BirthdayEmail].sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    return (
      <div className="flex flex-col gap-0.5">
        <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          sorted[0].status === 'replied' ? 'bg-purple-100 text-purple-700' :
          sorted[0].status === 'opened' ? 'bg-blue-100 text-blue-700' :
          sorted[0].status === 'sent' ? 'bg-green-100 text-green-700' :
          sorted[0].status === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {sorted[0].status}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          {new Date(sorted[0].sentAt).toLocaleDateString()}
        </span>
      </div>
    )
  }
  return <span className="text-[10px] text-gray-300 font-bold uppercase italic">No History</span>
}

function renderActions(person: any, onEdit: (person: any) => void, onDelete: (id: string, name: string) => void) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={() => onEdit(person)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(person.id, `${person.otherNames} ${person.surname}`)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default PeopleTable
