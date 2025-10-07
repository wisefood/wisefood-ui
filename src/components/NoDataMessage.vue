<template>
  <div class="text-center pa-8">
    <v-icon :size="iconSize" :color="iconColor" class="mb-4">
      {{ icon }}
    </v-icon>

    <div :class="titleClass" class="mb-2">
      {{ computedTitle }}
    </div>

    <div :class="descriptionClass" v-if="description">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";

const { t } = useI18nWithStorage();

interface Props {
  icon?: string;
  iconSize?: string | number;
  iconColor?: string;
  title?: string;
  description?: string;
  titleClass?: string;
  descriptionClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "mdi-inbox-outline",
  iconSize: 64,
  iconColor: "grey-lighten-2",
  titleClass: "text-h6 text-grey-lighten-1",
  descriptionClass: "text-body-2 text-grey",
  title: "",
  description: "",
});

const computedTitle = computed(() => {
  return props.title || t("common.noDataAvailable");
});
</script>
