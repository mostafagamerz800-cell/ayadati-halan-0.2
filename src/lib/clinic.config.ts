export type Language = "ar" | "en";
export type Localized = { ar: string; en: string };
export interface ClinicBranch {
  id: string;
  name: Localized;
  address?: Localized;
  hours?: Localized[];
  fee?: number;
  phone?: string;
  mapsUrl?: string;
  image?: string;
}
export interface ClinicConfig {
  verified: boolean;
  doctorName?: Localized;
  title?: Localized;
  specialty?: Localized;
  bio?: Localized;
  conditions?: {
    id: string;
    title: Localized;
    prompt: Localized;
    body: Localized;
    reviewer: Localized;
  }[];
  specialtyRows?: {
    id: string;
    title: Localized;
    image?: string;
    conditions: Localized[];
  }[];
  procedures?: { id: string; title: Localized; points: Localized[] }[];
  promo?: {
    title: Localized;
    description: Localized;
    action: Localized;
    route: string;
  };
  credentials: Localized[];
  yearsExperience?: number;
  portrait?: string;
  whatsappNumber?: string;
  branches: ClinicBranch[];
  services: { id: string; title: Localized; description: Localized }[];
  articles: {
    id: string;
    title: Localized;
    body: Localized;
    reviewer: Localized;
    date: string;
  }[];
  reviews: {
    quote: Localized;
    firstName: string;
    branchId: string;
    consent: true;
  }[];
}
// The old tenant seed contains unverified example identities and contact details.
// It is deliberately NOT promoted to verified medical content here.
// Add only owner-approved content. Flip verified only after checking its provenance.
export const clinicConfig: ClinicConfig = {
  verified: false,
  credentials: [],
  branches: [],
  services: [],
  articles: [],
  reviews: [],
};

// Each tenant keeps its own approved presentation. Never fall back to another doctor's content.
export const clinicConfigs: Record<string, ClinicConfig> = {};
export function getClinicConfig(tenantId: string): ClinicConfig {
  return clinicConfigs[tenantId] || clinicConfig;
}
