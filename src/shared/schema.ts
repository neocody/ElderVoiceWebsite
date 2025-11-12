// Shared schema types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  [key: string]: any;
}

export interface ElderlyUser {
  id: string;
  name: string;
  preferredName?: string;
  age?: number;
  phone: string;
  preferredCallDays?: string[];
  preferredCallTime?: string;
  callFrequency?: string;
  [key: string]: any;
}

export interface SelectService {
  id: string;
  key: string;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  discountType: "percentage" | "fixed";
  validFrom?: string;
  validUntil?: string;
  [key: string]: any;
}

