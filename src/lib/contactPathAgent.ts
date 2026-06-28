import type { Building, ContactPath } from "../types";

function createFallbackContactPath(building: Building): ContactPath {
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

function hasUsableContactMethod(contactPath: ContactPath) {
  return Boolean(contactPath.email || contactPath.phone || contactPath.url);
}

export function getContactPathPriority(contactPath: ContactPath): number {
  let priority = contactPath.confidence;

  if (contactPath.isBestPath && contactPath.confidence >= 70) {
    priority += 12;
  }

  if (hasUsableContactMethod(contactPath)) {
    priority += 8;
  }

  if (
    contactPath.sourceType === "property_website" &&
    contactPath.targetType === "contact_form"
  ) {
    priority += 30;
  }

  if (contactPath.targetType === "leasing_office" && contactPath.phone) {
    priority += 24;
  }

  if (
    contactPath.sourceType === "management_company_site" ||
    /management|property/i.test(contactPath.company)
  ) {
    priority += 20;
  }

  if (
    contactPath.sourceType === "permit_record" &&
    contactPath.targetType === "project_contact"
  ) {
    priority += 16;
  }

  if (
    contactPath.targetType === "property_manager" ||
    contactPath.targetType === "facilities_manager"
  ) {
    priority += 14;
  }

  if (contactPath.sourceType === "linkedin_search") {
    priority += 4;
  }

  if (contactPath.targetType === "owner_entity") {
    priority -= hasUsableContactMethod(contactPath) ? 8 : 18;
  }

  if (contactPath.targetType === "registered_agent") {
    priority -= 30;
  }

  return priority;
}

function buildConfidenceReasoning(bestPath: ContactPath, needsHumanVerification: boolean) {
  if (needsHumanVerification) {
    return "Only low-confidence contact paths are available, so human verification is recommended before outreach.";
  }

  if (
    bestPath.sourceType === "property_website" &&
    bestPath.targetType === "contact_form"
  ) {
    return `The best path is the official property website contact form with ${bestPath.confidence}% confidence.`;
  }

  if (bestPath.sourceType === "permit_record") {
    return `The best path is a ${bestPath.role.toLowerCase()} listed on a permit record, which is more actionable than legal or ownership records.`;
  }

  if (
    bestPath.targetType === "property_manager" ||
    bestPath.targetType === "facilities_manager" ||
    bestPath.sourceType === "management_company_site"
  ) {
    return `The best path is an operational property management contact with ${bestPath.confidence}% confidence.`;
  }

  if (bestPath.targetType === "leasing_office") {
    return `The best path is the leasing office phone path with ${bestPath.confidence}% confidence, likely useful for routing maintenance inquiries.`;
  }

  return `The best available path is ${bestPath.role} at ${bestPath.company} with ${bestPath.confidence}% confidence.`;
}

export async function rankContactPaths({
  building,
  contactPaths,
}: {
  building: Building;
  contactPaths: ContactPath[];
}): Promise<{
  bestContactPath: ContactPath;
  rankedContactPaths: ContactPath[];
  confidenceReasoning: string;
  needsHumanVerification: boolean;
}> {
  const paths =
    contactPaths.length > 0 ? [...contactPaths] : [createFallbackContactPath(building)];

  const rankedContactPaths = paths.sort((a, b) => {
    const priorityDelta = getContactPathPriority(b) - getContactPathPriority(a);
    return priorityDelta === 0 ? b.confidence - a.confidence : priorityDelta;
  });

  const bestContactPath = rankedContactPaths[0];
  const needsHumanVerification = bestContactPath.confidence < 65;

  return {
    bestContactPath,
    rankedContactPaths,
    confidenceReasoning: buildConfidenceReasoning(
      bestContactPath,
      needsHumanVerification,
    ),
    needsHumanVerification,
  };
}
