import {MuscleGroup} from '../enums/muscle-group.enum';
import {TrackingMode} from '../enums/tracking-mode.enum';

export interface Exercise{
    id:string,
    slug:string,
    name:string,
    primaryMuscle:MuscleGroup,
    trackingMode:TrackingMode,
    isActive: boolean;
}

const pressBanca: Exercise = {
  // Completa las propiedades
    id:"1",
    slug:"press-banca",
    name: "press-banca",
    primaryMuscle : MuscleGroup.CHEST,
    trackingMode: TrackingMode.WEIGHT_REPS,
    isActive: true
};

