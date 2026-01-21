<template>
  <div
    class="relative rounded-full overflow-hidden transition-all duration-300"
    :class="[sizeClasses, selected ? 'ring-4 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900' : '']"
  >
    <!-- Custom SVG Avatar -->
    <svg
      viewBox="0 0 100 100"
      class="w-full h-full"
      :style="{ backgroundColor: avatar.bgColor }"
    >
      <!-- Face background circle -->
      <circle cx="50" cy="50" r="50" :fill="avatar.bgColor" />

      <!-- Face -->
      <circle cx="50" cy="52" r="35" :fill="avatar.skinColor" />

      <!-- Eyes -->
      <g :fill="avatar.eyeColor">
        <!-- Left eye -->
        <ellipse :cx="38" cy="45" :rx="avatar.eyeStyle === 'round' ? 5 : 4" :ry="avatar.eyeStyle === 'round' ? 6 : 5" />
        <!-- Right eye -->
        <ellipse :cx="62" cy="45" :rx="avatar.eyeStyle === 'round' ? 5 : 4" :ry="avatar.eyeStyle === 'round' ? 6 : 5" />
        <!-- Pupils -->
        <circle cx="38" cy="46" r="2.5" fill="#1a1a2e" />
        <circle cx="62" cy="46" r="2.5" fill="#1a1a2e" />
        <!-- Eye shine -->
        <circle cx="39.5" cy="44" r="1" fill="white" />
        <circle cx="63.5" cy="44" r="1" fill="white" />
      </g>

      <!-- Eyebrows -->
      <g :stroke="avatar.hairColor" stroke-width="2.5" stroke-linecap="round" fill="none">
        <path :d="avatar.eyebrowStyle === 'arched' ? 'M32 38 Q38 35 44 38' : 'M32 37 L44 37'" />
        <path :d="avatar.eyebrowStyle === 'arched' ? 'M56 38 Q62 35 68 38' : 'M56 37 L68 37'" />
      </g>

      <!-- Mouth -->
      <g>
        <path
          v-if="avatar.mouthStyle === 'smile'"
          d="M38 62 Q50 72 62 62"
          :stroke="avatar.mouthColor"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
        />
        <path
          v-else-if="avatar.mouthStyle === 'grin'"
          d="M36 60 Q50 75 64 60"
          :fill="avatar.mouthColor"
        />
        <ellipse
          v-else-if="avatar.mouthStyle === 'open'"
          cx="50"
          cy="64"
          rx="8"
          ry="6"
          :fill="avatar.mouthColor"
        />
        <circle
          v-else
          cx="50"
          cy="63"
          r="4"
          :fill="avatar.mouthColor"
        />
      </g>

      <!-- Cheeks (blush) -->
      <g v-if="avatar.hasBlush" fill="#ffb5b5" opacity="0.4">
        <ellipse cx="28" cy="55" rx="6" ry="4" />
        <ellipse cx="72" cy="55" rx="6" ry="4" />
      </g>

      <!-- Hair -->
      <g :fill="avatar.hairColor">
        <!-- Different hair styles -->
        <template v-if="avatar.hairStyle === 'short'">
          <ellipse cx="50" cy="22" rx="30" ry="15" />
          <rect x="22" y="15" width="56" height="15" rx="5" />
        </template>
        <template v-else-if="avatar.hairStyle === 'curly'">
          <circle cx="30" cy="25" r="12" />
          <circle cx="50" cy="20" r="14" />
          <circle cx="70" cy="25" r="12" />
          <circle cx="25" cy="35" r="8" />
          <circle cx="75" cy="35" r="8" />
        </template>
        <template v-else-if="avatar.hairStyle === 'long'">
          <ellipse cx="50" cy="22" rx="32" ry="14" />
          <rect x="18" y="20" width="14" height="45" rx="7" />
          <rect x="68" y="20" width="14" height="45" rx="7" />
        </template>
        <template v-else-if="avatar.hairStyle === 'spiky'">
          <polygon points="50,5 45,25 55,25" />
          <polygon points="35,10 35,28 45,25" />
          <polygon points="65,10 65,28 55,25" />
          <polygon points="25,18 28,35 38,28" />
          <polygon points="75,18 72,35 62,28" />
          <ellipse cx="50" cy="28" rx="28" ry="10" />
        </template>
        <template v-else-if="avatar.hairStyle === 'bald'">
          <!-- No hair, just a slight highlight -->
          <ellipse cx="50" cy="25" rx="20" ry="8" fill="white" opacity="0.1" />
        </template>
        <template v-else>
          <!-- Default ponytail style -->
          <ellipse cx="50" cy="22" rx="28" ry="12" />
          <ellipse cx="75" cy="35" rx="10" ry="15" />
        </template>
      </g>

      <!-- Accessories -->
      <g v-if="avatar.accessory === 'glasses'">
        <circle cx="38" cy="45" r="10" fill="none" stroke="#333" stroke-width="2" />
        <circle cx="62" cy="45" r="10" fill="none" stroke="#333" stroke-width="2" />
        <path d="M48 45 L52 45" stroke="#333" stroke-width="2" />
        <path d="M28 43 L20 40" stroke="#333" stroke-width="2" />
        <path d="M72 43 L80 40" stroke="#333" stroke-width="2" />
      </g>
      <g v-else-if="avatar.accessory === 'hat'">
        <ellipse cx="50" cy="18" rx="35" ry="8" :fill="avatar.bgColor" />
        <rect x="30" y="5" width="40" height="15" rx="3" :fill="avatar.bgColor" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { AvatarConfig } from '~/utils/avatarPresets'

interface Props {
  avatar: AvatarConfig
  size?: 'sm' | 'md' | 'lg' | 'xl'
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  selected: false
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-12 h-12'
    case 'md': return 'w-20 h-20'
    case 'lg': return 'w-28 h-28'
    case 'xl': return 'w-36 h-36'
    default: return 'w-20 h-20'
  }
})
</script>
