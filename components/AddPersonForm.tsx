'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { parseFlexibleDate } from '@/lib/utils'

const personSchema = z.object({
  surname: z.string().min(1, 'Surname is required'),
  otherNames: z.string().min(1, 'Other names are required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
  email: z.string().email('Invalid email'),
  dateOfBirth: z.string().min(1, 'Date of Birth is required').refine((val) => {
    const parsed = parseFlexibleDate(val);
    return parsed !== null;
  }, { message: 'Invalid format. Use DD-MM-YYYY or a recognized text date (e.g. January 1, 2000)' }),
  role: z.enum(['STAFF', 'STUDENT'], { required_error: 'Role is required' }),
  rank: z.string().optional(),
})

type PersonFormData = z.infer<typeof personSchema>

interface AddPersonFormProps {
  onSubmit: (data: any) => void
  initialData?: any
}

function AddPersonForm({ onSubmit, initialData }: AddPersonFormProps) {
  // Try to reconstruct DD-MM-YYYY if we have initial data (from edit)
  const defaultDob = initialData
    ? `${initialData.birthDay.toString().padStart(2, '0')}-${initialData.birthMonth.toString().padStart(2, '0')}-${initialData.birthYear?.toString().padStart(4, '0') || '1990'}`
    : ''

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      surname: initialData?.surname || '',
      otherNames: initialData?.otherNames || '',
      gender: initialData?.gender as 'MALE' | 'FEMALE' | 'OTHER' || 'MALE',
      email: initialData?.email || '',
      dateOfBirth: defaultDob,
      role: (initialData?.role as 'STAFF' | 'STUDENT') || 'STUDENT',
      rank: initialData?.rank || '',
    },
  })

  const handleSubmit = (data: PersonFormData) => {
    // Parse the flexible format into distinct fields for the backend API
    const parsedDate = parseFlexibleDate(data.dateOfBirth)
    if (!parsedDate) return // Should be caught by zod anyway

    // Construct the payload the API expects
    const apiPayload = {
      surname: data.surname,
      otherNames: data.otherNames,
      gender: data.gender,
      email: data.email,
      birthDay: parsedDate.day,
      birthMonth: parsedDate.month,
      birthYear: parsedDate.year || null,
      role: data.role,
      rank: data.rank || null
    }

    onSubmit(apiPayload)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="surname">Surname</Label>
          <Input id="surname" placeholder="e.g. Doe" {...form.register('surname')} />
          {form.formState.errors.surname && <p className="text-red-500 text-sm mt-1">{form.formState.errors.surname.message}</p>}
        </div>
        <div>
          <Label htmlFor="otherNames">Other Names</Label>
          <Input id="otherNames" placeholder="e.g. John Kwame" {...form.register('otherNames')} />
          {form.formState.errors.otherNames && <p className="text-red-500 text-sm mt-1">{form.formState.errors.otherNames.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select onValueChange={(value: any) => form.setValue('gender', value)} defaultValue={form.getValues('gender')}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.gender && <p className="text-red-500 text-sm mt-1">{form.formState.errors.gender.message}</p>}
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            placeholder="e.g. DD-MM-YYYY or January 1, 2000"
            {...form.register('dateOfBirth')}
          />
          {form.formState.errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{form.formState.errors.dateOfBirth.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="john.doe@example.com" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select onValueChange={(value: any) => form.setValue('role', value, { shouldValidate: true })} defaultValue={form.getValues('role')}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.role && <p className="text-red-500 text-sm mt-1">{form.formState.errors.role.message}</p>}
        </div>
        <div>
          <Label htmlFor="rank">Index Number / Rank (Optional)</Label>
          <Input id="rank" placeholder="e.g. Senior Lecturer" {...form.register('rank')} />
          {form.formState.errors.rank && <p className="text-red-500 text-sm mt-1">{form.formState.errors.rank.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#FFD700] text-[#003087]">
        {initialData ? 'Update Person' : 'Add Person'}
      </Button>
    </form>
  )
}

export default AddPersonForm
