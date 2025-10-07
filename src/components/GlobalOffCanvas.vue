<!-- components/GlobalOffCanvas.vue -->
<template>
  <div>
    <v-navigation-drawer
      v-for="instance in activeInstances"
      :key="instance.id"
      v-model="instance.isOpen"
      :location="instance.location"
      :width="instance.width"
      temporary
      class="off-canvas-drawer"
    >
      <!-- Header -->
      <div class="off-canvas-header">
        <v-list-item width="100%">
          <v-list-item-title class="text-h6 font-weight-bold">
            {{ instance.title }}
          </v-list-item-title>
          <template v-slot:append>
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="closeInstance(instance.id)"
            />
          </template>
        </v-list-item>
      </div>

      <v-divider />

      <!-- Content Area -->
      <div class="off-canvas-content">
        <component
          v-if="instance.component"
          :is="instance.component"
          :key="`${instance.id}-${instance.refreshKey}`"
          v-bind="instance.componentProps"
        />
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup lang="ts">
import { useOffCanvas } from "@/composables/useOffCanvas";

const { activeInstances, close } = useOffCanvas();

const closeInstance = (id: string): void => {
  close(id);
};
</script>

<style lang="scss" scoped>
.off-canvas-drawer {
  top: 0 !important;
  height: 100vh !important;
  z-index: 2000 !important;
}

.off-canvas-header {
  position: sticky;
  height: 60px;
  top: 0;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.off-canvas-content {
  padding: 1rem;
  height: calc(100vh - 62px);
  overflow-y: auto;
}
</style>
