// ── Membership Renewal ───────────────────────────────────────────────────────

export interface MembershipTypeConfig {
  value: string;
  label: string;
  annualRate: number;
}

export const MAX_LIFE_MEMBERSHIPS = 100;
export const LIFE_MEMBERSHIP_FEE = 5000;

// Add new membership types here — pricing and forms pick up automatically
export const MEMBERSHIP_TYPE_CONFIG: MembershipTypeConfig[] = [
  { value: 'individual',  label: 'Individual',    annualRate: 500  },
  { value: 'school_club', label: 'School / Club', annualRate: 2000 },
];

export const RENEWAL_PRICING: Record<string, number> = Object.fromEntries(
  MEMBERSHIP_TYPE_CONFIG.map((t) => [t.value, t.annualRate])
);

export const RENEWAL_DURATIONS = [
  { years: 1, label: '1 Year'  },
  { years: 2, label: '2 Years' },
  { years: 3, label: '3 Years' },
] as const;

export function getRenewalPrice(membershipType: string, years: number): number {
  const config = MEMBERSHIP_TYPE_CONFIG.find((t) => t.value === membershipType);
  return (config?.annualRate ?? 500) * years;
}

// Extends from activeUntil if still in future, otherwise starts from today (IST)
export function calculateNewExpiry(
  activeUntil: string | Date | null | undefined,
  years: number
): string {
  const todayIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let baseStr: string;
  if (!activeUntil) {
    baseStr = todayIST;
  } else {
    const normalized =
      activeUntil instanceof Date
        ? activeUntil.toISOString().slice(0, 10)
        : (activeUntil as string).length > 10
        ? new Date(activeUntil as string).toISOString().slice(0, 10)
        : (activeUntil as string);
    baseStr = normalized > todayIST ? normalized : todayIST;
  }

  const base = new Date(baseStr + "T00:00:00Z");
  base.setUTCFullYear(base.getUTCFullYear() + years);
  return base.toISOString().slice(0, 10);
}

// ── Pilot Rating Constants ───────────────────────────────────────────────────

// Pilot Rating Constants
export interface PilotRating {
  value: string;
  label: string;
  description: string;
}

export const PILOT_RATINGS: PilotRating[] = [
  { value: 'P1', label: 'P1 - Introduction', description: 'Basic paragliding knowledge' },
  { value: 'P2', label: 'P2 - Student Pilot', description: 'Student flying techniques' },
  { value: 'P3', label: 'P3 - Novice Pilot', description: 'Novice flying techniques' },
  { value: 'P4', label: 'P4 - Intermediate Pilot', description: 'Advanced maneuvers' },
  { value: 'P5', label: 'P5 - Advanced Pilot', description: 'Expert level XC flying' },
  { value: 'P6', label: 'P6 - Sports Tandem Pilot', description: 'Sports Tandem Pilot' },
  { value: 'P7', label: 'P7 - Tandem Pilot', description: 'Tandem Pilotlevel' },
  { value: 'P8', label: 'P8 - Assistant Instructor', description: 'Assistant Instructor' },
  { value: 'P9', label: 'P9 - Instructor', description: 'Instructor' },
  { value: 'P10', label: 'P10 - Examiner', description: 'Examiner' },

  { value: 'PPG1', label: 'PPG1 - Novice', description: 'PPG1 Novice' },
  { value: 'PPG2', label: 'PPG2 - Intermediate', description: 'PPG2 Intermediate' },
  { value: 'PPG3', label: 'PPG3 - Advanced', description: 'PPG3 Advanced' },
  { value: 'PPG4', label: 'PPG4 - Sports Tandem', description: 'PPG4 Sports Tandem' },
  { value: 'PPG5', label: 'PPG5 - Tandem', description: 'PPG5 Tandem' },
  { value: 'PPG6', label: 'PPG6 -  Instructor', description: 'PPG6  Instructor' },
  { value: 'PPG7', label: 'PPG7 - Examiner', description: 'PPG7 Examiner' },
  
  { value: 'SCHOOL', label: 'PAI Member School', description: 'PAI Member School' },
  { value: 'CLUB', label: 'PAI Member Club', description: 'PAI Member Club' },
];

/**
 * Get rating label from rating value
 * @param value - Rating value (e.g., 'P1', 'P2') or CSV (e.g., 'P1,P2,P3')
 * @returns Rating label or the value itself if not found
 */
export function getRatingLabel(value: string | null | undefined): string {
  if (!value) return 'N/A';
  
  // Handle CSV (comma-separated values)
  if (value.includes(',')) {
    const values = value.split(',').map(v => v.trim());
    const labels = values.map(v => {
      const rating = PILOT_RATINGS.find(r => r.value === v);
      return rating ? rating.label : v;
    });
    return labels.join(', ');
  }
  
  // Handle single value
  const rating = PILOT_RATINGS.find(r => r.value === value);
  return rating ? rating.label : value;
}

/**
 * Get rating description from rating value
 * @param value - Rating value (e.g., 'P1', 'P2')
 * @returns Rating description or empty string if not found
 */
export function getRatingDescription(value: string | null | undefined): string {
  if (!value) return '';
  const rating = PILOT_RATINGS.find(r => r.value === value);
  return rating ? rating.description : '';
}

// Test Level Constants
export interface TestLevel {
  level: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const TEST_LEVELS: TestLevel[] = [
  {
    level: 'P1',
    name: 'Beginner Pilot',
    description: 'Basic paragliding knowledge and safety',
    color: 'from-green-500 to-emerald-500',
    icon: '🪂',
  },
  {
    level: 'P2',
    name: 'Student Pilot',
    description: 'Student flying techniques and theory',
    color: 'from-green-500 to-emerald-500',
    icon: '🪂',
  },
  {
    level: 'P3',
    name: 'Novice Pilot',
    description: 'Intermediate flying techniques and theory',
    color: 'from-blue-500 to-cyan-500',
    icon: '🌤️',
  },
  {
    level: 'P4',
    name: 'Intermediate Pilot',
    description: 'Advanced maneuvers and weather understanding',
    color: 'from-orange-500 to-amber-500',
    icon: '⛰️',
  },
  {
    level: 'P5',
    name: 'Advanced Pilot',
    description: 'Expert level XC flying and competition knowledge',
    color: 'from-purple-500 to-pink-500',
    icon: '🏆',
  },
];

/**
 * Get array of valid test level codes
 * @returns Array of test level codes (e.g., ['P1', 'P2', 'P3', 'P4', 'P5'])
 */
export function getValidTestLevels(): string[] {
  return TEST_LEVELS.map(level => level.level);
}

/**
 * Check if a test level is valid
 * @param level - Test level to check
 * @returns True if the level is valid
 */
export function isValidTestLevel(level: string | null | undefined): boolean {
  if (!level) return false;
  return TEST_LEVELS.some(testLevel => testLevel.level === level.toUpperCase());
}
