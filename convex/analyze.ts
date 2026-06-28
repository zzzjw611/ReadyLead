import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { analyzeBuildingOpportunity } from "../src/lib/analyzeBuildingOpportunity";
import { contractors as fallbackContractors } from "../src/data/contractors";
import type {
  Building,
  BuildingSignal,
  ContactPath,
  Contractor,
  OpportunityAnalysis,
} from "../src/types";

type BuildingDetail = {
  building: {
    _id: string;
    externalId: string;
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
  signals: Array<{
    _id: string;
    externalId: string;
    buildingId: string;
    type: string;
    date: string;
    text: string;
    source: string;
  }>;
  contactPaths: Array<{
    _id: string;
    externalId: string;
    buildingId: string;
    sourceType: string;
    targetType: string;
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
  }>;
};

type ContractorDoc = {
  _id: string;
  externalId: string;
  company: string;
  trade: string;
  location: string;
  serviceArea: string[];
  specialties: string[];
  email: string;
  phone: string;
};

function toAppBuilding(detail: BuildingDetail): Building {
  const building = detail.building;

  return {
    id: building.externalId,
    name: building.name,
    address: building.address,
    city: building.city,
    buildingType: building.buildingType,
    yearBuilt: building.yearBuilt,
    units: building.units,
    propertyManager: building.propertyManager,
    managerEmail: building.managerEmail,
    systems: building.systems,
    lastMajorHVACPermitYear: building.lastMajorHVACPermitYear,
    lastPlumbingPermitYear: building.lastPlumbingPermitYear,
  };
}

function toSignalType(type: string): BuildingSignal["type"] {
  if (
    type === "resident_review" ||
    type === "permit_history" ||
    type === "hoa_minutes" ||
    type === "weather" ||
    type === "inspection" ||
    type === "plan_extraction"
  ) {
    return type;
  }

  return "inspection";
}

function toAppSignals(detail: BuildingDetail): BuildingSignal[] {
  return detail.signals.map((signal) => ({
    id: signal.externalId,
    buildingId: detail.building.externalId,
    type: toSignalType(signal.type),
    date: signal.date,
    text: signal.text,
    source: signal.source,
  }));
}

function toSourceType(sourceType: string): ContactPath["sourceType"] {
  if (
    sourceType === "property_website" ||
    sourceType === "google_business" ||
    sourceType === "county_assessor" ||
    sourceType === "secretary_of_state" ||
    sourceType === "permit_record" ||
    sourceType === "management_company_site" ||
    sourceType === "linkedin_search" ||
    sourceType === "email_pattern"
  ) {
    return sourceType;
  }

  return "management_company_site";
}

function toTargetType(targetType: string): ContactPath["targetType"] {
  if (
    targetType === "leasing_office" ||
    targetType === "property_manager" ||
    targetType === "facilities_manager" ||
    targetType === "regional_manager" ||
    targetType === "owner_entity" ||
    targetType === "registered_agent" ||
    targetType === "contact_form" ||
    targetType === "project_contact"
  ) {
    return targetType;
  }

  return "property_manager";
}

function toAppContactPaths(detail: BuildingDetail): ContactPath[] {
  return detail.contactPaths.map((contactPath) => ({
    id: contactPath.externalId,
    buildingId: detail.building.externalId,
    sourceType: toSourceType(contactPath.sourceType),
    targetType: toTargetType(contactPath.targetType),
    company: contactPath.company,
    personName: contactPath.personName,
    role: contactPath.role,
    phone: contactPath.phone,
    email: contactPath.email,
    url: contactPath.url,
    linkedinSearchUrl: contactPath.linkedinSearchUrl,
    confidence: contactPath.confidence,
    evidence: contactPath.evidence,
    isBestPath: contactPath.isBestPath,
  }));
}

function toTrade(trade: string): Contractor["trade"] {
  if (trade === "HVAC" || trade === "Plumbing" || trade === "Electrical") {
    return trade;
  }

  return "HVAC";
}

function toAppContractors(contractorDocs: ContractorDoc[]): Contractor[] {
  return contractorDocs.map((contractor) => ({
    id: contractor.externalId,
    company: contractor.company,
    trade: toTrade(contractor.trade),
    location: contractor.location,
    serviceArea: contractor.serviceArea,
    specialties: contractor.specialties,
    email: contractor.email,
    phone: contractor.phone,
  }));
}

function snapshotContactPath(analysis: OpportunityAnalysis) {
  return {
    company: analysis.bestContactPath.company,
    personName: analysis.bestContactPath.personName,
    role: analysis.bestContactPath.role,
    phone: analysis.bestContactPath.phone,
    email: analysis.bestContactPath.email,
    url: analysis.bestContactPath.url,
    linkedinSearchUrl: analysis.bestContactPath.linkedinSearchUrl,
    confidence: analysis.bestContactPath.confidence,
    evidence: analysis.bestContactPath.evidence,
    sourceType: analysis.bestContactPath.sourceType,
    targetType: analysis.bestContactPath.targetType,
  };
}

export const analyzeAndSaveOpportunity = action({
  args: {
    buildingId: v.id("buildings"),
  },
  handler: async (ctx, args) => {
    try {
      const detail = (await ctx.runQuery(api.buildings.getBuildingDetail, {
        buildingId: args.buildingId,
      })) as BuildingDetail | null;

      if (!detail) {
        return {
          success: false,
          error: "Building not found",
          buildingId: args.buildingId,
        };
      }

      const contractorDocs = (await ctx.runQuery(
        api.buildings.listContractors,
        {},
      )) as ContractorDoc[];
      const appContractors =
        contractorDocs.length > 0 ? toAppContractors(contractorDocs) : fallbackContractors;

      const analysis = await analyzeBuildingOpportunity({
        building: toAppBuilding(detail),
        signals: toAppSignals(detail),
        contactPaths: toAppContactPaths(detail),
        contractors: appContractors,
      });

      await ctx.runMutation(api.buildings.upsertOpportunity, {
        buildingId: args.buildingId,
        trade: analysis.trade,
        riskScore: analysis.riskScore,
        predictedNeed: analysis.predictedNeed,
        urgencyWindow: analysis.urgencyWindow,
        reason: analysis.reason,
        evidence: analysis.evidence,
        bestContactPath: snapshotContactPath(analysis),
        matchedContractors: analysis.matchedContractors,
        outreachDraft: analysis.outreachDraft,
      });

      return {
        success: true,
        buildingId: args.buildingId,
        riskScore: analysis.riskScore,
        predictedNeed: analysis.predictedNeed,
        urgencyWindow: analysis.urgencyWindow,
        evidence: analysis.evidence,
        updatedAt: analysis.updatedAt ?? Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        buildingId: args.buildingId,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error while analyzing building opportunity",
      };
    }
  },
});
