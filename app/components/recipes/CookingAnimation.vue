<template>
  <div
    ref="container"
    class="cooking-animation-container relative flex flex-col items-center justify-center py-8"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <!-- Main cooking scene -->
    <div class="relative mb-8">
      <!-- Soft glow behind pot -->
      <div class="absolute inset-0 -inset-x-8 -inset-y-4 bg-gradient-radial from-rose-100/40 via-transparent to-transparent dark:from-rose-900/20 rounded-full blur-2xl"></div>

      <!-- Steam particles - softer, more elegant -->
      <div class="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-3">
        <svg
          v-for="i in 3"
          :key="`steam-${i}`"
          class="steam-particle"
          :style="{ animationDelay: `${i * 0.5}s` }"
          width="20"
          height="36"
          viewBox="0 0 20 36"
          fill="none"
        >
          <path
            d="M10 34C10 34 6 26 6 20C6 14 10 10 10 4C10 10 14 14 14 20C14 26 10 34 10 34Z"
            fill="currentColor"
            class="text-stone-300/50 dark:text-stone-500/40"
          />
        </svg>
      </div>

      <!-- Pot/Pan SVG - pastel colors -->
      <div
        class="cooking-vessel transition-transform duration-500 ease-out"
        :style="vesselStyle"
      >
        <svg
          width="140"
          height="110"
          viewBox="0 0 140 110"
          fill="none"
          class="drop-shadow-sm"
        >
          <!-- Pan shadow -->
          <ellipse
            cx="70"
            cy="85"
            rx="45"
            ry="10"
            class="fill-stone-200/50 dark:fill-stone-700/30"
          />
          <!-- Pan base -->
          <ellipse
            cx="70"
            cy="75"
            rx="48"
            ry="14"
            class="fill-stone-400 dark:fill-stone-500"
          />
          <!-- Pan body -->
          <path
            d="M22 50C22 50 22 75 70 75C118 75 118 50 118 50"
            stroke="currentColor"
            stroke-width="6"
            stroke-linecap="round"
            class="text-stone-300 dark:text-stone-400"
            fill="none"
          />
          <ellipse
            cx="70"
            cy="50"
            rx="48"
            ry="14"
            class="fill-stone-300 dark:fill-stone-400"
          />
          <!-- Pan interior - warm pastel -->
          <ellipse
            cx="70"
            cy="50"
            rx="40"
            ry="10"
            class="fill-amber-50 dark:fill-stone-600"
          />
          <!-- Pan handle -->
          <rect
            x="115"
            y="47"
            width="30"
            height="6"
            rx="3"
            class="fill-rose-200 dark:fill-rose-300/60"
          />
          <rect
            x="118"
            y="48"
            width="24"
            height="4"
            rx="2"
            class="fill-rose-300/80 dark:fill-rose-400/40"
          />

          <!-- Animated content based on cooking action -->
          <g class="cooking-content">
            <!-- Stirring spoon -->
            <g v-if="currentAction === 'stirring'" class="stirring-spoon">
              <ellipse cx="70" cy="50" rx="6" ry="3" class="fill-amber-100 dark:fill-amber-200/60" />
              <rect x="67" y="18" width="6" height="32" rx="3" class="fill-rose-200 dark:fill-rose-300/70" />
              <ellipse cx="70" cy="18" rx="4" ry="2" class="fill-rose-300/80 dark:fill-rose-400/50" />
            </g>

            <!-- Frying bubbles - softer -->
            <g v-if="currentAction === 'frying'" class="frying-bubbles">
              <circle v-for="b in 5" :key="`bubble-${b}`"
                :cx="40 + b * 12"
                :cy="50"
                :r="2 + (b % 3)"
                class="frying-bubble fill-amber-100/80 dark:fill-amber-200/40"
                :style="{ animationDelay: `${b * 0.25}s` }"
              />
            </g>

            <!-- Chopping knife - elegant -->
            <g v-if="currentAction === 'chopping'" class="chopping-knife">
              <rect x="55" y="28" width="30" height="3" rx="1.5" class="fill-stone-200 dark:fill-stone-300/70" />
              <path d="M55 31L85 31L70 48Z" class="fill-stone-300/80 dark:fill-stone-400/60" />
            </g>

            <!-- Boiling bubbles - gentle -->
            <g v-if="currentAction === 'boiling'" class="boiling-action">
              <circle v-for="b in 5" :key="`boil-${b}`"
                :cx="45 + b * 10"
                :cy="52"
                :r="2 + (b % 2)"
                class="boiling-bubble fill-sky-100/80 dark:fill-sky-200/40"
                :style="{ animationDelay: `${b * 0.2}s` }"
              />
            </g>

            <!-- Sauteing ingredients - pastel colors -->
            <g v-if="currentAction === 'sauteing'" class="sauteing-action">
              <rect v-for="i in 4" :key="`saute-${i}`"
                :x="50 + i * 10"
                y="47"
                width="5"
                height="5"
                rx="1"
                class="saute-piece"
                :class="['fill-peach', 'fill-sage', 'fill-lavender', 'fill-cream'][i - 1]"
                :style="{ animationDelay: `${i * 0.12}s` }"
              />
            </g>

            <!-- Simmering - gentle ripples -->
            <g v-if="currentAction === 'simmering'" class="simmering-action">
              <circle v-for="s in 4" :key="`simmer-${s}`"
                :cx="48 + s * 12"
                :cy="52"
                r="2.5"
                class="simmer-bubble fill-amber-100/60 dark:fill-amber-200/30"
                :style="{ animationDelay: `${s * 0.35}s` }"
              />
            </g>
          </g>
        </svg>
      </div>

      <!-- Flying ingredients - pastel versions -->
      <div class="absolute inset-0 pointer-events-none">
        <svg
          v-for="(ingredient, idx) in flyingIngredients"
          :key="`ing-${idx}`"
          class="flying-ingredient absolute"
          :style="{
            left: `${ingredient.x}px`,
            top: `${ingredient.y}px`,
            animationDelay: `${idx * 0.6}s`
          }"
          width="28"
          height="28"
          viewBox="0 0 28 28"
        >
          <!-- Carrot - pastel orange -->
          <g v-if="ingredient.type === 'carrot'">
            <path d="M8 22L14 4L20 22C20 22 17 25 14 25C11 25 8 22 8 22Z" class="fill-peach" />
            <path d="M12 4L14 1L16 4" class="fill-sage" />
          </g>
          <!-- Tomato - soft red -->
          <g v-if="ingredient.type === 'tomato'">
            <circle cx="14" cy="16" r="10" class="fill-rose-200 dark:fill-rose-300/70" />
            <ellipse cx="14" cy="8" rx="4" ry="2" class="fill-sage" />
          </g>
          <!-- Onion - lavender -->
          <g v-if="ingredient.type === 'onion'">
            <ellipse cx="14" cy="16" rx="9" ry="10" class="fill-lavender" />
            <path d="M8 12C8 12 14 8 20 12" stroke="currentColor" stroke-width="0.5" class="text-violet-300/60" />
          </g>
          <!-- Herb/Leaf - sage -->
          <g v-if="ingredient.type === 'herb'">
            <path d="M14 26C14 26 4 18 4 10C4 4 14 0 14 0C14 0 24 4 24 10C24 18 14 26 14 26Z" class="fill-sage" />
            <path d="M14 24V8" stroke="currentColor" stroke-width="1.5" class="text-emerald-400/60" />
          </g>
          <!-- Garlic - cream -->
          <g v-if="ingredient.type === 'garlic'">
            <ellipse cx="14" cy="16" rx="8" ry="8" class="fill-cream" />
            <path d="M14 4L12 10H16L14 4Z" class="fill-stone-200" />
          </g>
          <!-- Pepper - soft coral -->
          <g v-if="ingredient.type === 'pepper'">
            <path d="M7 10C7 10 5 16 9 21C13 26 19 24 21 19C23 14 19 10 19 10C19 10 16 12 14 12C12 12 7 10 7 10Z" class="fill-rose-300/80 dark:fill-rose-400/60" />
            <path d="M12 10L14 5L16 10" class="fill-sage" />
          </g>
        </svg>
      </div>
    </div>

    <!-- Action text - elegant typography -->
    <div class="text-center space-y-3">
      <h3 class="text-xl sm:text-2xl font-light tracking-wide text-black-600 dark:text-stone-300 flex items-center justify-center gap-2">
        <Transition name="fade-verb" mode="out-in">
          <span :key="currentAction" class="action-verb font-medium text-stone-500 dark:text-stone-400">{{ displayCurrentAction }}</span>
        </Transition>
        <span class="cooking-text text-2xl sm:text-3xl font-serif italic text-brandg-500 dark:text-brandg-400">{{ t('recipeWrangler.cookingAnimation.deliciousRecipes') }}</span>
        <span class="dots text-stone-400 dark:text-stone-500">
          <span class="dot">.</span>
          <span class="dot">.</span>
          <span class="dot">.</span>
        </span>
      </h3>
      <Transition name="fade-desc" mode="out-in">
        <p :key="currentAction" class="text-sm font-light tracking-wide">
          {{ actionDescription }}
        </p>
      </Transition>
    </div>

    <!-- Progress dots - subtle -->
    <div class="mt-8 flex gap-2">
      <div
        v-for="(action, idx) in cookingActions"
        :key="action"
        class="w-1.5 h-1.5 rounded-full transition-all duration-500"
        :class="idx === currentActionIndex
          ? 'bg-brandg-400 dark:bg-brandg-500/70 scale-150'
          : 'bg-stone-200 dark:bg-stone-600'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

// Cooking actions to cycle through
const cookingActions = ['stirring', 'frying', 'chopping', 'boiling', 'sauteing', 'simmering'] as const
type CookingAction = typeof cookingActions[number]

const { t } = useI18n()
const currentActionIndex = ref(0)
const currentAction = computed(() => cookingActions[currentActionIndex.value])
const displayCurrentAction = computed(() => t(`recipeWrangler.cookingAnimation.actions.${currentAction.value}`))

const actionDescriptionKeys: Record<CookingAction, string> = {
  stirring: 'recipeWrangler.cookingAnimation.descriptions.stirring',
  frying: 'recipeWrangler.cookingAnimation.descriptions.frying',
  chopping: 'recipeWrangler.cookingAnimation.descriptions.chopping',
  boiling: 'recipeWrangler.cookingAnimation.descriptions.boiling',
  sauteing: 'recipeWrangler.cookingAnimation.descriptions.sauteing',
  simmering: 'recipeWrangler.cookingAnimation.descriptions.simmering'
}

const actionDescription = computed(() => t(actionDescriptionKeys[currentAction.value]))

// Flying ingredients
const flyingIngredients = [
  { type: 'carrot', x: -45, y: -5 },
  { type: 'tomato', x: 75, y: -15 },
  { type: 'onion', x: -35, y: 35 },
  { type: 'herb', x: 85, y: 25 },
  { type: 'garlic', x: -55, y: 15 },
  { type: 'pepper', x: 65, y: -25 }
]

// Mouse tracking for interactive movement
const container = ref<HTMLElement | null>(null)
const rotateX = ref(0)
const rotateY = ref(0)

const vesselStyle = computed(() => ({
  transform: `perspective(800px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`
}))

const handleMouseMove = (event: MouseEvent) => {
  if (!container.value) return

  const rect = container.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const deltaX = (mouseX - centerX) / centerX
  const deltaY = (mouseY - centerY) / centerY

  rotateY.value = deltaX * 8
  rotateX.value = -deltaY * 6
}

const handleMouseLeave = () => {
  rotateX.value = 0
  rotateY.value = 0
}

// Cycle through actions
let actionInterval: ReturnType<typeof setInterval>

onMounted(() => {
  actionInterval = setInterval(() => {
    currentActionIndex.value = (currentActionIndex.value + 1) % cookingActions.length
  }, 3500)
})

onUnmounted(() => {
  clearInterval(actionInterval)
})
</script>

<style scoped>
/* Pastel color fills */
.fill-peach {
  fill: #FFDAB9;
}
.fill-sage {
  fill: #B2D8B2;
}
.fill-lavender {
  fill: #E6E6FA;
}
.fill-cream {
  fill: #FFFDD0;
}

:root.dark .fill-peach {
  fill: rgba(255, 218, 185, 0.6);
}
:root.dark .fill-sage {
  fill: rgba(178, 216, 178, 0.6);
}
:root.dark .fill-lavender {
  fill: rgba(230, 230, 250, 0.5);
}
:root.dark .fill-cream {
  fill: rgba(255, 253, 208, 0.5);
}

/* Steam animation - slower, more elegant */
.steam-particle {
  animation: steam-rise 3s ease-out infinite;
  opacity: 0;
}

@keyframes steam-rise {
  0% {
    transform: translateY(0) scale(0.7);
    opacity: 0;
  }
  15% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(-45px) scale(1) translateX(3px);
    opacity: 0;
  }
}

/* Cooking vessel - gentle float */
.cooking-vessel {
  animation: gentle-float 4s ease-in-out infinite;
}

@keyframes gentle-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Stirring spoon rotation - smoother */
.stirring-spoon {
  transform-origin: 70px 50px;
  animation: stir 2s ease-in-out infinite;
}

@keyframes stir {
  0%, 100% { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
}

/* Frying bubbles - gentle */
.frying-bubble {
  animation: fry-pop 1.2s ease-out infinite;
}

@keyframes fry-pop {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
  50% { transform: translateY(-6px) scale(1.2); opacity: 0.8; }
}

/* Chopping knife - elegant motion */
.chopping-knife {
  transform-origin: 70px 28px;
  animation: chop 0.7s ease-in-out infinite;
}

@keyframes chop {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  50% { transform: rotate(-12deg) translateY(-8px); }
}

/* Boiling bubbles - gentle rise */
.boiling-bubble {
  animation: boil-rise 1.4s ease-out infinite;
}

@keyframes boil-rise {
  0% { transform: translateY(0) scale(1); opacity: 0.6; }
  100% { transform: translateY(-12px) scale(0.6); opacity: 0; }
}

/* Sauteing pieces - graceful */
.saute-piece {
  animation: saute-jump 0.8s ease-in-out infinite;
}

@keyframes saute-jump {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(10deg); }
}

/* Simmering - soft pulse */
.simmer-bubble {
  animation: simmer-pulse 2.5s ease-in-out infinite;
}

@keyframes simmer-pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.3); opacity: 0.6; }
}

/* Flying ingredients - graceful arc */
.flying-ingredient {
  animation: fly-in 4s ease-in-out infinite;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
}

@keyframes fly-in {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg) scale(0.9);
    opacity: 0;
  }
  15% { opacity: 0.9; }
  50% {
    transform: translate(12px, -20px) rotate(120deg) scale(1);
    opacity: 0.9;
  }
  85% { opacity: 0.9; }
}

/* Action verb fade transition */
.action-verb {
  display: inline-block;
}

.fade-verb-enter-active,
.fade-verb-leave-active {
  transition: all 0.4s ease;
}

.fade-verb-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-verb-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Description fade transition */
.fade-desc-enter-active,
.fade-desc-leave-active {
  transition: all 0.3s ease;
}

.fade-desc-enter-from {
  opacity: 0;
}

.fade-desc-leave-to {
  opacity: 0;
}

/* Cooking text - brandg shimmer gradient */
.cooking-text {
  background: linear-gradient(
    90deg,
    var(--color-brandg-500) 0%,
    var(--color-brandg-400) 25%,
    var(--color-brandg-300) 50%,
    var(--color-brandg-400) 75%,
    var(--color-brandg-500) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
}

:root.dark .cooking-text {
  background: linear-gradient(
    90deg,
    var(--color-brandg-600) 0%,
    var(--color-brandg-500) 25%,
    var(--color-brandg-400) 50%,
    var(--color-brandg-500) 75%,
    var(--color-brandg-600) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes shimmer {
  to { background-position: 200% center; }
}

/* Animated dots - gentle */
.dots {
  display: inline-flex;
  gap: 1px;
}

.dot {
  animation: dot-pulse 1.8s ease-in-out infinite;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.3s; }
.dot:nth-child(3) { animation-delay: 0.6s; }

@keyframes dot-pulse {
  0%, 70%, 100% { opacity: 1; }
  35% { opacity: 0.2; }
}
</style>
