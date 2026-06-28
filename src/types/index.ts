export type Building = {
  id: string;
  name: string;
  address: string;
  city: string;
  buildingType: string;
  yearBuilt: number;
  units: number;
  propertyManager: string;
  managerEmail: string;
  systems: string[];
  lastMajorHVACPermitYear?: number;
  lastPlumbingPermitYear?: number;
};

export type BuildingSignal = {
  id: string;
  buildingId: string;
  type:
    | "resident_review"
    | "permit_history"
    | "hoa_minutes"
    | "weather"
    | "inspection"
    | "plan_extraction";
  date: string;
  text: string;
  source: string;
};

export type Contractor = {
  id: string;
  company: string;
  trade: "HVAC" | "Plumbing" | "Electrical";
  location: string;
  serviceArea: string[];
  specialties: string[];
  email: string;
  phone: string;
};

export type ContactPath = {
  id: string;
  buildingId: string;
  sourceType:
    | "property_website"
    | "google_business"
    | "county_assessor"
    | "secretary_of_state"
    | "permit_record"
    | "management_company_site"
    | "linkedin_search"
    | "email_pattern";
  targetType:
    | "leasing_office"
    | "property_manager"
    | "facilities_manager"
    | "regional_manager"
    | "owner_entity"
    | "registered_agent"
    | "contact_form"
    | "project_contact";
  company: string;
  personName?: string;
  role: string;
  phone?: string;
  email?: string;
  url?: string;
  linkedinSearchUrl?: string;
  confidence: number;
  evidence: string;
  isBestPath?: boolean;
};

export type MatchedContractor = {
  company: string;
  fitScore: number;
  reason: string;
  email: string;
  phone: string;
  specialties: string[];
};

export type OutreachDraft = {
  subject: string;
  body: string;
};

export type OpportunityAnalysis = {
  buildingId: string;
  riskScore: number;
  predictedNeed: string;
  trade: "HVAC";
  urgencyWindow: string;
  reason: string;
  evidence: string[];
  bestContactPath: ContactPath;
  matchedContractors: MatchedContractor[];
  outreachDraft: OutreachDraft;
  updatedAt?: number;
};
