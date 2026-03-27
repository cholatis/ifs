import { computed, ref } from 'vue'

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_required'
  | 'approved'
  | 'rejected'

export type UserRole = 'admin' | 'customer'

export interface FactoringRequest {
  id: string
  type: 'PO' | 'LINE'
  companyId: string
  companyName: string
  poNumber: string
  buyerName: string
  requestedAmount: number
  creditPeriod: number
  status: RequestStatus
  createdDate: string
  updatedDate: string
  submittedDate: string | null
}

export interface FilterParams {
  search: string
  status: RequestStatus | 'all'
  minAmount: number | null
  maxAmount: number | null
  dateFrom: string | null
  dateTo: string | null
}

export const useFactoringRequestList = (userRole: UserRole = 'customer') => {
  const requests = ref<FactoringRequest[]>([
    {
      id: 'FAREQ00001',
      type: 'PO',
      companyId: 'COMP001',
      companyName: 'บริษัท AAA จำกัด',
      poNumber: 'PO-2024-001',
      buyerName: 'บริษัท XYZ (มหาชน)',
      requestedAmount: 5000000,
      creditPeriod: 60,
      status: 'approved',
      createdDate: '2024-01-10',
      updatedDate: '2024-01-12',
      submittedDate: '2024-01-12',
    },
    {
      id: 'FAREQ00002',
      type: 'PO',
      companyId: 'COMP002',
      companyName: 'บริษัท BBB จำกัด',
      poNumber: 'PO-2024-002',
      buyerName: 'การไฟฟ้านครหลวง',
      requestedAmount: 12000000,
      creditPeriod: 90,
      status: 'under_review',
      createdDate: '2024-01-15',
      updatedDate: '2024-01-16',
      submittedDate: '2024-01-16',
    },
    {
      id: 'FAREQ00003',
      type: 'PO',
      companyId: 'COMP003',
      companyName: 'บริษัท CCC จำกัด',
      poNumber: 'PO-2024-003',
      buyerName: 'PTT จำกัด (มหาชน)',
      requestedAmount: 3500000,
      creditPeriod: 45,
      status: 'draft',
      createdDate: '2024-01-18',
      updatedDate: '2024-01-18',
      submittedDate: null,
    },
    {
      id: 'FAREQ00004',
      type: 'PO',
      companyId: 'COMP001',
      companyName: 'บริษัท AAA จำกัด',
      poNumber: 'PO-2024-004',
      buyerName: 'SCG (มหาชน)',
      requestedAmount: 8000000,
      creditPeriod: 30,
      status: 'submitted',
      createdDate: '2024-02-01',
      updatedDate: '2024-02-02',
      submittedDate: '2024-02-02',
    },
    {
      id: 'FAREQ00005',
      type: 'PO',
      companyId: 'COMP002',
      companyName: 'บริษัท BBB จำกัด',
      poNumber: 'PO-2024-005',
      buyerName: 'CP All (มหาชน)',
      requestedAmount: 2500000,
      creditPeriod: 60,
      status: 'additional_required',
      createdDate: '2024-02-05',
      updatedDate: '2024-02-07',
      submittedDate: '2024-02-06',
    },
    {
      id: 'FAREQ00006',
      type: 'PO',
      companyId: 'COMP004',
      companyName: 'บริษัท DDD จำกัด',
      poNumber: 'PO-2024-006',
      buyerName: 'Bangchak Corporation',
      requestedAmount: 15000000,
      creditPeriod: 120,
      status: 'rejected',
      createdDate: '2024-02-10',
      updatedDate: '2024-02-12',
      submittedDate: '2024-02-11',
    },
    {
      id: 'FAREQ00007',
      type: 'PO',
      companyId: 'COMP005',
      companyName: 'บริษัท EEE จำกัด',
      poNumber: 'PO-2024-007',
      buyerName: 'Thai Airways',
      requestedAmount: 4200000,
      creditPeriod: 45,
      status: 'approved',
      createdDate: '2024-02-15',
      updatedDate: '2024-02-16',
      submittedDate: '2024-02-16',
    },
    {
      id: 'FAREQ00008',
      type: 'PO',
      companyId: 'COMP001',
      companyName: 'บริษัท AAA จำกัด',
      poNumber: 'PO-2024-008',
      buyerName: 'AIS (มหาชน)',
      requestedAmount: 6800000,
      creditPeriod: 60,
      status: 'draft',
      createdDate: '2024-02-20',
      updatedDate: '2024-02-20',
      submittedDate: null,
    },
    {
      id: 'FAREQ00009',
      type: 'PO',
      companyId: 'COMP003',
      companyName: 'บริษัท CCC จำกัด',
      poNumber: 'PO-2024-009',
      buyerName: 'Central Group',
      requestedAmount: 9500000,
      creditPeriod: 90,
      status: 'under_review',
      createdDate: '2024-02-25',
      updatedDate: '2024-02-26',
      submittedDate: '2024-02-26',
    },
    {
      id: 'CAAPP00001',
      type: 'LINE',
      companyId: 'COMP001',
      companyName: 'บริษัท ทดสอบ จำกัด',
      poNumber: 'REF-2024-001',
      buyerName: 'Credit Line Setup',
      requestedAmount: 10000000,
      creditPeriod: 60,
      status: 'submitted',
      createdDate: '2024-03-06',
      updatedDate: '2024-03-06',
      submittedDate: '2024-03-06',
    },
    {
      id: 'CAAPP00002',
      type: 'LINE',
      companyId: 'COMP002',
      companyName: 'บริษัท BBB จำกัด',
      poNumber: 'REF-2024-002',
      buyerName: 'Expansion Project',
      requestedAmount: 5000000,
      creditPeriod: 90,
      status: 'draft',
      createdDate: '2024-03-07',
      updatedDate: '2024-03-07',
      submittedDate: null,
    },
  ])

  const filters = ref<FilterParams>({
    search: '',
    status: 'all',
    minAmount: null,
    maxAmount: null,
    dateFrom: null,
    dateTo: null,
  })

  const filteredRequests = computed(() => {
    return requests.value.filter(req => {
      // Role-based filtering (simplified: customers only see their data)
      // In a real app, you'd filter by companyId from user session
      // if (userRole === 'customer') { ... }

      const matchesSearch = !filters.value.search || 
        req.id.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        req.companyName.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        req.poNumber.toLowerCase().includes(filters.value.search.toLowerCase())

      const matchesStatus = filters.value.status === 'all' || req.status === filters.value.status

      const matchesMinAmount = filters.value.minAmount === null || req.requestedAmount >= filters.value.minAmount
      const matchesMaxAmount = filters.value.maxAmount === null || req.requestedAmount <= filters.value.maxAmount

      const matchesDateFrom = !filters.value.dateFrom || req.createdDate >= filters.value.dateFrom
      const matchesDateTo = !filters.value.dateTo || req.createdDate <= filters.value.dateTo

      return matchesSearch && matchesStatus && matchesMinAmount && matchesMaxAmount && matchesDateFrom && matchesDateTo
    }).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
  })

  const clearFilters = () => {
    filters.value = {
      search: '',
      status: 'all',
      minAmount: null,
      maxAmount: null,
      dateFrom: null,
      dateTo: null,
    }
  }

  const deleteRequest = (id: string) => {
    const index = requests.value.findIndex(r => r.id === id)
    if (index !== -1 && requests.value[index].status === 'draft') {
      requests.value.splice(index, 1)
      return true
    }
    return false
  }

  return {
    filters,
    filteredRequests,
    clearFilters,
    deleteRequest
  }
}
