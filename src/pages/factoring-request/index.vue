<script setup lang="ts">
import { useFactoringRequest } from '@/composables/useFactoringRequest'
import { useRouter } from 'vue-router'
import { requiredValidator, lengthValidator } from '@core/utils/validators'

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
  remainingAfterRequest,
  isAmountOverLimit,
  creditUsagePercentage,
  isFormValid,
  saveDraft,
  submitApplication,
  updateDocFiles,
} = useFactoringRequest()

const item1Included = ref(true)
const item2Included = ref(true)

const formatCurrency = (value: number | null) => {
  if (value === null) return '0'
  return new Intl.NumberFormat('th-TH').format(value)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary'
    case 'submitted': return 'info'
    case 'under_review': return 'warning'
    case 'approved': return 'success'
    case 'disbursed': return 'primary'
    case 'collected': return 'success'
    case 'rejected': return 'error'
    default: return 'primary'
  }
}

const onSubmit = async () => {
  const success = await submitApplication()
  if (success) {
    router.push('/credit-application/list')
    console.log('Factoring Request Submitted Successfully!')
  }
}
</script>

<template>
  <VForm @submit.prevent="onSubmit">
    <VRow>
      <!-- Page Header -->
      <VCol cols="12">
        <VCard color="primary" class="pa-4 d-flex align-center justify-space-between flex-wrap gap-4 elevation-2 header-card">
          <div class="d-flex align-center gap-2">
            <h2 class="text-white mb-0">Factoring Request (PO-based)</h2>
            <VBadge
              color="white"
              :content="form.requestId"
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

      <!-- Section 1: Credit Summary (Read-only) -->
      <VCol cols="12">
        <VCard class="credit-summary-card elevation-1">
          <VCardItem>
            <template #title>
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-chart-pie" color="primary" />
                <span>Section 1 — Approved Credit Limit (Ref: {{ form.creditApplicationId }})</span>
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <VRow align="center">
              <VCol cols="12" md="4" class="d-flex flex-column gap-2">
                <div class="d-flex align-center justify-space-between">
                  <span class="text-subtitle-2">Total Credit Limit</span>
                  <VChip color="primary" variant="flat" class="font-weight-bold">
                    {{ formatCurrency(form.approvedCreditLimit) }} THB
                  </VChip>
                </div>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-subtitle-2">Already Used</span>
                  <VChip color="warning" variant="flat" class="font-weight-bold">
                    {{ formatCurrency(form.usedCreditAmount) }} THB
                  </VChip>
                </div>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-subtitle-2">Remaining</span>
                  <VChip color="success" variant="flat" class="font-weight-bold">
                    {{ formatCurrency(form.availableCreditAmount) }} THB
                  </VChip>
                </div>
              </VCol>

              <VCol cols="12" md="8">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-caption font-weight-medium">Credit Usage Rate</span>
                  <span class="text-caption font-weight-bold text-primary">{{ Math.round(creditUsagePercentage) }}%</span>
                </div>
                <VProgressLinear
                  :model-value="creditUsagePercentage"
                  color="primary"
                  height="12"
                  rounded
                  striped
                />
                <div class="mt-4 d-flex align-center gap-2 text-info">
                  <VIcon icon="tabler-info-circle" size="18" />
                  <span class="text-caption italic">Remaining limit after this request: {{ formatCurrency(remainingAfterRequest) }} THB</span>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Section 2: PO Information -->
      <VCol cols="12" md="6">
        <VCard title="Section 2 — PO Information" class="elevation-1 h-100">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.poNumber"
                  label="PO Number"
                  placeholder="Enter PO number"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.poDate"
                  label="PO Date"
                  type="date"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model.number="form.poAmount"
                  label="PO Amount (THB)"
                  type="number"
                  placeholder="0.00"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="form.buyerName"
                  label="Buyer Name"
                  placeholder="Enter buyer company name"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="form.buyerTaxId"
                  label="Buyer Tax ID"
                  placeholder="13 digits"
                  :rules="[requiredValidator, lengthValidator(form.buyerTaxId, 13)]"
                  required
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Section 3: Invoice Information -->
      <VCol cols="12" md="6">
        <VCard title="Section 3 — Invoice Information" class="elevation-1 h-100">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.invoiceNumber"
                  label="Invoice Number"
                  placeholder="Enter invoice number"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="form.invoiceDate"
                  label="Invoice Date"
                  type="date"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="form.invoiceDueDate"
                  label="Due Date"
                  type="date"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model.number="form.requestedAmount"
                  label="Requested Amount (THB)"
                  type="number"
                  placeholder="0.00"
                  :rules="[requiredValidator]"
                  required
                  :class="{ 'invalid-amount-input': isAmountOverLimit }"
                  class="requested-amount-field"
                />
                
                <VAlert
                  v-if="isAmountOverLimit"
                  color="error"
                  variant="tonal"
                  class="mt-3 py-2"
                  icon="tabler-alert-circle"
                  density="compact"
                >
                  <span class="text-caption font-weight-bold">
                    Requested amount exceeds remaining limit. Please check.
                  </span>
                </VAlert>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Section 4: PO List -->
      <VCol cols="12">
        <VCard title="Section 4 — PO List" class="elevation-1">
          <VCardText>
            <VTable class="border rounded">
              <thead>
                <tr>
                  <th class="text-left font-weight-bold">PO Number</th>
                  <th class="text-left font-weight-bold">PO Date</th>
                  <th class="text-right font-weight-bold">Amount (THB)</th>
                  <th class="text-center font-weight-bold">Status</th>
                  <th class="text-center font-weight-bold">Include in Factoring</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>PO-2026-001</td>
                  <td>20/04/2026</td>
                  <td class="text-right">50,000.00</td>
                  <td class="text-center">
                    <VChip color="success" size="x-small" variant="flat">Invoiced</VChip>
                  </td>
                  <td class="text-center">
                    <VCheckbox v-model="item1Included" density="compact" hide-details />
                  </td>
                </tr>
                <tr>
                  <td>PO-2026-002</td>
                  <td>22/04/2026</td>
                  <td class="text-right">75,500.00</td>
                  <td class="text-center">
                    <VChip color="success" size="x-small" variant="flat">Invoiced</VChip>
                  </td>
                  <td class="text-center">
                    <VCheckbox v-model="item2Included" density="compact" hide-details />
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VForm>
</template>

<style lang="scss">
.header-card {
  border-radius: 12px !important;
}

.credit-summary-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0.02) 100%);
  border-left: 5px solid rgb(var(--v-theme-primary)) !important;
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

.requested-amount-field {
  transition: all 0.3s ease;
  
  &.invalid-amount-input {
    .v-field__outline {
      --v-field-border-color: rgb(var(--v-theme-error)) !important;
      --v-field-border-opacity: 1 !important;
      border-width: 2px !important;
    }
    
    .v-label {
      color: rgb(var(--v-theme-error)) !important;
    }
  }
}

.uploaded-doc {
  background-color: #f6fff6;
  border-color: #69db7c !important;
}

.italic {
  font-style: italic;
}
</style>
