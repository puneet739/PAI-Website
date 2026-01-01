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
  { value: 'P7', label: 'P7 - Commercial Tandem Pilot', description: 'Commercial Tandem Pilotlevel' },
  { value: 'P8', label: 'P8 - Assistant Instructor', description: 'Assistant Instructor' },
  { value: 'P9', label: 'P9 - Instructor', description: 'Instructor' },
  { value: 'P10', label: 'P10 - Examiner', description: 'Examiner' },

  { value: 'PPG1', label: 'PPG1 - Novice', description: 'PPG1 Novice' },
  { value: 'PPG2', label: 'PPG2 - Intermediate', description: 'PPG2 Intermediate' },
  { value: 'PPG3', label: 'PPG3 - Advanced', description: 'PPG3 Advanced' },
  { value: 'PPG4', label: 'PPG4 - Sports Tandem', description: 'PPG4 Sports Tandem' },
  { value: 'PPG5', label: 'PPG5 - Commercial Tandem', description: 'PPG5 Commercial Tandem' },
  { value: 'PPG6', label: 'PPG6 -  Instructor', description: 'PPG6  Instructor' },
  { value: 'PPG7', label: 'PPG7 - Examiner', description: 'PPG7 Examiner' },
  

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
