import { usePlatformApi } from "@/composables/usePlatformApi";
import { useNotifications } from "@/composables/useNotifications";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { type ApplicationDTO } from "@/types/application.types";
import { type PagedApiResponse } from "@/types/api.types";

export const applicationManagementService = () => {
  const { get, post, put } = usePlatformApi();
  const { success } = useNotifications();
  const { t } = useI18nWithStorage();

  const getMyApplications = async (
    page: number = 0,
    size: number = 10,
    sort?: string
  ): Promise<PagedApiResponse<ApplicationDTO>> => {
    const url = `/application/all`;

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (sort) {
      params.append("sort", sort);
    }

    const response = await get(`${url}?${params.toString()}`);

    return response.data as PagedApiResponse<ApplicationDTO>;
  };

  const getApplications = async (
    page: number = 0,
    size: number = 10,
    sort?: string
  ): Promise<PagedApiResponse<ApplicationDTO>> => {
    const url = `/application/admin/all`;

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (sort) {
      params.append("sort", sort);
    }

    const response = await get(`${url}?${params.toString()}`);

    return response.data as PagedApiResponse<ApplicationDTO>;
  };

  const rejectApplication = async (
    applicationId: string
  ): Promise<ApplicationDTO> => {
    const url = `/application/${applicationId}/reject`;
    const response = await put(url);
    if (response.success) {
      success(t("application.messages.applicationRejected"));
    }
    return response.data as ApplicationDTO;
  };

  const approveApplication = async (
    applicationId: string
  ): Promise<ApplicationDTO> => {
    const url = `/application/${applicationId}/approve`;
    const response = await put(url);
    if (response.success) {
      success(t("application.messages.applicationApproved"));
    }
    return response.data as ApplicationDTO;
  };

  const getApplicationFileUrl = async (
    applicationId: string,
    fileName: string
  ): Promise<string> => {
    const url = `/application/file/${fileName}`;
    const response = await get(url);
    return response.data as string;
  };

  const createApplication = async (
    applicationData: ApplicationDTO,
    files: File[]
  ): Promise<ApplicationDTO> => {
    const url = `/application/apply`;

    const formData = new FormData();
    formData.append("application", JSON.stringify(applicationData));
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await post(url, formData);
    if (response.success) {
      success(t("application.messages.applicationSubmittedSuccessfully"));
    }

    return response.data as ApplicationDTO;
  };

  return {
    getMyApplications,
    getApplications,
    getApplicationFileUrl,
    createApplication,
    rejectApplication,
    approveApplication,
  };
};
