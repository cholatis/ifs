import { computed, ref } from 'vue'

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'additional_required'
  | 'approved'
  | 'rejected'

export interface CreditLineApproval {
  applicationId: string
  companyName: string
  taxId: string
  businessType: string
  requestedCreditLimit: number
  approvedCreditLimit: number
  creditPeriod: number
  paymentType: 'cheque' | 'transfer'
  billingSchedule: string
  status: ApplicationStatus
  adminRemark: string
  additionalDocuments: string[]
  submittedDate: string
  reviewedDate: string | null
  reviewedBy: string | null
  documents: {
    id: number
    name: string
    category: 'company' | 'financial' | 'director'
    required: boolean
    status: 'pending' | 'uploaded'
    verified: boolean
  }[]
}

export const useCreditLineApproval = (id: string) => {
  const application = ref<CreditLineApproval>({
    applicationId: id || 'CAAPP00001',
    companyName: 'บริษัท ทดสอบ จำกัด',
    taxId: '0105562012345',
    businessType: 'การผลิต',
    requestedCreditLimit: 10000000,
    approvedCreditLimit: 10000000,
    creditPeriod: 60,
    paymentType: 'transfer',
    billingSchedule: 'ทุกสิ้นเดือน',
    status: 'under_review',
    adminRemark: '',
    additionalDocuments: [],
    submittedDate: '2024-01-12',
    reviewedDate: null,
    reviewedBy: null,
    documents: [
      { id: 1, name: 'หนังสือรับรองบริษัท', category: 'company', required: true, status: 'uploaded', verified: false },
      { id: 2, name: 'ภ.พ.20', category: 'company', required: true, status: 'uploaded', verified: false },
      { id: 3, name: 'บัญชีรายชื่อผู้ถือหุ้น (บอจ.5)', category: 'company', required: true, status: 'uploaded', verified: false },
      { id: 4, name: 'สำเนาบัตรประชาชนผู้มีอำนาจ', category: 'company', required: true, status: 'uploaded', verified: false },
      { id: 5, name: 'ทะเบียนบ้านผู้มีอำนาจ', category: 'company', required: true, status: 'pending', verified: false },
      { id: 6, name: 'แผนที่ตั้งบริษัท', category: 'company', required: false, status: 'uploaded', verified: false },
      { id: 7, name: 'รูปถ่ายสถานประกอบการ', category: 'company', required: false, status: 'uploaded', verified: false },
      { id: 8, name: 'ใบอนุญาตประกอบกิจการ', category: 'company', required: false, status: 'uploaded', verified: false },
      { id: 9, name: 'งบการเงินย้อนหลัง 3 ปี', category: 'financial', required: true, status: 'uploaded', verified: false },
      { id: 10, name: 'Bank Statement 6 เดือน', category: 'financial', required: true, status: 'uploaded', verified: false },
      { id: 11, name: 'รายงานภาษีซื้อ-ขาย (ภ.พ.30)', category: 'financial', required: true, status: 'uploaded', verified: false },
      { id: 12, name: 'ประวัติกรรมการ', category: 'director', required: true, status: 'uploaded', verified: false },
      { id: 13, name: 'ผลตรวจเครดิตบูโร', category: 'director', required: false, status: 'uploaded', verified: false },
    ],
  })

  const isSubmitting = ref(false)

  // Document Stats
  const getDocStats = (category: string) => {
    const docs = application.value.documents.filter(d => d.category === category)
    const verified = docs.filter(d => d.verified).length
    return { verified, total: docs.length }
  }

  const creditDiff = computed(() => {
    return application.value.approvedCreditLimit - application.value.requestedCreditLimit
  })

  // Actions
  const updateStatus = async (status: ApplicationStatus) => {
    isSubmitting.value = true
    // Mock API call to notifyStatusChange
    await new Promise(resolve => setTimeout(resolve, 1500))
    application.value.status = status
    application.value.reviewedDate = new Date().toISOString().split('T')[0]
    application.value.reviewedBy = 'Admin User'
    isSubmitting.value = false
    console.log(`Status updated to ${status} for ${application.value.applicationId}`)
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
    getDocStats,
    creditDiff,
    updateStatus,
    requestAdditional,
  }
}
