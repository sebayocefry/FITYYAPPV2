import { readFileSync } from "node:fs";
import {resolve} from "node:path";


const filePath = resolve(
    process.cwd(),
    'data',
    'exercises.json',
);

const content = readFileSync(filePath, "utf-8")
const exercises:unknown = JSON.parse(content);

const bandera = Array.isArray(exercises)

if (!bandera){
    throw new Error('el contenido no es valido')
}

const tamano = exercises.length
console.log(`se han encontrado ${tamano} ejercicios en el sistema`)

for (const exercise of exercises){
    if(
        typeof exercise !== 'object' || 
        exercise === null ||
        Array.isArray(exercise)
    ) {
        throw new Error('Se encontró un ejercicio inválido');
    }

    if(
        typeof exercise.slug !=='string'||
        exercise.slug.trim() === '' 
    ){
        throw new Error('El slug del ejercicio es inválido');
    }

    if(
        typeof exercise.name !=='string'||
        exercise.name.trim() === '' 
    ){
        throw new Error('El nombre del ejercicio es inválido');
    }
}