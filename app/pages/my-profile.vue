<!-- Member Profile Management Page -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <main class="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
      <!-- Back button -->
      <div class="mb-6">
        <UButton
          variant="ghost"
          color="gray"
          icon="i-lucide-arrow-left"
          to="/dashboard"
        >
          {{ t('myProfile.actions.backToDashboard') }}
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <UIcon name="i-lucide-loader-2" class="h-12 w-12 animate-spin mx-auto mb-4 text-brand-500" />
          <p class="text-gray-600 dark:text-gray-400">{{ t('myProfile.loading') }}</p>
        </div>
      </div>

      <!-- No Profile Selected -->
      <UCard v-else-if="!currentMember" class="text-center">
        <div class="py-8">
          <UIcon name="i-lucide-user-x" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ t('myProfile.emptyState.noProfileSelected') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('myProfile.emptyState.selectProfileToManage') }}
          </p>
          <UButton color="primary" to="/profiles">
            {{ t('myProfile.actions.goToProfiles') }}
          </UButton>
        </div>
      </UCard>

      <!-- Profile Content -->
      <div v-else class="space-y-6">
        <!-- Header Section -->
        <div class="text-center mb-8">
          <div class="relative inline-block">
            <ProfileAvatar
              v-if="memberAvatarConfig"
              :avatar="memberAvatarConfig"
              size="xl"
              class="w-28 h-28 mx-auto"
            />
            <div
              v-else
              class="w-28 h-28 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto"
            >
              <span class="text-4xl font-semibold text-white">
                {{ currentMember.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <button
              class="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              @click="showAvatarEditor = true"
            >
              <UIcon name="i-lucide-pencil" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <h1 class="text-3xl font-light text-gray-900 dark:text-white mt-4">
            {{ currentMember.name }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {{ ageGroupLabel }}
          </p>
        </div>

        <!-- Profile Details Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.sections.profileDetails') }}</h2>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-pencil"
                size="sm"
                @click="showEditDetails = true"
              >
                {{ t('myProfile.actions.edit') }}
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
              <span class="text-gray-600 dark:text-gray-400">{{ t('myProfile.fields.name') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ currentMember.name }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
              <span class="text-gray-600 dark:text-gray-400">{{ t('myProfile.fields.ageGroup') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ ageGroupLabel }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
              <span class="text-gray-600 dark:text-gray-400">{{ t('myProfile.fields.gender') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ genderLabel }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-gray-600 dark:text-gray-400">{{ t('myProfile.fields.memberSince') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ memberSince }}</span>
            </div>
          </div>
        </UCard>

        <!-- Dietary Preferences Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-salad" class="w-5 h-5 text-green-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.sections.dietaryPreferences') }}</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="showAddDiet = true"
              >
                {{ t('myProfile.actions.add') }}
              </UButton>
            </div>
          </template>

          <div v-if="currentDietaryGroups.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-utensils-crossed" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('myProfile.emptyState.noDietaryPreferences') }}</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="showAddDiet = true"
            >
              {{ t('myProfile.emptyState.addFirstPreference') }}
            </UButton>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="diet in currentDietaryGroups"
              :key="diet"
              class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UIcon :name="getDietIcon(diet)" class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ getDietLabel(diet) }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ getDietDescription(diet) }}</p>
                </div>
              </div>
              <UButton
                variant="ghost"
                color="red"
                icon="i-lucide-trash-2"
                size="xs"
                @click="removeDiet(diet)"
              />
            </div>
          </div>
        </UCard>

        <!-- Food Likes Card -->
        <UCard data-flows="card-food-likes">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-heart" class="w-5 h-5 text-pink-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.sections.foodLikes') }}</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="openFoodPicker('likes')"
              >
                {{ t('myProfile.actions.add') }}
              </UButton>
            </div>
          </template>

          <div v-if="foodLikes.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-heart" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('myProfile.emptyState.noFavoriteFoods') }}</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="openFoodPicker('likes')"
            >
              {{ t('myProfile.emptyState.addFoodsYouLove') }}
            </UButton>
          </div>

          <div v-else class="flex flex-wrap gap-2">
            <div
              v-for="foodId in foodLikes"
              :key="foodId"
              class="flex items-center gap-2 px-3 py-2 rounded-full bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800"
            >
              <UIcon :name="getFoodIcon(foodId)" class="w-4 h-4 text-pink-500" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ getFoodName(foodId) }}</span>
              <button
                class="ml-1 hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5 transition-colors"
                @click="removeFoodLike(foodId)"
              >
                <UIcon name="i-lucide-x" class="w-3 h-3 text-pink-600 dark:text-pink-400" />
              </button>
            </div>
          </div>
        </UCard>

        <!-- Food Dislikes Card -->
        <UCard data-flows="card-food-dislikes">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-thumbs-down" class="w-5 h-5 text-orange-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.sections.foodDislikes') }}</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="openFoodPicker('dislikes')"
              >
                {{ t('myProfile.actions.add') }}
              </UButton>
            </div>
          </template>

          <div v-if="foodDislikes.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-thumbs-down" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('myProfile.emptyState.noDislikedFoods') }}</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="openFoodPicker('dislikes')"
            >
              {{ t('myProfile.emptyState.addFoodsToAvoid') }}
            </UButton>
          </div>

          <div v-else class="flex flex-wrap gap-2">
            <div
              v-for="foodId in foodDislikes"
              :key="foodId"
              class="flex items-center gap-2 px-3 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
            >
              <UIcon :name="getFoodIcon(foodId)" class="w-4 h-4 text-orange-500" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ getFoodName(foodId) }}</span>
              <button
                class="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                @click="removeFoodDislike(foodId)"
              >
                <UIcon name="i-lucide-x" class="w-3 h-3 text-orange-600 dark:text-orange-400" />
              </button>
            </div>
          </div>
        </UCard>

        <!-- Allergies & Intolerances Card -->
        <UCard data-flows="card-allergies">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.sections.allergiesAndIntolerances') }}</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="showAddAllergy = true"
              >
                {{ t('myProfile.actions.add') }}
              </UButton>
            </div>
          </template>

          <div v-if="allergies.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-shield-check" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('myProfile.emptyState.noAllergies') }}</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="showAddAllergy = true"
            >
              {{ t('myProfile.emptyState.addAllergyOrIntolerance') }}
            </UButton>
          </div>

          <div v-else class="flex flex-wrap gap-2">
            <div
              v-for="allergy in allergies"
              :key="allergy"
              class="flex items-center gap-2 px-3 py-2 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-red-500" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ getAllergyLabel(allergy) }}</span>
              <button
                class="ml-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5 transition-colors"
                @click="removeAllergy(allergy)"
              >
                <UIcon name="i-lucide-x" class="w-3 h-3 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </UCard>

        <!-- What WiseFood Remembers Card -->
        <UCard data-flows="card-memory">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-brain" class="w-5 h-5 text-purple-500" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.sections.memory') }}</h2>
            </div>
          </template>

          <div v-if="memoryItems.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-brain" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('myProfile.memory.empty') }}</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="item in memoryItems"
              :key="item.key"
              class="rounded-xl bg-gray-50 dark:bg-zinc-800/50"
            >
              <div class="flex items-center justify-between gap-2 p-2.5">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                    :class="memoryKindStyle(item.entry.kind).bg"
                  >
                    <UIcon
                      :name="memoryKindStyle(item.entry.kind).icon"
                      class="w-4 h-4"
                      :class="memoryKindStyle(item.entry.kind).fg"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ memoryValueLabel(item.entry) }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ t('myProfile.memory.learnedIn', { app: memorySourceLabel(item.entry) }) }}<template v-if="formatMemoryDate(item.entry.recorded_at)"> &middot; {{ formatMemoryDate(item.entry.recorded_at) }}</template>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-0.5 shrink-0">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    :icon="explainedMemoryKey === item.key ? 'i-lucide-chevron-up' : 'i-lucide-help-circle'"
                    :aria-label="t('myProfile.memory.why.title')"
                    :aria-expanded="explainedMemoryKey === item.key"
                    data-flows="memory-why"
                    @click="toggleMemoryExplanation(item)"
                  />
                  <UButton
                    v-if="memoryEditor(item.entry) !== 'none'"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-pencil"
                    size="xs"
                    :disabled="!!forgettingMemoryKey || !!savingMemoryKey"
                    :aria-label="t('myProfile.memory.edit.action')"
                    data-flows="memory-edit"
                    @click="startMemoryEdit(item)"
                  />
                  <UButton
                    variant="ghost"
                    color="error"
                    icon="i-lucide-trash-2"
                    size="xs"
                    :loading="forgettingMemoryKey === item.key"
                    :disabled="!!forgettingMemoryKey || !!savingMemoryKey"
                    :aria-label="t('myProfile.memory.forget')"
                    @click="forgetMemory(item)"
                  />
                </div>
              </div>

              <!-- "Why am I seeing this?" — provenance, effect, and the way out,
                   for the memory the member is pointing at. -->
              <div
                v-if="explainedMemoryKey === item.key"
                class="px-2.5 pb-2.5 space-y-2.5"
              >
                <div class="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-gray-200/80 dark:border-white/10 p-3 space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ t('myProfile.memory.why.title') }}
                  </p>

                  <dl class="space-y-1.5 text-xs">
                    <div class="flex gap-2">
                      <dt class="shrink-0 text-gray-500 dark:text-gray-400 w-28">{{ t('myProfile.memory.why.learned') }}</dt>
                      <dd class="text-gray-700 dark:text-gray-200">
                        {{ t('myProfile.memory.why.learnedValue', {
                          app: memorySourceLabel(item.entry),
                          when: formatMemoryDate(item.entry.recorded_at) || t('myProfile.memory.why.unknownDate')
                        }) }}
                      </dd>
                    </div>
                    <div
                      v-if="memorySourceQuote(item.entry)"
                      class="flex gap-2"
                    >
                      <dt class="shrink-0 text-gray-500 dark:text-gray-400 w-28">{{ t('myProfile.memory.why.fromWhatYouSaid') }}</dt>
                      <dd class="text-gray-700 dark:text-gray-200 italic">“{{ memorySourceQuote(item.entry) }}”</dd>
                    </div>
                    <div class="flex gap-2">
                      <dt class="shrink-0 text-gray-500 dark:text-gray-400 w-28">{{ t('myProfile.memory.why.consent') }}</dt>
                      <dd class="text-gray-700 dark:text-gray-200">{{ t('myProfile.memory.why.consentValue') }}</dd>
                    </div>
                    <div class="flex gap-2">
                      <dt class="shrink-0 text-gray-500 dark:text-gray-400 w-28">{{ t('myProfile.memory.why.effectLabel') }}</dt>
                      <dd class="text-gray-700 dark:text-gray-200">{{ memoryEffect(item.entry) }}</dd>
                    </div>
                    <div class="flex gap-2">
                      <dt class="shrink-0 text-gray-500 dark:text-gray-400 w-28">{{ t('myProfile.memory.why.storedLabel') }}</dt>
                      <dd class="text-gray-700 dark:text-gray-200 font-mono text-[11px]">{{ memoryStoredIn(item.entry) }}</dd>
                    </div>
                    <div
                      v-if="item.entry.edited_at"
                      class="flex gap-2"
                    >
                      <dt class="shrink-0 text-gray-500 dark:text-gray-400 w-28">{{ t('myProfile.memory.why.edited') }}</dt>
                      <dd class="text-gray-700 dark:text-gray-200">
                        {{ t('myProfile.memory.why.editedValue', { when: formatMemoryDate(item.entry.edited_at) || t('myProfile.memory.why.unknownDate') }) }}
                      </dd>
                    </div>
                  </dl>

                  <p class="text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/70 dark:border-white/10">
                    {{ t('myProfile.memory.why.control') }}
                  </p>
                </div>

                <!-- Editing: correct the memory instead of only deleting it -->
                <div
                  v-if="editingMemoryKey === item.key"
                  class="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-gray-200/80 dark:border-white/10 p-3 space-y-2"
                >
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ t('myProfile.memory.edit.title') }}
                  </p>

                  <UInput
                    v-if="memoryEditor(item.entry) === 'text'"
                    v-model="memoryDraft.value"
                    size="sm"
                    class="w-full"
                    :placeholder="t('myProfile.memory.edit.placeholder')"
                    @keydown.enter="saveMemoryEdit(item)"
                  />
                  <USelectMenu
                    v-else
                    v-model="memoryDraft.value"
                    :items="goalSlugOptions"
                    value-key="value"
                    label-key="label"
                    size="sm"
                    class="w-full"
                  />

                  <div
                    v-if="memoryCanFlip(item.entry)"
                    class="flex items-center gap-2"
                  >
                    <UButton
                      variant="soft"
                      color="neutral"
                      size="xs"
                      :icon="memoryDraft.kind === 'like' ? 'i-lucide-heart' : 'i-lucide-thumbs-down'"
                      @click="flipMemoryKind()"
                    >
                      {{ memoryDraft.kind === 'like' ? t('myProfile.memory.edit.isLike') : t('myProfile.memory.edit.isDislike') }}
                    </UButton>
                    <span class="text-[11px] text-gray-500 dark:text-gray-400">{{ t('myProfile.memory.edit.flipHint') }}</span>
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <UButton
                      color="primary"
                      size="xs"
                      :loading="savingMemoryKey === item.key"
                      :disabled="!memoryDraftChanged"
                      @click="saveMemoryEdit(item)"
                    >
                      {{ t('myProfile.memory.edit.save') }}
                    </UButton>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :disabled="savingMemoryKey === item.key"
                      @click="cancelMemoryEdit()"
                    >
                      {{ t('myProfile.memory.edit.cancel') }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Privacy & Data -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-gray-400" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.sections.privacy') }}</h2>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="font-medium text-gray-900 dark:text-white">{{ t('myProfile.privacy.analyticsTitle') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('myProfile.privacy.analyticsDescription') }}</p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ t('myProfile.privacy.analyticsAggregateNote') }}</p>
              </div>
              <USwitch
                v-model="analyticsConsent"
                :loading="analyticsConsentSaving || analyticsConsentLoading"
                :disabled="!analyticsConsentKnown || analyticsConsentSaving"
                :aria-label="t('myProfile.privacy.analyticsTitle')"
                @update:model-value="saveAnalyticsConsent"
              />
            </div>
            <p
              v-if="!analyticsConsentKnown && !analyticsConsentLoading"
              class="text-xs text-amber-600 dark:text-amber-400"
            >
              {{ t('myProfile.privacy.analyticsUnavailable') }}
            </p>
            <p v-if="analyticsSessionId" class="text-xs text-gray-400 dark:text-gray-500">
              {{ t('myProfile.privacy.sessionLine', { id: analyticsSessionId }) }}
            </p>
            <NuxtLink to="/privacy" class="inline-block text-sm text-primary hover:underline">
              {{ t('myProfile.privacy.readMore') }}
            </NuxtLink>
          </div>
        </UCard>

        <!-- Danger Zone -->
        <UCard
          :ui="{
            ring: 'ring-1 ring-red-200 dark:ring-red-900/50'
          }"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
              <h2 class="text-lg font-semibold text-red-600 dark:text-red-400">{{ t('myProfile.sections.dangerZone') }}</h2>
            </div>
          </template>

          <div class="divide-y divide-gray-100 dark:divide-white/10">
            <!-- Narrowest scope first: one profile out of a household -->
            <div class="flex items-center justify-between gap-4 pb-4">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ t('myProfile.dangerZone.deleteTitle') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('myProfile.dangerZone.deleteDescription') }}</p>
              </div>
              <UButton
                color="error"
                variant="soft"
                icon="i-lucide-trash-2"
                class="shrink-0"
                @click="showDeleteConfirm = true"
              >
                {{ t('myProfile.actions.deleteProfile') }}
              </UButton>
            </div>

            <div class="flex items-center justify-between gap-4 py-4">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ t('myProfile.dangerZone.deleteHouseholdTitle') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('myProfile.dangerZone.deleteHouseholdDescription', { count: householdStore.members.length }) }}
                </p>
              </div>
              <UButton
                color="error"
                variant="soft"
                icon="i-lucide-users"
                class="shrink-0"
                data-flows="delete-household"
                @click="showDeleteHouseholdConfirm = true"
              >
                {{ t('myProfile.actions.deleteHousehold') }}
              </UButton>
            </div>

            <!-- Widest scope last: the account itself -->
            <div class="flex items-center justify-between gap-4 pt-4">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ t('myProfile.dangerZone.deleteAccountTitle') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('myProfile.dangerZone.deleteAccountDescription') }}</p>
              </div>
              <UButton
                color="error"
                icon="i-lucide-user-x"
                class="shrink-0"
                data-flows="delete-account"
                @click="showDeleteAccountConfirm = true"
              >
                {{ t('myProfile.actions.deleteAccount') }}
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- What WiseFood keeps — the inventory, in the place where you can act
             on it. Sits next to the deletion controls on purpose. -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.dataKept.title') }}</h2>
            </div>
          </template>

          <p class="text-sm text-gray-600 dark:text-gray-300">{{ t('myProfile.dataKept.intro') }}</p>

          <ul class="mt-3 space-y-2">
            <li
              v-for="row in dataKeptRows"
              :key="row.key"
              class="flex gap-2.5 text-sm"
            >
              <UIcon :name="row.icon" class="w-4 h-4 mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
              <span class="text-gray-700 dark:text-gray-200">
                <span class="font-medium">{{ row.what }}</span>
                — {{ row.detail }}
              </span>
            </li>
          </ul>

          <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">{{ t('myProfile.dataKept.notUsedForTraining') }}</p>

          <div class="mt-3 flex flex-wrap gap-3 text-sm">
            <ULink to="/privacy" class="text-primary-600 dark:text-primary-400 hover:underline">
              {{ t('myProfile.dataKept.privacyLink') }}
            </ULink>
          </div>
        </UCard>
      </div>

      <!-- Edit Avatar Modal -->
      <UModal v-model:open="showAvatarEditor">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.modals.changeAvatar') }}</h3>
                <UButton
                  variant="ghost"
                  color="gray"
                  icon="i-lucide-x"
                  size="sm"
                  @click="showAvatarEditor = false"
                />
              </div>
            </template>

            <ProfileAvatarSelector v-model="editAvatarIndex" />

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showAvatarEditor = false">
                  {{ t('myProfile.actions.cancel') }}
                </UButton>
                <UButton color="primary" :loading="isSaving" @click="saveAvatar">
                  {{ t('myProfile.actions.saveAvatar') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Edit Details Modal -->
      <UModal v-model:open="showEditDetails">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.modals.editProfileDetails') }}</h3>
                <UButton
                  variant="ghost"
                  color="gray"
                  icon="i-lucide-x"
                  size="sm"
                  @click="showEditDetails = false"
                />
              </div>
            </template>

            <div class="space-y-4">
              <UFormField :label="t('myProfile.fields.name')" required>
                <UInput
                  v-model="editName"
                  :placeholder="t('myProfile.fields.profileNamePlaceholder')"
                  size="lg"
                  icon="i-lucide-user"
                />
              </UFormField>

              <UFormField :label="t('myProfile.fields.ageGroup')">
                <USelectMenu
                  v-model="editAgeGroup"
                  :items="ageGroupOptions"
                  :placeholder="t('myProfile.fields.selectAgeGroup')"
                  size="lg"
                  value-key="value"
                />
              </UFormField>

              <UFormField :label="t('myProfile.fields.gender')">
                <USelectMenu
                  v-model="editGender"
                  :items="genderOptions"
                  :placeholder="t('myProfile.fields.selectGender')"
                  size="lg"
                  value-key="value"
                />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showEditDetails = false">
                  {{ t('myProfile.actions.cancel') }}
                </UButton>
                <UButton
                  color="primary"
                  :loading="isSaving"
                  :disabled="!editName.trim()"
                  @click="saveDetails"
                >
                  {{ t('myProfile.actions.saveChanges') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Add Dietary Preference Modal -->
      <UModal v-model:open="showAddDiet">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.modals.addDietaryPreference') }}</h3>
                <UButton
                  variant="ghost"
                  color="gray"
                  icon="i-lucide-x"
                  size="sm"
                  @click="showAddDiet = false"
                />
              </div>
            </template>

            <div class="grid grid-cols-1 gap-3">
              <button
                v-for="diet in availableDiets"
                :key="diet.value"
                type="button"
                class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:border-brand-300 dark:hover:border-brand-700"
                :class="selectedNewDiet === diet.value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700'"
                @click="selectedNewDiet = diet.value"
              >
                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="selectedNewDiet === diet.value ? 'bg-brand-100 dark:bg-brand-900/50' : 'bg-gray-100 dark:bg-zinc-800'">
                  <UIcon
                    :name="diet.icon"
                    class="w-5 h-5"
                    :class="selectedNewDiet === diet.value ? 'text-brand-600' : 'text-gray-500'"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ diet.label }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ diet.description }}</p>
                </div>
                <UIcon
                  v-if="selectedNewDiet === diet.value"
                  name="i-lucide-check-circle"
                  class="w-5 h-5 text-brand-500 ml-auto"
                />
              </button>
            </div>

            <p v-if="availableDiets.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
              {{ t('myProfile.emptyState.allDietaryPreferencesAdded') }}
            </p>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showAddDiet = false">
                  {{ t('myProfile.actions.cancel') }}
                </UButton>
                <UButton
                  color="primary"
                  :loading="isSaving"
                  :disabled="!selectedNewDiet"
                  @click="addDiet"
                >
                  {{ t('myProfile.actions.addPreference') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Food Picker Modal -->
      <UModal v-model:open="showFoodPicker">
        <template #content>
          <UCard
            class="flex flex-col max-h-[85vh]"
            :ui="{ body: 'flex-1 min-h-0 flex flex-col overflow-hidden' }"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ foodPickerMode === 'likes' ? t('myProfile.foodPicker.addFoodsYouLike') : t('myProfile.foodPicker.addFoodsYouDislike') }}
                </h3>
                <UButton
                  variant="ghost"
                  color="gray"
                  icon="i-lucide-x"
                  size="sm"
                  @click="showFoodPicker = false"
                />
              </div>
            </template>

            <!-- Search -->
            <div class="mb-4 shrink-0">
              <UInput
                v-model="foodSearch"
                :placeholder="t('myProfile.foodPicker.searchFoodsPlaceholder')"
                icon="i-lucide-search"
                size="lg"
              />
            </div>

            <!-- Category tabs -->
            <div class="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
              <UButton
                v-for="cat in foodCategories"
                :key="cat.id"
                :variant="selectedFoodCategory === cat.id ? 'solid' : 'soft'"
                :color="selectedFoodCategory === cat.id ? 'primary' : 'gray'"
                size="sm"
                @click="selectedFoodCategory = cat.id"
              >
                <UIcon :name="cat.icon" class="w-4 h-4 mr-1" />
                {{ getFoodCategoryLabel(cat.id, cat.name) }}
              </UButton>
            </div>

            <!-- Diet compatibility notice -->
            <div v-if="currentDietaryGroups.length > 0" class="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shrink-0">
              <div class="flex items-start gap-2">
                <UIcon name="i-lucide-info" class="w-4 h-4 text-blue-500 mt-0.5" />
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  {{ t('myProfile.foodPicker.compatibilityNotice', { diets: currentDietaryGroups.map(d => getDietLabel(d)).join(', ') }) }}
                </p>
              </div>
            </div>

            <!-- Bulk selection controls -->
            <div v-if="selectableFoods.length > 0" class="flex items-center justify-between gap-2 mb-3 shrink-0">
              <UButton
                variant="soft"
                color="primary"
                size="xs"
                :icon="allSelectableSelected ? 'i-lucide-square' : 'i-lucide-check-square'"
                @click="toggleSelectAll"
              >
                {{ allSelectableSelected ? t('myProfile.foodPicker.deselectAll') : t('myProfile.foodPicker.selectAll') }}
              </UButton>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('myProfile.foodPicker.selectableCount', { count: selectableFoods.length }) }}
              </span>
            </div>

            <!-- Foods grid -->
            <div class="flex-1 min-h-0 overflow-y-auto pr-1">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="food in filteredFoods"
                  :key="food.id"
                  type="button"
                  class="flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left"
                  :class="[
                    selectedFoods.includes(food.id)
                      ? foodPickerMode === 'likes'
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                    isAlreadySelected(food.id) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                  :disabled="isAlreadySelected(food.id)"
                  @click="toggleFood(food.id)"
                >
                  <UIcon
                    :name="food.icon"
                    class="w-5 h-5 shrink-0"
                    :class="selectedFoods.includes(food.id)
                      ? foodPickerMode === 'likes' ? 'text-pink-500' : 'text-orange-500'
                      : 'text-gray-400'"
                  />
                  <span class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ getFoodName(food.id) }}</span>
                  <UIcon
                    v-if="selectedFoods.includes(food.id)"
                    name="i-lucide-check"
                    class="w-4 h-4 ml-auto shrink-0"
                    :class="foodPickerMode === 'likes' ? 'text-pink-500' : 'text-orange-500'"
                  />
                </button>
              </div>

              <p v-if="filteredFoods.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                {{ t('myProfile.foodPicker.noFoodsFound') }}
              </p>
            </div>

            <template #footer>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('myProfile.foodPicker.selectedCount', { count: selectedFoods.length }) }}
                </span>
                <div class="flex gap-3">
                  <UButton variant="ghost" color="gray" @click="showFoodPicker = false">
                    {{ t('myProfile.actions.cancel') }}
                  </UButton>
                  <UButton
                    :color="foodPickerMode === 'likes' ? 'pink' : 'orange'"
                    :loading="isSaving"
                    :disabled="selectedFoods.length === 0"
                    @click="saveFoodPreferences"
                  >
                    {{
                      selectedFoods.length === 1
                        ? t('myProfile.foodPicker.addOneFood')
                        : t('myProfile.foodPicker.addManyFoods', { count: selectedFoods.length })
                    }}
                  </UButton>
                </div>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Add Allergy Modal -->
      <UModal v-model:open="showAddAllergy">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.modals.addAllergyOrIntolerance') }}</h3>
                <UButton
                  variant="ghost"
                  color="gray"
                  icon="i-lucide-x"
                  size="sm"
                  @click="showAddAllergy = false"
                />
              </div>
            </template>

            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="allergy in availableAllergies"
                :key="allergy.value"
                type="button"
                class="flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left"
                :class="selectedNewAllergy === allergy.value
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'"
                @click="selectedNewAllergy = allergy.value"
              >
                <UIcon
                  :name="allergy.icon"
                  class="w-5 h-5"
                  :class="selectedNewAllergy === allergy.value ? 'text-red-500' : 'text-gray-400'"
                />
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ allergy.label }}</span>
              </button>
            </div>

            <p v-if="availableAllergies.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
              {{ t('myProfile.emptyState.allCommonAllergiesAdded') }}
            </p>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showAddAllergy = false">
                  {{ t('myProfile.actions.cancel') }}
                </UButton>
                <UButton
                  color="red"
                  :loading="isSaving"
                  :disabled="!selectedNewAllergy"
                  @click="addAllergy"
                >
                  {{ t('myProfile.actions.addAllergy') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Delete Confirmation Modal -->
      <UModal v-model:open="showDeleteConfirm">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.modals.deleteProfileTitle') }}</h3>
              </div>
            </template>

            <p class="text-gray-600 dark:text-gray-400">
              {{ t('myProfile.modals.deleteConfirm', { name: currentMember?.name || '' }) }}
            </p>

            <UAlert
              v-if="deleteError"
              color="red"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="deleteError"
              class="mt-4"
            />

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showDeleteConfirm = false">
                  {{ t('myProfile.actions.cancel') }}
                </UButton>
                <UButton
                  color="red"
                  :loading="isDeleting"
                  @click="deleteProfile"
                >
                  {{ t('myProfile.actions.deleteProfile') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Delete household -->
      <UModal v-model:open="showDeleteHouseholdConfirm">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.modals.deleteHouseholdTitle') }}</h3>
              </div>
            </template>

            <p class="text-gray-600 dark:text-gray-400">
              {{ t('myProfile.modals.deleteHouseholdConfirm', { count: householdStore.members.length }) }}
            </p>

            <UAlert
              v-if="deleteError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="deleteError"
              class="mt-4"
            />

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="neutral" @click="showDeleteHouseholdConfirm = false">
                  {{ t('myProfile.actions.cancel') }}
                </UButton>
                <UButton
                  color="error"
                  :loading="isDeleting"
                  @click="deleteHousehold"
                >
                  {{ t('myProfile.actions.deleteHousehold') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Delete account — typed confirmation, and an honest list of what
           survives, so nobody discovers the consent ledger afterwards. -->
      <UModal v-model:open="showDeleteAccountConfirm">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-user-x" class="w-5 h-5 text-red-500" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('myProfile.modals.deleteAccountTitle') }}</h3>
              </div>
            </template>

            <p class="text-gray-600 dark:text-gray-400">{{ t('myProfile.modals.deleteAccountConfirm') }}</p>

            <ul class="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <li class="flex gap-2">
                <UIcon name="i-lucide-x-circle" class="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                {{ t('myProfile.modals.deleteAccountRemoved') }}
              </li>
              <li class="flex gap-2">
                <UIcon name="i-lucide-file-check" class="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                {{ t('myProfile.modals.deleteAccountRetained') }}
              </li>
            </ul>

            <UFormField
              :label="t('myProfile.modals.deleteAccountTypeToConfirm', { phrase: accountConfirmPhrase })"
              class="mt-4"
            >
              <UInput
                v-model="accountConfirmInput"
                :placeholder="accountConfirmPhrase"
                autocomplete="off"
                class="w-full"
              />
            </UFormField>

            <UAlert
              v-if="deleteError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="deleteError"
              class="mt-4"
            />

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="neutral" @click="showDeleteAccountConfirm = false">
                  {{ t('myProfile.actions.cancel') }}
                </UButton>
                <UButton
                  color="error"
                  :disabled="!accountConfirmed"
                  :loading="isDeleting"
                  @click="deleteAccount"
                >
                  {{ t('myProfile.actions.deleteAccount') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '@/stores/household'
import { stringToAvatarConfig, avatarPresets } from '~/utils/avatarPresets'
import {
  foodCategories,
  getFoodsByCategory,
  getFoodById,
  type DietaryGroup
} from '~/utils/foodPreferences'
import householdsApi, { type MemberProfile, type NutritionalPreferences } from '~/services/householdsApi'
import consentApi from '~/services/consentApi'
import { useAnalyticsSession } from '~/composables/useAnalyticsSession'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'profile']
})

const { t, te, locale } = useI18n()

useHead({
  title: computed(() => t('myProfile.pageTitle'))
})

const householdStore = useHouseholdStore()
const authStore = useAuthStore()

const loading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

// Analytics consent. The platform defaults to opt-in, so until someone says
// yes their activity is counted but never attributed — this switch is the only
// thing that turns "somebody searched for X" into "this person did".
const analyticsConsent = ref(false)
const analyticsConsentLoading = ref(false)
const analyticsConsentSaving = ref(false)
// Unknown until the first load succeeds. A switch showing "off" for a user
// who is actually opted in — because the request failed — would be a lie in
// the one place they come to check; so until we know, it is disabled and says
// so.
const analyticsConsentKnown = ref(false)
const { sessionId: analyticsSessionId } = useAnalyticsSession()

async function loadAnalyticsConsent() {
  analyticsConsentLoading.value = true
  try {
    const status = await consentApi.getAnalyticsConsent()
    analyticsConsent.value = status.enabled
    analyticsConsentKnown.value = true
  } catch {
    analyticsConsentKnown.value = false
  } finally {
    analyticsConsentLoading.value = false
  }
}

async function saveAnalyticsConsent(enabled: boolean) {
  analyticsConsentSaving.value = true
  try {
    const status = await consentApi.setAnalyticsConsent(enabled)
    analyticsConsent.value = status.enabled
  } catch {
    // Put the switch back where it was: a toggle that stays flipped after a
    // failed save is a user believing they opted out when they have not.
    analyticsConsent.value = !enabled
  } finally {
    analyticsConsentSaving.value = false
  }
}

// Modal states
const showAvatarEditor = ref(false)
const showEditDetails = ref(false)
const showAddDiet = ref(false)
const showFoodPicker = ref(false)
const showAddAllergy = ref(false)
const showDeleteConfirm = ref(false)

// Edit form states
const editName = ref('')
const editAgeGroup = ref<string | undefined>(undefined)
const editGender = ref<string | undefined>(undefined)
const editAvatarIndex = ref(0)
const selectedNewDiet = ref<string | null>(null)
const selectedNewAllergy = ref<string | null>(null)

// Food picker states
const foodPickerMode = ref<'likes' | 'dislikes'>('likes')
const foodSearch = ref('')
const selectedFoodCategory = ref('proteins')
const selectedFoods = ref<string[]>([])

const currentMember = computed(() => householdStore.currentMember)

// Member profile data
const memberProfile = ref<MemberProfile | null>(null)

const currentDietaryGroups = computed(() => {
  return memberProfile.value?.dietary_groups || []
})

// Food preferences from nutritional_preferences
const foodLikes = computed(() => {
  return memberProfile.value?.nutritional_preferences?.food_likes || []
})

const foodDislikes = computed(() => {
  return memberProfile.value?.nutritional_preferences?.food_dislikes || []
})

// Allergies are top-level in profile
const allergies = computed(() => {
  return memberProfile.value?.allergies || []
})

// ── FoodChat memory (properties.memory_log / standing_seeds) ──
interface MemoryLogEntry {
  kind: string
  value: string
  source?: string
  session_id?: string
  recorded_at?: string
  /**
   * Why this was inferred, in the member's own words. FoodChat stores the
   * phrase its extractor keyed on (`evidence`); FoodScholar stores the question
   * that produced the goal (`source_text`). Either answers "why am I seeing
   * this?" better than any generated explanation could.
   */
  evidence?: string
  source_text?: string
  /** Set when the member corrected the memory from this panel. */
  edited_at?: string
  edited_by?: string
}

interface StandingSeed {
  name: string
}

interface MemoryItem {
  key: string
  entry: MemoryLogEntry
}

const memoryLog = computed<MemoryLogEntry[]>(() => {
  const raw = memberProfile.value?.properties?.memory_log
  return Array.isArray(raw) ? (raw as MemoryLogEntry[]) : []
})

const standingSeeds = computed<StandingSeed[]>(() => {
  const raw = memberProfile.value?.properties?.standing_seeds
  return Array.isArray(raw) ? (raw as StandingSeed[]) : []
})

// Standing seeds that have no corresponding memory_log entry still get listed
const memoryItems = computed<MemoryItem[]>(() => {
  const items: MemoryItem[] = memoryLog.value.map((entry, i) => ({
    key: `log-${i}-${entry.kind}-${entry.value}`,
    entry
  }))
  for (const seed of standingSeeds.value) {
    if (!memoryLog.value.some(e => e.kind === 'standing_seed' && e.value === seed.name)) {
      items.push({ key: `seed-${seed.name}`, entry: { kind: 'standing_seed', value: seed.name } })
    }
  }
  return items
})

// Memories carry provenance (memory_log.source) — label by the app that
// learned them. Entries predating the source field came from FoodChat.
const MEMORY_SOURCE_LABELS: Record<string, string> = {
  foodchat: 'FoodChat',
  foodscholar: 'FoodScholar'
}

const memorySourceLabel = (entry: MemoryLogEntry): string => {
  const source = (entry.source ?? 'foodchat').toLowerCase()
  return MEMORY_SOURCE_LABELS[source] ?? 'FoodChat'
}

const forgettingMemoryKey = ref<string | null>(null)
const explainedMemoryKey = ref<string | null>(null)
const editingMemoryKey = ref<string | null>(null)
const savingMemoryKey = ref<string | null>(null)
const memoryDraft = reactive<{ kind: string, value: string }>({ kind: '', value: '' })

function toggleMemoryExplanation(item: MemoryItem) {
  explainedMemoryKey.value = explainedMemoryKey.value === item.key ? null : item.key
  if (explainedMemoryKey.value !== item.key) return
  // Opening the explanation closes an edit in progress on another row, so the
  // panel never shows two different states for the same memory.
  if (editingMemoryKey.value && editingMemoryKey.value !== item.key) editingMemoryKey.value = null
}

/**
 * Which editor a memory kind can offer. Food-valued kinds take free text (the
 * planner matches on the string), goals must stay one of the canonical planner
 * slugs, and allergies are deliberately not editable here — they are a safety
 * filter with their own reviewed control above.
 */
function memoryEditor(entry: MemoryLogEntry): 'text' | 'goal' | 'none' {
  if (entry.kind === 'like' || entry.kind === 'dislike' || entry.kind === 'cuisine' || entry.kind === 'standing_seed') return 'text'
  if (entry.kind === 'goal' || entry.kind === 'dietary_goal') return 'goal'
  return 'none'
}

/** Likes and dislikes are the pair a wrong guess most often lands on. */
function memoryCanFlip(entry: MemoryLogEntry): boolean {
  return entry.kind === 'like' || entry.kind === 'dislike'
}

/**
 * Canonical planner goal slugs. These are a contract with the planner, not
 * copy, so the list lives here rather than being read back out of the locale
 * file — a locale with no myProfile block would otherwise offer no goals.
 */
const GOAL_SLUGS = [
  'reduce_fat',
  'reduce_sugar',
  'reduce_sodium',
  'reduce_calories',
  'reduce_carbs',
  'increase_protein',
  'increase_fiber',
  'increase_hydration',
  'lose_weight',
  'gain_weight',
  'gain_muscle',
  'maintain_weight'
] as const

const goalSlugOptions = computed(() =>
  GOAL_SLUGS.map(slug => ({
    value: slug as string,
    label: memoryValueLabel({ kind: 'goal', value: slug })
  }))
)

function startMemoryEdit(item: MemoryItem) {
  editingMemoryKey.value = item.key
  explainedMemoryKey.value = item.key
  memoryDraft.kind = item.entry.kind
  memoryDraft.value = item.entry.value
}

function cancelMemoryEdit() {
  editingMemoryKey.value = null
}

function flipMemoryKind() {
  memoryDraft.kind = memoryDraft.kind === 'like' ? 'dislike' : 'like'
}

const memoryDraftChanged = computed(() => {
  const item = memoryItems.value.find(i => i.key === editingMemoryKey.value)
  if (!item) return false
  return memoryDraft.value.trim() !== ''
    && (memoryDraft.value.trim() !== item.entry.value || memoryDraft.kind !== item.entry.kind)
})

/**
 * Save an edited memory: detach the old value from the field it steered, attach
 * the new one, and rewrite the log entry in place — keeping its provenance and
 * stamping that the member corrected it, which is itself provenance.
 */
async function saveMemoryEdit(item: MemoryItem) {
  if (!currentMember.value || savingMemoryKey.value || !memoryDraftChanged.value) return

  savingMemoryKey.value = item.key
  const target = currentMemoryTarget()
  const edited: MemoryLogEntry = {
    ...item.entry,
    kind: memoryDraft.kind,
    value: memoryDraft.value.trim(),
    edited_at: new Date().toISOString(),
    edited_by: 'member'
  }

  detachMemory(target, item.entry)
  attachMemory(target, edited)

  const log = memoryLog.value.map(e => (sameMemoryEntry(e, item.entry) ? edited : e))
  // A standing seed with no log line of its own gets one on first edit, so the
  // correction is not silently lost on reload.
  target.props.memory_log = log.some(e => sameMemoryEntry(e, edited)) ? log : [...log, edited]

  const ok = await persistMemoryTarget(target)
  savingMemoryKey.value = null
  if (ok) editingMemoryKey.value = null
}

/**
 * "Why am I seeing this?" — the concrete effect a memory has on what WiseFood
 * recommends, named per kind rather than as one generic line. Hard filters say
 * so; ranking signals say they are only signals; the goal line names the
 * household merge, because a goal that outranked another diner silently is the
 * failure this panel exists to prevent.
 */
function memoryEffect(entry: MemoryLogEntry): string {
  const value = memoryValueLabel(entry)
  switch (entry.kind) {
    case 'like':
    case 'cuisine':
      return t('myProfile.memory.why.effect.like', { value })
    case 'dislike':
      return t('myProfile.memory.why.effect.dislike', { value })
    case 'allergy_hint':
      return t('myProfile.memory.why.effect.allergy', { value })
    case 'standing_seed':
      return t('myProfile.memory.why.effect.seed', { value })
    case 'goal':
    case 'dietary_goal':
      return t('myProfile.memory.why.effect.goal', { value })
    case 'dietary_pattern':
      return t('myProfile.memory.why.effect.pattern', { value })
    default:
      return t('myProfile.memory.why.effect.other', { value })
  }
}

/** What the member said that led to this memory, if the writer recorded it. */
function memorySourceQuote(entry: MemoryLogEntry): string {
  return (entry.evidence || entry.source_text || '').trim()
}

/** The profile field the memory was written through to — what makes it auditable. */
function memoryStoredIn(entry: MemoryLogEntry): string {
  switch (entry.kind) {
    case 'like':
    case 'cuisine':
      return t('myProfile.memory.why.storedIn.likes')
    case 'dislike':
      return t('myProfile.memory.why.storedIn.dislikes')
    case 'allergy_hint':
      return t('myProfile.memory.why.storedIn.allergies')
    case 'standing_seed':
      return t('myProfile.memory.why.storedIn.seeds')
    case 'goal':
    case 'dietary_goal':
      return t('myProfile.memory.why.storedIn.goals')
    case 'dietary_pattern':
      return t('myProfile.memory.why.storedIn.pattern')
    default:
      return t('myProfile.memory.why.storedIn.other')
  }
}

function memoryKindStyle(kind: string): { icon: string, bg: string, fg: string } {
  switch (kind) {
    case 'like':
      return { icon: 'i-lucide-heart', bg: 'bg-pink-100 dark:bg-pink-900/30', fg: 'text-pink-600 dark:text-pink-400' }
    case 'dislike':
      return { icon: 'i-lucide-thumbs-down', bg: 'bg-orange-100 dark:bg-orange-900/30', fg: 'text-orange-600 dark:text-orange-400' }
    case 'cuisine':
      return { icon: 'i-lucide-globe', bg: 'bg-sky-100 dark:bg-sky-900/30', fg: 'text-sky-600 dark:text-sky-400' }
    case 'constraint':
      return { icon: 'i-lucide-sliders-horizontal', bg: 'bg-gray-100 dark:bg-zinc-800', fg: 'text-gray-600 dark:text-gray-400' }
    case 'allergy_hint':
      return { icon: 'i-lucide-alert-triangle', bg: 'bg-red-100 dark:bg-red-900/30', fg: 'text-red-600 dark:text-red-400' }
    case 'standing_seed':
      return { icon: 'i-lucide-sprout', bg: 'bg-green-100 dark:bg-green-900/30', fg: 'text-green-600 dark:text-green-400' }
    // FoodScholar writes kind "goal"; FoodChat writes "dietary_goal" — same concept
    case 'goal':
    case 'dietary_goal':
      return { icon: 'i-lucide-target', bg: 'bg-indigo-100 dark:bg-indigo-900/30', fg: 'text-indigo-600 dark:text-indigo-400' }
    case 'dietary_pattern':
      return { icon: 'i-lucide-leaf', bg: 'bg-emerald-100 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400' }
    default:
      return { icon: 'i-lucide-brain', bg: 'bg-purple-100 dark:bg-purple-900/30', fg: 'text-purple-600 dark:text-purple-400' }
  }
}

function memoryValueLabel(entry: MemoryLogEntry): string {
  if (entry.kind === 'like' || entry.kind === 'dislike' || entry.kind === 'cuisine') return getFoodName(entry.value)
  if (entry.kind === 'allergy_hint') return getAllergyLabel(entry.value)
  if (entry.kind === 'goal' || entry.kind === 'dietary_goal') {
    // Goal values are canonical planner slugs (reduce_fat) — show the human label
    const key = `myProfile.memory.goals.${entry.value}`
    const translated = t(key)
    if (translated !== key) return translated
    return humanizeSlug(entry.value)
  }
  if (entry.kind === 'dietary_pattern') return humanizeSlug(entry.value)
  return entry.value
}

function humanizeSlug(value: string): string {
  const text = String(value || '').replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatMemoryDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return t('myProfile.memory.today')
  if (days === 1) return t('myProfile.memory.yesterday')
  if (days < 7) return t('myProfile.memory.daysAgo', { count: days })
  return date.toLocaleDateString(dateLocale.value, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * The profile fields a memory is applied to, gathered so one mapping can serve
 * both forgetting and editing. A memory is never only a log line: it was
 * written through to a field the planner reads, and both operations have to
 * move that field too or the list would stop matching the recommendations.
 */
interface MemoryTarget {
  nutPrefs: NutritionalPreferences
  allergies: string[]
  dietaryGroups: string[]
  props: Record<string, unknown>
}

function currentMemoryTarget(): MemoryTarget {
  return {
    nutPrefs: { ...memberProfile.value?.nutritional_preferences },
    allergies: [...allergies.value],
    dietaryGroups: [...(memberProfile.value?.dietary_groups || [])],
    props: { ...(memberProfile.value?.properties || {}) }
  }
}

/** Drop a memory's value from the field it was applied to. */
function detachMemory(target: MemoryTarget, entry: MemoryLogEntry) {
  if (entry.kind === 'like' || entry.kind === 'cuisine') {
    target.nutPrefs.food_likes = (target.nutPrefs.food_likes || []).filter(v => v !== entry.value)
  } else if (entry.kind === 'dislike') {
    target.nutPrefs.food_dislikes = (target.nutPrefs.food_dislikes || []).filter(v => v !== entry.value)
  } else if (entry.kind === 'allergy_hint') {
    target.allergies = target.allergies.filter(a => a !== entry.value)
  } else if (entry.kind === 'standing_seed') {
    const seeds = (target.props.standing_seeds as StandingSeed[] | undefined) || standingSeeds.value
    target.props.standing_seeds = seeds.filter(s => s.name !== entry.value)
  } else if (entry.kind === 'goal' || entry.kind === 'dietary_goal') {
    // Goals live in properties.dietary_goals [{slug, label}] and steer the
    // planner — forgetting must remove the slug, not just the log entry
    const goals = (target.props.dietary_goals as Array<{ slug?: string }> | undefined) || []
    target.props.dietary_goals = goals.filter(g => String(g?.slug || '').toLowerCase() !== entry.value)
  } else if (entry.kind === 'dietary_pattern') {
    target.dietaryGroups = target.dietaryGroups.filter(g => String(g).toLowerCase() !== entry.value)
  }
}

/** Apply a memory's value to the field its kind belongs to, without duplicating. */
function attachMemory(target: MemoryTarget, entry: MemoryLogEntry) {
  const value = entry.value
  if (!value) return

  if (entry.kind === 'like' || entry.kind === 'cuisine') {
    const likes = target.nutPrefs.food_likes || []
    target.nutPrefs.food_likes = likes.includes(value) ? likes : [...likes, value]
  } else if (entry.kind === 'dislike') {
    const dislikes = target.nutPrefs.food_dislikes || []
    target.nutPrefs.food_dislikes = dislikes.includes(value) ? dislikes : [...dislikes, value]
  } else if (entry.kind === 'allergy_hint') {
    target.allergies = target.allergies.includes(value) ? target.allergies : [...target.allergies, value]
  } else if (entry.kind === 'standing_seed') {
    const seeds = (target.props.standing_seeds as StandingSeed[] | undefined) || []
    target.props.standing_seeds = seeds.some(s => s.name === value) ? seeds : [...seeds, { name: value }]
  } else if (entry.kind === 'goal' || entry.kind === 'dietary_goal') {
    const goals = (target.props.dietary_goals as Array<{ slug?: string, label?: string }> | undefined) || []
    const slug = value.toLowerCase()
    // The label is what the planner echoes back in its explanations, so it is
    // written in the reader's language — same as the backend writers do.
    target.props.dietary_goals = goals.some(g => String(g?.slug || '').toLowerCase() === slug)
      ? goals
      : [...goals, { slug, label: memoryValueLabel(entry) }]
  } else if (entry.kind === 'dietary_pattern') {
    target.dietaryGroups = target.dietaryGroups.some(g => String(g).toLowerCase() === value.toLowerCase())
      ? target.dietaryGroups
      : [...target.dietaryGroups, value]
  }
}

function sameMemoryEntry(a: MemoryLogEntry, b: MemoryLogEntry): boolean {
  return a.kind === b.kind && a.value === b.value && a.recorded_at === b.recorded_at
}

/** Push a rewritten target to the API, rolling the UI back if it fails. */
async function persistMemoryTarget(target: MemoryTarget): Promise<boolean> {
  if (!currentMember.value) return false

  const snapshot = memberProfile.value
    ? (JSON.parse(JSON.stringify(memberProfile.value)) as MemberProfile)
    : null

  // Optimistic update, reverted on failure
  memberProfile.value = {
    ...memberProfile.value,
    nutritional_preferences: target.nutPrefs,
    allergies: target.allergies,
    dietary_groups: target.dietaryGroups,
    properties: target.props
  }

  try {
    const payload = buildProfilePayload({
      nutritional_preferences: target.nutPrefs,
      allergies: target.allergies,
      dietary_groups: target.dietaryGroups,
      properties: target.props
    })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)
    return true
  } catch (err) {
    console.error('Failed to update memory:', err)
    memberProfile.value = snapshot
    return false
  }
}

async function forgetMemory(item: MemoryItem) {
  if (!currentMember.value || forgettingMemoryKey.value) return

  forgettingMemoryKey.value = item.key
  const target = currentMemoryTarget()

  detachMemory(target, item.entry)
  target.props.memory_log = memoryLog.value.filter(e => !sameMemoryEntry(e, item.entry))

  await persistMemoryTarget(target)
  forgettingMemoryKey.value = null
}

const memberAvatarConfig = computed(() => {
  if (!currentMember.value?.image_url) return null
  return stringToAvatarConfig(currentMember.value.image_url)
})

const ageGroupOptions = computed(() => [
  { label: t('profileSelection.ageGroups.child'), value: 'child' },
  { label: t('profileSelection.ageGroups.teen'), value: 'teen' },
  { label: t('profileSelection.ageGroups.adult'), value: 'adult' },
  { label: t('profileSelection.ageGroups.senior'), value: 'senior' }
])

const genderOptions = computed(() => [
  { label: t('profileSelection.genders.female'), value: 'female' },
  { label: t('profileSelection.genders.male'), value: 'male' },
  { label: t('profileSelection.genders.other'), value: 'other' },
  { label: t('profileSelection.genders.prefer_not_to_say'), value: 'prefer_not_to_say' }
])

const dietaryOptions = computed(() => [
  {
    value: 'omnivore',
    label: t('profileSelection.setupWizard.dietary.omnivore.label'),
    description: t('profileSelection.setupWizard.dietary.omnivore.description'),
    icon: 'i-lucide-utensils'
  },
  {
    value: 'vegetarian',
    label: t('profileSelection.setupWizard.dietary.vegetarian.label'),
    description: t('profileSelection.setupWizard.dietary.vegetarian.description'),
    icon: 'i-lucide-carrot'
  },
  {
    value: 'vegan',
    label: t('profileSelection.setupWizard.dietary.vegan.label'),
    description: t('profileSelection.setupWizard.dietary.vegan.description'),
    icon: 'i-lucide-leaf'
  },
  {
    value: 'pescatarian',
    label: t('profileSelection.setupWizard.dietary.pescatarian.label'),
    description: t('profileSelection.setupWizard.dietary.pescatarian.description'),
    icon: 'i-lucide-fish'
  },
  {
    value: 'flexitarian',
    label: t('profileSelection.setupWizard.dietary.flexitarian.label'),
    description: t('profileSelection.setupWizard.dietary.flexitarian.description'),
    icon: 'i-lucide-sprout'
  }
])

const allergyOptions = computed(() => [
  { value: 'gluten', label: t('myProfile.allergyOptions.gluten'), icon: 'i-lucide-wheat' },
  { value: 'dairy', label: t('myProfile.allergyOptions.dairy'), icon: 'i-lucide-milk' },
  { value: 'eggs', label: t('myProfile.allergyOptions.eggs'), icon: 'i-lucide-egg' },
  { value: 'nuts', label: t('myProfile.allergyOptions.nuts'), icon: 'i-lucide-nut' },
  { value: 'peanuts', label: t('myProfile.allergyOptions.peanuts'), icon: 'i-lucide-nut' },
  { value: 'soy', label: t('myProfile.allergyOptions.soy'), icon: 'i-lucide-bean' },
  { value: 'shellfish', label: t('myProfile.allergyOptions.shellfish'), icon: 'i-lucide-shell' },
  { value: 'fish', label: t('myProfile.allergyOptions.fish'), icon: 'i-lucide-fish' },
  { value: 'sesame', label: t('myProfile.allergyOptions.sesame'), icon: 'i-lucide-circle-dot' },
  { value: 'sulfites', label: t('myProfile.allergyOptions.sulfites'), icon: 'i-lucide-flask-conical' },
  { value: 'lactose', label: t('myProfile.allergyOptions.lactose'), icon: 'i-lucide-milk' },
  { value: 'fructose', label: t('myProfile.allergyOptions.fructose'), icon: 'i-lucide-apple' }
])

const availableDiets = computed(() => {
  return dietaryOptions.value.filter(d => !currentDietaryGroups.value.includes(d.value as DietaryGroup))
})

const availableAllergies = computed(() => {
  return allergyOptions.value.filter(a => !allergies.value.includes(a.value))
})

// Filtered foods based on category, search, and dietary compatibility
const filteredFoods = computed(() => {
  let foods = getFoodsByCategory(
    selectedFoodCategory.value,
    currentDietaryGroups.value as DietaryGroup[]
  )

  if (foodSearch.value) {
    const search = foodSearch.value.toLowerCase()
    foods = foods.filter(f => getFoodName(f.id).toLowerCase().includes(search))
  }

  return foods
})

// Foods in the current view that can still be toggled (not already saved on either list)
const selectableFoods = computed(() => filteredFoods.value.filter(f => !isAlreadySelected(f.id)))

const allSelectableSelected = computed(() => {
  if (selectableFoods.value.length === 0) return false
  return selectableFoods.value.every(f => selectedFoods.value.includes(f.id))
})

const ageGroupLabel = computed(() => {
  if (!currentMember.value?.age_group) return t('myProfile.values.notSpecified')
  const option = ageGroupOptions.value.find(o => o.value === currentMember.value?.age_group)
  return option?.label || currentMember.value.age_group
})

// Gender rides in the profile's nutritional_preferences blob, not on the member.
const genderLabel = computed(() => {
  const gender = memberProfile.value?.nutritional_preferences?.gender
  if (!gender) return t('myProfile.values.notSpecified')
  const option = genderOptions.value.find(o => o.value === gender)
  return option?.label || gender
})

const dateLocale = computed(() => {
  if (locale.value === 'hu') return 'hu-HU'
  if (locale.value === 'sl') return 'sl-SI'
  return 'en-US'
})

const memberSince = computed(() => {
  const dateStr = currentMember.value?.joined_at || currentMember.value?.created_at
  if (!dateStr) return t('myProfile.values.unknown')
  const date = new Date(dateStr)
  return date.toLocaleDateString(dateLocale.value, { month: 'long', year: 'numeric' })
})

function getDietIcon(diet: string): string {
  return dietaryOptions.value.find(d => d.value === diet)?.icon || 'i-lucide-utensils'
}

function getDietLabel(diet: string): string {
  return dietaryOptions.value.find(d => d.value === diet)?.label || diet
}

function getDietDescription(diet: string): string {
  return dietaryOptions.value.find(d => d.value === diet)?.description || ''
}

function getFoodIcon(foodId: string): string {
  return getFoodById(foodId)?.icon || 'i-lucide-utensils'
}

function getFoodName(foodId: string): string {
  const fallbackName = getFoodById(foodId)?.name || foodId
  const key = `myProfile.foodItems.${foodId}`
  return te(key) ? t(key) : fallbackName
}

function getAllergyLabel(allergy: string): string {
  return allergyOptions.value.find(a => a.value === allergy)?.label || allergy
}

function getFoodCategoryLabel(categoryId: string, fallbackLabel: string): string {
  const key = `myProfile.foodCategories.${categoryId}`
  return te(key) ? t(key) : fallbackLabel
}

function isAlreadySelected(foodId: string): boolean {
  if (foodPickerMode.value === 'likes') {
    return foodLikes.value.includes(foodId) || foodDislikes.value.includes(foodId)
  }
  return foodDislikes.value.includes(foodId) || foodLikes.value.includes(foodId)
}

function openFoodPicker(mode: 'likes' | 'dislikes') {
  foodPickerMode.value = mode
  selectedFoods.value = []
  foodSearch.value = ''
  selectedFoodCategory.value = 'proteins'
  showFoodPicker.value = true
}

function toggleFood(foodId: string) {
  if (isAlreadySelected(foodId)) return

  const idx = selectedFoods.value.indexOf(foodId)
  if (idx === -1) {
    selectedFoods.value = [...selectedFoods.value, foodId]
  } else {
    selectedFoods.value = selectedFoods.value.filter(id => id !== foodId)
  }
}

function toggleSelectAll() {
  const ids = selectableFoods.value.map(f => f.id)
  if (allSelectableSelected.value) {
    selectedFoods.value = selectedFoods.value.filter(id => !ids.includes(id))
  } else {
    const set = new Set([...selectedFoods.value, ...ids])
    selectedFoods.value = Array.from(set)
  }
}

// Initialize edit forms when member changes
watch(currentMember, (member) => {
  // Don't re-seed the edit form while it's open: saving changes currentMember
  // (updateMember swaps selectedMember), and re-seeding mid-save reverts the
  // user's in-progress choices — notably gender, written after that point.
  if (showEditDetails.value) return
  if (member) {
    editName.value = member.name
    editAgeGroup.value = member.age_group
    editGender.value = memberProfile.value?.nutritional_preferences?.gender
    if (member.image_url?.startsWith('avatar:')) {
      const idx = parseInt(member.image_url.slice(7), 10)
      if (!isNaN(idx) && idx >= 0 && idx < avatarPresets.length) {
        editAvatarIndex.value = idx
      }
    }
  }
}, { immediate: true })

// Load member profile on mount
onMounted(async () => {
  if (!householdStore.initialized) {
    loading.value = true
    await householdStore.initialize()
    loading.value = false
  }

  // Load profile data if member exists
  if (currentMember.value?.id) {
    await loadMemberProfile()
  }

  // Not awaited with the rest: the privacy switch settling a moment later is
  // better than the whole page waiting on it.
  void loadAnalyticsConsent()
})

async function loadMemberProfile() {
  if (!currentMember.value?.id) return

  try {
    const response = await householdStore.getMemberProfile(currentMember.value.id)
    if (response) {
      memberProfile.value = response as MemberProfile
      // Seed the edit form now the profile (where gender lives) is loaded.
      editGender.value = memberProfile.value?.nutritional_preferences?.gender
    }
  } catch {
    // Profile might not exist yet
    memberProfile.value = {
      dietary_groups: [],
      allergies: [],
      nutritional_preferences: {}
    }
  }
}

async function saveAvatar() {
  if (!currentMember.value) return

  isSaving.value = true
  try {
    await householdStore.updateMember(currentMember.value.id, {
      image_url: `avatar:${editAvatarIndex.value}`
    })
    showAvatarEditor.value = false
  } catch (err) {
    console.error('Failed to save avatar:', err)
  } finally {
    isSaving.value = false
  }
}

async function saveDetails() {
  if (!currentMember.value || !editName.value.trim()) return

  isSaving.value = true
  // Snapshot the form values BEFORE the first write. updateMember() changes
  // currentMember, which fires watch(currentMember) and re-seeds editGender
  // from the not-yet-updated profile — reading editGender after that point
  // silently reverts the user's choice, so gender never persisted.
  const memberId = currentMember.value.id
  const chosenGender = editGender.value
  try {
    await householdStore.updateMember(memberId, {
      name: editName.value.trim(),
      age_group: editAgeGroup.value as 'child' | 'teen' | 'adult' | 'senior' | undefined
    })

    // Gender lives in the profile's nutritional_preferences blob, not on the
    // member, so it's always a second write. Send it every save rather than
    // diffing against a possibly-stale local copy — the earlier change-guard
    // silently dropped the write when the loaded profile hadn't populated yet.
    const nutPrefs: NutritionalPreferences = {
      ...memberProfile.value?.nutritional_preferences
    }
    if (chosenGender) {
      nutPrefs.gender = chosenGender as NutritionalPreferences['gender']
    } else {
      delete nutPrefs.gender
    }
    const payload = buildProfilePayload({ nutritional_preferences: nutPrefs })
    await householdStore.updateMemberProfile(memberId, payload)
    memberProfile.value = { ...memberProfile.value, nutritional_preferences: nutPrefs }
    // Re-seed the form: the watcher may have reverted editGender mid-save.
    editGender.value = chosenGender

    showEditDetails.value = false
  } catch (err) {
    console.error('[saveDetails] failed:', err)
  } finally {
    isSaving.value = false
  }
}

async function addDiet() {
  if (!currentMember.value || !selectedNewDiet.value) return

  isSaving.value = true
  try {
    const newDiets = [...currentDietaryGroups.value, selectedNewDiet.value as DietaryGroup]
    const payload = buildProfilePayload({ dietary_groups: newDiets })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)

    memberProfile.value = { ...memberProfile.value, dietary_groups: newDiets }
    selectedNewDiet.value = null
    showAddDiet.value = false
  } catch (err) {
    console.error('Failed to add diet:', err)
  } finally {
    isSaving.value = false
  }
}

async function removeDiet(diet: string) {
  if (!currentMember.value) return

  isSaving.value = true
  try {
    const newDiets = currentDietaryGroups.value.filter(d => d !== diet)
    const payload = buildProfilePayload({ dietary_groups: newDiets })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)

    memberProfile.value = { ...memberProfile.value, dietary_groups: newDiets }
  } catch (err) {
    console.error('Failed to remove diet:', err)
  } finally {
    isSaving.value = false
  }
}

// Build the full profile payload, preserving properties (internal field) as-is
function buildProfilePayload(overrides: Partial<MemberProfile>): MemberProfile {
  return {
    nutritional_preferences: memberProfile.value?.nutritional_preferences || {},
    dietary_groups: memberProfile.value?.dietary_groups || [],
    allergies: memberProfile.value?.allergies || [],
    properties: memberProfile.value?.properties || {},
    ...overrides
  }
}

async function saveFoodPreferences() {
  if (!currentMember.value || selectedFoods.value.length === 0) return

  isSaving.value = true
  try {
    const nutPrefs: NutritionalPreferences = {
      ...memberProfile.value?.nutritional_preferences
    }

    if (foodPickerMode.value === 'likes') {
      nutPrefs.food_likes = [...foodLikes.value, ...selectedFoods.value]
    } else {
      nutPrefs.food_dislikes = [...foodDislikes.value, ...selectedFoods.value]
    }

    const payload = buildProfilePayload({ nutritional_preferences: nutPrefs })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)

    memberProfile.value = { ...memberProfile.value, nutritional_preferences: nutPrefs }

    selectedFoods.value = []
    showFoodPicker.value = false
  } catch (err) {
    console.error('Failed to save food preferences:', err)
  } finally {
    isSaving.value = false
  }
}

async function removeFoodLike(foodId: string) {
  if (!currentMember.value) return

  isSaving.value = true
  try {
    const nutPrefs: NutritionalPreferences = {
      ...memberProfile.value?.nutritional_preferences,
      food_likes: foodLikes.value.filter(f => f !== foodId)
    }

    const payload = buildProfilePayload({ nutritional_preferences: nutPrefs })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)

    memberProfile.value = { ...memberProfile.value, nutritional_preferences: nutPrefs }
  } catch (err) {
    console.error('Failed to remove food like:', err)
  } finally {
    isSaving.value = false
  }
}

async function removeFoodDislike(foodId: string) {
  if (!currentMember.value) return

  isSaving.value = true
  try {
    const nutPrefs: NutritionalPreferences = {
      ...memberProfile.value?.nutritional_preferences,
      food_dislikes: foodDislikes.value.filter(f => f !== foodId)
    }

    const payload = buildProfilePayload({ nutritional_preferences: nutPrefs })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)

    memberProfile.value = { ...memberProfile.value, nutritional_preferences: nutPrefs }
  } catch (err) {
    console.error('Failed to remove food dislike:', err)
  } finally {
    isSaving.value = false
  }
}

async function addAllergy() {
  if (!currentMember.value || !selectedNewAllergy.value) return

  isSaving.value = true
  try {
    const newAllergies = [...allergies.value, selectedNewAllergy.value]
    const payload = buildProfilePayload({ allergies: newAllergies })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)

    memberProfile.value = { ...memberProfile.value, allergies: newAllergies }

    selectedNewAllergy.value = null
    showAddAllergy.value = false
  } catch (err) {
    console.error('Failed to add allergy:', err)
  } finally {
    isSaving.value = false
  }
}

async function removeAllergy(allergy: string) {
  if (!currentMember.value) return

  isSaving.value = true
  try {
    const newAllergies = allergies.value.filter(a => a !== allergy)
    const payload = buildProfilePayload({ allergies: newAllergies })
    await householdStore.updateMemberProfile(currentMember.value.id, payload)

    memberProfile.value = { ...memberProfile.value, allergies: newAllergies }
  } catch (err) {
    console.error('Failed to remove allergy:', err)
  } finally {
    isSaving.value = false
  }
}

async function deleteProfile() {
  if (!currentMember.value) return

  isDeleting.value = true
  deleteError.value = null

  try {
    await householdStore.deleteMember(currentMember.value.id)
    showDeleteConfirm.value = false
    navigateTo('/profiles')
  } catch (err) {
    console.error('Failed to delete profile:', err)
    deleteError.value = t('myProfile.errors.deleteProfileFailed')
  } finally {
    isDeleting.value = false
  }
}

// ── Household and account erasure ──

const showDeleteHouseholdConfirm = ref(false)
const showDeleteAccountConfirm = ref(false)
/**
 * Typing the confirmation phrase is required for the account, and only for the
 * account: it is the one action here that cannot be undone by re-entering data.
 */
const accountConfirmInput = ref('')
const accountConfirmPhrase = computed(() => t('myProfile.dangerZone.confirmPhrase'))
const accountConfirmed = computed(() =>
  accountConfirmInput.value.trim().toLowerCase() === accountConfirmPhrase.value.trim().toLowerCase()
)

/**
 * What is actually stored about a member, named from the code that stores it.
 * Kept in the profile page rather than only in the privacy policy so it sits
 * next to the controls that act on it.
 */
const dataKeptRows = computed(() => [
  {
    key: 'profile',
    icon: 'i-lucide-user',
    what: t('myProfile.dataKept.rows.profile.what'),
    detail: t('myProfile.dataKept.rows.profile.detail')
  },
  {
    key: 'memories',
    icon: 'i-lucide-brain',
    what: t('myProfile.dataKept.rows.memories.what'),
    detail: t('myProfile.dataKept.rows.memories.detail')
  },
  {
    key: 'plans',
    icon: 'i-lucide-calendar',
    what: t('myProfile.dataKept.rows.plans.what'),
    detail: t('myProfile.dataKept.rows.plans.detail')
  },
  {
    key: 'conversations',
    icon: 'i-lucide-message-square',
    what: t('myProfile.dataKept.rows.conversations.what'),
    detail: t('myProfile.dataKept.rows.conversations.detail')
  },
  {
    key: 'traces',
    icon: 'i-lucide-activity',
    what: t('myProfile.dataKept.rows.traces.what'),
    detail: t('myProfile.dataKept.rows.traces.detail')
  },
  {
    key: 'consent',
    icon: 'i-lucide-file-check',
    what: t('myProfile.dataKept.rows.consent.what'),
    detail: t('myProfile.dataKept.rows.consent.detail')
  }
])

async function deleteHousehold() {
  const householdId = householdStore.household?.id
  if (!householdId) return

  isDeleting.value = true
  deleteError.value = null

  try {
    await householdsApi.deleteHousehold(householdId)
    showDeleteHouseholdConfirm.value = false
    // The store's cached household and member selection are now stale.
    householdStore.$reset?.()
    await navigateTo('/dashboard')
  } catch (err) {
    console.error('Failed to delete household:', err)
    deleteError.value = t('myProfile.errors.deleteHouseholdFailed')
  } finally {
    isDeleting.value = false
  }
}

async function deleteAccount() {
  if (!accountConfirmed.value) return

  isDeleting.value = true
  deleteError.value = null

  try {
    const receipt = await consentApi.deleteAccount()
    if (!receipt?.erased) throw new Error('Erasure not confirmed by the server')
    showDeleteAccountConfirm.value = false
    // The account no longer exists, so there is no session to end politely —
    // drop local state and leave through the logged-out door.
    await authStore.logout('/?erased=1')
  } catch (err) {
    console.error('Failed to delete account:', err)
    deleteError.value = t('myProfile.errors.deleteAccountFailed')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}
</style>
