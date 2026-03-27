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

export interface CreditLineApplication {
  applicationId: string
  companyId: string
  companyName: string
  taxId: string
  businessType: string
  requestedCreditLimit: number | null
  creditPeriod: number | null
  paymentType: 'cheque' | 'transfer' | null
  billingSchedule: string
  paymentDueDate: string
  billingLocation: string
  billingRemark: string
  status: ApplicationStatus
  documents: DocumentUpload[]
  createdDate: string
  submittedDate: string | null
}

export const useCreditLineApplication = () => {
  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)
  
  const form = ref<CreditLineApplication>({
    applicationId: 'CAAPP' + Math.floor(Math.random() * 90000 + 10000),
    companyId: 'CUST' + Math.floor(Math.random() * 90000 + 10000),
    companyName: 'บริษัท ทดสอบ จำกัด', // Mocked from profile
    taxId: '0105562012345',         // Mocked from profile
    businessType: '',
    requestedCreditLimit: null,
    creditPeriod: null,
    paymentType: null,
    billingSchedule: '',
    paymentDueDate: '',
    billingLocation: '',
    billingRemark: '',
    status: 'draft',
    createdDate: new Date().toISOString(),
    submittedDate: null,
    documents: [
      // Tab 1: Company Documents
      { docId: 1, docGroup: 'company', docName: 'Company Profile', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 2, docGroup: 'company', docName: 'ประวัติเจ้าของ / ผู้บริหารหลัก', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 3, docGroup: 'company', docName: 'หนังสือรับรองบริษัท อายุไม่เกิน 1 เดือน', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 4, docGroup: 'company', docName: 'บริคณธ์สนธิ', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 5, docGroup: 'company', docName: 'สำเนารายชื่อผู้ถือหุ้น ล่าสุด', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 6, docGroup: 'company', docName: 'หนังสือแสดงการจดทะเบียนหุ้นส่วนบริษัท', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 7, docGroup: 'company', docName: 'ภ.พ.20', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 8, docGroup: 'company', docName: 'บอจ.3 / ใบอนุญาตจัดตั้งโรงงาน', required: false, files: [], uploadStatus: 'pending', remark: '' },
      
      // Tab 2: Financial Documents
      { docId: 9, docGroup: 'financial', docName: 'ภ.พ.30 ย้อนหลัง ม.ค. ปัจจุบัน พร้อมใบเสร็จ', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 10, docGroup: 'financial', docName: 'งบการเงินย้อนหลัง 3 ปี ล่าสุด', required: true, files: [], uploadStatus: 'pending', remark: '' },
      { docId: 11, docGroup: 'financial', docName: 'Statement ธนาคารย้อนหลัง 1 ปี', required: true, files: [], uploadStatus: 'pending', remark: '' },
      
      // Tab 3: Director Documents
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

  // Grouped progress for tabs
  const tabProgress = computed(() => {
    const groups: Record<string, { total: number; current: number; complete: boolean }> = {
      company: { total: 0, current: 0, complete: false },
      financial: { total: 0, current: 0, complete: false },
      director: { total: 0, current: 0, complete: false }
    }

    form.value.documents.forEach(doc => {
      if (doc.required) {
        groups[doc.docGroup].total++
        if (doc.uploadStatus === 'uploaded') {
          groups[doc.docGroup].current++
        }
      }
    })

    Object.keys(groups).forEach(key => {
      groups[key].complete = groups[key].total > 0 && groups[key].current === groups[key].total
    })

    return groups
  })

  const isFormValid = computed(() => {
    return form.value.businessType && 
           form.value.requestedCreditLimit && 
           form.value.creditPeriod && 
           form.value.billingSchedule &&
           form.value.paymentDueDate &&
           form.value.paymentType &&
           uploadProgress.value.percentage === 100
  })

  const saveDraft = async () => {
    isSaving.value = true
    console.log('[CreditLineApplication] Saving draft...', form.value)
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastSaved.value = new Date()
    isSaving.value = false
  }

  const submitApplication = async () => {
    if (!isFormValid.value) return false
    isSaving.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    form.value.status = 'submitted'
    form.value.submittedDate = new Date().toISOString()
    isSaving.value = false
    return true
  }

  let autoSaveInterval: any = null

  onMounted(() => {
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
    tabProgress,
    isFormValid,
    saveDraft,
    submitApplication,
    updateDocFiles
  }
}
