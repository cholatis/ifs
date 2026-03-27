import { computed, onMounted, onUnmounted, ref } from 'vue'

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_required'
  | 'approved'
  | 'rejected'

export interface DocumentUpload {
  docId: number
  docGroup: 'company' | 'financial' | 'director'
  docName: string
  required: boolean
  files: File[]
  uploadStatus: 'pending' | 'uploaded' | 'error'
  remark: string
}

export interface CreditApplicationForm {
  requestId: string
  companyId: string
  poNumber: string
  poAmount: number | null
  buyerName: string
  buyerTaxId: string
  requestedAmount: number | null
  creditPeriod: number | null
  paymentType: 'cheque' | 'transfer' | null
  billingSchedule: string
  paymentDueDate: string
  status: ApplicationStatus
  documents: DocumentUpload[]
}

export const useCreditApplication = () => {
  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)
  
  const form = ref<CreditApplicationForm>({
    requestId: 'FAREQ' + Math.floor(Math.random() * 90000 + 10000),
    companyId: 'CUST' + Math.floor(Math.random() * 90000 + 10000),
    poNumber: '',
    poAmount: null,
    buyerName: '',
    buyerTaxId: '',
    requestedAmount: null,
    creditPeriod: null,
    paymentType: null,
    billingSchedule: '',
    paymentDueDate: '',
    status: 'draft',
    documents: [
      // Company Documents
      { docId: 1, docGroup: 'company', docName: 'Company Profile', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 2, docGroup: 'company', docName: 'ประวัติเจ้าของ / ผู้บริหารหลัก', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 3, docGroup: 'company', docName: 'หนังสือรับรองบริษัท อายุไม่เกิน 1 เดือน', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 4, docGroup: 'company', docName: 'บริคณธ์สนธิ', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 5, docGroup: 'company', docName: 'สำเนารายชื่อผู้ถือหุ้น ล่าสุด', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 6, docGroup: 'company', docName: 'หนังสือแสดงการจดทะเบียนหุ้นส่วนบริษัท', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 7, docGroup: 'company', docName: 'ภ.พ.20', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 8, docGroup: 'company', docName: 'บอจ.3 / ใบอนุญาตจัดตั้งโรงงาน', required: false, files: [], uploadStatus: 'pending', remark: '' },
      
      // Financial Documents
      { docId: 9, docGroup: 'financial', docName: 'ภ.พ.30 ย้อนหลัง ม.ค. ปัจจุบัน พร้อมใบเสร็จ', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 10, docGroup: 'financial', docName: 'งบการเงินย้อนหลัง 3 ปี ล่าสุด', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 11, docGroup: 'financial', docName: 'Statement ธนาคารย้อนหลัง 1 ปี', required: true, files: [], uploadStatus: 'pending', remark: '' },
      
      // Director Documents
      { docId: 12, docGroup: 'director', docName: 'สำเนาบัตรประชาชน + ทะเบียนบ้านกรรมการและคู่สมรส', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 13, docGroup: 'director', docName: 'เอกสารเครดิตบูโร (บริษัท + กรรมการ + ผู้ค้ำประกัน)', required: true, files: [], uploadStatus: 'pending', remark: '' },
    ]
  })

  const uploadProgress = computed(() => {
    const requiredDocs = form.value.documents.filter(d => d.required)
    const uploadedRequiredDocs = requiredDocs.filter(d => d.uploadStatus === 'uploaded')
    
    const total = requiredDocs.length
    const current = uploadedRequiredDocs.length
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0
    
    return {
      total,
      current,
      percentage
    }
  })

  const isFormValid = computed(() => {
    return form.value.poNumber && 
           form.value.poAmount && 
           form.value.buyerName && 
           form.value.buyerTaxId.length === 13 &&
           form.value.requestedAmount &&
           form.value.creditPeriod &&
           form.value.paymentType &&
           uploadProgress.value.percentage === 100
  })

  // Mock Save Draft
  const saveDraft = async () => {
    isSaving.value = true
    console.log('[CreditApplication] Saving draft...', form.value)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    lastSaved.value = new Date()
    isSaving.value = false
    console.log('[CreditApplication] Draft saved at', lastSaved.value)
  }

  // Mock Submit
  const submitApplication = async () => {
    if (!isFormValid.value) return false
    
    isSaving.value = true
    console.log('[CreditApplication] Submitting application...', form.value)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    form.value.status = 'submitted'
    isSaving.value = false
    return true
  }

  // Auto-save logic
  let autoSaveInterval: any = null

  onMounted(() => {
    // Mock mapping for business requirements
    autoSaveInterval = setInterval(() => {
      saveDraft()
    }, 120000) // 2 minutes
  })

  onUnmounted(() => {
    if (autoSaveInterval) clearInterval(autoSaveInterval)
  })

  const updateDocFiles = (docId: number, files: File[]) => {
    const doc = form.value.documents.find(d => d.docId === docId)
    if (doc) {
      doc.files = files
      doc.uploadStatus = files.length > 0 ? 'uploaded' : 'pending'
    }
  }

  return {
    form,
    isSaving,
    lastSaved,
    uploadProgress,
    isFormValid,
    saveDraft,
    submitApplication,
    updateDocFiles
  }
}
