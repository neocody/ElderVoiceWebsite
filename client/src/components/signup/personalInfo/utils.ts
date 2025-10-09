export const relationshipOptions = [
  "Spouse/Partner",
  "Adult Child",
  "Parent",
  "Sibling",
  "Other Family Member",
  "Friend",
  "Caregiver",
  "Healthcare Professional",
  "Other",
];

export const calculateAge = (dateString: string) => {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

export const formatPhoneInput = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10) {
    if (digits.length === 11 && digits.startsWith("1")) {
      digits = digits.slice(1);
    } else {
      digits = digits.slice(-10);
    }
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
    6,
    10
  )}`;
};

export const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
};

export const formatZipCode = (value: string) => {
  const cleaned = value.replace(/[^\d-]/g, "");
  if (cleaned.length <= 5) {
    return cleaned;
  } else if (cleaned.length <= 10 && cleaned.includes("-")) {
    return cleaned;
  } else if (cleaned.length === 6 && !cleaned.includes("-")) {
    return cleaned.slice(0, 5) + "-" + cleaned.slice(5);
  } else if (cleaned.length > 5 && !cleaned.includes("-")) {
    return cleaned.slice(0, 5) + "-" + cleaned.slice(5, 9);
  }
  return cleaned.slice(0, 10);
};

export const isZipCodeValid = (zip: string) => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};
