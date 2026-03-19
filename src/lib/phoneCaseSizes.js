/**
 * Phone case model options — mirrors canvasSizes.js structure.
 */
export const PHONE_CASE_MODELS = [
  { id: 'iphone-15', label: 'iPhone 15 / 15 Pro', description: 'Latest generation', price: 57 },
  { id: 'iphone-14', label: 'iPhone 14 / 14 Pro', description: 'Previous generation', price: 57 },
  { id: 'iphone-13', label: 'iPhone 13 / 13 Pro', description: 'Still going strong', price: 57 },
  { id: 'samsung-s24', label: 'Samsung Galaxy S24', description: 'Flagship Android', price: 57 },
];

export const PHONE_CASE_MODEL_MAP = Object.fromEntries(
  PHONE_CASE_MODELS.map((m) => [m.id, m])
);
