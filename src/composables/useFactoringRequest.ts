import { computed, onMounted, onUnmounted, ref } from 'vue'

export type FactoringStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'disbursed'
  | 'collected'
  | 'rejected'

export interface FactoringDocument {
  docId: number
  docName: string
  required: boolean
  file: File[] | null
  uploadStatus: 'pending' | 'uploaded' | 'error'
}

export interface FactoringRequest {
  requestId: string
  creditApplicationId: string
  companyId: string
  approvedCreditLimit: number
  usedCreditAmount: number
  availableCreditAmount: number
  poNumber: string
  poDate: string
  poAmount: number | null
  buyerName: string
  buyerTaxId: string
  invoiceNumber: string
  invoiceDate: string
  invoiceDueDate: string
  requestedAmount: number | null
  status: FactoringStatus
  documents: FactoringDocument[]
}

export const useFactoringRequest = () => {
  const form = ref<FactoringRequest>({
    requestId: 'FAREQ' + Math.floor(Math.random() * 90000 + 10000),
    creditApplicationId: 'CAAPP00001',
    companyId: 'COMP001',
    approvedCreditLimit: 10000000,
    usedCreditAmount: 3000000,
    availableCreditAmount: 7000000,
    poNumber: '',
    poDate: '',
    poAmount: null,
    buyerName: '',
    buyerTaxId: '',
    invoiceNumber: '',
    invoiceDate: '',
    invoiceDueDate: '',
    requestedAmount: null,
    status: 'draft',
    documents: [
      { docId: 1, docName: 'สำเนา PO', required: true, file: null, uploadStatus: 'pending' },
      { docId: 2, docName: 'Invoice / ใบแจ้งหนี้', required: true, file: null, uploadStatus: 'pending' },
      { docId: 3, docName: 'ใบส่งของ / Delivery Order', required: false, file: null, uploadStatus: 'pending' },
      { docId: 4, docName: 'เอกสารอื่นๆ ที่เกี่ยวข้อง', required: false, file: null, uploadStatus: 'pending' },
    ],
  })

  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)

  // Credit Calculations
  const remainingAfterRequest = computed(() => {
    const requested = form.value.requestedAmount || 0
    return form.value.availableCreditAmount - requested
  })

  const isAmountOverLimit = computed(() => {
    const requested = form.value.requestedAmount || 0
    return requested > form.value.availableCreditAmount
  })

  const creditUsagePercentage = computed(() => {
    return (form.value.usedCreditAmount / form.value.approvedCreditLimit) * 100
  })

  // Document Tracking
  const updateDocFiles = (docId: number, files: File[]) => {
    const doc = form.value.documents.find(d => d.docId === docId)
    if (doc) {
      doc.file = files
      doc.uploadStatus = files.length > 0 ? 'uploaded' : 'pending'
    }
  }

  // Validation
  const isFormValid = computed(() => {
    const hasRequiredFields = !!(
      form.value.poNumber &&
      form.value.poDate &&
      form.value.poAmount &&
      form.value.buyerName &&
      form.value.buyerTaxId &&
      form.value.invoiceNumber &&
      form.value.invoiceDate &&
      form.value.invoiceDueDate &&
      form.value.requestedAmount
    )

    const requiredDocsUploaded = form.value.documents
      .filter(d => d.required)
      .every(d => d.uploadStatus === 'uploaded')

    return hasRequiredFields && requiredDocsUploaded && !isAmountOverLimit.value
  })

  // Actions
  const saveDraft = async () => {
    isSaving.value = true
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    lastSaved.value = new Date()
    isSaving.value = false
    console.log('Draft Saved:', form.value)
    return true
  }

  const submitApplication = async () => {
    if (!isFormValid.value) return false
    isSaving.value = true
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    form.value.status = 'submitted'
    isSaving.value = false
    console.log('Application Submitted:', form.value)
    return true
  }

  // Auto-save logic
  let autoSaveInterval: any = null
  onMounted(() => {
    autoSaveInterval = setInterval(() => {
      saveDraft()
    }, 120000) // 2 minutes
  })

  onUnmounted(() => {
    if (autoSaveInterval) clearInterval(autoSaveInterval)
  })

  return {
    form,
    isSaving,
    lastSaved,
    remainingAfterRequest,
    isAmountOverLimit,
    creditUsagePercentage,
    isFormValid,
    saveDraft,
    submitApplication,
    updateDocFiles,
  }
}
