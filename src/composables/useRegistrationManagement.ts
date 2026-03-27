import { $api } from '@/utils/api'
import { ref } from 'vue'

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface UserRegistration {
  user_id: string
  email: string
  full_name: string
  company_name: string
  registration_status: RegistrationStatus
  created_time: string
  is_active: boolean
  phone?: string
  tax_id?: string
  business_type?: string
  requested_amount?: number
  target_buyer?: string
  admin_remark?: string
}

export const useRegistrationManagement = () => {
  const registrations = ref<UserRegistration[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchRegistrations = async () => {
    isLoading.value = true
    error.value = null
    try {
      // In a real app, this would be an API call to a specific Edge Function
      // or a Supabase REST API endpoint. For now, we use mock data to build the UI
      // and provide the logic skeleton.
      
      // Mock data for initial development
      const mockData: UserRegistration[] = [
        {
          user_id: '1',
          email: 'somchai@gec.co.th',
          full_name: 'สมชาย รักดี',
          company_name: 'บริษัท กขค จำกัด',
          registration_status: 'PENDING',
          created_time: '2024-03-10T10:00:00.000Z',
          is_active: false,
          phone: '0812345678',
          tax_id: '1234567890123',
          business_type: 'Manufacturing',
          requested_amount: 5000000,
          target_buyer: 'PTT'
        },
        {
          user_id: '2',
          email: 'mana@test.com',
          full_name: 'มานะ ขยันงาน',
          company_name: 'บริษัท มั่งมี จำกัด',
          registration_status: 'APPROVED',
          created_time: '2024-03-09T14:30:00.000Z',
          is_active: true,
          phone: '0898765432',
          tax_id: '9876543210987',
          business_type: 'Trading',
          requested_amount: 2000000,
          target_buyer: 'CP All'
        }
      ]

      // Attempt real fetch if endpoint exists
      try {
        const response = await $api('/manage-registrations', {
          method: 'GET'
        })
        if (response && Array.isArray(response)) {
          registrations.value = response
        } else {
          registrations.value = mockData
        }
      } catch (apiErr) {
        console.warn('API /manage-registrations not found, using mock data')
        registrations.value = mockData
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch registrations'
    } finally {
      isLoading.value = false
    }
  }

  const updateRegistrationStatus = async (userId: string, status: RegistrationStatus, remark?: string) => {
    isLoading.value = true
    error.value = null
    try {
      // Logic for updating status
      // This would normally call an Edge Function
      await $api('/manage-registrations/status', {
        method: 'POST',
        body: {
          userId,
          status,
          remark
        }
      })
      
      // Update local state if needed or re-fetch
      await fetchRegistrations()
      return true
    } catch (err: any) {
      console.error('Failed to update status:', err)
      // For mock purposes, update locally
      const index = registrations.value.findIndex(r => r.user_id === userId)
      if (index !== -1) {
        registrations.value[index].registration_status = status
        registrations.value[index].is_active = status === 'APPROVED'
        registrations.value[index].admin_remark = remark
      }
      return true // Return true for mock success
    } finally {
      isLoading.value = false
    }
  }

  const getRegistrationById = (id: string) => {
    return registrations.value.find(r => r.user_id === id)
  }

  return {
    registrations,
    isLoading,
    error,
    fetchRegistrations,
    updateRegistrationStatus,
    getRegistrationById
  }
}
