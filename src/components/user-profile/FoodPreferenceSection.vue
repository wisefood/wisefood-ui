<template>
  <v-card-item>
    <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
      <v-icon v-if="icon" :icon="icon" size="small" class="me-2" />
      {{ title }}
    </v-card-subtitle>

    <div class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="item in items"
        :key="getItemKey(item)"
        :color="getItemColor(item)"
        variant="flat"
        size="small"
      >
        <v-icon
          v-if="getItemIcon(item)"
          :icon="String(getItemIcon(item))"
          start
          size="x-small"
        />
        {{ formatText(getItemText(item)) }}
      </v-chip>

      <v-chip
        v-if="items.length === 0"
        variant="outlined"
        color="grey"
        size="small"
      >
        {{ emptyMessage }}
      </v-chip>
    </div>
  </v-card-item>
</template>

<script setup lang="ts">
import type { FoodConstrain } from "@/types/food-profile.types";

interface Props {
  title: string;
  items: FoodConstrain<any>[] | { food: any }[]; // Support both constrained and simple food items
  emptyMessage: string;
  color?: string;
  colorFn?: (item: FoodConstrain<any>) => string;
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
});

const formatText = (text: string): string => {
  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
};

const getItemKey = (item: any): string => {
  return item.food?.toString() || Math.random().toString();
};

const getItemText = (item: any): string => {
  return item.food?.toString() || "Unknown";
};

const getItemColor = (item: any): string => {
  return props.colorFn ? props.colorFn(item) : props.color;
};

const getItemIcon = (item: any): string | null => {
  if (item.isRequired) return "mdi-star";
  return null;
};
</script>
