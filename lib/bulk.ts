import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { formatFullDate, parseFlexibleDate } from './utils'

export function downloadSampleTemplate(type: 'csv' | 'xlsx') {
  const sampleData = [
    {
      'Surname': 'Mensah',
      'Other Names': 'Kwame Emmanuel',
      'Email': 'k.mensah@upsamail.edu.gh',
      'Role': 'STAFF',
      'Rank': 'Senior Lecturer',
      'Date of Birth': '15-04-1985',
      'Gender': 'MALE'
    },
    {
      'Surname': 'Osei',
      'Other Names': 'Akosua Serwaa',
      'Email': 'a.osei@upsamail.edu.gh',
      'Role': 'STUDENT',
      'Rank': 'Level 300',
      'Date of Birth': '22-09-2002',
      'Gender': 'FEMALE'
    },
    {
      'Surname': 'Boateng',
      'Other Names': 'Kofi Daniel',
      'Email': 'k.boateng@upsamail.edu.gh',
      'Role': 'STUDENT',
      'Rank': 'Level 100',
      'Date of Birth': '05-11-2004',
      'Gender': 'MALE'
    }
  ]

  if (type === 'csv') {
    const csv = Papa.unparse(sampleData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'upsa_bulk_import_sample.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } else {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'People')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'upsa_bulk_import_sample.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function exportPeopleToCSV(people: any[]) {
  const data = people.map(person => {
    const formattedDob = formatFullDate(person.birthDay, person.birthMonth, person.birthYear)

    let emailStatus = 'No History'
    if (person.BirthdayEmail && person.BirthdayEmail.length > 0) {
      const latestEmail = [...person.BirthdayEmail].sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0]
      emailStatus = latestEmail.status.toUpperCase()
    }

    return {
      'Surname': person.surname,
      'Other Names': person.otherNames,
      'Gender': person.gender,
      'Email Address': person.email,
      'Role': person.role,
      'Rank': person.rank || '',
      'Date of Birth': formattedDob,
      'Email Status': emailStatus,
    }
  })

  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'people.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportPeopleToExcel(people: any[], mode: 'STUDENT' | 'STAFF' | 'BOTH' = 'BOTH') {
  const mapStudent = (person: any) => {
    let emailStatus = 'No History'
    if (person.BirthdayEmail && person.BirthdayEmail.length > 0) {
      const latestEmail = [...person.BirthdayEmail].sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0]
      emailStatus = latestEmail.status.toUpperCase()
    }
    return {
      'Surname': person.surname,
      'Other Names': person.otherNames,
      'Gender': person.gender,
      'Email Address': person.email,
      'Date of Birth': formatFullDate(person.birthDay, person.birthMonth, person.birthYear),
      'Rank': person.rank || '',
      'Email Status': emailStatus,
    }
  }

  const mapStaff = (person: any) => {
    let emailStatus = 'No History'
    if (person.BirthdayEmail && person.BirthdayEmail.length > 0) {
      const latestEmail = [...person.BirthdayEmail].sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0]
      emailStatus = latestEmail.status.toUpperCase()
    }
    return {
      'Surname': person.surname,
      'Other Names': person.otherNames,
      'Gender': person.gender,
      'Email Address': person.email,
      'Role': person.role,
      'Rank': person.rank || '',
      'Date of Birth': formatFullDate(person.birthDay, person.birthMonth, person.birthYear),
      'Email Status': emailStatus,
    }
  }

  const workbook = XLSX.utils.book_new()

  if (mode === 'BOTH') {
    const students = people.filter(p => p.role === 'STUDENT')
    const staff = people.filter(p => p.role === 'STAFF')

    const studentSheet = XLSX.utils.json_to_sheet(students.map(mapStudent))
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Students')

    const staffSheet = XLSX.utils.json_to_sheet(staff.map(mapStaff))
    XLSX.utils.book_append_sheet(workbook, staffSheet, 'Staff')
  } else if (mode === 'STAFF') {
    const staff = people.filter(p => p.role === 'STAFF')
    const staffSheet = XLSX.utils.json_to_sheet(staff.map(mapStaff))
    XLSX.utils.book_append_sheet(workbook, staffSheet, 'Staff')
  } else {
    const students = people.filter(p => p.role === 'STUDENT')
    const studentSheet = XLSX.utils.json_to_sheet(students.map(mapStudent))
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Students')
  }

  const filename = mode === 'BOTH' ? 'people_all.xlsx' : mode === 'STAFF' ? 'staff.xlsx' : 'students.xlsx'

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function parsePeopleFromCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim().toLowerCase().replace(/[\s_]/g, ''),
      complete: (results: Papa.ParseResult<any>) => {
        if (results.errors.length > 0 && (!results.data || results.data.length === 0)) {
          reject(new Error('CSV parsing errors: ' + results.errors.map(e => e.message).join(', ')))
          return
        }

        const data = results.data.map((row: any) => {
          let surname = row.surname || row.lastname || row.familyname || ''
          let otherNames = row.othernames || row.firstname || row.givenname || row.middlename || ''
          const email = (row.email || row.emailaddress || row.mail || row.officialemail || '').toString().trim().toLowerCase()

          // Fallback for single 'name' column
          if ((!surname || !otherNames) && (row.name || row.fullname || row.fullnames || row.names || row.studentname || row.staffname)) {
            const fullName = (row.name || row.fullname || row.fullnames || row.names || row.studentname || row.staffname || '').toString().trim()
            const parts = fullName.split(/\s+/)
            if (parts.length > 1) {
              surname = parts[parts.length - 1]
              otherNames = parts.slice(0, -1).join(' ')
            } else if (fullName) {
              surname = fullName
              otherNames = fullName
            }
          }

          const rawGender = (row.gender || row.sex || 'OTHER').toString().trim().toUpperCase()
          const gender = ['MALE', 'FEMALE', 'OTHER'].includes(rawGender) 
            ? rawGender 
            : rawGender.startsWith('M') ? 'MALE' : rawGender.startsWith('F') ? 'FEMALE' : 'OTHER'

          let role = 'STUDENT'
          let rank = (row.rank || row.rankposition || row.indexnumber || row.index || row.level || '').toString().trim()

          const roleInput = (row.role || row.rolerank || row.type || row.category || row.designation || '').toString().toUpperCase().trim()
          if (roleInput === 'STAFF' || roleInput === 'STUDENT') {
            role = roleInput
          } else if (roleInput) {
            role = 'STAFF'
            if (!rank) rank = roleInput
          }

          let birthMonth: number | undefined
          let birthDay: number | undefined
          let birthYear: number | undefined

          // 1. Try full birthdate column first
          const dobRaw = row.dateofbirth || row.dob || row.birthdate || row.birthday || row.bday || row.date || row.birth || ''
          if (dobRaw) {
            const parsedFlexible = parseFlexibleDate(dobRaw)
            if (parsedFlexible) {
              birthDay = parsedFlexible.day
              birthMonth = parsedFlexible.month
              birthYear = parsedFlexible.year
            }
          }

          // 2. Fallback to separate month and day columns
          if (!birthMonth || !birthDay || isNaN(birthMonth) || isNaN(birthDay)) {
            const rawMonth = row.birthmonth || row.month || row.bmonth
            const rawDay = row.birthday || row.day || row.bday
            const rawYear = row.birthyear || row.year || row.byear

            if (rawMonth && !isNaN(parseInt(rawMonth, 10))) {
              birthMonth = parseInt(rawMonth, 10)
            }
            if (rawDay && !isNaN(parseInt(rawDay, 10))) {
              birthDay = parseInt(rawDay, 10)
            }
            if (rawYear && !isNaN(parseInt(rawYear, 10))) {
              birthYear = parseInt(rawYear, 10)
            }
          }

          return {
            surname: surname.toString().trim(),
            otherNames: otherNames.toString().trim() || 'N/A',
            gender,
            email,
            role,
            rank,
            birthMonth,
            birthDay,
            birthYear: birthYear || null,
          }
        }).filter((person: any) =>
          person.surname &&
          person.email &&
          person.email.includes('@') &&
          typeof person.birthMonth === 'number' && !isNaN(person.birthMonth) && person.birthMonth >= 1 && person.birthMonth <= 12 &&
          typeof person.birthDay === 'number' && !isNaN(person.birthDay) && person.birthDay >= 1 && person.birthDay <= 31
        )

        resolve(data)
      },
      error: (error: Error) => reject(error),
    })
  })
}

export function parsePeopleFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const json: any[] = []
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const sheetData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 0, defval: '' })
          
          const sheetRole = sheetName.toUpperCase().includes('STAFF') ? 'STAFF' : 
                           sheetName.toUpperCase().includes('STUDENT') ? 'STUDENT' : null

          const processedSheetData = sheetData.map(row => ({
            ...row,
            __sheetRole: sheetRole
          }))
          
          json.push(...processedSheetData)
        })

        const people = json.map((row: any) => {
          const normalizedRow: any = {}
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
            normalizedRow[normalizedKey] = row[key]
          })

          let surname = normalizedRow.surname || normalizedRow.lastname || normalizedRow.familyname || ''
          let otherNames = normalizedRow.othernames || normalizedRow.firstname || normalizedRow.givenname || normalizedRow.middlename || ''
          const email = (normalizedRow.email || normalizedRow.emailaddress || normalizedRow.mail || normalizedRow.officialemail || '').toString().trim().toLowerCase()

          // Fallback for single 'name' column
          if ((!surname || !otherNames) && (normalizedRow.name || normalizedRow.fullname || normalizedRow.fullnames || normalizedRow.names || normalizedRow.studentname || normalizedRow.staffname)) {
            const fullName = (normalizedRow.name || normalizedRow.fullname || normalizedRow.fullnames || normalizedRow.names || normalizedRow.studentname || normalizedRow.staffname || '').toString().trim()
            const parts = fullName.split(/\s+/)
            if (parts.length > 1) {
              surname = parts[parts.length - 1]
              otherNames = parts.slice(0, -1).join(' ')
            } else if (fullName) {
              surname = fullName
              otherNames = fullName
            }
          }

          const rawGender = (normalizedRow.gender || normalizedRow.sex || 'OTHER').toString().trim().toUpperCase()
          const gender = ['MALE', 'FEMALE', 'OTHER'].includes(rawGender) 
            ? rawGender 
            : rawGender.startsWith('M') ? 'MALE' : rawGender.startsWith('F') ? 'FEMALE' : 'OTHER'

          let role = normalizedRow.sheetrole || 'STUDENT'
          let rank = (normalizedRow.rank || normalizedRow.rankposition || normalizedRow.indexnumber || normalizedRow.index || normalizedRow.level || '').toString().trim()

          const roleInput = (normalizedRow.role || normalizedRow.rolerank || normalizedRow.type || normalizedRow.category || normalizedRow.designation || '').toString().toUpperCase().trim()
          if (roleInput === 'STAFF' || roleInput === 'STUDENT') {
            role = roleInput
          } else if (roleInput) {
            role = 'STAFF'
            if (!rank) rank = roleInput
          }

          let birthMonth: number | undefined
          let birthDay: number | undefined
          let birthYear: number | undefined

          // 1. Try full birthdate column first (checking 'dateofbirth', 'dob', 'birthdate', 'birthday', 'bday', 'date', 'birth')
          const birthdateVal = normalizedRow.dateofbirth ?? normalizedRow.dob ?? normalizedRow.birthdate ?? normalizedRow.birthday ?? normalizedRow.bday ?? normalizedRow.date ?? normalizedRow.birth ?? null

          if (birthdateVal !== null && birthdateVal !== '') {
            if (birthdateVal instanceof Date) {
              if (!isNaN(birthdateVal.getTime())) {
                birthMonth = birthdateVal.getUTCMonth() + 1
                birthDay = birthdateVal.getUTCDate()
                birthYear = birthdateVal.getUTCFullYear()
              }
            } else {
              const parsedFlexible = parseFlexibleDate(birthdateVal)
              if (parsedFlexible) {
                birthDay = parsedFlexible.day
                birthMonth = parsedFlexible.month
                birthYear = parsedFlexible.year
              }
            }
          }

          // 2. Fallback to separate month and day columns
          if (!birthMonth || !birthDay || isNaN(birthMonth) || isNaN(birthDay)) {
            const rawMonth = normalizedRow.birthmonth || normalizedRow.month || normalizedRow.bmonth
            const rawDay = normalizedRow.day || normalizedRow.bday || (typeof normalizedRow.birthday === 'number' ? normalizedRow.birthday : undefined)
            const rawYear = normalizedRow.birthyear || normalizedRow.year || normalizedRow.byear

            if (rawMonth && !isNaN(parseInt(rawMonth, 10))) {
              birthMonth = parseInt(rawMonth, 10)
            }
            if (rawDay && !isNaN(parseInt(rawDay, 10))) {
              birthDay = parseInt(rawDay, 10)
            }
            if (rawYear && !isNaN(parseInt(rawYear, 10))) {
              birthYear = parseInt(rawYear, 10)
            }
          }

          return {
            surname: surname?.toString().trim(),
            otherNames: otherNames?.toString().trim() || 'N/A',
            gender,
            email,
            role,
            rank,
            birthMonth,
            birthDay,
            birthYear: birthYear || null,
          }
        }).filter(person =>
          person.surname &&
          person.email &&
          person.email.includes('@') &&
          typeof person.birthMonth === 'number' && !isNaN(person.birthMonth) && person.birthMonth >= 1 && person.birthMonth <= 12 &&
          typeof person.birthDay === 'number' && !isNaN(person.birthDay) && person.birthDay >= 1 && person.birthDay <= 31
        )

        resolve(people)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })
}
