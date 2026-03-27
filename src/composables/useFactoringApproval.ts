import { computed, ref } from 'vue'

export type FactoringStatus =
  | 'submitted'
  | 'under_review'
  | 'additional_required'
  | 'approved'
  | 'disbursed'
  | 'collected'
  | 'rejected'

export interface FactoringApproval {
  requestId: string
  creditApplicationId: string
  companyName: string
  approvedCreditLimit: number
  usedCreditAmount: number
  availableCreditAmount: number
  poNumber: string
  poDate: string
  poAmount: number
  buyerName: string
  buyerTaxId: string
  invoiceNumber: string
  invoiceDate: string
  invoiceDueDate: string
  requestedAmount: number
  approvedAmount: number
  status: FactoringStatus
  adminRemark: string
  additionalDocuments: string[]
  submittedDate: string
  reviewedDate: string | null
  reviewedBy: string | null
  documents: {
    id: number
    name: string
    required: boolean
    status: 'pending' | 'uploaded'
    verified: boolean
  }[]
}

export const useFactoringApproval = (id: string) => {
  const application = ref<FactoringApproval>({
    requestId: id || 'FAREQ00001',
    creditApplicationId: 'CAAPP00001',
    companyName: 'บริษัท ทดสอบ จำกัด',
    approvedCreditLimit: 10000000,
    usedCreditAmount: 3000000,
    availableCreditAmount: 7000000,
    poNumber: 'PO-2024-00123',
    poDate: '2024-01-10',
    poAmount: 5000000,
    buyerName: 'บริษัท ABC จำกัด (มหาชน)',
    buyerTaxId: '0105562012345',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-12',
    invoiceDueDate: '2024-03-12',
    requestedAmount: 4500000,
    approvedAmount: 4500000,
    status: 'under_review',
    adminRemark: '',
    additionalDocuments: [],
    submittedDate: '2024-01-12',
    reviewedDate: null,
    reviewedBy: null,
    documents: [
      { id: 1, name: 'สำเนา PO', required: true, status: 'uploaded', verified: false },
      { id: 2, name: 'Invoice / ใบแจ้งหนี้', required: true, status: 'uploaded', verified: false },
      { id: 3, name: 'ใบส่งของ / Delivery Order', required: false, status: 'uploaded', verified: false },
      { id: 4, name: 'เอกสารอื่นๆ ที่เกี่ยวข้อง', required: false, status: 'pending', verified: false },
    ],
  })

  const isSubmitting = ref(false)

  // Calculations
  const creditDiff = computed(() => {
    return application.value.approvedAmount - application.value.requestedAmount
  })

  const remainingAfterApprove = computed(() => {
    return application.value.availableCreditAmount - application.value.approvedAmount
  })

  const isAmountOverLimit = computed(() => {
    return application.value.approvedAmount > application.value.availableCreditAmount
  })

  const creditUsagePercentage = computed(() => {
    return (application.value.usedCreditAmount / application.value.approvedCreditLimit) * 100
  })

  const verifiedCount = computed(() => {
    return application.value.documents.filter(d => d.verified).length
  })

  const totalDocs = computed(() => {
    return application.value.documents.length
  })

  // Actions
  const updateStatus = async (status: FactoringStatus) => {
    isSubmitting.value = true
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    application.value.status = status
    application.value.reviewedDate = new Date().toISOString().split('T')[0]
    application.value.reviewedBy = 'Admin User'
    isSubmitting.value = false
    return true
  }

  const requestAdditional = async (selectedDocIds: number[], message: string) => {
    isSubmitting.value = true
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    application.value.status = 'additional_required'
    application.value.adminRemark = message
    application.value.additionalDocuments = application.value.documents
      .filter(d => selectedDocIds.includes(d.id))
      .map(d => d.name)
    isSubmitting.value = false
    return true
  }

  return {
    application,
    isSubmitting,
    creditDiff,
    remainingAfterApprove,
    isAmountOverLimit,
    creditUsagePercentage,
    verifiedCount,
    totalDocs,
    updateStatus,
    requestAdditional,
  }
}
