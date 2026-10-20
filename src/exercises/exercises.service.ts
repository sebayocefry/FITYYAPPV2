import { Injectable } from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService){}
  async findAll() {
    return await this.prisma.exercise.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} exercise`;
  }

}
