import type { Building, Contractor, MatchedContractor } from "../types";

type HvacOpportunity = {
  trade: "HVAC";
  predictedNeed: string;
  evidence: string[];
};

const BAY_AREA_CITIES = new Set([
  "san francisco",
  "san jose",
  "santa clara",
  "sunnyvale",
  "cupertino",
  "oakland",
  "daly city",
  "mountain view",
  "palo alto",
]);

function normalize(value: string) {
  return value.toLowerCase();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function opportunityText(opportunity: HvacOpportunity) {
  return normalize(`${opportunity.predictedNeed} ${opportunity.evidence.join(" ")}`);
}

function specialtiesText(contractor: Contractor) {
  return normalize(contractor.specialties.join(" "));
}

function isBayAreaCity(city: string) {
  return BAY_AREA_CITIES.has(normalize(city));
}

function hasBayAreaServiceArea(contractor: Contractor) {
  return contractor.serviceArea.some((city) => isBayAreaCity(city));
}

function isMultifamilyOrHoa(building: Building) {
  const buildingType = normalize(building.buildingType);
  return buildingType.includes("multifamily") || buildingType.includes("hoa");
}

function isCommercialOrMixedUse(building: Building) {
  const buildingType = normalize(building.buildingType);
  return buildingType.includes("commercial") || buildingType.includes("mixed-use");
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

export function calculateContractorFitScore({
  building,
  contractor,
  opportunity,
}: {
  building: Building;
  contractor: Contractor;
  opportunity: HvacOpportunity;
}): number {
  const city = normalize(building.city);
  const location = normalize(contractor.location);
  const serviceArea = contractor.serviceArea.map(normalize);
  const specialties = specialtiesText(contractor);
  const oppText = opportunityText(opportunity);
  let score = 0;

  if (contractor.trade === opportunity.trade) {
    score += 35;
  } else {
    score -= 50;
  }

  if (serviceArea.includes(city)) {
    score += 25;
  } else if (location.includes(city)) {
    score += 15;
  } else if (isBayAreaCity(building.city) && hasBayAreaServiceArea(contractor)) {
    score += 10;
  } else {
    score -= 20;
  }

  if (
    isMultifamilyOrHoa(building) &&
    includesAny(specialties, [
      "multifamily hvac",
      "apartment hvac",
      "multifamily central hvac",
      "hoa complexes",
      "hoa townhome",
      "large multifamily hvac",
    ])
  ) {
    score += 15;
  }

  if (
    isCommercialOrMixedUse(building) &&
    includesAny(specialties, [
      "commercial hvac",
      "commercial preventive maintenance",
      "office buildings",
      "mixed-use buildings",
      "rooftop replacement",
    ])
  ) {
    score += 15;
  }

  if (
    includesAny(oppText, ["rooftop", "rooftop hvac", "rooftop unit"]) &&
    includesAny(specialties, ["rooftop", "rooftop units", "rooftop package units"])
  ) {
    score += 10;
  }

  if (
    includesAny(oppText, ["central hvac", "central system", "central systems"]) &&
    includesAny(specialties, ["central hvac", "central hvac replacement"])
  ) {
    score += 10;
  }

  if (
    includesAny(specialties, [
      "preventive maintenance",
      "maintenance contracts",
      "maintenance agreements",
      "service plans",
    ])
  ) {
    score += 10;
  }

  if (
    includesAny(specialties, [
      "heat pump",
      "heat pumps",
      "cooling system",
      "cooling repairs",
      "ac repair",
      "emergency cooling",
    ])
  ) {
    score += 5;
  }

  return clampScore(score);
}

function buildMatchReason({
  building,
  contractor,
  opportunity,
  fitScore,
}: {
  building: Building;
  contractor: Contractor;
  opportunity: HvacOpportunity;
  fitScore: number;
}) {
  const cityServed =
    contractor.serviceArea.includes(building.city) || contractor.location.includes(building.city);
  const specialties = contractor.specialties.slice(0, 2).join(" and ");

  if (contractor.trade !== opportunity.trade) {
    return "Matched mainly because fewer HVAC contractors were available; trade fit should be verified.";
  }

  if (fitScore >= 85) {
    return `Strong fit because they serve ${building.city} and specialize in ${specialties}.`;
  }

  if (fitScore >= 70) {
    return cityServed
      ? `Good fit for ${building.city} with relevant specialties in ${specialties}.`
      : `Good Bay Area fit with relevant specialties in ${specialties}.`;
  }

  return `Potential fit based on HVAC trade match and specialties in ${specialties}, but location or scope should be verified.`;
}

export function matchContractors({
  building,
  contractors,
  opportunity,
}: {
  building: Building;
  contractors: Contractor[];
  opportunity: HvacOpportunity;
}): MatchedContractor[] {
  const scored = contractors
    .map((contractor) => {
      const fitScore = calculateContractorFitScore({
        building,
        contractor,
        opportunity,
      });

      return {
        contractor,
        fitScore,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);

  const hvacMatches = scored.filter(({ contractor }) => contractor.trade === opportunity.trade);
  const selected =
    hvacMatches.length >= 3
      ? hvacMatches.slice(0, 3)
      : [
          ...hvacMatches,
          ...scored
            .filter(({ contractor }) => contractor.trade !== opportunity.trade)
            .slice(0, 3 - hvacMatches.length),
        ];

  return selected.map(({ contractor, fitScore }) => ({
    company: contractor.company,
    fitScore,
    reason: buildMatchReason({
      building,
      contractor,
      opportunity,
      fitScore,
    }),
    email: contractor.email,
    phone: contractor.phone,
    specialties: contractor.specialties,
  }));
}
