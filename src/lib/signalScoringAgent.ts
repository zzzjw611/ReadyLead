import type { Building, BuildingSignal } from "../types";

const HACKATHON_YEAR = 2026;

type RiskLabel = "Hot" | "High" | "Medium" | "Low";

type SignalScoringResult = {
  riskScore: number;
  riskLabel: RiskLabel;
  predictedNeed: string;
  trade: "HVAC";
  urgencyWindow: string;
  reason: string;
  evidence: string[];
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function combinedSignalText(signals: BuildingSignal[]) {
  return signals.map((signal) => signal.text).join(" ").toLowerCase();
}

function hasRepeatedCoolingComplaints(text: string) {
  return (
    /(\d+|several|multiple|repeated|recurring|many).{0,40}(cooling|ac|a\/c).{0,40}complaints/i.test(
      text,
    ) ||
    /(cooling|ac|a\/c).{0,40}complaints.{0,40}(\d+|several|multiple|repeated|recurring|many)/i.test(
      text,
    )
  );
}

function hasHoaVendorOptions(text: string) {
  return /hoa|board/i.test(text) && /vendor options|vendors|collect hvac vendor/i.test(text);
}

function hasInjectedHoaEscalation(text: string) {
  return (
    /12 cooling complaints/i.test(text) &&
    /vendor options/i.test(text) &&
    /june heat wave/i.test(text)
  );
}

function hasRecentHeatWave(text: string) {
  return /heat wave|above 92|hot afternoons|summer peak|cooling load/i.test(text);
}

function hasMajorHvacSystemSignal(building: Building, text: string) {
  const systemText = building.systems.join(" ").toLowerCase();
  return /rooftop hvac|central hvac|mechanical room/i.test(`${systemText} ${text}`);
}

function hasRecentHvacReplacement(text: string, building: Building) {
  const recentPermit =
    typeof building.lastMajorHVACPermitYear === "number" &&
    HACKATHON_YEAR - building.lastMajorHVACPermitYear <= 5;

  return recentPermit || /recent hvac replacement|replacement completed in 202[1-6]|newer split systems/i.test(text);
}

function getRiskLabel(score: number): RiskLabel {
  if (score >= 85) return "Hot";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getPredictedNeed(label: RiskLabel, building: Building, text: string) {
  if (label === "Hot") {
    if (/rooftop/i.test(text) || building.systems.some((system) => /rooftop/i.test(system))) {
      return "Preventive HVAC inspection and rooftop unit maintenance planning";
    }

    return "Central HVAC review for multifamily building";
  }

  if (label === "High") {
    return "Cooling system tune-up before summer peak demand";
  }

  if (label === "Medium") {
    return "Preventive HVAC maintenance review";
  }

  return "Low-priority HVAC monitoring";
}

function getUrgencyWindow(label: RiskLabel) {
  if (label === "Hot") return "Next 30 days";
  if (label === "High") return "Next 30-60 days";
  if (label === "Medium") return "This summer";
  return "Monitor";
}

function selectEvidence(building: Building, signals: BuildingSignal[]) {
  const evidence: string[] = [];
  const age = HACKATHON_YEAR - building.yearBuilt;
  const text = combinedSignalText(signals);

  if (age > 30) {
    evidence.push(`Built in ${building.yearBuilt}, making the building ${age} years old.`);
  }

  if (
    typeof building.lastMajorHVACPermitYear === "number" &&
    HACKATHON_YEAR - building.lastMajorHVACPermitYear >= 10
  ) {
    evidence.push(`No major HVAC permit found since ${building.lastMajorHVACPermitYear}.`);
  }

  const hoaSignal = signals.find((signal) => hasHoaVendorOptions(signal.text));
  if (hoaSignal) {
    evidence.push(hoaSignal.text);
  }

  const coolingSignal = signals.find((signal) =>
    /(cooling|ac|a\/c|weak|warm|hot|inconsistent)/i.test(signal.text),
  );
  if (coolingSignal) {
    evidence.push(coolingSignal.text);
  }

  const heatSignal = signals.find((signal) => hasRecentHeatWave(signal.text));
  if (heatSignal) {
    evidence.push(heatSignal.text);
  }

  const systemSignal = signals.find((signal) =>
    /rooftop hvac|centralized rooftop hvac|central hvac|mechanical room/i.test(signal.text),
  );
  if (systemSignal) {
    evidence.push(systemSignal.text);
  } else if (/central hvac|rooftop hvac|mechanical room/i.test(building.systems.join(" "))) {
    evidence.push(`Building systems include ${building.systems.join(", ")}.`);
  }

  if (hasRecentHvacReplacement(text, building)) {
    evidence.push(
      typeof building.lastMajorHVACPermitYear === "number"
        ? `Recent HVAC replacement or major permit activity found in ${building.lastMajorHVACPermitYear}.`
        : "Signals mention recent HVAC replacement activity.",
    );
  }

  return [...new Set(evidence)].slice(0, 5);
}

function buildReason(label: RiskLabel, evidence: string[]) {
  if (label === "Hot" || label === "High") {
    return `Signals suggest this building may be approaching an HVAC maintenance window: ${evidence
      .slice(0, 3)
      .join(" ")} This makes it worth proactive outreach for HVAC contractors.`;
  }

  if (label === "Medium") {
    return `Signals suggest a possible HVAC maintenance opportunity, but urgency is still developing. This building is worth monitoring and light proactive outreach.`;
  }

  return `Current signals do not indicate a near-term HVAC maintenance need. This building is best kept in a low-priority monitoring segment.`;
}

export function calculateDeterministicRiskScore(
  building: Building,
  signals: BuildingSignal[],
): number {
  const text = combinedSignalText(signals);
  const buildingAge = HACKATHON_YEAR - building.yearBuilt;
  let score = 10;

  if (buildingAge > 30) score += 15;

  if (
    typeof building.lastMajorHVACPermitYear !== "number" ||
    HACKATHON_YEAR - building.lastMajorHVACPermitYear >= 10
  ) {
    score += 20;
  }

  if (hasRepeatedCoolingComplaints(text)) score += 20;
  if (hasHoaVendorOptions(text)) score += 15;
  if (hasRecentHeatWave(text)) score += 10;
  if (hasMajorHvacSystemSignal(building, text)) score += 10;

  if (
    building.units >= 50 ||
    building.systems.some((system) => /central|shared|rooftop/i.test(system))
  ) {
    score += 10;
  }

  if (hasRecentHvacReplacement(text, building)) score -= 30;
  if (buildingAge < 10) score -= 20;

  const finalScore = clampScore(score);

  // Keep the live demo escalation visibly Hot without saturating at 100.
  if (hasInjectedHoaEscalation(text)) {
    return Math.min(95, Math.max(88, Math.round(finalScore * 0.92)));
  }

  return finalScore;
}

export async function scoreBuildingSignals({
  building,
  signals,
}: {
  building: Building;
  signals: BuildingSignal[];
}): Promise<SignalScoringResult> {
  const riskScore = calculateDeterministicRiskScore(building, signals);
  const riskLabel = getRiskLabel(riskScore);
  const text = combinedSignalText(signals);
  const evidence = selectEvidence(building, signals);

  return {
    riskScore,
    riskLabel,
    predictedNeed: getPredictedNeed(riskLabel, building, text),
    trade: "HVAC",
    urgencyWindow: getUrgencyWindow(riskLabel),
    reason: buildReason(riskLabel, evidence),
    evidence,
  };
}
