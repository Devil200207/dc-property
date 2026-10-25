export const PROPERTY_TYPES = {
  residential: "Residential Plot",
  agricultural: "Agricultural Land",
  commercial: "Commercial Plot",
  farmhouse: "Farmhouse Land",
  other: "Other",
} as const;

export const STATUSES = {
  available: "Available",
  booked: "Booked",
  sold: "Sold",
  draft: "Draft (hidden)",
} as const;

export const AREA_UNITS = {
  sqyd: { label: "Gaj (Sq. Yd)", short: "gaj", sqm: 0.836127 },
  sqft: { label: "Sq. Ft", short: "sq ft", sqm: 0.092903 },
  sqm: { label: "Sq. Metre", short: "sq m", sqm: 1 },
  bigha: { label: "Bigha", short: "bigha", sqm: null },
  biswa: { label: "Biswa", short: "biswa", sqm: null },
  acre: { label: "Acre", short: "acre", sqm: 4046.856 },
  hectare: { label: "Hectare", short: "ha", sqm: 10000 },
} as const;

export const FACINGS = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];

export const TEHSILS = ["Mathura", "Chhata", "Mant", "Goverdhan", "Mahavan"];
export const DISTRICTS = ["Mathura", "Agra", "Hathras", "Aligarh"];

export type PropertyType = keyof typeof PROPERTY_TYPES;
export type Status = keyof typeof STATUSES;
export type AreaUnit = keyof typeof AREA_UNITS;
