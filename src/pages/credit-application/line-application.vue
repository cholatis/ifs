<script setup lang="ts">
import { useCreditLineApplication } from '@/composables/useCreditLineApplication'
import { useRouter } from 'vue-router'
import { requiredValidator } from '@core/utils/validators'

definePage({
  meta: {
    layout: 'default',
  },
})

const router = useRouter()
const { 
  form, 
  isSaving, 
  lastSaved, 
  uploadProgress, 
  tabProgress,
  isFormValid, 
  saveDraft, 
  submitApplication,
  updateDocFiles 
} = useCreditLineApplication()

const businessTypeOptions = ['Manufacturing', 'Trade', 'Services', 'Contractor', 'Others']
const creditPeriodOptions = [30, 45, 60, 90, 120]
const paymentTypeOptions = [
  { title: 'Cheque', value: 'cheque' },
  { title: 'Transfer', value: 'transfer' },
]

const currentTab = ref('company')

const onSubmit = async () => {
  const success = await submitApplication()
  if (success) {
    router.push('/credit-application/list')
    console.log('Application Submitted Successfully!')
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary'
    case 'submitted': return 'info'
    case 'under_review': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'primary'
  }
}

const getDocGroupCount = (group: string) => {
  const docs = form.value.documents.filter(d => d.docGroup === group)
  const uploaded = docs.filter(d => d.uploadStatus === 'uploaded').length
  return `${uploaded}/${docs.length}`
}
</script>

<template>
  <VForm @submit.prevent="onSubmit">
    <VRow>
      <!-- Page Header -->
      <VCol cols="12">
        <VCard color="primary" class="pa-4 d-flex align-center justify-space-between flex-wrap gap-4 elevation-2 header-card">
          <div class="d-flex align-center gap-2">
            <h2 class="text-white mb-0">Factoring Credit Line Application</h2>
            <VBadge
              color="white"
              :content="form.applicationId"
              inline
              class="app-id-badge"
            />
            <VChip
              :color="getStatusColor(form.status)"
              size="small"
              class="text-uppercase ml-2"
              variant="flat"
            >
              {{ form.status }}
            </VChip>
          </div>
          
          <div class="d-flex gap-3 align-center">
            <div v-if="lastSaved" class="text-white text-caption d-none d-sm-flex align-center mr-2">
              <VIcon icon="tabler-clock" size="14" class="mr-1" />
              Auto-saved: {{ lastSaved.toLocaleTimeString() }}
            </div>
            <VBtn
              variant="tonal"
              color="white"
              prepend-icon="tabler-device-floppy"
              @click="saveDraft"
              :loading="isSaving"
            >
              Save Draft
            </VBtn>
            <VBtn
              color="white"
              class="text-primary"
              prepend-icon="tabler-send"
              type="submit"
              :disabled="!isFormValid"
            >
              Submit Application
            </VBtn>
          </div>
        </VCard>
      </VCol>

      <!-- Section 1: Company Info -->
      <VCol cols="12">
        <VCard title="Section 1 — Company Information & Requested Limit" class="elevation-1">
          <VCardText>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.companyName"
                  label="Company Name"
                  placeholder="Enter company name"
                  readonly
                  class="bg-grey-lighten-4"
                  persistent-placeholder
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.taxId"
                  label="Tax ID"
                  placeholder="010XXXXXXXXXX"
                  readonly
                  class="bg-grey-lighten-4"
                  persistent-placeholder
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.businessType"
                  label="Business Type"
                  :items="businessTypeOptions"
                  :rules="[requiredValidator]"
                  placeholder="Select business type"
                  required
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="form.requestedCreditLimit"
                  label="Requested Credit Limit (THB)"
                  type="number"
                  placeholder="e.g. 10,000,000"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.creditPeriod"
                  label="Credit Period (Days)"
                  :items="creditPeriodOptions"
                  :rules="[requiredValidator]"
                  placeholder="Select period"
                  required
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Section 2: Billing & Payment -->
      <VCol cols="12">
        <VCard title="Section 2 — Billing & Payment Terms" class="elevation-1">
          <VCardText>
            <VRow>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="form.billingSchedule"
                  label="Billing Schedule"
                  placeholder="e.g. 25th of every month"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="form.paymentDueDate"
                  label="Payment Due Date"
                  placeholder="e.g. 30 days after billing"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.paymentType"
                  label="Payment Type"
                  :items="paymentTypeOptions"
                  :rules="[requiredValidator]"
                  placeholder="Select payment type"
                  required
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="form.billingLocation"
                  label="Payment / Cheque Collection Location"
                  placeholder="Enter location (if any)"
                />
              </VCol>
              <VCol cols="12" md="8">
                <VTextarea
                  v-model="form.billingRemark"
                  label="Billing/Payment Rules (if any)"
                  rows="2"
                  placeholder="Additional details..."
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Section 3: Document Upload -->
      <VCol cols="12" class="mb-16">
        <VCard title="Section 3 — Document Upload" class="elevation-1">
          <VTabs v-model="currentTab" grow>
            <VTab value="company">
              <VIcon v-if="tabProgress.company.complete" start icon="tabler-circle-check" color="success" />
              Company Documents ({{ getDocGroupCount('company') }})
            </VTab>
            <VTab value="financial">
              <VIcon v-if="tabProgress.financial.complete" start icon="tabler-circle-check" color="success" />
              Financial Documents ({{ getDocGroupCount('financial') }})
            </VTab>
            <VTab value="director">
              <VIcon v-if="tabProgress.director.complete" start icon="tabler-circle-check" color="success" />
              Director Documents ({{ getDocGroupCount('director') }})
            </VTab>
          </VTabs>

          <VCardText class="pa-0 mt-2">
            <VTabsWindow v-model="currentTab">
              <!-- Tab: Company -->
              <VTabsWindowItem value="company">
                <div class="doc-list pa-4">
                  <VRow v-for="doc in form.documents.filter(d => d.docGroup === 'company')" :key="doc.docId" 
                    class="doc-row align-center py-2 px-3 mb-2 rounded border"
                    :class="{ 'uploaded-bg': doc.uploadStatus === 'uploaded', 'required-border': doc.required && doc.uploadStatus === 'pending' }"
                  >
                    <VCol cols="12" sm="5">
                      <div class="d-flex align-center gap-2">
                        <span class="text-subtitle-2">{{ doc.docId }}. {{ doc.docName }}</span>
                        <VChip v-if="doc.required" color="error" size="x-small">Required</VChip>
                        <VChip v-else color="secondary" size="x-small" variant="tonal">Optional</VChip>
                      </div>
                    </VCol>
                    <VCol cols="12" sm="5">
                      <VFileInput
                        label="Select File (PDF, Image)"
                        accept="application/pdf,image/*"
                        multiple
                        density="compact"
                        hide-details
                        prepend-icon="tabler-upload"
                        color="primary"
                        @update:model-value="(files) => updateDocFiles(doc.docId, files as File[])"
                      />
                    </VCol>
                    <VCol cols="12" sm="2" class="text-right d-flex align-center justify-end gap-2">
                      <VIcon v-if="doc.uploadStatus === 'uploaded'" icon="tabler-circle-check" color="success" size="20" />
                      <VChip
                        :color="doc.uploadStatus === 'uploaded' ? 'success' : 'grey-lighten-1'"
                        size="small"
                        variant="flat"
                        class="text-capitalize"
                      >
                        {{ doc.uploadStatus }}
                      </VChip>
                    </VCol>
                  </VRow>
                </div>
              </VTabsWindowItem>

              <!-- Tab: Financial -->
              <VTabsWindowItem value="financial">
                <div class="doc-list pa-4">
                  <VAlert color="warning" variant="tonal" class="mb-4" icon="tabler-alert-triangle" border="start" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Note (Item 9):</div>
                    If 2023 financial statement is not yet closed, please attach P.P.30 (Jan-Dec 2023) instead.
                  </VAlert>
                  <VRow v-for="doc in form.documents.filter(d => d.docGroup === 'financial')" :key="doc.docId" 
                    class="doc-row align-center py-2 px-3 mb-2 rounded border"
                    :class="{ 'uploaded-bg': doc.uploadStatus === 'uploaded', 'required-border': doc.required && doc.uploadStatus === 'pending' }"
                  >
                    <VCol cols="12" sm="5">
                      <div class="d-flex align-center gap-2">
                        <span class="text-subtitle-2">{{ doc.docId }}. {{ doc.docName }}</span>
                        <VChip v-if="doc.required" color="error" size="x-small">Required</VChip>
                      </div>
                    </VCol>
                    <VCol cols="12" sm="5">
                      <VFileInput
                        label="Select File"
                        accept="application/pdf,image/*"
                        multiple
                        density="compact"
                        hide-details
                        prepend-icon="tabler-upload"
                        @update:model-value="(files) => updateDocFiles(doc.docId, files as File[])"
                      />
                    </VCol>
                    <VCol cols="12" sm="2" class="text-right d-flex align-center justify-end gap-2">
                      <VIcon v-if="doc.uploadStatus === 'uploaded'" icon="tabler-circle-check" color="success" size="20" />
                      <VChip :color="doc.uploadStatus === 'uploaded' ? 'success' : 'grey-lighten-1'" size="small" variant="flat">
                        {{ doc.uploadStatus }}
                      </VChip>
                    </VCol>
                  </VRow>
                </div>
              </VTabsWindowItem>

              <!-- Tab: Director -->
              <VTabsWindowItem value="director">
                <div class="doc-list pa-4">
                  <VAlert color="info" variant="tonal" class="mb-4" icon="tabler-info-square-rounded" border="start" density="compact">
                    Regulation: Credit Bureau documents must be no older than 1 month
                  </VAlert>
                  <VRow v-for="doc in form.documents.filter(d => d.docGroup === 'director')" :key="doc.docId" 
                    class="doc-row align-center py-2 px-3 mb-2 rounded border"
                    :class="{ 'uploaded-bg': doc.uploadStatus === 'uploaded', 'required-border': doc.required && doc.uploadStatus === 'pending' }"
                  >
                    <VCol cols="12" sm="5">
                      <div class="d-flex align-center gap-2">
                        <span class="text-subtitle-2">{{ doc.docId }}. {{ doc.docName }}</span>
                        <VChip v-if="doc.required" color="error" size="x-small">Required</VChip>
                      </div>
                    </VCol>
                    <VCol cols="12" sm="5">
                      <VFileInput
                        label="Select File"
                        accept="application/pdf,image/*"
                        multiple
                        density="compact"
                        hide-details
                        prepend-icon="tabler-upload"
                        @update:model-value="(files) => updateDocFiles(doc.docId, files as File[])"
                      />
                    </VCol>
                    <VCol cols="12" sm="2" class="text-right d-flex align-center justify-end gap-2">
                      <VIcon v-if="doc.uploadStatus === 'uploaded'" icon="tabler-circle-check" color="success" size="20" />
                      <VChip :color="doc.uploadStatus === 'uploaded' ? 'success' : 'grey-lighten-1'" size="small" variant="flat">
                        {{ doc.uploadStatus }}
                      </VChip>
                    </VCol>
                  </VRow>
                </div>
              </VTabsWindowItem>
            </VTabsWindow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Sticky Bottom Progress Summary Bar -->
    <div class="line-app-sticky-bar bg-white border-top pa-4 elevation-12">
      <div class="max-width-1200 mx-auto d-flex align-center justify-space-between gap-6 flex-wrap flex-md-nowrap">
        <div class="flex-grow-1">
          <div class="d-flex justify-space-between mb-1 align-center">
            <span class="text-subtitle-1 font-weight-medium">Required Document Progress</span>
            <span class="text-primary font-weight-bold">
              {{ uploadProgress.current }} of {{ uploadProgress.total }} items ({{ uploadProgress.percentage }}%)
            </span>
          </div>
          <VProgressLinear
            :model-value="uploadProgress.percentage"
            color="primary"
            height="10"
            rounded
            striped
          />
        </div>
        <div class="d-flex gap-4 w-full w-md-auto">
          <VBtn
            variant="outlined"
            color="secondary"
            class="flex-grow-1 flex-md-grow-0"
            prepend-icon="tabler-device-floppy"
            @click="saveDraft"
            :loading="isSaving"
          >
            Save Draft
          </VBtn>
          <VBtn
            color="primary"
            class="flex-grow-1 flex-md-grow-0"
            prepend-icon="tabler-send"
            type="submit"
            :disabled="!isFormValid"
            :loading="isSaving"
          >
            Submit Credit Application
          </VBtn>
        </div>
      </div>
    </div>
  </VForm>
</template>

<style lang="scss">
.header-card {
  border-radius: 12px !important;
}

.line-app-sticky-bar {
  position: sticky;
  bottom: 0;
  z-index: 99;
  margin-left: -2rem;
  margin-right: -2rem;
  margin-bottom: -2rem;
  width: calc(100% + 4rem);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  
  .max-width-1200 {
    max-width: 1200px;
    width: 100%;
  }
}

.app-id-badge {
  .v-badge__badge {
    background-color: white !important;
    color: rgb(var(--v-theme-primary)) !important;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 6px 10px;
    height: auto;
  }
}

.doc-row {
  transition: all 0.25s ease;
  border-color: rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  background-color: rgb(var(--v-theme-surface));
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.04);
    transform: translateX(4px);
    border-color: rgba(var(--v-theme-primary), 0.2) !important;
  }
}

.uploaded-bg {
  background-color: #f6fff6;
  border-color: #69db7c !important;
  
  &:hover {
    background-color: #f0fff0;
  }
}

.required-border {
  border-left: 4px solid rgb(var(--v-theme-error)) !important;
}

@media (max-width: 959px) {
  .line-app-sticky-bar {
    padding: 1rem !important;
  }
}

.v-tab--selected {
  .v-tab__slider {
    height: 3px !important;
  }
}
</style>
