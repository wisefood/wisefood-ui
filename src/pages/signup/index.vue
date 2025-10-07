<template>
  <div class="container container-normal py-4">
    <div class="row align-items-center g-4">
      <div class="col-lg">
        <signup-card />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
const { t } = useI18nWithStorage();

definePage({
  name: 'signup',
  meta: {
    layout: 'auth',
  }
})

</script>

