export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "DC Propertys",
  tagline: "Plots & land across Braj — Mathura · Vrindavan · Govardhan",
  phone: process.env.NEXT_PUBLIC_PHONE || "",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, ""),
  address: process.env.NEXT_PUBLIC_OFFICE_ADDRESS || "Mathura, Uttar Pradesh",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
};

/** Official UP land-record portals. They have no public API, so we deep-link for verification. */
export const landRecordLinks = {
  bhulekh: "https://upbhulekh.gov.in/",
  bhunaksha: "https://upbhunaksha.gov.in/",
};

export const MATHURA_CENTER: [number, number] = [27.4924, 77.6737];
