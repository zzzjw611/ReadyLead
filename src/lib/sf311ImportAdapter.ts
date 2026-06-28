import type { Building, BuildingSignal, ContactPath } from "../types";
import type { SF311ContactRow } from "../data/sf311Contacts";

function titleCaseAddress(address: string) {
  return address
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fakeYear(index: number) {
  const years = [1968, 1974, 1982, 1991, 1963, 1988, 1979, 1995, 1971];
  return years[index % years.length];
}

function fakeUnits(index: number) {
  const units = [42, 78, 112, 64, 28, 96, 55, 34, 84];
  return units[index % units.length];
}

function fakePermitYear(index: number) {
  const years = [2011, 2014, 2010, 2016, 2012, 2013, 2015, 2010, 2014];
  return years[index % years.length];
}

export function convertSF311RowsToNaraData(rows: SF311ContactRow[]): {
  buildings: Building[];
  signals: BuildingSignal[];
  contactPaths: ContactPath[];
} {
  return rows.reduce<{
    buildings: Building[];
    signals: BuildingSignal[];
    contactPaths: ContactPath[];
  }>(
    (acc, row, index) => {
      const id = `sf311_${index + 1}`;
      const displayAddress = titleCaseAddress(row.address);
      const company = row.landlord || row.dba || "Unknown property manager";
      const hasKnownOwner = Boolean(row.landlord || row.dba);
      const hasContactMethod = Boolean(row.email || row.phone);

      acc.buildings.push({
        id,
        name: displayAddress,
        address: `${row.address}, San Francisco, CA`,
        city: "San Francisco",
        buildingType: index % 3 === 0 ? "Mixed-use Building" : "Multifamily Apartment",
        yearBuilt: fakeYear(index),
        units: fakeUnits(index),
        propertyManager: company,
        managerEmail: row.email || "unknown@sf311.example.com",
        systems: ["heating system", "central HVAC", "boiler"],
        lastMajorHVACPermitYear: fakePermitYear(index),
      });

      acc.signals.push({
        id: `${id}_sig_1`,
        buildingId: id,
        type: row.status === "Open" ? "inspection" : "resident_review",
        date: row.noheatDate,
        text:
          row.status === "Open"
            ? `Open SF 311 no-heat complaint reported on ${row.noheatDate} at ${row.address} in ${row.neighborhood}.`
            : `Closed SF 311 no-heat complaint reported on ${row.noheatDate} at ${row.address} in ${row.neighborhood}.`,
        source: "DataSF 311 No-Heat Complaint",
      });

      acc.contactPaths.push({
        id: `${id}_cp_1`,
        buildingId: id,
        sourceType: hasKnownOwner ? "management_company_site" : "county_assessor",
        targetType: hasKnownOwner ? "property_manager" : "owner_entity",
        company,
        role: hasKnownOwner ? "Property Management Contact" : "Property Management Office",
        phone: row.phone,
        email: row.email,
        confidence: hasKnownOwner ? (hasContactMethod ? 80 : 65) : 40,
        evidence: hasKnownOwner
          ? hasContactMethod
            ? `Business registration data identifies ${company} as landlord/operator. Skip-trace contact path provides email/phone and needs human verification.`
            : `Business registration data identifies ${company} as landlord/operator, but direct contact information needs verification.`
          : "SF 311 complaint provides address but no landlord registration was found.",
        isBestPath: true,
      });

      return acc;
    },
    { buildings: [], signals: [], contactPaths: [] },
  );
}
