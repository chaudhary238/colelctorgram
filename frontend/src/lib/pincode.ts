// Pincode → canonical city resolver (DV4-07b, port of design_v4/EventCreate.jsx).
// The system derives the city from the PIN so a typed spelling can never split one
// city into two (Bangalore/Bengaluru, Gurgaon/Gurugram, …).

const PIN_AREAS: Record<string, { city: string; area: string | null }> = {
  "400070": { city: "Mumbai", area: "Kurla" }, "400050": { city: "Mumbai", area: "Bandra West" },
  "560038": { city: "Bengaluru", area: "Indiranagar" }, "560001": { city: "Bengaluru", area: "MG Road" },
  "110001": { city: "New Delhi", area: "Connaught Place" }, "122002": { city: "Gurugram", area: "DLF Phase 1" },
  "201301": { city: "Noida", area: "Sector 18" }, "600001": { city: "Chennai", area: "Parrys" },
  "500001": { city: "Hyderabad", area: "Abids" }, "700001": { city: "Kolkata", area: "B.B.D. Bagh" },
  "411001": { city: "Pune", area: "Camp" }, "380001": { city: "Ahmedabad", area: "Lal Darwaja" },
  "302001": { city: "Jaipur", area: "M.I. Road" },
};
const PIN_PREFIX: Record<string, string> = {
  "400": "Mumbai", "401": "Mumbai", "560": "Bengaluru", "561": "Bengaluru", "562": "Bengaluru",
  "110": "New Delhi", "122": "Gurugram", "201": "Noida", "600": "Chennai", "500": "Hyderabad",
  "700": "Kolkata", "411": "Pune", "412": "Pune", "380": "Ahmedabad", "302": "Jaipur",
};
const PIN_ZONE: Record<string, string> = {
  "1": "New Delhi", "2": "Lucknow", "3": "Jaipur", "4": "Mumbai", "5": "Hyderabad", "6": "Chennai", "7": "Kolkata", "8": "Patna",
};

export interface ResolvedPin { city: string; area: string | null }

export function resolvePincode(pin: string): ResolvedPin | null {
  if (!/^\d{6}$/.test(pin)) return null;
  if (PIN_AREAS[pin]) return PIN_AREAS[pin];
  if (PIN_PREFIX[pin.slice(0, 3)]) return { city: PIN_PREFIX[pin.slice(0, 3)], area: null };
  const z = PIN_ZONE[pin[0]];
  return z ? { city: z, area: null } : null;
}
