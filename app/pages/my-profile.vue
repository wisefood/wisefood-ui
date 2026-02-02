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
          Back to Dashboard
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <UIcon name="i-lucide-loader-2" class="h-12 w-12 animate-spin mx-auto mb-4 text-brand-500" />
          <p class="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>

      <!-- No Profile Selected -->
      <UCard v-else-if="!currentMember" class="text-center">
        <div class="py-8">
          <UIcon name="i-lucide-user-x" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Profile Selected
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Please select a profile from your household to manage it.
          </p>
          <UButton color="primary" to="/profiles">
            Go to Profiles
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
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profile Details</h2>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-pencil"
                size="sm"
                @click="showEditDetails = true"
              >
                Edit
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
              <span class="text-gray-600 dark:text-gray-400">Name</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ currentMember.name }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
              <span class="text-gray-600 dark:text-gray-400">Age Group</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ ageGroupLabel }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-gray-600 dark:text-gray-400">Member Since</span>
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
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Dietary Preferences</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="showAddDiet = true"
              >
                Add
              </UButton>
            </div>
          </template>

          <div v-if="currentDietaryGroups.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-utensils-crossed" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">No dietary preferences set</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="showAddDiet = true"
            >
              Add your first preference
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
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-heart" class="w-5 h-5 text-pink-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Food Likes</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="openFoodPicker('likes')"
              >
                Add
              </UButton>
            </div>
          </template>

          <div v-if="foodLikes.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-heart" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">No favorite foods added yet</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="openFoodPicker('likes')"
            >
              Add foods you love
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
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-thumbs-down" class="w-5 h-5 text-orange-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Food Dislikes</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="openFoodPicker('dislikes')"
              >
                Add
              </UButton>
            </div>
          </template>

          <div v-if="foodDislikes.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-thumbs-down" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">No disliked foods added yet</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="openFoodPicker('dislikes')"
            >
              Add foods to avoid
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
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Allergies & Intolerances</h2>
              </div>
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-plus"
                size="sm"
                @click="showAddAllergy = true"
              >
                Add
              </UButton>
            </div>
          </template>

          <div v-if="allergies.length === 0" class="text-center py-6">
            <UIcon name="i-lucide-shield-check" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400 text-sm">No allergies or intolerances recorded</p>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="mt-2"
              @click="showAddAllergy = true"
            >
              Add allergy or intolerance
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

        <!-- Danger Zone -->
        <UCard
          :ui="{
            ring: 'ring-1 ring-red-200 dark:ring-red-900/50'
          }"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
              <h2 class="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            </div>
          </template>

          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Delete this profile</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Once deleted, this profile cannot be recovered.</p>
            </div>
            <UButton
              color="red"
              variant="soft"
              icon="i-lucide-trash-2"
              @click="showDeleteConfirm = true"
            >
              Delete Profile
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Edit Avatar Modal -->
      <UModal v-model:open="showAvatarEditor">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Change Avatar</h3>
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
                  Cancel
                </UButton>
                <UButton color="primary" :loading="isSaving" @click="saveAvatar">
                  Save Avatar
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
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile Details</h3>
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
              <UFormField label="Name" required>
                <UInput
                  v-model="editName"
                  placeholder="Profile name"
                  size="lg"
                  icon="i-lucide-user"
                />
              </UFormField>

              <UFormField label="Age Group">
                <USelectMenu
                  v-model="editAgeGroup"
                  :items="ageGroupOptions"
                  placeholder="Select age group"
                  size="lg"
                  value-key="value"
                />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showEditDetails = false">
                  Cancel
                </UButton>
                <UButton
                  color="primary"
                  :loading="isSaving"
                  :disabled="!editName.trim()"
                  @click="saveDetails"
                >
                  Save Changes
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
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Dietary Preference</h3>
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
              You've added all available dietary preferences.
            </p>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showAddDiet = false">
                  Cancel
                </UButton>
                <UButton
                  color="primary"
                  :loading="isSaving"
                  :disabled="!selectedNewDiet"
                  @click="addDiet"
                >
                  Add Preference
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Food Picker Modal -->
      <UModal v-model:open="showFoodPicker">
        <template #content>
          <UCard class="max-h-[80vh] flex flex-col">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ foodPickerMode === 'likes' ? 'Add Foods You Like' : 'Add Foods You Dislike' }}
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
            <div class="mb-4">
              <UInput
                v-model="foodSearch"
                placeholder="Search foods..."
                icon="i-lucide-search"
                size="lg"
              />
            </div>

            <!-- Category tabs -->
            <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
              <UButton
                v-for="cat in foodCategories"
                :key="cat.id"
                :variant="selectedFoodCategory === cat.id ? 'solid' : 'soft'"
                :color="selectedFoodCategory === cat.id ? 'primary' : 'gray'"
                size="sm"
                @click="selectedFoodCategory = cat.id"
              >
                <UIcon :name="cat.icon" class="w-4 h-4 mr-1" />
                {{ cat.name }}
              </UButton>
            </div>

            <!-- Diet compatibility notice -->
            <div v-if="currentDietaryGroups.length > 0" class="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div class="flex items-start gap-2">
                <UIcon name="i-lucide-info" class="w-4 h-4 text-blue-500 mt-0.5" />
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  Showing foods compatible with your dietary preferences: {{ currentDietaryGroups.map(d => getDietLabel(d)).join(', ') }}
                </p>
              </div>
            </div>

            <!-- Foods grid -->
            <div class="flex-1 overflow-y-auto">
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
                    class="w-5 h-5"
                    :class="selectedFoods.includes(food.id)
                      ? foodPickerMode === 'likes' ? 'text-pink-500' : 'text-orange-500'
                      : 'text-gray-400'"
                  />
                  <span class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ food.name }}</span>
                  <UIcon
                    v-if="selectedFoods.includes(food.id)"
                    name="i-lucide-check"
                    class="w-4 h-4 ml-auto"
                    :class="foodPickerMode === 'likes' ? 'text-pink-500' : 'text-orange-500'"
                  />
                </button>
              </div>

              <p v-if="filteredFoods.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No foods found matching your search.
              </p>
            </div>

            <template #footer>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ selectedFoods.length }} selected
                </span>
                <div class="flex gap-3">
                  <UButton variant="ghost" color="gray" @click="showFoodPicker = false">
                    Cancel
                  </UButton>
                  <UButton
                    :color="foodPickerMode === 'likes' ? 'pink' : 'orange'"
                    :loading="isSaving"
                    :disabled="selectedFoods.length === 0"
                    @click="saveFoodPreferences"
                  >
                    Add {{ selectedFoods.length }} Food{{ selectedFoods.length !== 1 ? 's' : '' }}
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
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Allergy or Intolerance</h3>
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
              You've added all common allergies.
            </p>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" color="gray" @click="showAddAllergy = false">
                  Cancel
                </UButton>
                <UButton
                  color="red"
                  :loading="isSaving"
                  :disabled="!selectedNewAllergy"
                  @click="addAllergy"
                >
                  Add Allergy
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
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delete Profile</h3>
              </div>
            </template>

            <p class="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{{ currentMember?.name }}</strong>? This action cannot be undone.
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
                  Cancel
                </UButton>
                <UButton
                  color="red"
                  :loading="isDeleting"
                  @click="deleteProfile"
                >
                  Delete Profile
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
import { ref, computed, watch } from 'vue'
import { useHouseholdStore } from '@/stores/household'
import { stringToAvatarConfig, avatarPresets } from '~/utils/avatarPresets'
import {
  foodCategories,
  foodItems,
  getFoodsByCategory,
  getFoodById,
  type DietaryGroup
} from '~/utils/foodPreferences'
import type { MemberProfile } from '~/services/householdsApi'

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: 'My Profile'
})

const householdStore = useHouseholdStore()

const loading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

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

// Food preferences from profile properties
const foodLikes = computed(() => {
  const props = memberProfile.value?.properties as Record<string, unknown> | undefined
  return (props?.food_likes as string[]) || []
})

const foodDislikes = computed(() => {
  const props = memberProfile.value?.properties as Record<string, unknown> | undefined
  return (props?.food_dislikes as string[]) || []
})

const allergies = computed(() => {
  const props = memberProfile.value?.properties as Record<string, unknown> | undefined
  return (props?.allergies as string[]) || []
})

const memberAvatarConfig = computed(() => {
  if (!currentMember.value?.image_url) return null
  return stringToAvatarConfig(currentMember.value.image_url)
})

const ageGroupOptions = [
  { label: 'Child (0-12)', value: 'child' },
  { label: 'Teen (13-19)', value: 'teen' },
  { label: 'Adult (20-64)', value: 'adult' },
  { label: 'Senior (65+)', value: 'senior' }
]

const dietaryOptions = [
  { value: 'omnivore', label: 'Omnivore', description: 'Eats everything', icon: 'i-lucide-utensils' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat', icon: 'i-lucide-carrot' },
  { value: 'vegan', label: 'Vegan', description: 'Plant-based only', icon: 'i-lucide-leaf' },
  { value: 'pescatarian', label: 'Pescatarian', description: 'Fish & plants', icon: 'i-lucide-fish' },
  { value: 'flexitarian', label: 'Flexitarian', description: 'Mostly plant-based', icon: 'i-lucide-sprout' }
]

const allergyOptions = [
  { value: 'gluten', label: 'Gluten', icon: 'i-lucide-wheat' },
  { value: 'dairy', label: 'Dairy', icon: 'i-lucide-milk' },
  { value: 'eggs', label: 'Eggs', icon: 'i-lucide-egg' },
  { value: 'nuts', label: 'Tree Nuts', icon: 'i-lucide-nut' },
  { value: 'peanuts', label: 'Peanuts', icon: 'i-lucide-nut' },
  { value: 'soy', label: 'Soy', icon: 'i-lucide-bean' },
  { value: 'shellfish', label: 'Shellfish', icon: 'i-lucide-shell' },
  { value: 'fish', label: 'Fish', icon: 'i-lucide-fish' },
  { value: 'sesame', label: 'Sesame', icon: 'i-lucide-circle-dot' },
  { value: 'sulfites', label: 'Sulfites', icon: 'i-lucide-flask-conical' },
  { value: 'lactose', label: 'Lactose', icon: 'i-lucide-milk' },
  { value: 'fructose', label: 'Fructose', icon: 'i-lucide-apple' }
]

const availableDiets = computed(() => {
  return dietaryOptions.filter(d => !currentDietaryGroups.value.includes(d.value as DietaryGroup))
})

const availableAllergies = computed(() => {
  return allergyOptions.filter(a => !allergies.value.includes(a.value))
})

// Filtered foods based on category, search, and dietary compatibility
const filteredFoods = computed(() => {
  let foods = getFoodsByCategory(
    selectedFoodCategory.value,
    currentDietaryGroups.value as DietaryGroup[]
  )

  if (foodSearch.value) {
    const search = foodSearch.value.toLowerCase()
    foods = foods.filter(f => f.name.toLowerCase().includes(search))
  }

  return foods
})

const ageGroupLabel = computed(() => {
  if (!currentMember.value?.age_group) return 'Not specified'
  const option = ageGroupOptions.find(o => o.value === currentMember.value?.age_group)
  return option?.label || currentMember.value.age_group
})

const memberSince = computed(() => {
  if (!currentMember.value?.created_at) return 'Unknown'
  const date = new Date(currentMember.value.created_at)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function getDietIcon(diet: string): string {
  return dietaryOptions.find(d => d.value === diet)?.icon || 'i-lucide-utensils'
}

function getDietLabel(diet: string): string {
  return dietaryOptions.find(d => d.value === diet)?.label || diet
}

function getDietDescription(diet: string): string {
  return dietaryOptions.find(d => d.value === diet)?.description || ''
}

function getFoodIcon(foodId: string): string {
  return getFoodById(foodId)?.icon || 'i-lucide-utensils'
}

function getFoodName(foodId: string): string {
  return getFoodById(foodId)?.name || foodId
}

function getAllergyLabel(allergy: string): string {
  return allergyOptions.find(a => a.value === allergy)?.label || allergy
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
    selectedFoods.value.push(foodId)
  } else {
    selectedFoods.value.splice(idx, 1)
  }
}

// Initialize edit forms when member changes
watch(currentMember, (member) => {
  if (member) {
    editName.value = member.name
    editAgeGroup.value = member.age_group
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
})

async function loadMemberProfile() {
  if (!currentMember.value?.id) return

  try {
    const response = await householdStore.updateMemberProfile(currentMember.value.id, {})
    if (response) {
      memberProfile.value = response as MemberProfile
    }
  } catch {
    // Profile might not exist yet
    memberProfile.value = {
      dietary_groups: [],
      nutritional_preferences: {},
      properties: {}
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
  try {
    await householdStore.updateMember(currentMember.value.id, {
      name: editName.value.trim(),
      age_group: editAgeGroup.value as 'child' | 'teen' | 'adult' | 'senior' | undefined
    })
    showEditDetails.value = false
  } catch (err) {
    console.error('Failed to save details:', err)
  } finally {
    isSaving.value = false
  }
}

async function addDiet() {
  if (!currentMember.value || !selectedNewDiet.value) return

  isSaving.value = true
  try {
    const newDiets = [...currentDietaryGroups.value, selectedNewDiet.value as DietaryGroup]
    await householdStore.updateMemberProfile(currentMember.value.id, {
      ...memberProfile.value,
      dietary_groups: newDiets
    })
    memberProfile.value = {
      ...memberProfile.value,
      dietary_groups: newDiets
    }
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
    await householdStore.updateMemberProfile(currentMember.value.id, {
      ...memberProfile.value,
      dietary_groups: newDiets
    })
    memberProfile.value = {
      ...memberProfile.value,
      dietary_groups: newDiets
    }
  } catch (err) {
    console.error('Failed to remove diet:', err)
  } finally {
    isSaving.value = false
  }
}

async function saveFoodPreferences() {
  if (!currentMember.value || selectedFoods.value.length === 0) return

  isSaving.value = true
  try {
    const props = (memberProfile.value?.properties || {}) as Record<string, unknown>

    if (foodPickerMode.value === 'likes') {
      props.food_likes = [...foodLikes.value, ...selectedFoods.value]
    } else {
      props.food_dislikes = [...foodDislikes.value, ...selectedFoods.value]
    }

    await householdStore.updateMemberProfile(currentMember.value.id, {
      ...memberProfile.value,
      properties: props
    })

    memberProfile.value = {
      ...memberProfile.value,
      properties: props
    }

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
    const props = (memberProfile.value?.properties || {}) as Record<string, unknown>
    props.food_likes = foodLikes.value.filter(f => f !== foodId)

    await householdStore.updateMemberProfile(currentMember.value.id, {
      ...memberProfile.value,
      properties: props
    })

    memberProfile.value = {
      ...memberProfile.value,
      properties: props
    }
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
    const props = (memberProfile.value?.properties || {}) as Record<string, unknown>
    props.food_dislikes = foodDislikes.value.filter(f => f !== foodId)

    await householdStore.updateMemberProfile(currentMember.value.id, {
      ...memberProfile.value,
      properties: props
    })

    memberProfile.value = {
      ...memberProfile.value,
      properties: props
    }
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
    const props = (memberProfile.value?.properties || {}) as Record<string, unknown>
    props.allergies = [...allergies.value, selectedNewAllergy.value]

    await householdStore.updateMemberProfile(currentMember.value.id, {
      ...memberProfile.value,
      properties: props
    })

    memberProfile.value = {
      ...memberProfile.value,
      properties: props
    }

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
    const props = (memberProfile.value?.properties || {}) as Record<string, unknown>
    props.allergies = allergies.value.filter(a => a !== allergy)

    await householdStore.updateMemberProfile(currentMember.value.id, {
      ...memberProfile.value,
      properties: props
    })

    memberProfile.value = {
      ...memberProfile.value,
      properties: props
    }
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
    deleteError.value = 'Failed to delete profile. Please try again.'
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
