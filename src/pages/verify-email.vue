<script setup lang="ts">
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4 bg-background">
    <VCard
      flat
      max-width="500"
      class="text-center pa-6 auth-card"
    >
      <VCardText>
        <div class="d-flex align-center justify-center gap-x-3 mb-6">
          <VNodeRenderer :nodes="themeConfig.app.logo" />
          <h1 class="auth-title">
            {{ themeConfig.app.title }}
          </h1>
        </div>
        
        <VIcon
          icon="tabler-mail-check"
          size="64"
          color="primary"
          class="mb-6"
        />
        
        <h4 class="text-h4 mb-2">
          ยืนยัน Email ของคุณ ✉️
        </h4>
        <p class="text-body-1 mb-6">
          เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว โปรดตรวจสอบกล่องข้อความและคลิกลิงก์เพื่อเปิดใช้งานบัญชี
        </p>

        <VBtn
          block
          to="/login"
          class="mb-6"
        >
          กลับไปที่หน้า Login
        </VBtn>

        <p class="mb-0">
          ไม่ได้รับอีเมล? 
          <a
            href="javascript:void(0)"
            class="text-primary font-weight-medium"
          >
            ส่งอีกครั้ง
          </a>
        </p>
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
</style>
