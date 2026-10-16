import { from } from "rxjs";
import {MuscleGroup} from '../enums/muscle-group.enum';
import {TrackingMode} from '../enums/TrackingMode.enum';

export interface Exercise{
    id:string,
    slug:string,
    name:string,
    muscleGroup:MuscleGroup,
    trackingMode:TrackingMode,
}