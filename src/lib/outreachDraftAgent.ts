import type {
  Building,
  ContactPath,
  MatchedContractor,
  OutreachDraft,
} from "../types";

type DraftOpportunity = {
  riskScore: number;
  predictedNeed: string;
  urgencyWindow: string;
  reason: string;
  evidence: string[];
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function isContactForm(contactPath: ContactPath) {
  return contactPath.targetType === "contact_form" || Boolean(contactPath.url && !contactPath.email);
}

function buildingShortName(building: Building) {
  return building.name.replace(/\bResidences\b/i, "Apartments");
}

function subjectFor(building: Building, opportunity: DraftOpportunity) {
  const need = opportunity.predictedNeed.toLowerCase();

  if (need.includes("inspection") || need.includes("review")) {
    return `Preventive HVAC review for ${buildingShortName(building)}`;
  }

  if (need.includes("cooling")) {
    return `Cooling system inspection for ${buildingShortName(building)}`;
  }

  return `HVAC maintenance planning for ${buildingShortName(building)}`;
}

function audienceGreeting(building: Building, contactPath: ContactPath) {
  if (isContactForm(contactPath)) {
    return "Hello";
  }

  if (contactPath.personName) {
    return `Hi ${firstName(contactPath.personName)}`;
  }

  if (contactPath.company) {
    return `Hi ${contactPath.company} team`;
  }

  return `Hi ${building.propertyManager} team`;
}

function strongestEvidence(evidence: string[]) {
  return evidence.filter(Boolean).slice(0, 3);
}

function evidenceSentence(building: Building, opportunity: DraftOpportunity) {
  const evidenceItems = strongestEvidence(opportunity.evidence);

  if (evidenceItems.length === 0) {
    return `Based on the building profile and available maintenance signals, ${building.name} may be worth a preventive HVAC review.`;
  }

  if (evidenceItems.length === 1) {
    return `Signals suggest ${building.name} may be approaching an HVAC maintenance window, including: ${evidenceItems[0]}`;
  }

  const [first, ...rest] = evidenceItems;
  return `Signals suggest ${building.name} may be approaching an HVAC maintenance window, including ${first} Also noted: ${rest.join(" ")}`;
}

function confidenceNote(contactPath: ContactPath) {
  if (contactPath.confidence >= 65) {
    return "";
  }

  return "\n\nI may not have the exact right contact, so please feel free to point me to the right maintenance lead.";
}

function contractorIntro(contractor: MatchedContractor, building: Building) {
  const specialties = contractor.specialties.slice(0, 2).join(" and ");

  if (specialties) {
    return `${contractor.company} works with ${building.buildingType.toLowerCase()} properties on ${specialties}.`;
  }

  return `${contractor.company} works with properties on preventive HVAC inspections and maintenance planning.`;
}

export async function generateOutreachDraft({
  building,
  opportunity,
  bestContactPath,
  matchedContractor,
}: {
  building: Building;
  opportunity: DraftOpportunity;
  bestContactPath: ContactPath;
  matchedContractor: MatchedContractor;
}): Promise<OutreachDraft> {
  const subject = subjectFor(building, opportunity);
  const greeting = audienceGreeting(building, bestContactPath);
  const intro = contractorIntro(matchedContractor, building);
  const evidence = evidenceSentence(building, opportunity);
  const note = confidenceNote(bestContactPath);

  if (isContactForm(bestContactPath)) {
    return {
      subject,
      body: `${greeting},

${intro}

${evidence}

Could you route this to the person responsible for maintenance or vendor coordination?${note}

Best,
${matchedContractor.company}`,
    };
  }

  return {
    subject,
    body: `${greeting},

I'm reaching out from ${matchedContractor.company}. ${intro}

${evidence}

Given the ${opportunity.urgencyWindow.toLowerCase()} timing, would you be open to a quick preventive review this week or next?${note}

Best,
${matchedContractor.company}`,
  };
}
