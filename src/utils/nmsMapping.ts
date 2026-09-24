export const DIVISION_NAME_MAP: Record<number, string> = {
  71: "Vadodara",
  45: "Secunderabad",
  43: "Hyderabad",
  20: "Agra",
  36: "Delhi",
  65: "Kota",
  9: "DDU",
  15: "Asansol",
  16: "Howrah",
};

export const FIRM_NAME_MAP: Record<number, string> = {
  1: "MEDHA",
  2: "KERNEX",
  3: "HBL",
};

export const makeCardTitleFromKey = (key: string) => {
  const [divStr, firmStr] = key.split("_");
  const divisionCode = Number(divStr);
  const firmCode = Number(firmStr);

  const divisionName = DIVISION_NAME_MAP[divisionCode] ?? divStr;
  const firmName = FIRM_NAME_MAP[firmCode] ?? firmStr;

  return `${divisionName} (${firmName})`;
};

// ✅ Show these cards immediately (even before API response)
export const DEFAULT_KEYS: string[] = [
  "71_1", // BRC MEDHA
  "71_3", // BRC HBL
  "45_1", // SC MEDHA
  "43_3", // HYB HBL
  "20_3", // AGRA HBL
  "36_1", // DLI MEDHA
  "65_3", // KOTA HBL
  "9_3",  // DDU HBL
  "15_3", // ASN HBL
  "16_3", // HWH HBL
];
