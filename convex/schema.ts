import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  buildings: defineTable({
    externalId: v.string(),
    name: v.string(),
    address: v.string(),
    city: v.string(),
    buildingType: v.string(),
    yearBuilt: v.number(),
    units: v.number(),
    propertyManager: v.string(),
    managerEmail: v.string(),
    systems: v.array(v.string()),
    lastMajorHVACPermitYear: v.optional(v.number()),
    lastPlumbingPermitYear: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_externalId", ["externalId"]),

  signals: defineTable({
    externalId: v.string(),
    buildingId: v.id("buildings"),
    type: v.string(),
    date: v.string(),
    text: v.string(),
    source: v.string(),
    createdAt: v.number(),
  })
    .index("by_buildingId", ["buildingId"])
    .index("by_externalId", ["externalId"]),

  contractors: defineTable({
    externalId: v.string(),
    company: v.string(),
    trade: v.string(),
    location: v.string(),
    serviceArea: v.array(v.string()),
    specialties: v.array(v.string()),
    email: v.string(),
    phone: v.string(),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_trade", ["trade"]),

  contactPaths: defineTable({
    externalId: v.string(),
    buildingId: v.id("buildings"),
    sourceType: v.string(),
    targetType: v.string(),
    company: v.string(),
    personName: v.optional(v.string()),
    role: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    url: v.optional(v.string()),
    linkedinSearchUrl: v.optional(v.string()),
    confidence: v.number(),
    evidence: v.string(),
    isBestPath: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_buildingId", ["buildingId"])
    .index("by_externalId", ["externalId"]),

  opportunities: defineTable({
    buildingId: v.id("buildings"),
    trade: v.string(),
    riskScore: v.number(),
    predictedNeed: v.string(),
    urgencyWindow: v.string(),
    reason: v.string(),
    evidence: v.array(v.string()),
    bestContactPath: v.object({
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
    }),
    matchedContractors: v.array(
      v.object({
        company: v.string(),
        fitScore: v.number(),
        reason: v.string(),
        email: v.string(),
        phone: v.string(),
        specialties: v.array(v.string()),
      }),
    ),
    outreachDraft: v.object({
      subject: v.string(),
      body: v.string(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_buildingId", ["buildingId"])
    .index("by_riskScore", ["riskScore"]),
});
