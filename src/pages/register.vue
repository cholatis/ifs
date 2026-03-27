<script setup lang="ts">
import { requiredValidator, emailValidator, confirmedValidator, lengthValidator, integerValidator } from '@/@core/utils/validators'
import AppStepper from '@core/components/AppStepper.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()

const registrationForm = ref({
  companyName: '',
  taxId: '',
  businessType: null,
  requestedAmount: null,
  buyer: '',
  contactName: '',
  phone: '',
  email: '',
  acceptTerms: false,
})

const businessTypeOptions = ['การผลิต', 'การค้า', 'บริการ', 'รับเหมา', 'อื่นๆ']

const currentStep = ref(0)
const isSubmitting = ref(false)
const refStep1Form = ref()
const refStep2Form = ref()
const registrationError = ref('')

const steps = [
  { title: 'ข้อมูลบริษัท', icon: 'tabler-building' },
  { title: 'ข้อมูลผู้ติดต่อ & Email', icon: 'tabler-user' },
  { title: 'ยืนยันและส่งคำขอ', icon: 'tabler-check' },
]

const validateStep1 = async () => {
  const { valid } = await refStep1Form.value.validate()
  if (valid) currentStep.value++
}

const validateStep2 = async () => {
  const { valid } = await refStep2Form.value.validate()
  if (valid) currentStep.value++
}

const SUPABASE_REGISTER_URL = '/api/supabase/register'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b3l1cmFhY25neXZnZHZ4dmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDMxNDAsImV4cCI6MjA3NzM3MjQ2OX0.zbWnxWTFTwzjRurN6QUYEXEHqfRLtMSjBiPJF1S8UDU'

const onSubmit = async () => {
  if (!registrationForm.value.acceptTerms) return
  
  isSubmitting.value = true
  registrationError.value = ''
  
  try {
    const res = await fetch(SUPABASE_REGISTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(registrationForm.value),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      registrationError.value = data.error || 'Registration failed'
    } else {
      router.push('/login')
    }
  } catch (err) {
    registrationError.value = 'Network error'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4 bg-background">
    <VCard
      flat
      max-width="680"
      class="mt-12 mt-sm-0 pa-2 auth-card"
    >
      <VCardText class="text-center">
        <div class="d-flex align-center justify-center gap-x-3 mb-6">
          <VNodeRenderer :nodes="themeConfig.app.logo" />
          <h1 class="auth-title">
            Factoring Pre-Screening Portal
          </h1>
        </div>
        <h4 class="text-h4 mb-1">
          สร้างบัญชี Factoring
        </h4>
        <p class="mb-0">
          กรอกข้อมูลเพื่อเริ่มต้นการขอวงเงินของบริษัทคุณ
        </p>
      </VCardText>

      <VCardText>
        <AppStepper
          v-model:current-step="currentStep"
          :items="steps"
          direction="horizontal"
          align="center"
          class="mb-8 custom-stepper-header"
        />

        <VWindow
          v-model="currentStep"
          class="disable-tab-transition"
        >
          <!-- Step 1: Company Info -->
          <VWindowItem>
            <VForm
              ref="refStep1Form"
              @submit.prevent="validateStep1"
            >
              <VRow>
                <VCol cols="12">
                  <AppTextField
                    v-model="registrationForm.companyName"
                    label="ชื่อบริษัท"
                    placeholder="ระบุชื่อบริษัทเต็ม"
                    :rules="[requiredValidator]"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="registrationForm.taxId"
                    label="เลขประจำตัวผู้เสียภาษี"
                    placeholder="01055XXXXXXXX"
                    :rules="[requiredValidator, (v) => lengthValidator(v, 13) || 'Tax ID must be 13 digits', integerValidator]"
                  />
                </VCol>
                <VCol cols="12">
                  <AppSelect
                    v-model="registrationForm.businessType"
                    label="ประเภทธุรกิจ"
                    :items="businessTypeOptions"
                    placeholder="เลือกประเภทธุรกิจ"
                    :rules="[requiredValidator]"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="registrationForm.requestedAmount"
                    label="วงเงินที่ต้องการ (บาท)"
                    type="number"
                    placeholder="เช่น 1,000,000"
                    :rules="[requiredValidator]"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="registrationForm.buyer"
                    label="Buyer / ลูกค้าหลักของบริษัท"
                    placeholder="ระบุชื่อบริษัทลูกค้าหลัก"
                    :rules="[requiredValidator]"
                  />
                </VCol>
                <VCol cols="12">
                  <VBtn
                    block
                    @click="validateStep1"
                  >
                    ถัดไป
                    <VIcon
                      end
                      icon="tabler-arrow-right"
                    />
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VWindowItem>

          <!-- Step 2: Contact Info -->
          <VWindowItem>
            <VForm
              ref="refStep2Form"
              @submit.prevent="validateStep2"
            >
              <VRow>
                <VCol cols="12">
                  <AppTextField
                    v-model="registrationForm.contactName"
                    label="ชื่อ-นามสกุลผู้ติดต่อ"
                    placeholder="ระบุชื่อ-นามสกุล"
                    :rules="[requiredValidator]"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="registrationForm.phone"
                    label="เบอร์โทรศัพท์"
                    placeholder="08XXXXXXXX"
                    :rules="[requiredValidator, (v) => lengthValidator(v, 10) || 'Phone must be 10 digits', integerValidator]"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="registrationForm.email"
                    label="Email"
                    placeholder="name@company.com"
                    :rules="[requiredValidator, emailValidator]"
                  />
                  <VAlert
                    color="info"
                    variant="tonal"
                    closable
                    class="mt-2 text-caption"
                  >
                    ระบบจะส่ง One-Time Password (OTP) ไปยัง email นี้ เพื่อใช้ในการเข้าสู่ระบบครั้งแรก
                  </VAlert>
                </VCol>
                <VCol
                  cols="12"
                  class="d-flex gap-4"
                >
                  <VBtn
                    variant="tonal"
                    color="secondary"
                    class="flex-grow-1"
                    @click="currentStep--"
                  >
                    ย้อนกลับ
                  </VBtn>
                  <VBtn
                    class="flex-grow-1"
                    @click="validateStep2"
                  >
                    ถัดไป
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VWindowItem>

          <!-- Step 3: Summary -->
          <VWindowItem>
            <VRow>
              <VCol cols="12">
                <VCard
                  variant="outlined"
                  class="pa-4 bg-surface"
                >
                  <h6 class="text-h6 mb-3">สรุปข้อมูลการลงทะเบียน</h6>
                  <div class="text-body-2 mb-1"><span class="font-weight-bold">บริษัท:</span> {{ registrationForm.companyName }}</div>
                  <div class="text-body-2 mb-1"><span class="font-weight-bold">Tax ID:</span> {{ registrationForm.taxId }}</div>
                  <div class="text-body-2 mb-1"><span class="font-weight-bold">วงเงินที่ขอ:</span> {{ Number(registrationForm.requestedAmount).toLocaleString() }} บาท</div>
                  <VDivider class="my-3" />
                  <div class="text-body-2 mb-1"><span class="font-weight-bold">ผู้ติดต่อ:</span> {{ registrationForm.contactName }}</div>
                  <div class="text-body-2 mb-1"><span class="font-weight-bold">Email:</span> {{ registrationForm.email }}</div>
                </VCard>

                <VAlert
                  v-if="registrationError"
                  type="error"
                  variant="tonal"
                  closable
                  class="mt-4"
                >
                  <div class="font-weight-bold mb-1">เกิดข้อผิดพลาดในการลงทะเบียน:</div>
                  <div class="text-caption">{{ registrationError }}</div>
                  <div class="text-caption mt-2" v-if="registrationError.includes('SMTP') || registrationError.includes('500')">
                    <strong>ข้อแนะนำ:</strong> กรุณาตรวจสอบว่าได้ตั้งค่า SMTP Secrets ใน Supabase เรียบร้อยแล้ว (SMTP_USER, SMTP_PASS, APP_URL)
                  </div>
                </VAlert>
              </VCol>

              <VCol cols="12">
                <VCheckbox
                  v-model="registrationForm.acceptTerms"
                  label="ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol
                cols="12"
                class="d-flex gap-4"
              >
                <VBtn
                  variant="tonal"
                  color="secondary"
                  class="flex-grow-1"
                  @click="currentStep--"
                >
                  ย้อนกลับ
                </VBtn>
                <VBtn
                  class="flex-grow-1"
                  :loading="isSubmitting"
                  :disabled="!registrationForm.acceptTerms || isSubmitting"
                  @click="onSubmit"
                >
                  ส่งคำขอ
                  <VIcon
                    end
                    icon="tabler-send"
                  />
                </VBtn>
              </VCol>

              <VCol cols="12" class="text-center">
                <router-link to="/login" class="text-primary text-body-1">
                  มีบัญชีแล้ว? เข้าสู่ระบบ
                </router-link>
              </VCol>
            </VRow>
          </VWindowItem>
        </VWindow>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";

.auth-card {
  border-radius: 12px !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.custom-stepper-header {
  .v-avatar.bg-primary {
    background-color: rgb(var(--v-theme-primary)) !important;
    color: #fff !important;
  }
}

.v-text-field, .v-select {
  .v-field {
    border-radius: 8px !important;
    border: 1px solid #e2e8f0;
    
    &.v-field--focused {
      border-color: rgb(var(--v-theme-primary));
    }
  }
}
</style>
