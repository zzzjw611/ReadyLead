import type {
  Building,
  BuildingSignal,
  ContactPath,
  Contractor,
  MatchedContractor,
  OpportunityAnalysis,
  OutreachDraft,
} from "../types";
import { rankContactPaths } from "./contactPathAgent";
import { matchContractors } from "./contractorMatchingAgent";
import { generateOutreachDraft } from "./outreachDraftAgent";
import { scoreBuildingSignals } from "./signalScoringAgent";

type ScoredOpportunity = {
  riskScore: number;
  predictedNeed: string;
  trade: "HVAC";
  urgencyWindow: string;
  reason: string;
  evidence: string[];
};

function fallbackEvidence(building: Building, signals: BuildingSignal[]) {
  const signalEvidence = signals.slice(0, 3).map((signal) => signal.text);

  if (signalEvidence.length > 0) {
    return signalEvidence;
  }

  return [`Building systems include ${building.systems.join(", ")}.`];
}

function fallbackScoredOpportunity(
  building: Building,
  signals: BuildingSignal[],
): ScoredOpportunity {
  return {
    riskScore: 50,
    predictedNeed: "HVAC maintenance opportunity under review",
    trade: "HVAC",
    urgencyWindow: "Needs analysis",
    reason: "This building has been indexed, but the signal analysis could not complete.",
    evidence: fallbackEvidence(building, signals),
  };
}

function fallbackContactPath(building: Building): ContactPath {
  return {
    id: `fallback_${building.id}`,
    buildingId: building.id,
    sourceType: "management_company_site",
    targetType: "property_manager",
    company: building.propertyManager,
    role: "Property Management Office",
    email: building.managerEmail,
    confidence: 50,
    evidence: "Fallback contact path from building profile.",
    isBestPath: true,
  };
}

function fallbackMatchedContractors(contractors: Contractor[]): MatchedContractor[] {
  const contractor =
    contractors.find((candidate) => candidate.trade === "HVAC") ?? contractors[0];

  if (!contractor) {
    return [];
  }

  return [
    {
      company: contractor.company,
      fitScore: contractor.trade === "HVAC" ? 60 : 35,
      reason:
        contractor.trade === "HVAC"
          ? "Fallback HVAC match selected because contractor matching could not complete."
          : "Fallback contractor selected because no HVAC contractor was available; trade fit should be verified.",
      email: contractor.email,
      phone: contractor.phone,
      specialties: contractor.specialties,
    },
  ];
}

function fallbackOutreachDraft(
  building: Building,
  matchedContractor?: MatchedContractor,
): OutreachDraft {
  const contractorName = matchedContractor?.company ?? "an HVAC contractor";

  return {
    subject: `Preventive HVAC review for ${building.name}`,
    body: `Hello,

${contractorName} works with buildings on preventive HVAC reviews and maintenance planning.

Based on the building profile and available maintenance signals, ${building.name} may be worth a preventive HVAC review.

Could you route this to the person responsible for maintenance or vendor coordination?

Best,
${matchedContractor?.company ?? "Nara Labs"}`,
  };
}

export async function analyzeBuildingOpportunity({
  building,
  signals,
  contactPaths,
  contractors,
}: {
  building: Building;
  signals: BuildingSignal[];
  contactPaths: ContactPath[];
  contractors: Contractor[];
}): Promise<OpportunityAnalysis> {
  let opportunity: ScoredOpportunity;
  let bestContactPath: ContactPath;
  let matchedContractors: MatchedContractor[];
  let outreachDraft: OutreachDraft;

  try {
    const scoring = await scoreBuildingSignals({
      building,
      signals: [...signals],
    });

    opportunity = {
      riskScore: scoring.riskScore,
      predictedNeed: scoring.predictedNeed,
      trade: scoring.trade,
      urgencyWindow: scoring.urgencyWindow,
      reason: scoring.reason,
      evidence: scoring.evidence,
    };
  } catch {
    opportunity = fallbackScoredOpportunity(building, signals);
  }

  try {
    const contactRanking = await rankContactPaths({
      building,
      contactPaths: [...contactPaths],
    });

    bestContactPath = contactRanking.bestContactPath;
  } catch {
    bestContactPath = fallbackContactPath(building);
  }

  try {
    matchedContractors = matchContractors({
      building,
      contractors: [...contractors],
      opportunity: {
        trade: opportunity.trade,
        predictedNeed: opportunity.predictedNeed,
        evidence: opportunity.evidence,
      },
    });
  } catch {
    matchedContractors = fallbackMatchedContractors(contractors);
  }

  const matchedContractor = matchedContractors[0];

  try {
    outreachDraft = matchedContractor
      ? await generateOutreachDraft({
          building,
          opportunity,
          bestContactPath,
          matchedContractor,
        })
      : fallbackOutreachDraft(building);
  } catch {
    outreachDraft = fallbackOutreachDraft(building, matchedContractor);
  }

  return {
    buildingId: building.id,
    riskScore: opportunity.riskScore,
    predictedNeed: opportunity.predictedNeed,
    trade: "HVAC",
    urgencyWindow: opportunity.urgencyWindow,
    reason: opportunity.reason,
    evidence: opportunity.evidence,
    bestContactPath,
    matchedContractors,
    outreachDraft,
    updatedAt: Date.now(),
  };
}
