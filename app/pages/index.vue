<template>
<div>
  <div class="relative pt-48 pb-12 xl:pt-60 sm:pb-16 lg:pb-32 xl:pb-48 2xl:pb-56 overflow-hidden">
     <div class="absolute inset-0">
        <img 
          class="absolute inset-0 w-full h-full object-cover opacity-70" 
          src="/hero.png" 
          alt="Hero background" 
        />
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70"></div>
      </div>

    <div class="relative z-10 px-6 mx-auto max-w-6xl">
        <div class="text-center">
          <!-- Eyebrow text -->
          <p class="mb-6 text-sm sm:text-base tracking-[0.3em] uppercase text-white/60 font-light animate-fade-down">
            Nutrition · Sustainability · Wellness
          </p>
          
          <h1 class="tracking-tight text-white">
            <span class="block font-light text-5xl sm:text-6xl lg:text-7xl xl:text-8xl animate-fade-up animation-delay-200">
              Empowered Citizens
            </span>
            <span class="block mt-2 sm:mt-4 font-serif italic text-6xl sm:text-7xl lg:text-8xl xl:text-9xl animate-fade-up animation-delay-300">
              <span ref="typingElement" class="typing-effect"></span>
            </span>
          </h1>
          
          <p class="mt-8 sm:mt-10 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-white/70 font-light leading-relaxed animate-fade-up animation-delay-600">
            Transform your food choices with smart, AI-powered tools towards healthier and more sustainable living.
          </p>
          
          <!-- CTA Buttons using Nuxt UI with brand colors -->
          <div class="flex flex-col sm:flex-row items-center justify-center mt-10 sm:mt-12 gap-4 animate-fade-up animation-delay-800">
            <UButton
              size="xl"
              color="primary"
              variant="solid"
              trailing-icon="i-lucide-arrow-right"
              class="shadow-xl shadow-brand-500/20 hover:shadow-2xl text-white hover:shadow-brand-500/30 transition-shadow cursor-pointer"
            >
              Get Started
            </UButton>
            <UButton
              size="xl"
              variant="ghost"
              leading-icon="i-lucide-play-circle"
              class="backdrop-blur-sm text-brandg-500 cursor-pointer"
            >
              Watch Demo
            </UButton>
          </div>
        </div>
      </div>
  </div>


     <UPageSection id="features">
      <div class="text-center mb-6 sm:mb-10 scroll-fade-in">
        <h2 class="text-6xl sm:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white tracking-tight">
          Built for <span class="text-brand-500 text-5xl sm:text-6xl lg:text-7xl  font-serif italic">humans</span>
        </h2>
        <p class="mt-6 max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-light">
          Discover the powerful features that make WiseFood the ultimate nutritional companion.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div 
          v-for="(feature, index) in features" 
          :key="feature.title"
          class="scroll-fade-in"
          :style="{ '--delay': `${index * 0.1}s` }"
        >
          <div class="feature-card group h-full p-8 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/5">
            <!-- Icon -->
            <div class="w-12 h-12 mb-6 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center border border-brand-200 dark:border-brand-800 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-200 dark:group-hover:bg-brand-800/50">
              <UIcon :name="feature.icon" class="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            
            <!-- Content -->
            <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-3 tracking-tight">
              {{ feature.title }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
              {{ feature.description }}
            </p>
            
            <!-- Hover accent line -->
            <div class="mt-6 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </div>
        </div>
      </div>
    </UPageSection>

     <UPageSection>
        <div class="text-center sm:mb-6 scroll-fade-in">
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white tracking-tight">
            Simple <span class="text-brandg-500 text-5xl sm:text-6xl lg:text-7xl  font-serif italic">steps</span>
          </h2>
          <p class="mt-6 max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-light">
            Get started in minutes and transform your relationship with food.
          </p>
        </div>
 

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
        <div 
          v-for="(step, index) in steps" 
          :key="step.title"
          class="scroll-fade-in text-center"
          :style="{ '--delay': `${index * 0.15}s` }"
        >
          <div class="relative inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-brandg-100 dark:bg-zinc-900/50 border border-brandg-200 dark:border-brandg-800 text-brandg-600 dark:text-brandg-400 text-4xl font-serif font-semibold">
            {{ index + 1 }}
          </div>
          <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-3">
            {{ step.title }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            {{ step.description }}
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
          Ready to transform your
          <span class="block mt-2 text-brand-500 text-5xl sm:text-6xl lg:text-7xl  font-serif italic">relationship with food?</span>
        </h2>
        <p class="max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-light mb-10">
          Join a community of users building healthier habits with WiseFood. Start your journey today and discover a smarter way to nourish your body.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton
            size="xl"
            color="primary"
            cursor="pointer"
            variant="solid"
            trailing-icon="i-lucide-arrow-right"
            class="shadow-xl shadow-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/30 transition-shadow cursor-pointer"
          >
            Start Today
          </UButton>
        </div>
      </div>
    </UPageSection>

  </div>
</template>


  
<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Features data with balanced, equally-spaced descriptions
const features = ref([
  {
    icon: 'i-lucide-microscope',
    title: 'Scientific Knowledge',
    description: 'Access cutting-edge nutrition research made simple. We translate complex scientific studies into clear, actionable insights.'
  },
  {
    icon: 'i-lucide-fingerprint',
    title: 'Personalized For You',
    description: 'Every recommendation adapts to your unique profile. Your dietary preferences, allergies, and goals shape all suggestions.'
  },
  {
    icon: 'i-lucide-chef-hat',
    title: 'Culinary Inspiration',
    description: 'Discover recipes matching your taste and health goals. From quick weeknight meals to gourmet dishes, find new favorites.'
  },
  {
    icon: 'i-lucide-sparkles',
    title: 'AI-Powered Insights',
    description: 'Smart algorithms analyze your eating habits continuously. Get proactive suggestions to make better food choices daily.'
  },
  {
    icon: 'i-lucide-notepad-text',
    title: 'Meal Planning',
    description: 'Cooking for all household members has never been made easier. Receive meal plans suggestions that keep everyone happy.'
  },
  {
    icon: 'i-lucide-trending-up',
    title: 'Track Your Progress',
    description: 'Beautiful dashboards visualize your health journey clearly. Celebrate milestones and stay motivated with smart tracking.'
  }
])

// Steps data with balanced descriptions
const steps = ref([
  {
    title: 'Create Your Profile',
    description: 'Share your dietary preferences, health goals, and any restrictions. Getting started takes just a couple of minutes.'
  },
  {
    title: 'Get Recommendations',
    description: 'Our AI analyzes your profile instantly and delivers personalized meal plans, recipes, and nutritional guidance.'
  },
  {
    title: 'Track & Improve',
    description: 'Log your meals and monitor your progress over time. Watch as our system learns and adapts to serve you better.'
  }
])

// Typing effect
const typingElement = ref<HTMLElement | null>(null)
const typingText = 'Healthier Communities'

// Intersection Observer for scroll animations
let observer: IntersectionObserver | null = null

onMounted(() => {
  // Typing effect
  if (typingElement.value) {
    let i = 0
    const type = () => {
      if (typingElement.value && i < typingText.length) {
        typingElement.value.textContent += typingText.charAt(i)
        i++
        setTimeout(type, 80)
      }
    }
    setTimeout(type, 1000)
  }

  // Scroll fade-in observer
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

  // Parallax effect
  const handleScroll = () => {
    const scrolled = window.scrollY
    const parallaxElement = document.querySelector('.hero-parallax') as HTMLElement
    if (parallaxElement && scrolled < window.innerHeight) {
      parallaxElement.style.transform = `scale(1.1) translateY(${scrolled * 0.3}px)`
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    observer?.disconnect()
  })
})
</script>

<style>
/* Import elegant serif font for accent text */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

/* Font family for serif accent text */
.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* Hero gradient text using brand colors */
.hero-gradient-text {
  background: linear-gradient(135deg, #ffffff 0%, #f7d6dd 40%, #ee9db0 70%, #dd5c77 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Hero animations */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 1s ease-out forwards;
  opacity: 0;
}

.animate-fade-down {
  animation: fade-down 0.8s ease-out forwards;
  opacity: 0;
}

/* Animation delays */
.animation-delay-200 { animation-delay: 0.2s; }
.animation-delay-400 { animation-delay: 0.4s; }
.animation-delay-600 { animation-delay: 0.6s; }
.animation-delay-800 { animation-delay: 0.8s; }

/* Scroll indicator animations */
@keyframes bounce-slow {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}

@keyframes scroll-down {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(8px); }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.animate-scroll-down {
  animation: scroll-down 1.5s ease-in-out infinite;
}


@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(20px, 30px) scale(1.02); }
}

/* Scroll fade-in effect */
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

/* Hero parallax */
.hero-parallax {
  transition: transform 0.1s linear;
  will-change: transform;
}

/* Typing cursor effect */
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

/* Hide floating orbs on mobile for performance */
@media (max-width: 640px) {
  .floating-orb {
    display: none;
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>