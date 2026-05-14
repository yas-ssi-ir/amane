import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const reviewSchema = z.object({
  decision: z.enum(["traitement_simple", "suivi", "consultation", "urgence"]),
  agrees_with_ai: z.boolean(),
  modified_diagnosis: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().min(5, "Notes obligatoires (min 5 caractères)").max(2000),
  prescription: z.string().max(2000).optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
