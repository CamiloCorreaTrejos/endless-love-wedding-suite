export const AGE_CATEGORY_MAP: Record<string, string> = {
  adulto: 'Adulto',
  nino: 'Niño',
  bebe: 'Bebé'
};

export const GUEST_CATEGORY_MAP: Record<string, string> = {
  familia_camilo: 'Familia de Camilo',
  familia_valentina: 'Familia de Valentina',
  amigo_camilo: 'Amigo de Camilo',
  amigo_valentina: 'Amigo de Valentina',
  amigo_familia_camilo: 'Amigo de la Familia de Camilo',
  amigo_familia_valentina: 'Amigo de la Familia de Valentina',
  novios: 'Novios',
  amigo_ambos: 'Amigo de ambos',
  otros: 'Otros'
};

export const STATUS_MAP: Record<string, string> = {
  pendiente: 'Pendiente',
  enviada: 'Invitación Enviada',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado'
};

export const CERTAINTY_MAP: Record<string, string> = {
  seguro: 'Seguro',
  tal_vez: 'Tal vez',
  pendiente: 'Pendiente'
};

export const RSVP_STATUS_MAP: Record<string, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  confirmado: 'Confirmado',
  rechazado: 'Rechazado',
  cerrado: 'Cerrado'
};

// Helper to normalize strings (remove accents, lowercase, replace spaces with underscores)
const normalizeString = (str: string): string => {
  if (!str) return '';
  // Fix for corrupted UTF-8 like NiÃ±o
  let decoded = str;
  try {
    decoded = decodeURIComponent(escape(str));
  } catch (e) {
    // Ignore if not corrupted
  }
  
  return decoded
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_') // replace non-alphanumeric with underscore
    .replace(/_+/g, '_'); // remove duplicate underscores
};

// Reverse mapping helpers (Label -> Value)
const createReverseMap = (map: Record<string, string>) => {
  const reverseMap: Record<string, string> = {};
  Object.entries(map).forEach(([key, value]) => {
    reverseMap[normalizeString(value)] = key;
  });
  return reverseMap;
};

const REVERSE_AGE_CATEGORY_MAP = createReverseMap(AGE_CATEGORY_MAP);
const REVERSE_GUEST_CATEGORY_MAP = createReverseMap(GUEST_CATEGORY_MAP);
const REVERSE_STATUS_MAP = createReverseMap(STATUS_MAP);
const REVERSE_CERTAINTY_MAP = createReverseMap(CERTAINTY_MAP);
const REVERSE_RSVP_STATUS_MAP = createReverseMap(RSVP_STATUS_MAP);

// Getters (Value -> Label)
export const getAgeCategoryLabel = (value: string): string => AGE_CATEGORY_MAP[value] || value;
export const getGuestCategoryLabel = (value: string): string => GUEST_CATEGORY_MAP[value] || value;
export const getStatusLabel = (value: string): string => STATUS_MAP[value] || value;
export const getCertaintyLabel = (value: string): string => CERTAINTY_MAP[value] || value;
export const getRsvpStatusLabel = (value: string): string => RSVP_STATUS_MAP[value] || value;

// Parsers (Label or Value -> Value)
export const parseAgeCategoryInput = (input: string): string => {
  if (!input) return 'adulto';
  const normalized = normalizeString(input);
  if (AGE_CATEGORY_MAP[input]) return input; // Already a valid value
  if (AGE_CATEGORY_MAP[normalized]) return normalized; // Matches a value
  if (REVERSE_AGE_CATEGORY_MAP[normalized]) return REVERSE_AGE_CATEGORY_MAP[normalized]; // Matches a label
  
  // Legacy fallback
  if (normalized.includes('nino') || normalized.includes('nin') || normalized.includes('ni')) return 'nino';
  if (normalized.includes('bebe')) return 'bebe';
  
  return 'adulto'; // Default
};

export const parseGuestCategoryInput = (input: string): string => {
  if (!input) return 'otros';
  const normalized = normalizeString(input);
  if (GUEST_CATEGORY_MAP[input]) return input;
  if (GUEST_CATEGORY_MAP[normalized]) return normalized;
  if (REVERSE_GUEST_CATEGORY_MAP[normalized]) return REVERSE_GUEST_CATEGORY_MAP[normalized];
  
  // Fallback logic for legacy/typos
  if (normalized.includes('amigo') && normalized.includes('familia') && normalized.includes('camilo')) return 'amigo_familia_camilo';
  if (normalized.includes('amigo') && normalized.includes('familia') && normalized.includes('valentina')) return 'amigo_familia_valentina';
  if (normalized.includes('familia') && normalized.includes('camilo')) return 'familia_camilo';
  if (normalized.includes('familia') && normalized.includes('valentina')) return 'familia_valentina';
  if (normalized.includes('amigo') && normalized.includes('camilo')) return 'amigo_camilo';
  if (normalized.includes('amigo') && normalized.includes('valentina')) return 'amigo_valentina';
  if (normalized.includes('novio')) return 'novios';
  if (normalized.includes('ambos')) return 'amigo_ambos';
  
  return 'otros'; // Default
};

export const parseStatusInput = (input: string): string => {
  if (!input) return 'pendiente';
  const normalized = normalizeString(input);
  if (STATUS_MAP[input]) return input;
  if (STATUS_MAP[normalized]) return normalized;
  if (REVERSE_STATUS_MAP[normalized]) return REVERSE_STATUS_MAP[normalized];
  
  if (normalized.includes('enviad')) return 'enviada';
  if (normalized.includes('confirm')) return 'confirmado';
  if (normalized.includes('cancel')) return 'cancelado';
  
  return 'pendiente';
};

export const parseCertaintyInput = (input: string): string => {
  if (!input) return 'seguro';
  const normalized = normalizeString(input);
  if (CERTAINTY_MAP[input]) return input;
  if (CERTAINTY_MAP[normalized]) return normalized;
  if (REVERSE_CERTAINTY_MAP[normalized]) return REVERSE_CERTAINTY_MAP[normalized];
  
  if (normalized.includes('tal') || normalized.includes('vez') || normalized.includes('duda')) return 'tal_vez';
  if (normalized.includes('pend')) return 'pendiente';
  
  return 'seguro';
};

export const parseRsvpStatusInput = (input: string): string => {
  if (!input) return 'pendiente';
  const normalized = normalizeString(input);
  if (RSVP_STATUS_MAP[input]) return input;
  if (RSVP_STATUS_MAP[normalized]) return normalized;
  if (REVERSE_RSVP_STATUS_MAP[normalized]) return REVERSE_RSVP_STATUS_MAP[normalized];
  
  return 'pendiente';
};
