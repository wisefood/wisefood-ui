import { defineStore } from "pinia";
import { createHousehold, createHouseholdMember } from "@/services/householdService";

const MIN_MEMBERS = 1;
const MAX_MEMBERS = 10;
const DEFAULT_MEMBERS = 1;
const DEFAULT_TOTAL_STEPS = 4;

export type AgeGroup =
  | "baby"
  | "child"
  | "teen"
  | "yound_adult"
  | "adult"
  | "middle_aged"
  | "senio";

export type GenderOption = "female" | "male" | "non_binary" | "prefer_not_to_say" | "other";

export interface HouseholdWizardState {
  householdName: string;
  countryCode: string | null;
  memberCount: number;
  householdId: string | null;
  memberDrafts: HouseholdMemberDraft[];
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  creatingHousehold: boolean;
  creationError: unknown | null;
  creatingMembers: boolean;
}

export interface HouseholdMemberDraft {
  id: string | null;
  name: string;
  gender: GenderOption;
  ageGroup: AgeGroup;
  imageUrl: string;
  dietaryGroups: string[];
  nutritionalNotes: string;
  isPrimary: boolean;
}

type HouseholdWizardPayload = Partial<
  Pick<HouseholdWizardState, "householdName" | "countryCode" | "memberCount">
>;

function createMemberDraft(isPrimary = false): HouseholdMemberDraft {
  return {
    id: null,
    name: "",
    gender: "prefer_not_to_say",
    ageGroup: "adult",
    imageUrl: "",
    dietaryGroups: [],
    nutritionalNotes: "",
    isPrimary,
  };
}

function buildDraftCollection(count: number): HouseholdMemberDraft[] {
  return Array.from({ length: count }, (_, index) => createMemberDraft(index === 0));
}

export const useHouseholdWizardStore = defineStore("householdWizard", {
  state: (): HouseholdWizardState => ({
    householdName: "",
    countryCode: null,
    memberCount: DEFAULT_MEMBERS,
    householdId: null,
    memberDrafts: buildDraftCollection(DEFAULT_MEMBERS),
    currentStep: 1,
    totalSteps: DEFAULT_TOTAL_STEPS,
    completed: false,
    creatingHousehold: false,
    creationError: null,
    creatingMembers: false,
  }),

  getters: {
    hasHouseholdName: (state) => state.householdName.trim().length > 0,
    hasCountrySelection: (state) => Boolean(state.countryCode),
    isReadyForCreation(): boolean {
      return this.hasHouseholdName && this.hasCountrySelection && this.memberCount >= MIN_MEMBERS;
    },
    isHouseholdStepComplete(): boolean {
      return this.hasHouseholdName && this.hasCountrySelection;
    },
    progressPercent(): number {
      if (!this.totalSteps) return 0;
      return Math.min(100, Math.max(0, Math.round((this.currentStep / this.totalSteps) * 100)));
    },
    preparedMembers(state): Array<{
      name: string
      age_group: AgeGroup
      image_url?: string
      profile: {
        nutritional_preferences: Record<string, unknown>
        dietary_groups: string[]
      }
    }> {
      return state.memberDrafts.map((draft) => {
        const dietary = draft.dietaryGroups.length ? draft.dietaryGroups : ["omnivore"];
        const preferences: Record<string, unknown> = {};

        const trimmedNotes = draft.nutritionalNotes.trim();
        if (trimmedNotes) preferences.notes = trimmedNotes;
        preferences.gender = draft.gender === "prefer_not_to_say" ? "" : draft.gender;

        return {
          name: draft.name.trim(),
          age_group: draft.ageGroup,
          image_url: draft.imageUrl.trim() || undefined,
          profile: {
            nutritional_preferences: preferences,
            dietary_groups: dietary,
          },
        };
      });
    },
  },

  actions: {
    setHouseholdName(name: string) {
      this.householdName = name ?? "";
    },

    setCountryCode(code?: string | null) {
      this.countryCode = code && code.length ? code : null;
    },

    setMemberCount(count: number) {
      const normalized = Number.isFinite(count) ? Math.round(count) : DEFAULT_MEMBERS;
      this.memberCount = Math.min(MAX_MEMBERS, Math.max(MIN_MEMBERS, normalized));
      this.syncMemberDraftsWithCount();
    },

    setHouseholdId(id: string | null) {
      this.householdId = id;
    },

    setCreationError(error: unknown | null) {
      this.creationError = error ?? null;
    },

    setCreatingMembers(flag: boolean) {
      this.creatingMembers = flag;
    },

    setCurrentStep(step: number) {
      const next = Number.isFinite(step) ? Math.round(step) : 1;
      this.currentStep = Math.min(Math.max(1, next), this.totalSteps);
    },

    setTotalSteps(total: number) {
      const normalized = Number.isFinite(total) ? Math.max(1, Math.round(total)) : DEFAULT_TOTAL_STEPS;
      this.totalSteps = normalized;
      this.setCurrentStep(this.currentStep);
    },

    advanceStep() {
      if (this.currentStep < this.totalSteps) {
        this.currentStep += 1;
      }
    },

    goBack() {
      if (this.currentStep > 1) {
        this.currentStep -= 1;
      }
    },

    markCompleted() {
      this.completed = true;
    },

    async ensureHouseholdExists() {
      if (this.householdId) {
        return this.householdId;
      }

      if (!this.isReadyForCreation) {
        throw new Error("Household information is incomplete.");
      }

      this.creatingHousehold = true;
      this.setCreationError(null);

      try {
        const result = await createHousehold({
          name: this.householdName.trim(),
          region: this.countryCode as string,
          member_count: this.memberCount,
          metadata: {},
        });

        if (!result || !result.id) {
          throw new Error("Household creation response was missing an id.");
        }

        this.householdId = result.id;
        if (typeof result.member_count === "number") {
          this.memberCount = Math.min(MAX_MEMBERS, Math.max(MIN_MEMBERS, result.member_count));
          this.syncMemberDraftsWithCount();
        }
        return result.id;
      } catch (error) {
        this.setCreationError(error);
        throw error;
      } finally {
        this.creatingHousehold = false;
      }
    },

    bootstrap(payload: HouseholdWizardPayload) {
      if (payload.householdName !== undefined) {
        this.setHouseholdName(payload.householdName);
      }
      if (payload.countryCode !== undefined) {
        this.setCountryCode(payload.countryCode);
      }
      if (payload.memberCount !== undefined) {
        this.setMemberCount(payload.memberCount);
      }
    },

    reset() {
      this.householdName = "";
      this.countryCode = null;
      this.memberCount = DEFAULT_MEMBERS;
      this.householdId = null;
      this.memberDrafts = buildDraftCollection(DEFAULT_MEMBERS);
      this.currentStep = 1;
      this.totalSteps = DEFAULT_TOTAL_STEPS;
      this.completed = false;
      this.creatingHousehold = false;
      this.creationError = null;
      this.creatingMembers = false;
    },

    syncMemberDraftsWithCount() {
      if (this.memberDrafts.length > this.memberCount) {
        this.memberDrafts.splice(this.memberCount);
      } else {
        while (this.memberDrafts.length < this.memberCount) {
          this.memberDrafts.push(createMemberDraft(this.memberDrafts.length === 0));
        }
      }

      // Ensure first member remains flagged as primary
      this.memberDrafts.forEach((draft, index) => {
        draft.isPrimary = index === 0;
      });
    },

    updateMemberDraft(
      index: number,
      payload: Partial<Omit<HouseholdMemberDraft, "id" | "isPrimary">>
    ) {
      if (index < 0 || index >= this.memberDrafts.length) return;
      const draft = this.memberDrafts[index];
      if (payload.name !== undefined) draft.name = payload.name;
      if (payload.gender !== undefined) draft.gender = payload.gender;
      if (payload.ageGroup !== undefined) draft.ageGroup = payload.ageGroup;
      if (payload.imageUrl !== undefined) draft.imageUrl = payload.imageUrl;
      if (payload.dietaryGroups !== undefined) draft.dietaryGroups = [...payload.dietaryGroups];
      if (payload.nutritionalNotes !== undefined) draft.nutritionalNotes = payload.nutritionalNotes;
    },

    async submitMembers() {
      if (!this.householdId) throw new Error("No household to attach members to.");

      const members = this.preparedMembers.filter((member) => member.name.length > 0);
      if (!members.length) return;

      this.creatingMembers = true;
      try {
        await Promise.all(members.map((member) => createHouseholdMember(this.householdId as string, member)));
        this.memberCount = members.length;
        this.syncMemberDraftsWithCount();
      } finally {
        this.creatingMembers = false;
      }
    },
  },
});
