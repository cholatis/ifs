<script setup lang="ts">
import { useRegistrationManagement } from '@/composables/useRegistrationManagement'
import type { RegistrationStatus } from '@/composables/useRegistrationManagement'

const { 
  registrations, 
  isLoading, 
  fetchRegistrations 
} = useRegistrationManagement()

onMounted(() => {
  fetchRegistrations()
})

const search = ref('')
const statusFilter = ref<RegistrationStatus | 'all'>('all')

const headers = [
  { title: 'Email', key: 'email' },
  { title: 'Full Name', key: 'full_name' },
  { title: 'Company', key: 'company_name' },
  { title: 'Status', key: 'registration_status' },
  { title: 'Created At', key: 'created_time' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const resolveStatusVariant = (status: RegistrationStatus) => {
  if (status === 'APPROVED') return { color: 'success', text: 'Approved' }
  if (status === 'REJECTED') return { color: 'error', text: 'Rejected' }
  return { color: 'warning', text: 'Pending' }
}

const filteredRegistrations = computed(() => {
  return registrations.value.filter(reg => {
    const matchesSearch = !search.value || 
      reg.email.toLowerCase().includes(search.value.toLowerCase()) ||
      reg.full_name.toLowerCase().includes(search.value.toLowerCase()) ||
      reg.company_name.toLowerCase().includes(search.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === 'all' || reg.registration_status === statusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Registration Management">
        <VCardText>
          <VRow>
            <VCol cols="12" md="4">
              <AppTextField
                v-model="search"
                placeholder="Search Email, Name, Company"
                prepend-inner-icon="tabler-search"
                clearable
              />
            </VCol>
            <VCol cols="12" md="4">
              <AppSelect
                v-model="statusFilter"
                :items="[
                  { title: 'All Status', value: 'all' },
                  { title: 'Pending', value: 'PENDING' },
                  { title: 'Approved', value: 'APPROVED' },
                  { title: 'Rejected', value: 'REJECTED' },
                ]"
                placeholder="Select Status"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VDataTable
          :headers="headers"
          :items="filteredRegistrations"
          :loading="isLoading"
          class="text-no-wrap"
        >
          <!-- Email -->
          <template #item.email="{ item }">
            <div class="d-flex align-center">
              <VAvatar
                size="32"
                color="primary"
                variant="tonal"
                class="me-3"
              >
                <span class="text-xs">{{ item.full_name?.charAt(0).toUpperCase() }}</span>
              </VAvatar>
              <div class="d-flex flex-column">
                <span class="text-h6 font-weight-medium">{{ item.email }}</span>
              </div>
            </div>
          </template>

          <!-- Status -->
          <template #item.registration_status="{ item }">
            <VChip
              :color="resolveStatusVariant(item.registration_status).color"
              size="small"
              class="text-capitalize"
            >
              {{ resolveStatusVariant(item.registration_status).text }}
            </VChip>
          </template>

          <!-- Created At -->
          <template #item.created_time="{ item }">
            <span class="text-body-1">{{ formatDate(item.created_time) }}</span>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <VBtn
              icon
              variant="text"
              color="primary"
              :to="{ name: 'registration-management-view-id', params: { id: item.user_id } }"
            >
              <VIcon icon="tabler-eye" />
              <VTooltip activator="parent">View Details</VTooltip>
            </VBtn>
          </template>
        </VDataTable>
      </VCard>
    </VCol>
  </VRow>
</template>
