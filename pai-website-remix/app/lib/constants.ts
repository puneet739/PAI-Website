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
