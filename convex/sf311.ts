import { mutation } from "./_generated/server";
import { sf311ContactRows } from "../src/data/sf311Contacts";
import { contractors as fallbackContractors } from "../src/data/contractors";
import { convertSF311RowsToNaraData } from "../src/lib/sf311ImportAdapter";
import { matchContractors } from "../src/lib/contractorMatchingAgent";
import type { Building, ContactPath, Contractor, MatchedContractor } from "../src/types";

const DEMO_TODAY = new Date("2026-06-27T00:00:00.000Z").getTime();

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function daysSince(date: string) {
  return Math.floor((DEMO_TODAY - new Date(`${date}T00:00:00.000Z`).getTime()) / 86400000);
}

function scoreSF311Row(row: (typeof sf311ContactRows)[number]) {
  let score = 60;

  if (row.status === "Open") score += 30;
  if (daysSince(row.noheatDate) <= 14) score += 20;
  score += 15;
  if (row.landlord || row.dba) score += 10;
  if (row.email || row.phone) score += 10;
  if (row.status === "Closed") score -= 20;

  return clampScore(score);
}

function bestContactPathSnapshot(contactPath: ContactPath) {
  return {
    company: contactPath.company,
    personName: contactPath.personName,
    role: contactPath.role,
    phone: contactPath.phone,
    email: contactPath.email,
    url: contactPath.url,
    linkedinSearchUrl: contactPath.linkedinSearchUrl,
    confidence: contactPath.confidence,
    evidence: contactPath.evidence,
    sourceType: contactPath.sourceType,
    targetType: contactPath.targetType,
  };
}

function toContractor(doc: {
  externalId: string;
  company: string;
  trade: string;
  location: string;
  serviceArea: string[];
  specialties: string[];
  email: string;
  phone: string;
}): Contractor {
  return {
    id: doc.externalId,
    company: doc.company,
    trade: doc.trade === "Plumbing" || doc.trade === "Electrical" ? doc.trade : "HVAC",
    location: doc.location,
    serviceArea: doc.serviceArea,
    specialties: doc.specialties,
    email: doc.email,
    phone: doc.phone,
  };
}

function fallbackOutreach({
  building,
  row,
  contractor,
}: {
  building: Building;
  row: (typeof sf311ContactRows)[number];
  contractor?: MatchedContractor;
}) {
  const contractorName = contractor?.company ?? "Bay Area HVAC Pros";

  return {
    subject: `Heating system follow-up for ${building.name}`,
    body: `Hello,

${contractorName} works with San Francisco multifamily buildings on heating system inspections and preventive HVAC maintenance.

SF 311 records show a ${row.status.toLowerCase()} no-heat complaint at ${row.address} in ${row.neighborhood}. This may indicate a follow-up heating system maintenance opportunity.

Could you route this to the person responsible for maintenance or vendor coordination?

Best,
${contractorName}`,
  };
}

export const importSF311DemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const existingBuildings = await ctx.db.query("buildings").collect();
    const sf311Buildings = existingBuildings.filter((building) =>
      building.externalId.startsWith("sf311_"),
    );

    for (const building of sf311Buildings) {
      const opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_buildingId", (q) => q.eq("buildingId", building._id))
        .collect();
      const signals = await ctx.db
        .query("signals")
        .withIndex("by_buildingId", (q) => q.eq("buildingId", building._id))
        .collect();
      const contactPaths = await ctx.db
        .query("contactPaths")
        .withIndex("by_buildingId", (q) => q.eq("buildingId", building._id))
        .collect();

      for (const opportunity of opportunities) await ctx.db.delete(opportunity._id);
      for (const signal of signals) await ctx.db.delete(signal._id);
      for (const contactPath of contactPaths) await ctx.db.delete(contactPath._id);
      await ctx.db.delete(building._id);
    }

    const converted = convertSF311RowsToNaraData(sf311ContactRows);
    const contractorDocs = await ctx.db.query("contractors").collect();
    const contractors =
      contractorDocs.length > 0 ? contractorDocs.map(toContractor) : fallbackContractors;
    let buildingsInserted = 0;
    let signalsInserted = 0;
    let contactPathsInserted = 0;
    let opportunitiesInserted = 0;

    for (const [index, building] of converted.buildings.entries()) {
      const row = sf311ContactRows[index];
      const signal = converted.signals.find((item) => item.buildingId === building.id);
      const buildingContactPaths = converted.contactPaths
        .filter((item) => item.buildingId === building.id)
        .sort((a, b) => b.confidence - a.confidence);
      const bestContactPath = buildingContactPaths[0];

      if (!row || !signal || !bestContactPath) continue;

      const buildingId = await ctx.db.insert("buildings", {
        externalId: building.id,
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
        createdAt: now,
      });
      buildingsInserted += 1;

      await ctx.db.insert("signals", {
        externalId: signal.id,
        buildingId,
        type: signal.type,
        date: signal.date,
        text: signal.text,
        source: signal.source,
        createdAt: now,
      });
      signalsInserted += 1;

      for (const contactPath of buildingContactPaths) {
        await ctx.db.insert("contactPaths", {
          externalId: contactPath.id,
          buildingId,
          sourceType: contactPath.sourceType,
          targetType: contactPath.targetType,
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
          createdAt: now,
        });
        contactPathsInserted += 1;
      }

      const riskScore = scoreSF311Row(row);
      const predictedNeed =
        row.status === "Open"
          ? "Heating system inspection / active no-heat response opportunity"
          : "Follow-up HVAC maintenance opportunity after no-heat complaint";
      const evidence = [
        `${row.status} no-heat complaint reported on ${row.noheatDate}.`,
        `${row.address} in ${row.neighborhood}, San Francisco.`,
        row.landlord || row.dba
          ? `Landlord/contact path identified as ${row.landlord || row.dba}.`
          : "SF 311 complaint provides address but no landlord registration was found.",
      ];
      const matchedContractors = matchContractors({
        building,
        contractors,
        opportunity: {
          trade: "HVAC",
          predictedNeed,
          evidence,
        },
      });

      await ctx.db.insert("opportunities", {
        buildingId,
        trade: "HVAC",
        riskScore,
        predictedNeed,
        urgencyWindow: row.status === "Open" ? "Next 7 days" : "Next 30-60 days",
        reason:
          "SF 311 records show a recent no-heat complaint, which may indicate a heating system maintenance opportunity for HVAC contractors.",
        evidence,
        bestContactPath: bestContactPathSnapshot(bestContactPath),
        matchedContractors,
        outreachDraft: fallbackOutreach({
          building,
          row,
          contractor: matchedContractors[0],
        }),
        createdAt: now,
        updatedAt: now,
      });
      opportunitiesInserted += 1;
    }

    return {
      rowsImported: sf311ContactRows.length,
      buildingsInserted,
      signalsInserted,
      contactPathsInserted,
      opportunitiesInserted,
    };
  },
});
