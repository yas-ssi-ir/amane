import type { AgeRange, Gender } from '@/lib/types';

export type HealthCoverage = 'cnss' | 'mutuelle' | 'ramed' | 'non_assure';
export type ZoneType = 'rural' | 'periurbain' | 'urbain';

export interface FormState {
  imageUri: string | null;
  imageMime: string | null;
  imageName: string | null;
  videoUri: string | null;
  videoMime: string | null;
  videoName: string | null;
  age_range: AgeRange | null;
  gender: Gender | null;
  region: string;
  health_coverage: HealthCoverage | null;
  zone_type: ZoneType | null;
  latitude: number | null;
  longitude: number | null;
  body_area: string;
  symptoms_duration: string;
  symptoms: string;
}

export const AGE_RANGES: AgeRange[] = ['0-5', '5-12', '12-18', '18-30', '30-45', '45-60', '60-75', '75+'];

export const REGIONS = [
  'Tanger-Tetouan-Al Hoceima',
  'Oriental',
  'Fes-Meknes',
  'Rabat-Sale-Kenitra',
  'Beni Mellal-Khenifra',
  'Casablanca-Settat',
  'Marrakech-Safi',
  'Draa-Tafilalet',
  'Souss-Massa',
  'Guelmim-Oued Noun',
  'Laayoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
];

export const BODY_AREAS = ['Visage', 'Cou', 'Bras', 'Main', 'Torse', 'Dos', 'Jambe', 'Pied', 'Autre'];

export const DURATIONS = [
  "Moins d'une semaine",
  '1 à 4 semaines',
  '1 à 6 mois',
  'Plus de 6 mois',
];
