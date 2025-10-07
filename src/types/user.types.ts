// types/user.types.ts

import {
  type FoodProfileForm,
  type FoodProfileDTO,
} from "./food-profile.types";

// User form interface (for editing)
export interface UserForm {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
}

// API Response UserDTO (with complex objects)
export interface UserDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  foodProfile: FoodProfileDTO;
  createdAt?: string;
  updatedAt?: string;
}
