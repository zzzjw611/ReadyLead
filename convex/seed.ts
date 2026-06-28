import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { buildings } from "../src/data/buildings";
import { signals } from "../src/data/signals";
import { contractors } from "../src/data/contractors";
import { contactPaths } from "../src/data/contactPaths";
import { expectedOutputs } from "../src/data/expectedOutputs";

type ContactPathSnapshot = {
  company: string;
  personName?: string;
  role: string;
  phone?: string;
  email?: string;
  url?: string;
  linkedinSearchUrl?: string;
  confidence: number;
  evidence: string;
  sourceType: string;
  targetType: string;
};

function snapshotContactPath(contactPath: {
  company: string;
  personName?: string;
  role: string;
  phone?: string;
  email?: string;
  url?: string;
  linkedinSearchUrl?: string;
  confidence: number;
  evidence: string;
  sourceType: string;
  targetType: string;
}): ContactPathSnapshot {
  return {
    company: contactPath.company,
    ...(contactPath.personName ? { personName: contactPath.personName } : {}),
    role: contactPath.role,
    ...(contactPath.phone ? { phone: contactPath.phone } : {}),
    ...(contactPath.email ? { email: contactPath.email } : {}),
    ...(contactPath.url ? { url: contactPath.url } : {}),
    ...(contactPath.linkedinSearchUrl
      ? { linkedinSearchUrl: contactPath.linkedinSearchUrl }
      : {}),
    confidence: contactPath.confidence,
    evidence: contactPath.evidence,
    sourceType: contactPath.sourceType,
    targetType: contactPath.targetType,
  };
}

function fallbackMatchedContractors(buildingCity: string) {
  const localHvac = contractors.filter(
    (contractor) =>
      contractor.trade === "HVAC" &&
      (contractor.location === buildingCity || contractor.serviceArea.includes(buildingCity)),
  );

  const fallbackHvac = contractors.filter((contractor) => contractor.trade === "HVAC");
  const selected = (localHvac.length > 0 ? localHvac : fallbackHvac).slice(0, 3);

  return selected.map((contractor, index) => ({
    company: contractor.company,
    fitScore: 78 - index * 4,
    reason: `${contractor.company} serves ${buildingCity} and has relevant HVAC specialties for this building profile.`,
    email: contractor.email,
    phone: contractor.phone,
    specialties: contractor.specialties,
  }));
}

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "opportunities",
      "contactPaths",
      "contractors",
      "signals",
      "buildings",
    ] as const;

    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();

      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    const now = Date.now();
    const buildingIdsByExternalId = new Map<string, Id<"buildings">>();

    for (const building of buildings) {
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

      buildingIdsByExternalId.set(building.id, buildingId);
    }

    let signalsInserted = 0;
    for (const signal of signals) {
      const buildingId = buildingIdsByExternalId.get(signal.buildingId);
      if (!buildingId) continue;

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
    }

    for (const contractor of contractors) {
      await ctx.db.insert("contractors", {
        externalId: contractor.id,
        company: contractor.company,
        trade: contractor.trade,
        location: contractor.location,
        serviceArea: contractor.serviceArea,
        specialties: contractor.specialties,
        email: contractor.email,
        phone: contractor.phone,
        createdAt: now,
      });
    }

    let contactPathsInserted = 0;
    for (const contactPath of contactPaths) {
      const buildingId = buildingIdsByExternalId.get(contactPath.buildingId);
      if (!buildingId) continue;

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

    let opportunitiesInserted = 0;
    for (const building of buildings) {
      const buildingId = buildingIdsByExternalId.get(building.id);
      if (!buildingId) continue;

      const expectedOutput = expectedOutputs.find(
        (output) => output.buildingId === building.id,
      );
      const buildingContactPaths = contactPaths
        .filter((contactPath) => contactPath.buildingId === building.id)
        .sort((a, b) => b.confidence - a.confidence);
      const bestContactPath =
        buildingContactPaths.find((contactPath) => contactPath.isBestPath === true) ??
        buildingContactPaths[0];
      const buildingSignals = signals.filter((signal) => signal.buildingId === building.id);

      if (!bestContactPath) continue;

      await ctx.db.insert("opportunities", {
        buildingId,
        trade: expectedOutput?.trade ?? "HVAC",
        riskScore: expectedOutput?.riskScore ?? 50,
        predictedNeed:
          expectedOutput?.predictedNeed ?? "HVAC maintenance opportunity under review",
        urgencyWindow: expectedOutput?.urgencyWindow ?? "Needs analysis",
        reason:
          expectedOutput?.reason ??
          "This building has been indexed but has not been fully analyzed yet.",
        evidence:
          expectedOutput?.evidence ??
          buildingSignals.slice(0, 3).map((signal) => signal.text),
        bestContactPath: snapshotContactPath(
          expectedOutput?.bestContactPath ?? bestContactPath,
        ),
        matchedContractors:
          expectedOutput?.matchedContractors ?? fallbackMatchedContractors(building.city),
        outreachDraft:
          expectedOutput?.outreachDraft ?? {
            subject: `Preventive HVAC review for ${building.name}`,
            body: `Hi ${building.propertyManager}, ${building.name} has been indexed as a potential HVAC maintenance opportunity. Our team can provide a preventive review before cooling issues become urgent.`,
          },
        createdAt: now,
        updatedAt: now,
      });

      opportunitiesInserted += 1;
    }

    return {
      buildingsInserted: buildingIdsByExternalId.size,
      signalsInserted,
      contractorsInserted: contractors.length,
      contactPathsInserted,
      opportunitiesInserted,
    };
  },
});
