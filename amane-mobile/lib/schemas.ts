/**
 * Schemas zod = validation cote client, miroir des contraintes backend
 * (Form fields validees par FastAPI : Literal, min/max length, etc.)
 */

import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Nom d\'utilisateur requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginInput = z.infer<typeof loginSchema>;


export const genderSchema = z.enum(['M', 'F', 'AUTRE']);
export const ageRangeSchema = z.enum([
  '0-5', '5-12', '12-18', '18-30',
  '30-45', '45-60', '60-75', '75+',
]);

export const consultationFormSchema = z.object({
  symptoms: z.string()
    .min(1, 'Decrivez les symptomes')
    .max(2000, 'Trop long (max 2000)'),
  symptoms_duration: z.string().max(100).optional().or(z.literal('')),
  body_area: z.string().max(100).optional().or(z.literal('')),
  age_range: ageRangeSchema,
  gender: genderSchema,
  region: z.string().min(2, 'Region requise').max(100),
});

export type ConsultationFormInput = z.infer<typeof consultationFormSchema>;
