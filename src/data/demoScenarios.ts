import type { BuildingSignal } from "../types";

export type DemoScenario = {
  id: string;
  label: string;
  targetBuildingId: string;
  signalType: BuildingSignal["type"];
  source: string;
  text: string;
  expectedScoreAfterInjection: number;
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "scenario_hoa_heatwave",
    label: "Add New HOA Signal",
    targetBuildingId: "bldg_001",
    signalType: "hoa_minutes",
    source: "Mock HOA minutes",
    text: "HOA minutes: Board received 12 cooling complaints during the June heat wave and asked management to collect HVAC vendor options before the next meeting.",
    expectedScoreAfterInjection: 92,
  },
  {
    id: "scenario_rooftop_inspection",
    label: "Inspection Flags Aging Rooftop Equipment",
    targetBuildingId: "bldg_008",
    signalType: "inspection",
    source: "Mock inspection note",
    text: "Inspection note: Two rooftop package units showed compressor short-cycling and visible corrosion around condensate pans.",
    expectedScoreAfterInjection: 86,
  },
  {
    id: "scenario_plan_extraction",
    label: "Plan Extraction Finds Shared HVAC Dependency",
    targetBuildingId: "bldg_023",
    signalType: "plan_extraction",
    source: "Mock plan extraction",
    text: "Plan extraction: Package rooftop units serve multiple tenant zones through shared duct branches, increasing impact if one unit fails.",
    expectedScoreAfterInjection: 81,
  },
];
