import { type UserDTO } from "./user.types";

export enum ApplicationType {
  REGISTER_DIETITIAN,
  REGISTER_NUTRITIONIST,
}

export enum ApplicationStatus {
  SUBMITTED,
  APPROVED,
  REJECTED,
}

export interface ApplicationDTO {
  id: string;
  applicationType: ApplicationType;
  coverLetter: string;
  documents: string[];
  applicationStatus: ApplicationStatus;
  user: UserDTO;
  createdAt?: string;
  updatedAt?: string;
}
