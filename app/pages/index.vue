<template>
  <div>
    <div class="relative pt-48 pb-12 xl:pt-60 sm:pb-16 lg:pb-32 xl:pb-48 2xl:pb-56 overflow-hidden">
      <div class="absolute inset-0">
        <img 
          class="absolute inset-0 w-full h-full object-cover opacity-70" 
          src="/hero.png" 
          alt="Hero background" 
        />
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70"></div>
      </div>

      <div class="relative z-10 px-6 mx-auto max-w-6xl">
        <div class="text-center">
          <p class="mb-6 text-sm sm:text-base tracking-[0.3em] uppercase text-white/60 font-light animate-fade-down">
            {{ t('hero.eyebrow') }}
          </p>
          
          <h1 class="tracking-tight text-white">
            <span class="block font-light text-5xl sm:text-6xl lg:text-7xl xl:text-8xl animate-fade-up animation-delay-200">
              {{ t('hero.titleLead') }}
            </span>
            <span class="block mt-2 sm:mt-4 font-serif italic text-6xl sm:text-7xl lg:text-8xl xl:text-9xl animate-fade-up animation-delay-300">
              <span ref="typingElement" class="typing-effect"></span>
            </span>
          </h1>
          
          <p class="mt-8 sm:mt-10 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-white/70 font-light leading-relaxed animate-fade-up animation-delay-600">
            {{ t('hero.description') }}
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center mt-10 sm:mt-12 gap-4 animate-fade-up animation-delay-800">
              <ClientOnly>
            <UButton
              v-if="!auth.isAuthenticated"
              size="xl"
              color="primary"
              variant="solid"
              trailing-icon="i-lucide-arrow-right"
              to="/login"
              class="shadow-xl shadow-brand-500/20 hover:shadow-2xl text-white hover:shadow-brand-500/30 transition-shadow cursor-pointer"
            >
              {{ t('hero.ctaPrimary') }}
            </UButton>
            <UButton
              v-else
              size="xl"
              color="primary"
              variant="solid"
              trailing-icon="i-lucide-arrow-right"
              to="/dashboard"
              class="shadow-xl shadow-brand-500/20 hover:shadow-2xl text-white hover:shadow-brand-500/30 transition-shadow cursor-pointer"
            >
              Go to Dashboard
            </UButton>
            <UButton
              size="xl"
              variant="ghost"
              leading-icon="i-lucide-play-circle"
              class="backdrop-blur-sm text-brandg-500 cursor-pointer"
            >
              {{ t('hero.ctaSecondary') }}
            </UButton>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>

    <UPageSection id="features">
      <div class="text-center mb-6 sm:mb-10 scroll-fade-in">
        <h2 class="text-6xl sm:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white tracking-tight">
          {{ t('features.heading') }} <span class="text-brand-500 text-5xl sm:text-6xl lg:text-7xl font-serif italic">{{ t('features.headingAccent') }}</span>
        </h2>
        <p class="mt-6 max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-light">
          {{ t('features.subheading') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div 
          v-for="(feature, index) in features" 
          :key="feature.key"
          class="scroll-fade-in"
          :style="{ '--delay': `${index * 0.1}s` }"
        >
          <div class="feature-card group h-full p-8 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/5">
            <div class="w-12 h-12 mb-6 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center border border-brand-200 dark:border-brand-800 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-200 dark:group-hover:bg-brand-800/50">
              <UIcon :name="feature.icon" class="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            
            <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-3 tracking-tight">
              {{ t(`features.items.${feature.key}.title`) }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
              {{ t(`features.items.${feature.key}.description`) }}
            </p>
            
            <div class="mt-6 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </div>
        </div>
      </div>
    </UPageSection>

    <UPageSection>
      <div class="text-center sm:mb-6 scroll-fade-in">
        <h2 class="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white tracking-tight">
          {{ t('steps.heading') }} <span class="text-brandg-500 text-5xl sm:text-6xl lg:text-7xl font-serif italic">{{ t('steps.headingAccent') }}</span>
        </h2>
        <p class="mt-6 max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-light">
          {{ t('steps.subheading') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
        <div 
          v-for="(step, index) in steps" 
          :key="step.key"
          class="scroll-fade-in text-center"
          :style="{ '--delay': `${index * 0.15}s` }"
        >
          <div class="relative inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-brandg-100 dark:bg-zinc-900/50 border border-brandg-200 dark:border-brandg-800 text-brandg-600 dark:text-brandg-400 text-4xl font-serif font-semibold">
            {{ index + 1 }}
          </div>
          <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-3">
            {{ t(`steps.items.${step.key}.title`) }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            {{ t(`steps.items.${step.key}.description`) }}
          </p>
        </div>
      </div>
    </UPageSection>

    <UPageSection class="relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl"></div>
      </div>

      <div class="scroll-fade-in relative max-w-3xl mx-auto text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-6">
          {{ t('cta.heading') }}
          <span class="block mt-2 text-brand-500 text-5xl sm:text-6xl lg:text-7xl font-serif italic">{{ t('cta.accent') }}</span>
        </h2>
        <p class="max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-light mb-10">
          {{ t('cta.description') }}
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton
            size="xl"
            color="primary"
            variant="solid"
            trailing-icon="i-lucide-arrow-right"
            class="shadow-xl shadow-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/30 transition-shadow cursor-pointer"
          >
            {{ t('cta.primary') }}
          </UButton>
        </div>
      </div>
    </UPageSection>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()

definePageMeta({
  layout: 'default',
  auth: false
})

const features = [
  { key: 'scientific', icon: 'i-lucide-microscope' },
  { key: 'personalized', icon: 'i-lucide-fingerprint' },
  { key: 'culinary', icon: 'i-lucide-chef-hat' },
  { key: 'ai', icon: 'i-lucide-sparkles' },
  { key: 'planning', icon: 'i-lucide-notepad-text' },
  { key: 'progress', icon: 'i-lucide-trending-up' }
]

const steps = [
  { key: 'profile' },
  { key: 'recommendations' },
  { key: 'track' }
]

// Typing effect
const typingElement = ref<HTMLElement | null>(null)
const typingText = computed(() => t('hero.titleAccent'))

let observer: IntersectionObserver | null = null
let typingTimeout: ReturnType<typeof setTimeout> | null = null

const runTypingEffect = (text: string) => {
  if (!typingElement.value) return

  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }

  typingElement.value.textContent = ''
  let i = 0

  const type = () => {
    if (!typingElement.value) return
    if (i < text.length) {
      typingElement.value.textContent += text.charAt(i)
      i++
      typingTimeout = setTimeout(type, 80)
    }
  }

  typingTimeout = setTimeout(type, 200)
}

onMounted(async () => {
  await auth.initialize()
  runTypingEffect(typingText.value)

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, observerOptions)

  document.querySelectorAll('.scroll-fade-in').forEach((el) => {
    observer?.observe(el)
  })
})


watch(typingText, (newText) => {
  runTypingEffect(newText)
})

onUnmounted(() => {
  if (typingTimeout) clearTimeout(typingTimeout)
  observer?.disconnect()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-up { animation: fade-up 1s ease-out forwards; opacity: 0; }
.animate-fade-down { animation: fade-down 0.8s ease-out forwards; opacity: 0; }

.animation-delay-200 { animation-delay: 0.2s; }
.animation-delay-300 { animation-delay: 0.3s; }
.animation-delay-400 { animation-delay: 0.4s; }
.animation-delay-600 { animation-delay: 0.6s; }
.animation-delay-800 { animation-delay: 0.8s; }

.scroll-fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  transition-delay: var(--delay, 0s);
}

.scroll-fade-in.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.typing-effect::after {
  content: '|';
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  font-weight: 100;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

html { scroll-behavior: smooth; }
</style>
