// services/user-management.service.ts - Enhanced with utilities
import { usePlatformApi } from "@/composables/usePlatformApi";
import { useNotifications } from "@/composables/useNotifications";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { parseApiError } from "@/utils/validation.utils";
import type { UserDTO, UserForm } from "@/types/user.types";
import type { PagedApiResponse } from "@/types/api.types";
import type { FoodProfileForm } from "@/types/food-profile.types";

export const useUserManagementService = () => {
  const { get, post, put } = usePlatformApi();
  const { success, error } = useNotifications();
  const { t } = useI18nWithStorage();

  /**
   * Get current user profile
   */
  const getUserProfile = async (): Promise<UserDTO> => {
    const url = `/user-management/profile`;

    try {
      const response = await get(url);

      if (response.success) {
        return response.data as UserDTO;
      } else {
        throw new Error(response.data || "Failed to load profile");
      }
    } catch (err: any) {
      const errorMessage = parseApiError(err);
      console.error("Failed to load profile:", errorMessage);
      error(t("profile.errors.failedToLoadProfile"));
      throw err;
    }
  };

  /**
   * Get user profile by ID (for admin/management purposes)
   */
  const getUserProfileById = async (userId: string): Promise<UserDTO> => {
    const url = `/user-management/profile/${userId}`;

    try {
      const response = await get(url);

      if (response.success) {
        return response.data as UserDTO;
      } else {
        throw new Error(response.data || "Failed to load user profile");
      }
    } catch (err: any) {
      const errorMessage = parseApiError(err);
      console.error(`Failed to load profile for user ${userId}:`, errorMessage);
      error(t("profile.errors.failedToLoadProfile"));
      throw err;
    }
  };

  /**
   * Create a new user profile
   */
  const createUserProfile = async (profileData?: Partial<UserForm>) => {
    const url = `/user-management/profile`;

    try {
      const response = await post(url, profileData);

      if (response.success) {
        success("Profile created successfully");
        return response.data as UserDTO;
      } else {
        throw new Error(response.data || "Failed to create profile");
      }
    } catch (err: any) {
      const errorMessage = parseApiError(err);
      console.error("Failed to create profile:", errorMessage);
    }
  };

  /**
   * Update user profile with enhanced mapping and error handling
   */
  const updateUserProfile = async (userFormData: FoodProfileForm) => {
    const url = `/food-profile`;

    try {
      console.log("🚀 Starting profile update...");

      // Make API call
      const response = await post(url, userFormData);
      success(t("profile.messages.profileUpdatedSuccessfully"));
      return response.data;
    } catch (err: any) {
      const errorMessage = parseApiError(err);
      console.error("❌ Profile update failed:", errorMessage);

      error(t("profile.errors.failedToUpdateProfile"));
      throw err;
    }
  };

  const updateUserInfo = async (userFormData: UserForm) => {
    const url = `/user-management/profile`;

    try {
      console.log("🚀 Starting profile update...");

      // Make API call
      const response = await put(url, userFormData);
      success(t("profile.messages.profileUpdatedSuccessfully"));
      return response.data;
    } catch (err: any) {
      const errorMessage = parseApiError(err);
      console.error("❌ Profile update failed:", errorMessage);

      error(t("profile.errors.failedToUpdateProfile"));
      throw err;
    }
  };

  /**
   * Delete user profile
   */
  const deleteUserProfile = async (): Promise<void> => {
    const url = `/user-management/profile`;

    try {
      const response = await usePlatformApi().delete(url);

      if (response.success) {
        success("Profile deleted successfully");
      } else {
        throw new Error(response.data || "Failed to delete profile");
      }
    } catch (err: any) {
      const errorMessage = parseApiError(err);
      console.error("Failed to delete profile:", errorMessage);
      error("Failed to delete profile");
      throw err;
    }
  };

  /**
   * Get paginated list of user profiles (admin function)
   */
  const getUserProfiles = async (
    page: number = 0,
    size: number = 10,
    sort: string = "createdAt,DESC"
  ): Promise<PagedApiResponse<UserDTO>> => {
    const url = `/user-management/profiles`;

    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (sort) {
      params.append("sort", sort);
    }

    try {
      const response = await get(`${url}?${params.toString()}`);
      return response as PagedApiResponse<UserDTO>;
    } catch (err: any) {
      const errorMessage = parseApiError(err);
      console.error("Failed to load user profiles:", errorMessage);
      throw err;
    }
  };

  return {
    getUserProfile,
    getUserProfileById,
    getUserProfiles,
    createUserProfile,
    updateUserProfile,
    deleteUserProfile,
    updateUserInfo,
  };
};
