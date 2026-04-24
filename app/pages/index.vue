<template>
  <div>
    <section class="hero-shell relative min-h-[78svh] flex items-center overflow-hidden bg-[#2a1e2a] dark:bg-zinc-900 -mt-[var(--ui-header-height)] pt-[calc(var(--ui-header-height)+1rem)]">
      <!-- Flowing grainy gradient background.
           TODO: video reference placeholder — drop an optional looping video
           behind the gradient once assets are delivered:
           <video autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover opacity-30" src="/videos/hero.mp4" />
      -->
      <div class="absolute inset-0 pointer-events-none">
        <!-- Red blob on the right (kept away from the logo in top-left) -->
        <div
          class="gradient-blob blob-anim-a"
          :style="{
            top: '15%', right: '-10%',
            width: '55vw', height: '55vw',
            opacity: 0.55,
            background: 'radial-gradient(circle at 30% 30%, #d53355 0%, rgba(213,51,85,0) 70%)',
            transform: `translate3d(0, ${parallaxY * 0.4}px, 0)`
          }"
        ></div>
        <!-- Green blob bottom-right -->
        <div
          class="gradient-blob blob-anim-b"
          :style="{
            bottom: '-20%', right: '10%',
            width: '55vw', height: '55vw',
            opacity: 0.45,
            background: 'radial-gradient(circle at 70% 40%, #a6b52b 0%, rgba(166,181,43,0) 65%)',
            transform: `translate3d(0, ${parallaxY * 0.25}px, 0)`
          }"
        ></div>
        <!-- Warm terracotta blob bottom-left, away from the logo corner -->
        <div
          class="gradient-blob blob-anim-c"
          :style="{
            bottom: '-30%', left: '-5%',
            width: '65vw', height: '65vw',
            opacity: 0.4,
            background: 'radial-gradient(circle at 50% 50%, #D98A6B 0%, rgba(217,138,107,0) 70%)',
            transform: `translate3d(0, ${parallaxY * 0.15}px, 0)`
          }"
        ></div>

        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#2a1e2a]/60"></div>
        <div class="grain-noise grain-noise-soft"></div>
      </div>

      <div class="relative z-10 w-full px-6 mx-auto max-w-7xl py-20 sm:py-24">
        <div class="max-w-5xl">
          <p class="mb-8 text-xs sm:text-sm tracking-[0.4em] uppercase text-white/60 font-light animate-fade-down">
            <span class="inline-block w-10 h-px bg-white/40 align-middle mr-3"></span>
            {{ t('hero.eyebrow') }}
          </p>

          <h1 class="tracking-tight text-white leading-[0.95]">
            <span class="block font-light text-5xl sm:text-6xl lg:text-7xl xl:text-8xl animate-fade-up animation-delay-200">
              {{ t('hero.titleLead') }}
            </span>
            <span class="block mt-1 sm:mt-2 font-serif italic text-6xl sm:text-7xl lg:text-8xl xl:text-[9rem] whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-brand-300 via-brand-200 to-brandg-200 animate-fade-up animation-delay-300">
              <span ref="typingElement" class="typing-effect"></span>
            </span>
            <span
              v-if="t('hero.titleTrail')"
              class="block mt-2 sm:mt-3 font-light text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white/80 animate-fade-up animation-delay-400"
            >
              {{ t('hero.titleTrail') }}
            </span>
          </h1>

          <p class="mt-8 sm:mt-10 max-w-2xl text-base sm:text-lg text-white/75 font-light leading-relaxed animate-fade-up animation-delay-600">
            {{ t('hero.description') }}
          </p>

          <div class="flex flex-col sm:flex-row items-start sm:items-center mt-10 gap-4 animate-fade-up animation-delay-800">
            <ClientOnly>
              <UButton
                v-if="!auth.isAuthenticated"
                size="xl"
                color="primary"
                variant="solid"
                trailing-icon="i-lucide-arrow-right"
                to="/login"
                class="shadow-xl shadow-brand-500/30 hover:shadow-2xl text-white hover:shadow-brand-500/40 transition-shadow cursor-pointer"
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
                class="shadow-xl shadow-brand-500/30 hover:shadow-2xl text-white hover:shadow-brand-500/40 transition-shadow cursor-pointer"
              >
                Go to Dashboard
              </UButton>
              <UButton
                size="xl"
                variant="ghost"
                leading-icon="i-lucide-play-circle"
                href="https://www.youtube.com/watch?v=lcv4uFopexw"
                target="_blank"
                rel="noopener"
                class="backdrop-blur-sm text-white hover:text-brandg-300 cursor-pointer"
              >
                {{ t('hero.ctaSecondary') }}
              </UButton>
            </ClientOnly>
          </div>
        </div>

        <div class="absolute left-1/2 -translate-x-1/2 bottom-8 sm:bottom-10 flex flex-col items-center gap-2 text-white/50 text-xs tracking-[0.3em] uppercase animate-fade-up animation-delay-800">
          <span>{{ t('hero.scrollHint') }}</span>
          <span class="block w-px h-10 bg-gradient-to-b from-white/50 to-transparent float-soft"></span>
        </div>
      </div>
    </section>

    <!-- ── Pillars: FoodChat / FoodScholar / RecipeWrangler ───────────────── -->
    <section class="relative bg-white dark:bg-zinc-950 overflow-hidden">
      <!-- Grain overlay; per-row color washes live inside each pillar below -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="grain-noise grain-noise-soft"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
        <div class="max-w-3xl mb-16 sm:mb-20 scroll-fade-in">
          <p class="mb-5 text-xs sm:text-sm tracking-[0.4em] uppercase text-brand-600 dark:text-brand-400 font-light">
            <span class="inline-block w-10 h-px bg-brand-500/60 align-middle mr-3"></span>
            {{ t('pillars.eyebrow') }}
          </p>
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-900 dark:text-white leading-[1.05] tracking-tight">
            {{ t('pillars.heading') }}
            <span class="font-serif italic text-brand-500">{{ t('pillars.headingAccent') }}</span>
            {{ t('pillars.headingTrail') }}
          </h2>
          <p class="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
            {{ t('pillars.subheading') }}
          </p>
        </div>

        <div class="space-y-20 sm:space-y-28">
          <div
            v-for="(pillar, index) in pillars"
            :key="pillar.key"
            class="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center scroll-fade-in"
            :style="{ '--delay': `${index * 0.1}s` }"
          >
            <!-- Per-row ambient wash matched to the pillar's app color -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute -z-10 blur-3xl rounded-full"
              :style="{
                top: '50%', left: index % 2 === 1 ? '-15%' : 'auto', right: index % 2 === 1 ? 'auto' : '-15%',
                width: '70%', height: '140%', transform: 'translateY(-50%)',
                opacity: 0.35,
                background: `radial-gradient(circle at center, ${pillar.washColor} 0%, ${pillar.washColor}00 70%)`
              }"
            ></div>

            <!-- Copy -->
            <div
              class="lg:col-span-5"
              :class="index % 2 === 1 ? 'lg:col-start-8 lg:row-start-1' : ''"
            >
              <span
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-5"
                :class="pillar.tagClass"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="pillar.dotClass"></span>
                {{ t(`pillars.items.${pillar.key}.tag`) }}
              </span>
              <h3 class="text-3xl sm:text-4xl lg:text-5xl font-light text-zinc-900 dark:text-white leading-tight tracking-tight mb-5">
                {{ t(`pillars.items.${pillar.key}.title`) }}
              </h3>
              <p class="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-light leading-relaxed mb-6">
                {{ t(`pillars.items.${pillar.key}.description`) }}
              </p>
              <ul class="flex flex-wrap gap-2">
                <li
                  v-for="hl in pillarHighlights(pillar.key)"
                  :key="hl"
                  class="px-3 py-1.5 rounded-full text-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                >
                  {{ hl }}
                </li>
              </ul>
            </div>

            <!-- Visual: faux product mockup hinting at each pillar -->
            <div
              class="lg:col-span-7"
              :class="index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''"
            >
              <div
                class="relative aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br p-6 sm:p-8"
                :class="pillar.visualClass"
              >
                <div class="absolute inset-0 grain-noise grain-noise-soft"></div>

                <!-- FoodChat mockup: stylized chat bubbles (purple accent) -->
                <div v-if="pillar.key === 'foodchat'" class="relative h-full flex flex-col justify-end gap-3">
                  <div class="flex items-start gap-2 max-w-[75%] self-start float-soft">
                    <div class="w-8 h-8 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 shrink-0 flex items-center justify-center">
                      <UIcon name="i-lucide-user" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-100 text-zinc-900 text-sm leading-snug shadow-sm">
                      Plan a high-protein dinner for 4 — no nuts.
                    </div>
                  </div>
                  <div class="flex items-start gap-2 max-w-[90%] self-end w-full">
                    <div class="flex-1 rounded-2xl rounded-tr-sm bg-white dark:bg-zinc-100 text-zinc-900 shadow-sm overflow-hidden">
                      <div class="px-4 pt-3 pb-2 text-sm leading-snug">
                        Here's a balanced plan for tomorrow — high-protein, nut-free.
                      </div>
                      <table class="w-full text-left text-xs border-t border-zinc-200">
                        <thead>
                          <tr class="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
                            <th class="px-3 py-1.5 font-medium">Meal</th>
                            <th class="px-3 py-1.5 font-medium">Dish</th>
                            <th class="px-3 py-1.5 font-medium text-right">kcal</th>
                          </tr>
                        </thead>
                        <tbody class="text-zinc-700">
                          <tr class="border-t border-zinc-100">
                            <td class="px-3 py-1.5 font-medium text-brandp-700">Breakfast</td>
                            <td class="px-3 py-1.5">Greek yogurt · berries</td>
                            <td class="px-3 py-1.5 text-right tabular-nums">320</td>
                          </tr>
                          <tr class="border-t border-zinc-100">
                            <td class="px-3 py-1.5 font-medium text-brandp-700">Lunch</td>
                            <td class="px-3 py-1.5">Chicken quinoa bowl</td>
                            <td class="px-3 py-1.5 text-right tabular-nums">540</td>
                          </tr>
                          <tr class="border-t border-zinc-100">
                            <td class="px-3 py-1.5 font-medium text-brandp-700">Snack</td>
                            <td class="px-3 py-1.5">Hummus · carrot sticks</td>
                            <td class="px-3 py-1.5 text-right tabular-nums">180</td>
                          </tr>
                          <tr class="border-t border-zinc-100">
                            <td class="px-3 py-1.5 font-medium text-brandp-700">Dinner</td>
                            <td class="px-3 py-1.5">Grilled salmon · farro</td>
                            <td class="px-3 py-1.5 text-right tabular-nums">610</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-brandp-100 border border-brandp-200 shrink-0 flex items-center justify-center">
                      <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-brandp-600" />
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-zinc-500 self-end">
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-brandp-500 animate-pulse"></span>
                      typing
                    </span>
                  </div>
                </div>

                <!-- FoodScholar mockup: research-copilot answer card with grounded citations -->
                <div v-else-if="pillar.key === 'foodscholar'" class="relative h-full flex items-center">
                  <div class="w-full max-w-md mx-auto rounded-2xl bg-white dark:bg-zinc-100 p-5 shadow-xl float-soft">
                    <p class="text-xs text-zinc-500 italic leading-snug mb-2">
                      "Is extra-virgin olive oil better than seed oils?"
                    </p>
                    <p class="text-sm leading-snug text-zinc-900 mb-4">
                      EVOO is a primary fat in Mediterranean guidelines<sup class="text-brand-600 font-semibold ml-0.5">1</sup>, linked to lower CVD risk in long-term trials<sup class="text-brand-600 font-semibold ml-0.5">2</sup> — evidence is stronger than for most seed oils<sup class="text-brand-600 font-semibold ml-0.5">3</sup>.
                    </p>
                    <div class="border-t border-dashed border-zinc-200 pt-3">
                      <div class="text-[9px] tracking-[0.2em] uppercase text-zinc-400 font-medium mb-2">Sources</div>
                      <ul class="space-y-1.5">
                        <li class="flex items-center gap-2 text-[11px] text-zinc-700">
                          <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold shrink-0">1</span>
                          <UIcon name="i-lucide-compass" class="w-3 h-3 text-brand-600 shrink-0" />
                          <span class="font-medium text-zinc-800">Guide</span>
                          <span class="text-zinc-500 truncate">· Mediterranean diet</span>
                        </li>
                        <li class="flex items-center gap-2 text-[11px] text-zinc-700">
                          <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold shrink-0">2</span>
                          <UIcon name="i-lucide-file-text" class="w-3 h-3 text-brand-600 shrink-0" />
                          <span class="font-medium text-zinc-800">Article</span>
                          <span class="text-zinc-500 truncate">· PREDIMED trial, NEJM</span>
                        </li>
                        <li class="flex items-center gap-2 text-[11px] text-zinc-700">
                          <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold shrink-0">3</span>
                          <UIcon name="i-lucide-book-marked" class="w-3 h-3 text-brand-600 shrink-0" />
                          <span class="font-medium text-zinc-800">Textbook</span>
                          <span class="text-zinc-500 truncate">· Nutrition Essentials</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- RecipeWrangler mockup: recipe card with macros -->
                <div v-else-if="pillar.key === 'recipewrangler'" class="relative h-full flex items-center">
                  <div class="w-full max-w-sm mx-auto rounded-2xl bg-white dark:bg-zinc-100 p-4 shadow-xl float-soft">
                    <div class="relative h-28 rounded-xl overflow-hidden mb-3 bg-zinc-100">
                      <img
                        src="/recipe_mockup.png"
                        alt=""
                        class="absolute inset-0 w-full h-full object-cover"
                      />
                      <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-medium text-zinc-800">
                        25 min
                      </span>
                    </div>
                    <h4 class="text-base font-medium text-zinc-900 mb-3">
                      Miso-glazed aubergine with rice
                    </h4>
                    <div class="grid grid-cols-3 gap-2 mb-3">
                      <div class="rounded-lg bg-zinc-50 border border-zinc-200 px-2 py-1.5 text-center">
                        <div class="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Protein</div>
                        <div class="text-sm font-semibold text-zinc-900">18g</div>
                      </div>
                      <div class="rounded-lg bg-zinc-50 border border-zinc-200 px-2 py-1.5 text-center">
                        <div class="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Carbs</div>
                        <div class="text-sm font-semibold text-zinc-900">54g</div>
                      </div>
                      <div class="rounded-lg bg-zinc-50 border border-zinc-200 px-2 py-1.5 text-center">
                        <div class="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Fat</div>
                        <div class="text-sm font-semibold text-zinc-900">11g</div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-zinc-500">
                      <span class="inline-flex items-center gap-1">
                        <UIcon name="i-lucide-leaf" class="w-3 h-3 text-brandg-600" />
                        Low impact
                      </span>
                      <span class="inline-flex items-center gap-1 text-brandg-700 font-medium">
                        Compare
                        <UIcon name="i-lucide-arrow-right" class="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>

                <div class="absolute top-5 left-6 right-6 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-zinc-500 dark:text-zinc-400 font-medium">
                  <span>{{ t(`pillars.items.${pillar.key}.tag`) }}</span>
                  <span>0{{ index + 1 }} / 03</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Manifesto: editorial "Why WiseFood" band ──────────────────────── -->
    <section class="relative overflow-hidden bg-[#1c1418] dark:bg-zinc-950 text-white">
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="gradient-blob blob-anim-a"
          :style="{
            top: '-20%', left: '-10%',
            width: '60vw', height: '60vw',
            opacity: 0.35,
            background: 'radial-gradient(circle at 40% 40%, #733c95 0%, rgba(115,60,149,0) 70%)'
          }"
        ></div>
        <div
          class="gradient-blob blob-anim-b"
          :style="{
            bottom: '-25%', right: '-10%',
            width: '55vw', height: '55vw',
            opacity: 0.3,
            background: 'radial-gradient(circle at 60% 50%, #D98A6B 0%, rgba(217,138,107,0) 70%)'
          }"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"></div>
        <div class="grain-noise grain-noise-soft"></div>
      </div>

      <div class="relative max-w-6xl mx-auto px-6 py-28 sm:py-36">
        <div class="max-w-4xl mx-auto text-center scroll-fade-in">
          <p class="mb-8 text-xs sm:text-sm tracking-[0.4em] uppercase text-white/60 font-light">
            <span class="inline-block w-10 h-px bg-white/40 align-middle mr-3"></span>
            {{ t('manifesto.eyebrow') }}
            <span class="inline-block w-10 h-px bg-white/40 align-middle ml-3"></span>
          </p>
          <h2 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light leading-[1.05] tracking-tight text-white">
            {{ t('manifesto.heading') }}
            <span class="block mt-2 font-serif italic bg-clip-text text-transparent bg-gradient-to-r from-brand-300 via-brand-200 to-brandg-200">
              {{ t('manifesto.headingAccent') }}
            </span>
          </h2>
          <p class="mt-10 max-w-2xl mx-auto text-lg sm:text-xl text-white/75 font-light leading-relaxed">
            {{ t('manifesto.body') }}
          </p>
        </div>

        <div class="mt-20 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          <div
            v-for="(point, index) in manifestoPoints"
            :key="point.key"
            class="scroll-fade-in text-center md:text-left"
            :style="{ '--delay': `${index * 0.12}s` }"
          >
            <div class="flex md:justify-start justify-center mb-5">
              <div class="w-11 h-11 rounded-full bg-white/5 border border-white/15 backdrop-blur-sm flex items-center justify-center">
                <UIcon :name="point.icon" class="w-5 h-5 text-white/80" />
              </div>
            </div>
            <h3 class="text-xl sm:text-2xl font-light text-white mb-3 tracking-tight">
              <span class="font-serif italic text-white/50 mr-2">0{{ index + 1 }}</span>
              {{ t(`manifesto.points.${point.key}.title`) }}
            </h3>
            <p class="text-base text-white/65 font-light leading-relaxed">
              {{ t(`manifesto.points.${point.key}.description`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Steps: three moves to getting set up ──────────────────────────── -->
    <section class="relative overflow-hidden bg-[#F6EFE6] dark:bg-zinc-950">
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="gradient-blob"
          :style="{
            top: '-10%', right: '-15%',
            width: '45vw', height: '45vw',
            opacity: 0.22,
            background: 'radial-gradient(circle, #D98A6B 0%, rgba(217,138,107,0) 70%)'
          }"
        ></div>
        <div
          class="gradient-blob"
          :style="{
            bottom: '-15%', left: '-10%',
            width: '45vw', height: '45vw',
            opacity: 0.18,
            background: 'radial-gradient(circle, #a6b52b 0%, rgba(166,181,43,0) 70%)'
          }"
        ></div>
        <div class="grain-noise grain-noise-soft"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
        <div class="max-w-3xl mb-16 sm:mb-20 scroll-fade-in">
          <p class="mb-5 text-xs sm:text-sm tracking-[0.4em] uppercase text-brandg-700 dark:text-brandg-400 font-light">
            <span class="inline-block w-10 h-px bg-brandg-600/60 align-middle mr-3"></span>
            {{ t('steps.eyebrow') }}
          </p>
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-900 dark:text-white leading-[1.05] tracking-tight">
            {{ t('steps.heading') }}
            <span class="font-serif italic text-brandg-600">{{ t('steps.headingAccent') }}</span>
          </h2>
          <p class="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
            {{ t('steps.subheading') }}
          </p>
        </div>

        <div class="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <!-- Dotted connector line across md+ -->
          <div class="hidden md:block absolute top-10 left-[16%] right-[16%] h-px border-t border-dashed border-zinc-400/40 dark:border-zinc-700"></div>

          <div
            v-for="(step, index) in steps"
            :key="step.key"
            class="scroll-fade-in relative"
            :style="{ '--delay': `${index * 0.12}s` }"
          >
            <div class="relative flex items-center justify-center md:justify-start gap-4 mb-6">
              <div class="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <span class="font-serif italic text-5xl text-brandg-600 dark:text-brandg-400 leading-none">
                  {{ index + 1 }}
                </span>
              </div>
            </div>
            <h3 class="text-xl sm:text-2xl font-light text-zinc-900 dark:text-white leading-tight tracking-tight mb-3 text-center md:text-left">
              {{ t(`steps.items.${step.key}.title`) }}
            </h3>
            <p class="text-base text-zinc-600 dark:text-zinc-400 font-light leading-relaxed text-center md:text-left">
              {{ t(`steps.items.${step.key}.description`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Final CTA: dark plum full-bleed band ──────────────────────────── -->
    <section class="relative overflow-hidden bg-[#2a1e2a] text-white">
      <!-- TODO: video reference placeholder — drop in a short looping b-roll
           behind the CTA once assets are delivered:
           <video autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover opacity-20" src="/videos/cta.mp4" />
      -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="gradient-blob blob-anim-a"
          :style="{
            top: '-15%', left: '-10%',
            width: '55vw', height: '55vw',
            opacity: 0.45,
            background: 'radial-gradient(circle at 40% 40%, #d53355 0%, rgba(213,51,85,0) 70%)'
          }"
        ></div>
        <div
          class="gradient-blob blob-anim-c"
          :style="{
            bottom: '-25%', right: '-10%',
            width: '55vw', height: '55vw',
            opacity: 0.35,
            background: 'radial-gradient(circle at 60% 50%, #a6b52b 0%, rgba(166,181,43,0) 70%)'
          }"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
        <div class="grain-noise grain-noise-soft"></div>
      </div>

      <div class="relative max-w-5xl mx-auto px-6 py-28 sm:py-36 text-center">
        <div class="scroll-fade-in">
          <h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.05] tracking-tight text-white">
            {{ t('cta.heading') }}
            <span class="block mt-3 font-serif italic bg-clip-text text-transparent bg-gradient-to-r from-brand-300 via-brand-200 to-brandg-200">
              {{ t('cta.accent') }}
            </span>
          </h2>
          <p class="mt-8 max-w-xl mx-auto text-lg text-white/75 font-light leading-relaxed">
            {{ t('cta.description') }}
          </p>

          <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <UButton
              size="xl"
              color="primary"
              variant="solid"
              trailing-icon="i-lucide-arrow-right"
              to="/login"
              class="shadow-xl shadow-brand-500/30 hover:shadow-2xl text-white hover:shadow-brand-500/40 transition-shadow cursor-pointer"
            >
              {{ t('cta.primary') }}
            </UButton>
            <UButton
              size="xl"
              variant="ghost"
              leading-icon="i-lucide-play-circle"
              href="https://www.youtube.com/watch?v=lcv4uFopexw"
              target="_blank"
              rel="noopener"
              class="text-white hover:text-brandg-300 cursor-pointer"
            >
              {{ t('cta.secondary') }}
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useHouseholdStore } from '@/stores/household'

const { t, tm } = useI18n()
const auth = useAuthStore()
const householdStore = useHouseholdStore()
const router = useRouter()

definePageMeta({
  layout: 'default',
  auth: false
})

useHead({
  titleTemplate: '',  // Override the template for homepage
  title: 'WiseFood - Your Personalized Nutrition Journey'
})

useSeoMeta({
  description: 'Transform your relationship with food through science-backed insights and AI-powered recommendations.'
})

const steps = [
  { key: 'profile' },
  { key: 'recommendations' },
  { key: 'track' }
]

const manifestoPoints = [
  { key: 'one', icon: 'i-lucide-microscope' },
  { key: 'two', icon: 'i-lucide-users-round' },
  { key: 'three', icon: 'i-lucide-shield-check' }
]

const pillarHighlights = (key: string): string[] =>
  (tm(`pillars.items.${key}.highlights`) as unknown as string[]) ?? []

const pillars = [
  {
    key: 'foodscholar',
    icon: 'i-lucide-book-open-text',
    tagClass: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900',
    dotClass: 'bg-brand-500',
    visualClass: 'from-zinc-50 to-brand-50/50 dark:from-zinc-900 dark:to-brand-950/30',
    washColor: '#d53355'
  },
  {
    key: 'recipewrangler',
    icon: 'i-lucide-chef-hat',
    tagClass: 'bg-brandg-50 dark:bg-brandg-950/40 text-brandg-700 dark:text-brandg-300 border border-brandg-200 dark:border-brandg-900',
    dotClass: 'bg-brandg-500',
    visualClass: 'from-zinc-50 to-brandg-50/50 dark:from-zinc-900 dark:to-brandg-950/30',
    washColor: '#a6b52b'
  },
  {
    key: 'foodchat',
    icon: 'i-lucide-message-circle',
    tagClass: 'bg-brandp-50 dark:bg-brandp-950/40 text-brandp-700 dark:text-brandp-300 border border-brandp-200 dark:border-brandp-900',
    dotClass: 'bg-brandp-500',
    visualClass: 'from-zinc-50 to-brandp-50/50 dark:from-zinc-900 dark:to-brandp-950/30',
    washColor: '#733c95'
  }
]

// Typing effect
const typingElement = ref<HTMLElement | null>(null)
const typingText = computed(() => t('hero.titleAccent'))

// Hero parallax — cheap scroll-linked transform for gradient blobs
const parallaxY = ref(0)
const onScroll = () => {
  parallaxY.value = window.scrollY
}

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

function setupScrollObserver() {
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
}

onMounted(async () => {
  // Start animations immediately — they're visible in SSR content
  await nextTick()
  runTypingEffect(typingText.value)
  setupScrollObserver()
  window.addEventListener('scroll', onScroll, { passive: true })

  // Check auth and redirect authenticated users
  if (!auth.initialized) {
    await auth.initialize()
  }

  if (auth.isAuthenticated) {
    if (!householdStore.initialized) {
      await householdStore.initialize()
    }

    if (householdStore.currentMember) {
      router.push('/dashboard')
    } else {
      router.push('/profiles')
    }
  }
})

watch(typingText, (newText) => {
  runTypingEffect(newText)
})

onUnmounted(() => {
  if (typingTimeout) clearTimeout(typingTimeout)
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
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