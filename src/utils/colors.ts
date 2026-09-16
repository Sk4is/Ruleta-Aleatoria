// Curated palette of harmonious, modern, vibrant segment colors for the wheel
export const WHEEL_PALETTE = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#84CC16', // Lime
  '#6366F1', // Violet
  '#D946EF', // Fuchsia
  '#0EA5E9', // Sky
  '#EAB308', // Yellow
  '#2DD4BF', // Mint
];

export const TEAM_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#0891B2', // Cyan
  '#DB2777', // Pink
  '#4D7C0F', // Olive
  '#2563EB', // Blue
  '#EA580C', // Orange
];

export function getSegmentColor(index: number): string {
  return WHEEL_PALETTE[index % WHEEL_PALETTE.length];
}

export function getTeamColor(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}
