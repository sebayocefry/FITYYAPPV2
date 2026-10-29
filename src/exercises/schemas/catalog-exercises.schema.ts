import {z} from 'zod';
import { MuscleGroup, TrackingMode } from  '../../generated/prisma/enums';

export const catalogExerciseSchema = z.object({
  slug: z.string()
    .trim()
    .min(1, {
      message: 'El slug del ejercicio es inválido',
    })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: 'El slug debe usar minúsculas, números y guiones',
    }),

  name: z.string()
    .trim()
    .min(1, {
      message: 'El nombre del ejercicio es inválido',
    }),

  primaryMuscle: z.enum(MuscleGroup),

  trackingMode: z.enum(TrackingMode),

  isActive: z.boolean(),
});