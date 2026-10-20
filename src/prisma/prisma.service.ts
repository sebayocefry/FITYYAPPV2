import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";


@Injectable()
export class PrismaService extends PrismaClient{
    constructor(){
        const url = process.env.DATABASE_URL || "";
        if (!url){
            throw new Error("DATABASE_URL no está configurada en las variables de entorno.");
        }
        const  adapter = new PrismaPg({ connectionString:url});
        super ({adapter});

    }
}
