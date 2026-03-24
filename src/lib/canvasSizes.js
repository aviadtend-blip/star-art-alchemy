export const CANVAS_SIZE_MAP = {
  "12x18": {
    id: '12x18',
    label: '12" × 18"',
    price: 79,
    description: 'Perfect for combinations',
    dimensions: { width: 12, height: 18 },
  },
  "16x24": {
    id: '16x24',
    label: '16" × 24"',
    price: 119,
    description: 'Statement piece',
    badge: 'Most popular',
    dimensions: { width: 16, height: 24 },
  },
  "20x30": {
    id: '20x30',
    label: '20" × 30"',
    price: 179,
    description: 'Gallery showpiece',
    dimensions: { width: 20, height: 30 },
  },
};

export const CANVAS_SIZES = Object.values(CANVAS_SIZE_MAP);
