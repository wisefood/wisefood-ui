<template>
  <div>
    <div class="relative pt-48 pb-12 xl:pt-60 sm:pb-16 lg:pb-32 overflow-hidden">
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
            Feature Showcase
          </p>

          <h1 class="tracking-tight text-white">
            <span class="block font-light text-5xl sm:text-6xl lg:text-7xl xl:text-8xl animate-fade-up animation-delay-200">
              Experience
            </span>
            <span class="block mt-2 sm:mt-4 font-serif italic text-6xl sm:text-7xl lg:text-8xl xl:text-9xl animate-fade-up animation-delay-300">
              WiseFood
            </span>
          </h1>

          <p class="mt-8 sm:mt-10 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-white/70 font-light leading-relaxed animate-fade-up animation-delay-600">
            Discover how our platform transforms your nutrition journey through intelligent insights and personalized guidance
          </p>
        </div>
      </div>
    </div>

    <UPageSection>
      <div
        class="scroll-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        :style="{ '--delay': '0s' }"
      >
        <div class="order-2 lg:order-1">
          <div class="aspect-video rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
            <div class="w-full h-full flex items-center justify-center">
              <UIcon name="i-lucide-play-circle" class="w-16 h-16 text-brand-500" />
            </div>
          </div>
        </div>

        <div class="order-1 lg:order-2">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
            Personalized
            <span class="block mt-2 text-brand-500 text-4xl sm:text-5xl lg:text-6xl font-serif italic">
              Meal Plans
            </span>
          </h2>
          <p class="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            Our AI-powered system creates customized meal plans tailored to your unique nutritional needs, preferences, and health goals. Experience the perfect balance of science and culinary excellence in every recommendation.
          </p>
        </div>
      </div>
    </UPageSection>

    <UPageSection>
      <div
        class="scroll-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        :style="{ '--delay': '0.1s' }"
      >
        <div class="order-1">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
            Track Your
            <span class="block mt-2 text-brand-500 text-4xl sm:text-5xl lg:text-6xl font-serif italic">
              Progress
            </span>
          </h2>
          <p class="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            Monitor your nutritional journey with detailed analytics and insights. Visualize your progress over time and celebrate every milestone as you work towards your health objectives with data-driven precision.
          </p>
        </div>

        <div class="order-2">
          <div class="aspect-video rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
            <div class="w-full h-full flex items-center justify-center">
              <UIcon name="i-lucide-play-circle" class="w-16 h-16 text-brand-500" />
            </div>
          </div>
        </div>
      </div>
    </UPageSection>

    <UPageSection>
      <div
        class="scroll-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        :style="{ '--delay': '0.2s' }"
      >
        <div class="order-2 lg:order-1">
          <div class="aspect-video rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
            <div class="w-full h-full flex items-center justify-center">
              <UIcon name="i-lucide-play-circle" class="w-16 h-16 text-brand-500" />
            </div>
          </div>
        </div>

        <div class="order-1 lg:order-2">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
            Expert
            <span class="block mt-2 text-brand-500 text-4xl sm:text-5xl lg:text-6xl font-serif italic">
              Guidance
            </span>
          </h2>
          <p class="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            Access professional nutritional advice backed by the latest scientific research. Our platform combines cutting-edge technology with evidence-based practices to guide you towards optimal health and wellness.
          </p>
        </div>
      </div>
    </UPageSection>

    <UPageSection class="relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl"></div>
      </div>

      <div class="scroll-fade-in relative max-w-3xl mx-auto text-center" :style="{ '--delay': '0.3s' }">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-6">
          Ready to Transform
          <span class="block mt-2 text-brand-500 text-5xl sm:text-6xl lg:text-7xl font-serif italic">Your Journey?</span>
        </h2>
        <p class="max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-light mb-10">
          Join thousands of users who have already discovered a smarter way to achieve their nutrition goals
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton
            size="xl"
            color="primary"
            variant="solid"
            trailing-icon="i-lucide-arrow-right"
            to="/login"
            class="shadow-xl shadow-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/30 transition-shadow cursor-pointer"
          >
            Get Started
          </UButton>
        </div>
      </div>
    </UPageSection>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue'

definePageMeta({
  layout: 'default',
  auth: false
})

let observer: IntersectionObserver | null = null

onMounted(() => {
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

onUnmounted(() => {
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

html { scroll-behavior: smooth; }
</style>
