export interface UserSettings {
  metricSystem: boolean;
  privacyMasking: boolean;
  language: "en" | "ja" | "fr" | "de" | "it";
  isPremium?: boolean;
}

export interface User {
  id: string;
  displayName: string;
  familyId?: string;
  settings: UserSettings;
}
