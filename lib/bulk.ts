import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { formatFullDate, parseFlexibleDate } from './utils'

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
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/[\s_]/g, ''),
      complete: (results: Papa.ParseResult<any>) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing errors: ' + results.errors.map(e => e.message).join(', ')))
        } else {
          const data = results.data.map((row: any) => {
            let surname = row.surname || row.lastname || ''
            let otherNames = row.othernames || row.firstname || ''
            const gender = (row.gender || 'UNKNOWN').toString().toUpperCase()
            const email = row.email || row.emailaddress || ''

            // Fallback for single 'name' column
            if ((!surname || !otherNames) && (row.name || row.fullname)) {
              const fullName = (row.name || row.fullname).trim()
              const parts = fullName.split(' ')
              if (parts.length > 1) {
                surname = parts[parts.length - 1]
                otherNames = parts.slice(0, -1).join(' ')
              } else {
                surname = fullName
                otherNames = 'N/A' // placeholder if only one name
              }
            }

            let role = 'STUDENT'
            let rank = row.rank || ''

            if (row.role) {
              const roleInput = row.role.toString().toUpperCase().trim()
              if (roleInput === 'STAFF' || roleInput === 'STUDENT') {
                role = roleInput
              } else {
                role = 'STAFF'
                rank = roleInput
              }
            } else if (row.rolerank) {
              const roleInput = row.rolerank.toString().toUpperCase().trim()
              if (roleInput === 'STAFF' || roleInput === 'STUDENT') {
                role = roleInput
              } else {
                role = 'STAFF'
                rank = roleInput
              }
            } else if (row.type) {
              const typeInput = row.type.toString().toUpperCase().trim()
              if (typeInput === 'STAFF' || typeInput === 'STUDENT') {
                role = typeInput
              } else {
                role = 'STAFF'
                rank = typeInput
              }
            }

            let birthMonth: number | undefined
            let birthDay: number | undefined
            let birthYear: number | undefined

            // Parse Date of Birth (expected DD-MM-YYYY or similar string)
            const dobString = row.dateofbirth || row.dob || row.birthdate || ''

            const parsedFlexible = parseFlexibleDate(dobString)
            if (parsedFlexible) {
              birthDay = parsedFlexible.day
              birthMonth = parsedFlexible.month
              birthYear = parsedFlexible.year
            }

            // Fallback for separated month/day if Date of Birth parsing fails or wasn't provided
            if (!birthMonth || !birthDay || isNaN(birthMonth) || isNaN(birthDay)) {
              birthMonth = parseInt(row.birthmonth || row.month)
              birthDay = parseInt(row.birthday || row.day)
            }

            return {
              surname: surname.trim(),
              otherNames: otherNames.trim(),
              gender: ['MALE', 'FEMALE', 'OTHER'].includes(gender) ? gender : 'OTHER',
              email: email.trim(),
              role: role,
              rank: rank.trim(),
              birthMonth,
              birthDay,
              birthYear,
            }
          }).filter((person: any) => person.surname && person.email && !isNaN(person.birthMonth) && !isNaN(person.birthDay))
          resolve(data)
        }
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
          const sheetData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 0 })
          
          // Infer role from sheet name if not explicitly provided in the row
          const sheetRole = sheetName.toUpperCase().includes('STAFF') ? 'STAFF' : 
                           sheetName.toUpperCase().includes('STUDENT') ? 'STUDENT' : null

          const processedSheetData = sheetData.map(row => ({
            ...row,
            __sheetRole: sheetRole
          }))
          
          json.push(...processedSheetData)
        })

        const people = json.map((row: any) => {
          // Normalize keys: trim, lowercase, remove non-alphanumeric characters
          const normalizedRow: any = {}
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
            normalizedRow[normalizedKey] = row[key]
          })

          let birthMonth: number | undefined
          let birthDay: number | undefined
          let birthYear: number | undefined

          // Check for separate month/day columns
          birthMonth = parseInt(normalizedRow.birthmonth || normalizedRow.month)
          birthDay = parseInt(normalizedRow.birthday || normalizedRow.day)

          // If not found, check for birthdate column or other date variations
          if (isNaN(birthMonth) || isNaN(birthDay)) {
            const birthdate = normalizedRow.dateofbirth || normalizedRow.dob || normalizedRow.birthdate || ''

            // If it's an actual Date object (parsed by XLSX cellDates: true)
            if (birthdate instanceof Date) {
              if (!isNaN(birthdate.getTime())) {
                birthMonth = birthdate.getUTCMonth() + 1
                birthDay = birthdate.getUTCDate()
                birthYear = birthdate.getUTCFullYear()
              }
            }
            // If it's a string like DD-MM-YYYY, or January 1 2000
            else if (typeof birthdate === 'string') {
              const parsedFlexible = parseFlexibleDate(birthdate)
              if (parsedFlexible) {
                birthDay = parsedFlexible.day
                birthMonth = parsedFlexible.month
                birthYear = parsedFlexible.year
              }
            }
          }

          let surname = normalizedRow.surname || normalizedRow.lastname || ''
          let otherNames = normalizedRow.othernames || normalizedRow.firstname || ''
          const gender = (normalizedRow.gender || 'UNKNOWN').toString().toUpperCase()
          const email = normalizedRow.email || normalizedRow.emailaddress || ''

          // Fallback for single 'name' column (handles: Name, Full Name, Full Names, Names, Student Name, etc.)
          if ((!surname || !otherNames) && (normalizedRow.name || normalizedRow.fullname || normalizedRow.fullnames || normalizedRow.names || normalizedRow.studentname || normalizedRow.staffname)) {
            const fullName = (normalizedRow.name || normalizedRow.fullname || normalizedRow.fullnames || normalizedRow.names || normalizedRow.studentname || normalizedRow.staffname).toString().trim()
            const parts = fullName.split(/\s+/)
            if (parts.length > 1) {
              surname = parts[parts.length - 1]
              otherNames = parts.slice(0, -1).join(' ')
            } else {
              surname = fullName
              otherNames = fullName
            }
          }

          let role = normalizedRow.sheetrole // inferred from sheet name earlier
          let rank = normalizedRow.rank || normalizedRow.rankposition || ''

          if (normalizedRow.role) {
            const roleInput = normalizedRow.role.toString().toUpperCase().trim()
            if (roleInput === 'STAFF' || roleInput === 'STUDENT') {
              role = roleInput
            } else {
              role = 'STAFF'
              rank = roleInput
            }
          } else if (normalizedRow.rolerank) {
            const roleInput = normalizedRow.rolerank.toString().toUpperCase().trim()
            if (roleInput === 'STAFF' || roleInput === 'STUDENT') {
              role = roleInput
            } else {
              role = 'STAFF'
              rank = roleInput
            }
          } else if (normalizedRow.type) {
            const typeInput = normalizedRow.type.toString().toUpperCase().trim()
            if (typeInput === 'STAFF' || typeInput === 'STUDENT') {
              role = typeInput
            } else {
              role = 'STAFF'
              rank = typeInput
            }
          }

          if (!role) role = 'STUDENT' // Final fallback

          return {
            surname: surname?.toString().trim(),
            otherNames: otherNames?.toString().trim() || 'N/A', // ensure some value exists
            gender: ['MALE', 'FEMALE', 'OTHER'].includes(gender) ? gender : 'OTHER',
            email: email?.toString().trim().toLowerCase(), // normalize to lowercase for consistency
            role: role,
            rank: rank?.toString().trim() || '',
            birthMonth,
            birthDay,
            birthYear,
          }
        }).filter(person =>
          person.surname &&
          person.email &&
          !isNaN(person.birthMonth!) &&
          !isNaN(person.birthDay!)
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
