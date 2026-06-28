import type { Building, ContactPath } from "../types";

function slugifyCompany(company: string) {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildLinkedInSearchUrl(company: string, building: Building) {
  const keywords = encodeURIComponent(
    `${company} ${building.city} property manager facilities manager`,
  );

  return `https://www.linkedin.com/search/results/people/?keywords=${keywords}`;
}

export async function enrichContactPathsWithOrangeSlice({
  building,
  contactPaths,
}: {
  building: Building;
  contactPaths: ContactPath[];
}): Promise<ContactPath[]> {
  try {
    if (process.env.ORANGE_SLICE_API_KEY) {
      // Future integration point: call Orange Slice here to enrich contacts.
      // For the MVP, this remains deterministic mock enrichment and never blocks demo flow.
    }

    return contactPaths.map((contactPath) => {
      const companySlug = slugifyCompany(contactPath.company);
      const shouldAddUrl =
        !contactPath.url &&
        Boolean(companySlug) &&
        contactPath.sourceType !== "linkedin_search" &&
        contactPath.targetType !== "registered_agent";

      return {
        ...contactPath,
        confidence:
          contactPath.sourceType === "management_company_site"
            ? Math.min(95, contactPath.confidence + 2)
            : contactPath.confidence,
        url: shouldAddUrl
          ? `https://${companySlug}.example.com/contact`
          : contactPath.url,
        linkedinSearchUrl:
          contactPath.sourceType === "linkedin_search"
            ? contactPath.linkedinSearchUrl ??
              buildLinkedInSearchUrl(contactPath.company, building)
            : contactPath.linkedinSearchUrl,
      };
    });
  } catch {
    return contactPaths;
  }
}
