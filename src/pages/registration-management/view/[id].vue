<script setup lang="ts">
import { useRegistrationManagement } from '@/composables/useRegistrationManagement'
import type { RegistrationStatus } from '@/composables/useRegistrationManagement'

const route = useRoute()
const router = useRouter()
const { registrations, fetchRegistrations, updateRegistrationStatus, getRegistrationById, isLoading } = useRegistrationManagement()

const userId = route.params.id as string
const registration = ref()

onMounted(async () => {
  if (registrations.value.length === 0) {
    await fetchRegistrations()
  }
  registration.value = getRegistrationById(userId)
})

const isRejectDialogVisible = ref(false)
const rejectReason = ref('')

const handleApprove = async () => {
  const success = await updateRegistrationStatus(userId, 'APPROVED')
  if (success) {
    // In a real app, we'd show a success toast
    router.push({ name: 'registration-management-list' })
  }
}

const handleReject = async () => {
  const success = await updateRegistrationStatus(userId, 'REJECTED', rejectReason.value)
  if (success) {
    isRejectDialogVisible.value = false
    router.push({ name: 'registration-management-list' })
  }
}

const resolveStatusVariant = (status: RegistrationStatus) => {
  if (status === 'APPROVED') return { color: 'success', text: 'Approved' }
  if (status === 'REJECTED') return { color: 'error', text: 'Rejected' }
  return { color: 'warning', text: 'Pending' }
}
</script>

<template>
  <VRow v-if="registration">
    <!-- Action Toolbar -->
    <VCol cols="12">
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-4">
        <div class="d-flex align-center">
          <VBtn
            icon="tabler-arrow-left"
            variant="tonal"
            color="secondary"
            class="me-3"
            @click="router.back()"
          />
          <div>
            <h4 class="text-h4 mb-0">Registration Details</h4>
            <div class="d-flex align-center mt-1">
              <span class="text-body-2 text-disabled me-2">User ID: {{ userId }}</span>
              <VChip
                :color="resolveStatusVariant(registration.registration_status).color"
                size="x-small"
                class="text-capitalize"
              >
                {{ resolveStatusVariant(registration.registration_status).text }}
              </VChip>
            </div>
          </div>
        </div>
        
        <div v-if="registration.registration_status === 'PENDING'" class="d-flex gap-3">
          <VBtn
            color="error"
            variant="tonal"
            prepend-icon="tabler-x"
            @click="isRejectDialogVisible = true"
          >
            Reject
          </VBtn>
          <VBtn
            color="success"
            prepend-icon="tabler-check"
            @click="handleApprove"
          >
            Approve
          </VBtn>
        </div>
      </div>
    </VCol>

    <!-- Details Column -->
    <VCol cols="12" md="8">
      <VCard title="User Information" class="mb-6">
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <div class="mb-4">
                <span class="text-subtitle-2 text-disabled d-block">Full Name</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">{{ registration.full_name }}</span>
              </div>
              <div>
                <span class="text-subtitle-2 text-disabled d-block">Email Address</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">{{ registration.email }}</span>
              </div>
            </VCol>
            <VCol cols="12" sm="6">
              <div class="mb-4">
                <span class="text-subtitle-2 text-disabled d-block">Phone Number</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">{{ registration.phone || '-' }}</span>
              </div>
              <div>
                <span class="text-subtitle-2 text-disabled d-block">Registration Date</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">
                  {{ registration.created_time ? new Date(registration.created_time).toLocaleString('th-TH') : '-' }}
                </span>
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCard title="Business Details">
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <div class="mb-4">
                <span class="text-subtitle-2 text-disabled d-block">Company Name</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">{{ registration.company_name }}</span>
              </div>
              <div>
                <span class="text-subtitle-2 text-disabled d-block">Tax ID / Business Registration</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">{{ registration.tax_id || '-' }}</span>
              </div>
            </VCol>
            <VCol cols="12" sm="6">
              <div class="mb-4">
                <span class="text-subtitle-2 text-disabled d-block">Business Type</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">{{ registration.business_type || '-' }}</span>
              </div>
              <div>
                <span class="text-subtitle-2 text-disabled d-block">Requested Credit Amount</span>
                <span class="text-h6 font-weight-bold text-primary">
                  {{ registration.requested_amount ? registration.requested_amount.toLocaleString() + ' THB' : '-' }}
                </span>
              </div>
            </VCol>
            <VCol cols="12">
              <div>
                <span class="text-subtitle-2 text-disabled d-block">Target Buyer / Debtor Information</span>
                <span class="text-body-1 font-weight-medium text-high-emphasis">{{ registration.target_buyer || '-' }}</span>
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Side Column -->
    <VCol cols="12" md="4">
      <VCard title="Status History" class="mb-6">
        <VCardText>
          <VTimeline
            side="end"
            align="start"
            density="compact"
          >
            <VTimelineItem
              dot-color="primary"
              size="x-small"
            >
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2 font-weight-medium">Registered</span>
                <span class="text-caption">{{ registration.created_time ? new Date(registration.created_time).toLocaleDateString() : '-' }}</span>
              </div>
              <p class="text-caption mb-0">Initial sign-up via portal</p>
            </VTimelineItem>

            <VTimelineItem
              v-if="registration.registration_status !== 'PENDING'"
              :dot-color="resolveStatusVariant(registration.registration_status).color"
              size="x-small"
            >
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2 font-weight-medium">{{ resolveStatusVariant(registration.registration_status).text }}</span>
              </div>
              <p v-if="registration.admin_remark" class="text-caption mb-0 text-error">{{ registration.admin_remark }}</p>
            </VTimelineItem>
          </VTimeline>
        </VCardText>
      </VCard>

      <VCard v-if="registration.admin_remark" border class="mb-6 bg-lightest">
        <VCardText>
          <div class="d-flex align-center text-error mb-2">
            <VIcon icon="tabler-alert-circle" size="20" class="me-2" />
            <span class="font-weight-medium">Rejection Reasons</span>
          </div>
          <p class="text-body-2 mb-0">{{ registration.admin_remark }}</p>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Reject Dialog -->
    <VDialog v-model="isRejectDialogVisible" max-width="500">
      <VCard title="Confirm Rejection">
        <VCardText>
          <p class="text-body-1 mb-4">Are you sure you want to reject the registration for <strong>{{ registration.full_name }}</strong>?</p>
          <AppTextarea
            v-model="rejectReason"
            label="Rejection Reason"
            placeholder="Please specify why this registration is being rejected..."
            rows="3"
            persistent-hint
            hint="This reason will be visible to the user."
          />
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn color="secondary" variant="tonal" @click="isRejectDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" :disabled="!rejectReason" @click="handleReject">Reject User</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VRow>

  <div v-else-if="isLoading" class="d-flex flex-column align-center justify-center py-12">
    <VProgressCircular indeterminate color="primary" class="mb-4" size="64" width="6" />
    <span class="text-h6">Loading registration details...</span>
  </div>
  
  <VAlert v-else type="error" variant="tonal" class="mt-4">
    <template #title>User Not Found</template>
    <p>The registration record you requested could not be found. It may have been deleted or the ID is incorrect.</p>
    <template #append>
      <VBtn color="error" class="mt-2" :to="{ name: 'registration-management-list' }">Return to List</VBtn>
    </template>
  </VAlert>
</template>

<style scoped>
.bg-lightest {
  background-color: rgb(var(--v-theme-surface-variant), 0.05);
}
</style>
