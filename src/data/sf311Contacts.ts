export type SF311ContactRow = {
  noheatDate: string;
  status: "Open" | "Closed";
  address: string;
  neighborhood: string;
  landlord?: string;
  dba?: string;
  entityType?: string;
  mailing?: string;
  email?: string;
  phone?: string;
};

export const sf311ContactRows: SF311ContactRow[] = [
  {
    noheatDate: "2026-06-26",
    status: "Open",
    address: "953 KEARNY ST",
    neighborhood: "Chinatown",
  },
  {
    noheatDate: "2026-06-23",
    status: "Closed",
    address: "684 ELLIS ST",
    neighborhood: "Tenderloin",
    landlord: "Hotel Essex Lp",
    dba: "Essex Hotel",
    entityType: "entity",
    email: "ops@essexhotel.example.com",
    phone: "415-555-0190",
  },
  {
    noheatDate: "2026-06-07",
    status: "Closed",
    address: "350 TURK ST",
    neighborhood: "Tenderloin",
    landlord: "Central Towers Joint Venture LLC",
    entityType: "entity",
    email: "maintenance@centraltowers.example.com",
    phone: "415-555-0128",
  },
  {
    noheatDate: "2026-06-04",
    status: "Closed",
    address: "580 MCALLISTER ST",
    neighborhood: "Western Addition",
    landlord: "San Francisco Barbara LLC",
    entityType: "entity",
    email: "property@sfbarbara.example.com",
    phone: "415-555-0145",
  },
  {
    noheatDate: "2026-06-02",
    status: "Closed",
    address: "348 BUCHANAN ST",
    neighborhood: "Hayes Valley",
  },
  {
    noheatDate: "2026-06-25",
    status: "Open",
    address: "1201 SUTTER ST",
    neighborhood: "Nob Hill",
    landlord: "Sutter Crest Housing LLC",
    entityType: "entity",
    email: "maintenance@suttercrest.example.com",
    phone: "415-555-0172",
  },
  {
    noheatDate: "2026-06-18",
    status: "Open",
    address: "241 JONES ST",
    neighborhood: "Tenderloin",
    landlord: "Jones Street Residential Group",
    dba: "Jones Court Apartments",
    entityType: "entity",
    phone: "415-555-0164",
  },
  {
    noheatDate: "2026-05-30",
    status: "Closed",
    address: "88 6TH ST",
    neighborhood: "SoMa",
    dba: "Sixth Street Lofts",
    entityType: "business",
    email: "service@sixthstreetlofts.example.com",
  },
  {
    noheatDate: "2026-06-21",
    status: "Open",
    address: "1700 MARKET ST",
    neighborhood: "Civic Center",
    landlord: "Market Octavia Partners LLC",
    entityType: "entity",
    mailing: "PO Box 310, San Francisco, CA",
  },
];
