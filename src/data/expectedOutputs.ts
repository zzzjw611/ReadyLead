import type { OpportunityAnalysis } from "../types";
import { contactPaths } from "./contactPaths";

const byId = (id: string) => {
  const path = contactPaths.find((contactPath) => contactPath.id === id);

  if (!path) {
    throw new Error(`Missing contact path fixture: ${id}`);
  }

  return path;
};

export const expectedOutputs: OpportunityAnalysis[] = [
  {
    buildingId: "bldg_001",
    riskScore: 72,
    predictedNeed: "Central HVAC service assessment and rooftop unit replacement planning",
    trade: "HVAC",
    urgencyWindow: "30-60 days",
    reason:
      "Mission Creek is an older, high-unit multifamily building with central and rooftop HVAC, repeated AC complaints, and no major HVAC permit since 2012.",
    evidence: [
      "Built in 1984 with 118 units.",
      "No major HVAC replacement permit found since 2012.",
      "Residents mention weak AC during hot afternoons.",
      "Recent 4-day heat wave increased cooling load.",
    ],
    bestContactPath: byId("cp_001"),
    matchedContractors: [
      {
        company: "Bay Area HVAC Pros",
        fitScore: 94,
        reason: "Strong San Francisco coverage with multifamily central HVAC and emergency cooling experience.",
        email: "dispatch@bayareahvacpros.example.com",
        phone: "415-555-0101",
        specialties: ["multifamily central HVAC", "rooftop units", "emergency cooling calls"],
      },
      {
        company: "Mission Mechanical Services",
        fitScore: 91,
        reason: "Relevant mechanical room upgrade and multifamily service plan experience.",
        email: "service@missionmechanical.example.com",
        phone: "415-555-0128",
        specialties: ["central HVAC", "mechanical room upgrades", "multifamily service plans"],
      },
    ],
    outreachDraft: {
      subject: "Cooling complaints at Mission Creek Residences",
      body:
        "Hi Daniel, Mission Creek appears to be seeing recurring AC complaints during recent hot afternoons, and the last major HVAC permit signal we found was from 2012. Bay Area HVAC Pros can provide a quick rooftop and central system assessment with recommendations before complaints become an emergency issue.",
    },
    updatedAt: 1718841600000,
  },
  {
    buildingId: "bldg_002",
    riskScore: 89,
    predictedNeed: "HOA vendor options for shared HVAC and condenser bank replacement",
    trade: "HVAC",
    urgencyWindow: "Immediate - next board cycle",
    reason:
      "Canyon Terrace has HOA minutes explicitly requesting vendor options, older shared HVAC infrastructure, and no modernization permit in 14 years.",
    evidence: [
      "Built in 1978 with 92 units.",
      "HOA board requested HVAC vendor options.",
      "No central HVAC modernization permit in the past 14 years.",
      "Plans indicate shared ducting and centralized condenser banks.",
    ],
    bestContactPath: byId("cp_003"),
    matchedContractors: [
      {
        company: "South Bay Mechanical",
        fitScore: 96,
        reason: "Best fit for San Jose HOA complexes, central HVAC replacement, and vendor-option requests.",
        email: "service@southbaymechanical.example.com",
        phone: "408-555-0144",
        specialties: ["HOA complexes", "central HVAC replacement", "preventive maintenance"],
      },
      {
        company: "Orchard City Mechanical",
        fitScore: 88,
        reason: "Strong South Bay HOA vendor program experience.",
        email: "quotes@orchardcitymechanical.example.com",
        phone: "408-555-0191",
        specialties: ["split system upgrades", "commercial maintenance", "HOA vendor programs"],
      },
    ],
    outreachDraft: {
      subject: "HVAC vendor options for Canyon Terrace HOA",
      body:
        "Hi Maya, I noticed Canyon Terrace HOA is reviewing recurring cooling complaints and vendor options. South Bay Mechanical supports HOA communities with shared HVAC assessments, replacement planning, and board-ready scopes so the board can compare options before the next meeting.",
    },
    updatedAt: 1718841600000,
  },
  {
    buildingId: "bldg_005",
    riskScore: 91,
    predictedNeed: "Mechanical room assessment and central HVAC replacement planning",
    trade: "HVAC",
    urgencyWindow: "0-30 days",
    reason:
      "El Camino Garden Apartments combines high unit count, old central systems, deferred maintenance notes, and repeated resident complaints.",
    evidence: [
      "Built in 1972 with 134 units.",
      "No major HVAC replacement permit found since 2008.",
      "Inspection mentions aging mechanical room equipment.",
      "Residents mention warm bedrooms and noisy vents.",
    ],
    bestContactPath: byId("cp_009"),
    matchedContractors: [
      {
        company: "South Bay Mechanical",
        fitScore: 95,
        reason: "South Bay coverage and central HVAC replacement experience for multifamily communities.",
        email: "service@southbaymechanical.example.com",
        phone: "408-555-0144",
        specialties: ["HOA complexes", "central HVAC replacement", "preventive maintenance"],
      },
      {
        company: "Silicon Valley Air Systems",
        fitScore: 90,
        reason: "Relevant Santa Clara coverage and preventive maintenance programs.",
        email: "team@svairsystems.example.com",
        phone: "408-555-0188",
        specialties: ["commercial preventive maintenance", "VAV systems", "heat pump upgrades"],
      },
    ],
    outreachDraft: {
      subject: "Central HVAC risk at El Camino Garden Apartments",
      body:
        "Hi Elena, El Camino Garden Apartments shows several signs of HVAC replacement risk: older central systems, no major permit since 2008, and recent resident comfort complaints. South Bay Mechanical can inspect the mechanical room and prepare a phased replacement plan for budget review.",
    },
    updatedAt: 1718841600000,
  },
  {
    buildingId: "bldg_014",
    riskScore: 87,
    predictedNeed: "HOA condenser bank assessment and board proposal",
    trade: "HVAC",
    urgencyWindow: "30 days",
    reason:
      "Serra Heights is an older HOA complex with repeated cooling complaints, shared ducting, and no major HVAC permit since 2012.",
    evidence: [
      "Built in 1989 with 84 units.",
      "HOA requested HVAC vendor options.",
      "Shared ducting and aging condenser banks were identified.",
      "No major HVAC permit found since 2012.",
    ],
    bestContactPath: byId("cp_027"),
    matchedContractors: [
      {
        company: "Fogline Climate Works",
        fitScore: 93,
        reason: "Local Daly City HOA cluster expertise and condenser bank experience.",
        email: "service@foglineclimate.example.com",
        phone: "650-555-0109",
        specialties: ["HOA townhome clusters", "condenser banks", "coastal corrosion checks"],
      },
      {
        company: "Golden Gate Climate Systems",
        fitScore: 86,
        reason: "Experienced with older building retrofits and rooftop HVAC diagnostics.",
        email: "hello@goldengateclimate.example.com",
        phone: "415-555-0112",
        specialties: ["commercial rooftop HVAC", "older building retrofits", "air balancing"],
      },
    ],
    outreachDraft: {
      subject: "Board-ready HVAC options for Serra Heights",
      body:
        "Hi Riley, Serra Heights appears to be evaluating HVAC vendors after repeated cooling complaints. Fogline Climate Works can provide a board-ready condenser bank assessment with repair, replacement, and maintenance options tailored to HOA decision-making.",
    },
    updatedAt: 1718841600000,
  },
  {
    buildingId: "bldg_016",
    riskScore: 90,
    predictedNeed: "Cooling tower and central HVAC control assessment",
    trade: "HVAC",
    urgencyWindow: "0-45 days",
    reason:
      "Fair Oaks Manor has a large unit count, aging central HVAC infrastructure, weak AC complaints, and inspection notes around cooling tower corrosion.",
    evidence: [
      "Built in 1987 with 102 units.",
      "No major central HVAC permit found since 2011.",
      "Residents mention weak AC and warm hallways.",
      "Inspection mentioned cooling tower corrosion and aging controls.",
    ],
    bestContactPath: byId("cp_031"),
    matchedContractors: [
      {
        company: "Silicon Valley Air Systems",
        fitScore: 92,
        reason: "Strong Sunnyvale coverage and preventive maintenance capability for central systems.",
        email: "team@svairsystems.example.com",
        phone: "408-555-0188",
        specialties: ["commercial preventive maintenance", "VAV systems", "heat pump upgrades"],
      },
      {
        company: "Northstar Building Mechanical",
        fitScore: 89,
        reason: "Experienced with large multifamily HVAC and capital replacement planning.",
        email: "ops@northstarmechanical.example.com",
        phone: "650-555-0146",
        specialties: ["asset manager reporting", "large multifamily HVAC", "capital replacement planning"],
      },
    ],
    outreachDraft: {
      subject: "Cooling tower and central HVAC concerns at Fair Oaks Manor",
      body:
        "Hi, Fair Oaks Manor is showing multiple cooling-risk signals, including weak AC complaints, aging controls, and cooling tower corrosion notes. Silicon Valley Air Systems can complete a focused assessment and provide maintenance versus replacement recommendations.",
    },
    updatedAt: 1718841600000,
  },
  {
    buildingId: "bldg_021",
    riskScore: 88,
    predictedNeed: "Mixed-use HVAC assessment across residential and retail zones",
    trade: "HVAC",
    urgencyWindow: "30-60 days",
    reason:
      "Market Street West has recurring cooling issues, older central HVAC, and mixed residential-retail systems that likely require coordinated assessment.",
    evidence: [
      "Built in 1979 with 96 units.",
      "No major HVAC replacement permit found since 2011.",
      "Residents and storefront tenants reported recurring cooling issues.",
      "Plan extraction indicates central HVAC plus rooftop retail units.",
    ],
    bestContactPath: byId("cp_041"),
    matchedContractors: [
      {
        company: "Bay Area HVAC Pros",
        fitScore: 91,
        reason: "Strong fit for San Francisco multifamily and rooftop unit service.",
        email: "dispatch@bayareahvacpros.example.com",
        phone: "415-555-0101",
        specialties: ["multifamily central HVAC", "rooftop units", "emergency cooling calls"],
      },
      {
        company: "BayVista Mechanical Care",
        fitScore: 89,
        reason: "Relevant mixed-use building and rooftop replacement experience.",
        email: "hello@bayvistamechanical.example.com",
        phone: "510-555-0114",
        specialties: ["mixed-use buildings", "rooftop replacement", "maintenance agreements"],
      },
    ],
    outreachDraft: {
      subject: "HVAC opportunity at Market Street West",
      body:
        "Hi Casey, Market Street West appears to have recurring residential and storefront cooling issues, with no major HVAC permit signal since 2011. Bay Area HVAC Pros can assess central and rooftop systems and provide a phased plan before peak summer load.",
    },
    updatedAt: 1718841600000,
  },
];
