import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const bestContactPathValidator = v.object({
  company: v.string(),
  personName: v.optional(v.string()),
  role: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  url: v.optional(v.string()),
  linkedinSearchUrl: v.optional(v.string()),
  confidence: v.number(),
  evidence: v.string(),
  sourceType: v.string(),
  targetType: v.string(),
});

const matchedContractorValidator = v.object({
  company: v.string(),
  fitScore: v.number(),
  reason: v.string(),
  email: v.string(),
  phone: v.string(),
  specialties: v.array(v.string()),
});

const outreachDraftValidator = v.object({
  subject: v.string(),
  body: v.string(),
});

export const listBuildingsWithOpportunities = query({
  args: {},
  handler: async (ctx) => {
    const buildings = await ctx.db.query("buildings").collect();

    const rows = await Promise.all(
      buildings.map(async (building) => {
        const opportunities = await ctx.db
          .query("opportunities")
          .withIndex("by_buildingId", (q) => q.eq("buildingId", building._id))
          .collect();

        const opportunity = opportunities.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

        return {
          id: building._id,
          externalId: building.externalId,
          name: building.name,
          city: building.city,
          buildingType: building.buildingType,
          units: building.units,
          yearBuilt: building.yearBuilt,
          systems: building.systems,
          opportunity,
          bestContactPathConfidence: opportunity?.bestContactPath.confidence ?? null,
        };
      }),
    );

    return rows.sort(
      (a, b) => (b.opportunity?.riskScore ?? 0) - (a.opportunity?.riskScore ?? 0),
    );
  },
});

export const getBuildingDetail = query({
  args: {
    buildingId: v.id("buildings"),
  },
  handler: async (ctx, args) => {
    const building = await ctx.db.get(args.buildingId);

    if (!building) {
      return null;
    }

    const signals = await ctx.db
      .query("signals")
      .withIndex("by_buildingId", (q) => q.eq("buildingId", args.buildingId))
      .collect();

    const contactPaths = await ctx.db
      .query("contactPaths")
      .withIndex("by_buildingId", (q) => q.eq("buildingId", args.buildingId))
      .collect();

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_buildingId", (q) => q.eq("buildingId", args.buildingId))
      .collect();

    const sortedSignals = signals.sort((a, b) => {
      const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
      return byDate === 0 ? b.createdAt - a.createdAt : byDate;
    });

    const sortedContactPaths = contactPaths.sort((a, b) => b.confidence - a.confidence);
    const bestContactPath =
      sortedContactPaths.find((contactPath) => contactPath.isBestPath === true) ??
      sortedContactPaths[0] ??
      null;

    const latestOpportunity = opportunities.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

    return {
      building,
      signals: sortedSignals,
      contactPaths: sortedContactPaths,
      bestContactPath,
      opportunity: latestOpportunity,
    };
  },
});

export const addSignalToBuilding = mutation({
  args: {
    buildingId: v.id("buildings"),
    type: v.string(),
    text: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("signals", {
      externalId: `injected_${now}`,
      buildingId: args.buildingId,
      type: args.type,
      date: new Date(now).toISOString(),
      text: args.text,
      source: args.source,
      createdAt: now,
    });
  },
});

export const upsertOpportunity = mutation({
  args: {
    buildingId: v.id("buildings"),
    trade: v.string(),
    riskScore: v.number(),
    predictedNeed: v.string(),
    urgencyWindow: v.string(),
    reason: v.string(),
    evidence: v.array(v.string()),
    bestContactPath: bestContactPathValidator,
    matchedContractors: v.array(matchedContractorValidator),
    outreachDraft: outreachDraftValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("opportunities")
      .withIndex("by_buildingId", (q) => q.eq("buildingId", args.buildingId))
      .first();

    const opportunityFields = {
      trade: args.trade,
      riskScore: args.riskScore,
      predictedNeed: args.predictedNeed,
      urgencyWindow: args.urgencyWindow,
      reason: args.reason,
      evidence: args.evidence,
      bestContactPath: args.bestContactPath,
      matchedContractors: args.matchedContractors,
      outreachDraft: args.outreachDraft,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, opportunityFields);
      return existing._id;
    }

    return await ctx.db.insert("opportunities", {
      buildingId: args.buildingId,
      ...opportunityFields,
      createdAt: now,
    });
  },
});

export const listContactPathsForBuilding = query({
  args: {
    buildingId: v.id("buildings"),
  },
  handler: async (ctx, args) => {
    const contactPaths = await ctx.db
      .query("contactPaths")
      .withIndex("by_buildingId", (q) => q.eq("buildingId", args.buildingId))
      .collect();

    return contactPaths.sort((a, b) => b.confidence - a.confidence);
  },
});

export const listContractors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contractors").collect();
  },
});
