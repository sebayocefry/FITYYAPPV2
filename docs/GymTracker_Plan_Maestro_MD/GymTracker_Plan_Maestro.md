# GymTracker

**Documento maestro de producto, arquitectura y plan de desarrollo**  
**Versión:** 0.1 · **Fecha:** 16 de octubre de 2026 · **Estado:** diseño base para implementar  
**Proyecto:** aprendizaje de backend con NestJS, con aplicación real para computador y celular.

> **Propósito del documento.** Esta es la fuente de referencia del proyecto. Debe permitir continuar su desarrollo sin depender de un chat específico: reúne requisitos, decisiones, modelos, contratos API, fases, tareas, pruebas y asuntos pendientes. Cuando una decisión cambie, actualizar este archivo y su versión.

## 1. Visión y objetivo

**GymTracker** será una aplicación personal para registrar entrenamientos de fuerza y progreso físico desde computador y celular. Cada persona tendrá una cuenta y un perfil propios. El catálogo de ejercicios será **oficial, cerrado y mantenido por el desarrollador**: los usuarios pueden consultarlo, pero no crear, editar ni eliminar ejercicios.

La primera versión, **MVP 1.0**, ofrecerá seguimiento de entrenamientos, marcas, récords personales, peso corporal e índice de masa corporal (IMC). La arquitectura se preparará para incorporar **alimentación, calorías, macronutrientes y otros módulos** en versiones posteriores, sin desarrollar estas funcionalidades todavía.

### Principios de desarrollo

1. **Aprender implementando:** primero entender el requisito y decidir el diseño; luego programar; finalmente probar y explicar la solución. Evitar copiar archivos completos sin comprenderlos.
2. **Una aplicación útil desde temprano:** entregar pequeñas funcionalidades completas, no una enorme estructura vacía.
3. **Una fuente de verdad por dato:** los ejercicios viven en el catálogo; el peso y las repeticiones viven en las series realizadas; el peso corporal vive en sus mediciones.
4. **Modularidad sin sobreingeniería:** empezar como un monolito modular NestJS, con límites claros entre dominios.
5. **Datos personales protegidos:** cada cuenta accede solo a sus entrenamientos y mediciones, con autenticación y autorización desde que exista uso remoto.
6. **Compatibilidad con PC y celular:** frontend responsive; sincronización a través de una misma API y una misma base de datos del servidor.

## 2. Alcance del MVP 1.0

| Módulo | Incluido en 1.0 | Comportamiento esperado |
|---|---|---|
| Cuenta y perfil | Sí | Registro/inicio de sesión, ver/editar nombre y estatura, cerrar sesión. |
| Catálogo oficial | Sí | Buscar y filtrar ejercicios; ver músculos, material, instrucciones, imágenes y variaciones. |
| Entrenamiento completo | Sí | Crear sesión, agregar ejercicios, registrar series y completar entrenamiento. |
| Marca rápida | Sí | Registrar una serie directamente desde un ejercicio sin rellenar una sesión completa. |
| Historial | Sí | Consultar entrenamientos anteriores, con fecha, ejercicios y series. |
| Récords y progreso | Sí | Ver récords por ejercicio y una evolución básica de pesos, repeticiones o duración. |
| Peso corporal | Sí | Registrar mediciones fechadas; ver última medición y evolución histórica. |
| IMC | Sí | Calcular a partir del peso y la estatura, y mostrar su evolución orientativa. |
| Nutrición | **No** | Comidas, calorías, macronutrientes y objetivos nutricionales se dejan para una versión posterior. |
| Funciones complejas | **No** | Rutinas automáticas, redes sociales, recomendaciones médicas, notificaciones y uso offline completo quedan fuera. |

**Decisión sobre usuarios:** la primera experiencia estará centrada en una sola persona usando su perfil; sin embargo, el modelo incluirá `userId` para soportar varias cuentas sin mezclar información. No se construirá un panel administrativo de ejercicios en 1.0.

### Historias de usuario esenciales

- Como usuario, quiero iniciar sesión y ver mis entrenamientos y mediciones personales.
- Como usuario, quiero buscar «Press de banca» en el catálogo sin modificar su definición.
- Como usuario, quiero iniciar un entrenamiento, añadir ejercicios y registrar series de peso y repeticiones.
- Como usuario, quiero ingresar una marca rápida desde la ficha de un ejercicio.
- Como usuario, quiero consultar el historial y conocer mis mejores marcas por ejercicio.
- Como usuario, quiero registrar mi peso corporal, editar mi estatura y visualizar el IMC calculado.
- Como mantenedor, quiero agregar o actualizar ejercicios del catálogo desde archivos versionados sin perder datos históricos.

## 3. Arquitectura propuesta

```text
PC (navegador) ---------\
                         > React (web responsive / PWA posterior)
Celular (navegador) ----/              |
                                     HTTPS / REST
                                         |
                              NestJS (TypeScript, CJS)
              ┌─────────────┬──────────┼───────────┬─────────────┐
             Auth          Users     Exercises    Workouts    BodyMetrics
                                                      |
                                             Records / Statistics
                                         |
                             Prisma (capa de persistencia)
                                         |
                         SQLite inicial (servidor local)
                         PostgreSQL futuro (si se despliega)
```

- **Frontend:** React; diseño responsive; PWA instalable posteriormente. No necesitamos React para construir y probar primero la API.
- **Backend:** NestJS con controladores, servicios, módulos y validaciones. El proyecto ya existe, se creó con **CJS**, y ya se ejecutó `nest g resource exercises`.
- **Persistencia:** se propone **SQLite + Prisma** para aprender y mantener datos sin instalar un servidor SQL; al publicar para varios usuarios se evaluará PostgreSQL. Cambiar de motor requiere planificar y ejecutar una **migración real**: Prisma no hace transparente el traslado de datos.
- **Catálogo:** JSON versionado + comando de importación (*seed/upsert*); el usuario final no podrá invocar endpoints para modificarlo.
- **Imágenes:** archivos públicos estáticos y una referencia (`path` o URL) en la base de datos. En el futuro se podría utilizar almacenamiento de objetos.
- **Despliegue:** en desarrollo, el backend puede ejecutarse en el PC. Para que el celular acceda, debe haber conectividad entre dispositivos y configuración de red; para usarlo fuera de casa será necesario desplegar backend, frontend y base de datos de forma accesible y segura mediante HTTPS.

**Regla de dependencias:** `Controller → Service → Prisma/repository → DB`. No llamar directamente a Prisma desde los Controllers. Los módulos futuros de nutrición compartirán `User`, pero tendrán entidades y servicios propios.

## 4. Modelo de dominio y relaciones

### 4.1 Entidades centrales

| Entidad | Campos esenciales | Responsabilidad |
|---|---|---|
| `User` | `id`, `email` único, `passwordHash`, `createdAt` | Identidad y acceso. Nunca devolver `passwordHash`. |
| `UserProfile` | `userId` único, `displayName`, `heightCm`, `updatedAt` | Datos editables de perfil. Relación 1:1 con `User`. |
| `Exercise` | `id`, `slug` único, `name`, `description?`, `primaryMuscle`, `secondaryMuscles`, `equipment`, `trackingMode`, `instructions`, `familyId?`, `isActive`, timestamps | Catálogo oficial. No contiene marcas personales. |
| `ExerciseFamily` | `id`, `name`, `slug` único | Agrupa variaciones o familias de movimiento. |
| `ExerciseImage` | `id`, `exerciseId`, `path`, `alt`, `sortOrder` | Imágenes ordenadas de un ejercicio. |
| `Workout` | `id`, `userId`, `name?`, `type`, `status`, `startedAt`, `finishedAt?`, `notes?` | Sesión completa o contenedor de una marca rápida. |
| `WorkoutExercise` | `id`, `workoutId`, `exerciseId`, `position`, `notes?` | Ejercicio del catálogo usado en una sesión; permite repetir un mismo ejercicio en sesiones diferentes. |
| `WorkoutSet` | `id`, `workoutExerciseId`, `setNumber`, `weightKg?`, `reps?`, `durationSeconds?`, `rpe?`, `completedAt?` | Serie realizada y datos medidos. |
| `BodyWeightEntry` | `id`, `userId`, `measuredAt`, `weightKg`, `heightCmSnapshot` | Historial de peso; conserva la estatura utilizada para calcular el IMC histórico. |

### 4.2 Relaciones

```text
User (1) ── (1) UserProfile
User (1) ── (N) Workout
User (1) ── (N) BodyWeightEntry
Workout (1) ── (N) WorkoutExercise
Exercise (1) ── (N) WorkoutExercise
WorkoutExercise (1) ── (N) WorkoutSet
ExerciseFamily (1) ── (N) Exercise    [familia opcional]
Exercise (1) ── (N) ExerciseImage
```

**Decisión validada:** `WorkoutSet` solo guarda `workoutExerciseId` como referencia a su contexto. Desde `WorkoutExercise` se llega a `Exercise` y `Workout`, y desde `Workout` al usuario. No duplicar `exerciseId` ni `userId` en la serie sin una necesidad demostrada.

**Sobre tipos:** los nombres y campos anteriores describen el **dominio**, no un esquema Prisma copiable todavía. En el paso de persistencia elegiremos los tipos concretos, índices y restricciones; para datos numéricos medidos utilizaremos precisión decimal adecuada, evitando redondeos accidentales.

### 4.3 Reglas del catálogo

- Los ejercicios son administrados exclusivamente por el desarrollador; no existe `POST /exercises` público.
- Cada `slug` identifica de manera estable un ejercicio a través de versiones del catálogo.
- El cargador debe validar, evitar duplicados y realizar **upsert por `slug`**, sin recrear IDs ya existentes.
- Actualizar el nombre, instrucciones o imágenes no debe afectar las marcas históricas.
- Un ejercicio retirado pasa a `isActive=false`; no se elimina si tiene referencias de entrenamientos.
- `trackingMode` inicial: `WEIGHT_REPS`, `REPS` y `DURATION`. Posteriormente: asistencia, lastre, distancia y otros.
- `secondaryMuscles` e `instructions` pueden ser colecciones vacías; imágenes y familia son opcionales.
- Los archivos estáticos deben tener autorización de uso y textos alternativos para accesibilidad.

### 4.4 Entrenamiento completo y marca rápida

**Completo (`FULL`):** el usuario crea un `Workout`, añade uno o más `WorkoutExercise` y registra sus `WorkoutSet`. Puede quedar en `IN_PROGRESS` hasta que se complete.

**Rápido (`QUICK`):** el usuario selecciona un ejercicio y registra una serie. El backend crea, **en una sola transacción**, un `Workout` de tipo `QUICK`, su `WorkoutExercise` y su `WorkoutSet`. Se marca automáticamente como `COMPLETED`.

Ambas vías usan las mismas tablas y estadísticas. En la interfaz, un registro rápido debe identificarse como tal; si se cuenta la cantidad de «entrenamientos completos», los QUICK no deben inflar ese indicador.

### 4.5 Peso corporal e IMC

- `UserProfile.heightCm` guarda la estatura actual; `BodyWeightEntry` guarda cada peso con fecha.
- La primera medición copia la estatura a `heightCmSnapshot`. Así, si el perfil cambia de estatura, los IMC históricos no cambian silenciosamente.
- El IMC se calcula al consultar datos, **no se guarda como fuente independiente**:

  `IMC = peso (kg) / [estatura (m)]²`

- Ejemplo ilustrativo: 80 kg y 1,75 m → IMC ≈ 26,1.
- Validar peso y estatura mayores que cero, rangos razonables y fechas. Aceptar decimales. Conservar mediciones múltiples, ordenables por fecha; no sobrescribir siempre la «última».
- En 1.0 mostrar el valor, la fecha y la gráfica. Evitar conclusiones diagnósticas: el IMC no distingue masa muscular de grasa y debe interpretarse con cautela; sus categorías estándar para adultos no se aplican igual a menores.

## 5. API REST: contratos iniciales

**Convención:** prefijo `/api/v1`. Las rutas privadas requieren autenticación. El servidor debe obtener el identificador del usuario del token/sesión, **nunca confiar en un `userId` arbitrario enviado por el cliente**.

| Método y ruta | Objetivo | Acceso |
|---|---|---|
| `POST /api/v1/auth/register` | Crear cuenta personal | Público, validado y con protecciones básicas |
| `POST /api/v1/auth/login` | Autenticarse | Público |
| `GET /api/v1/me` | Ver perfil propio | Autenticado |
| `PATCH /api/v1/me` | Editar nombre o estatura | Autenticado |
| `GET /api/v1/exercises` | Listar, buscar y filtrar catálogo | Autenticado inicialmente |
| `GET /api/v1/exercises/:id` | Ver detalle e imágenes | Autenticado inicialmente |
| `POST /api/v1/workouts` | Iniciar entrenamiento completo | Autenticado |
| `GET /api/v1/workouts` | Historial paginado | Autenticado |
| `GET /api/v1/workouts/:id` | Consultar sesión propia | Autenticado |
| `PATCH /api/v1/workouts/:id` | Editar/cerrar sesión propia | Autenticado |
| `POST /api/v1/workouts/:id/exercises` | Agregar ejercicio del catálogo | Autenticado |
| `POST /api/v1/workout-exercises/:id/sets` | Registrar serie | Autenticado |
| `POST /api/v1/quick-marks` | Crear marca rápida | Autenticado |
| `GET /api/v1/exercises/:id/progress` | Progreso propio en ejercicio | Autenticado |
| `GET /api/v1/body-weight` | Historial de peso personal | Autenticado |
| `POST /api/v1/body-weight` | Registrar nueva medición | Autenticado |
| `GET /api/v1/me/summary` | Resumen personal (últimos registros) | Autenticado |

**Pendiente de detalle posterior:** edición y eliminación de series/mediciones, paginación exacta, códigos de error, validaciones de los estados y formato uniforme de las respuestas. Definirlos durante cada etapa, antes de programar el endpoint.

### 5.1 DTO previstos

| DTO | Campos entrantes principales | Observación |
|---|---|---|
| `RegisterDto` | `email`, `password`, `displayName` | Hash de contraseña en servidor. |
| `LoginDto` | `email`, `password` | No devuelve datos secretos. |
| `UpdateProfileDto` | `displayName?`, `heightCm?` | Solo perfil propio. |
| `ExerciseQueryDto` | `search?`, `muscle?`, `equipment?`, `page?`, `limit?` | Validar enums y paginación. |
| `CatalogExerciseInputDto` | `slug`, `name`, músculos, equipo, medición, instrucciones, imágenes | DTO interno del importador; no petición pública. |
| `CreateWorkoutDto` | `name?`, `notes?`, `startedAt?` | `type=FULL` decidido por backend. |
| `AddWorkoutExerciseDto` | `exerciseId`, `position?`, `notes?` | Validar existencia y actividad del ejercicio. |
| `CreateWorkoutSetDto` | `weightKg?`, `reps?`, `durationSeconds?`, `rpe?` | Reglas según `trackingMode`. |
| `CreateQuickMarkDto` | `exerciseId`, datos de serie, `performedAt?` | Construye transaccionalmente QUICK. |
| `CreateBodyWeightDto` | `weightKg`, `measuredAt?` | Estatura tomada del perfil en servidor. |

**DTO vs entidad:** los DTO determinan qué puede entrar o salir por una operación; las entidades expresan el dominio; Prisma define la persistencia. No agregar `userId`, `id`, `createdAt` ni `passwordHash` a un DTO público de creación por comodidad.

### 5.2 Ejemplos mínimos de entrada

**Crear entrenamiento completo**

```http
POST /api/v1/workouts
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Push Day", "notes": "Pecho y tríceps" }
```

**Registrar marca rápida**

```http
POST /api/v1/quick-marks
Authorization: Bearer <token>
Content-Type: application/json

{ "exerciseId": "uuid-exercise", "weightKg": 70, "reps": 8 }
```

**Registrar peso corporal**

```http
POST /api/v1/body-weight
Authorization: Bearer <token>
Content-Type: application/json

{ "weightKg": 80.2, "measuredAt": "2026-10-16T12:00:00-03:00" }
```

`<token>` y los UUID son valores ilustrativos. Guardar fechas como instantes UTC cuando corresponda y mostrarlas en la zona horaria del usuario. Tratar con cuidado los días locales de medición.

## 6. Organización de carpetas prevista

```text
gymtracker/
├── docs/
│   └── GymTracker_Plan_Maestro.md
├── data/
│   └── exercises.json           # catálogo versionado
├── media/
│   └── exercises/              # imágenes del catálogo
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   ├── users/
│   ├── exercises/               # resource YA GENERADO
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── exercises.controller.ts
│   │   ├── exercises.service.ts
│   │   └── exercises.module.ts
│   ├── workouts/
│   ├── body-metrics/
│   ├── statistics/
│   ├── database/
│   └── common/                  # solo utilidades realmente compartidas
└── package.json
```

Los directorios que aún no existen son **previstos**, no instrucciones de crearlos todos de inmediato. `statistics/` puede esperar hasta que haya suficiente información real para consultar.

## 7. Hoja de ruta en orden de implementación

Cada fase tiene: **objetivo → trabajo → criterio de finalización**. Solo avanzar cuando el criterio se cumpla. Preferir una prueba con Postman y una prueba automatizada cuando sea razonable.

### Fase 0 — Base del repositorio y decisiones

- [ ] Guardar este documento en `docs/` y abrir un repositorio Git.
- [ ] Confirmar que `npm run start:dev` funciona y registrar versiones de Node, NestJS y npm.
- [ ] Revisar `app.module.ts`, `exercises.module.ts`, Controller y Service generados.
- [ ] Elegir convención de nombres, `api/v1`, enums y manejo de errores.

**Listo cuando:** el proyecto se ejecuta, hay un commit inicial y puedes explicar el flujo Controller → Service → datos.

### Fase 1 — Catálogo de ejercicios (solo lectura)

- [ ] Definir `MuscleGroup`, `Equipment` y `TrackingMode`.
- [ ] Diseñar `Exercise`, `ExerciseFamily` y `ExerciseImage` conceptualmente.
- [ ] Crear `ExerciseQueryDto` y especificar respuesta de lista y detalle.
- [ ] Mantener solo `GET /exercises` y `GET /exercises/:id` como rutas públicas del módulo; eliminar o deshabilitar rutas generadas de escritura.
- [ ] Usar temporalmente datos de ejemplo **solo si se necesita probar antes de tener la BD**.

**Listo cuando:** puedes buscar y consultar un ejercicio, y un cliente no puede crear/modificar/eliminar ejercicios por HTTP.

### Fase 2 — Base de datos y cargador oficial

- [ ] Integrar Prisma + SQLite según documentación de la versión instalada (atención a ESM/CJS).
- [ ] Crear esquema, relaciones, índices, restricciones y primera migración.
- [ ] Crear `CatalogExerciseInputDto`, validación e importador JSON idempotente por `slug`.
- [ ] Incorporar un catálogo pequeño pero real (p. ej., 10-20 ejercicios) con sus imágenes.
- [ ] Sustituir almacenamiento temporal por consultas reales a Prisma.

**Listo cuando:** reiniciar NestJS no borra nada; importar el mismo JSON dos veces no duplica ejercicios; cambiar una descripción conserva su ID.

### Fase 3 — Cuenta y perfil

- [ ] Crear `User`, `UserProfile` y `AuthModule`.
- [ ] Implementar registro/inicio de sesión, hash seguro de contraseñas y autorización.
- [ ] Crear `GET /me` y `PATCH /me`, incluida estatura.
- [ ] Proteger rutas privadas, validar entradas y probar separación entre cuentas.

**Listo cuando:** una persona puede iniciar sesión y no puede consultar ni modificar información privada de otra cuenta.

### Fase 4 — Entrenamientos completos

- [ ] Implementar `Workout`, `WorkoutExercise` y `WorkoutSet`.
- [ ] Crear sesión FULL, incorporar ejercicios existentes y añadir series.
- [ ] Manejar estado `IN_PROGRESS` / `COMPLETED` y fechas.
- [ ] Validar peso, repeticiones y duración según `trackingMode`.

**Listo cuando:** puedes registrar y recuperar un entrenamiento con dos ejercicios y varias series, y los datos persisten.

### Fase 5 — Marcas rápidas, historial y récords

- [ ] Implementar `POST /quick-marks` usando una transacción.
- [ ] Consultar historial paginado y detalle por sesión.
- [ ] Calcular récords básicos por ejercicio: peso máximo válido y mejor desempeño por modalidad.
- [ ] Crear progresión temporal sin mezclar registros ajenos ni contar QUICK como FULL.

**Listo cuando:** un registro rápido aparece en la evolución del ejercicio y no necesita duplicar tablas ni lógica de estadísticas.

### Fase 6 — Peso corporal e IMC

- [ ] Crear `BodyWeightEntry` y validaciones.
- [ ] Permitir registrar mediciones con fechas y consultar el historial.
- [ ] Calcular IMC desde la estatura correspondiente, sin almacenarlo como valor redundante.
- [ ] Devolver última medición y datos para gráfica.

**Listo cuando:** añadir una segunda medición conserva la anterior; cambiar la estatura actual no altera el cálculo histórico guardado con `heightCmSnapshot`.

### Fase 7 — Interfaz React para PC y celular

- [ ] Crear frontend React separado y configurar cliente HTTP.
- [ ] Construir inicio de sesión, perfil, catálogo, entrenamiento, marca rápida, historial, récords y peso/IMC.
- [ ] Adaptar diseño a pantallas pequeñas y probar flujos táctiles.
- [ ] Evaluar PWA instalable; funcionamiento offline y sincronización quedan para otra iteración.

**Listo cuando:** una persona puede completar los flujos esenciales desde navegador de PC y celular utilizando los mismos datos.

### Fase 8 — Calidad y publicación

- [ ] Pruebas unitarias de cálculos, DTO y lógica de dominio.
- [ ] Pruebas e2e de autenticación y aislamiento entre usuarios.
- [ ] Revisar logs (sin secretos), CORS, variables de entorno, backups y recuperación.
- [ ] Desplegar de forma segura, usar HTTPS y elegir persistencia apta para hosting.
- [ ] Preparar documentación de instalación y API.

**Listo cuando:** se puede restaurar una copia de seguridad y las funciones clave funcionan en el entorno desplegado.

## 8. Orden recomendado para aprender NestJS

| Momento | Conceptos nuevos | Práctica concreta |
|---|---|---|
| Inicio | CLI, Module, Controller, Service, inyección de dependencias | Explicar y limpiar el recurso `exercises`. |
| Catálogo | DTO, enums, decoradores, `ValidationPipe`, query params | Validar filtros del catálogo. |
| Persistencia | ORM, modelos, relaciones, migraciones, transacciones | Guardar e importar ejercicios. |
| Perfil | autenticación, guards, JWT/sesiones, autorización | Un usuario solo ve su perfil. |
| Entrenamientos | modelado relacional, reglas de negocio, estados | Registrar una sesión completa. |
| Historial | filtros, paginación, agregaciones, cálculos | Marcas, récords y progresión. |
| Interfaz | consumo HTTP, estado UI, responsive | Usar GymTracker en PC y celular. |

**Método de trabajo en cada tarea:** (a) leer requisito, (b) proponer diseño propio, (c) implementar una parte pequeña, (d) probar en Postman/test, (e) revisar errores y explicar el resultado, (f) registrar aprendizaje/commit. Pedir pistas antes que código completo cuando sea posible.

## 9. Reglas técnicas y criterios de calidad

- **Validación:** habilitar `ValidationPipe`, rechazar propiedades inesperadas donde corresponda, validar enums, UUID, rangos y fechas.
- **Autorización:** cada consulta/actualización de `Workout` o `BodyWeightEntry` filtra por usuario autenticado, no solo por ID del recurso.
- **Integridad:** usar claves foráneas y transacciones para altas múltiples; impedir sesiones que referencien ejercicios inexistentes.
- **Precisión:** cantidades de kg, cm y tiempos deben manejarse con reglas claras de decimales y redondeo de presentación.
- **Tiempo:** conservar instantes UTC y distinguir fechas locales de entrenamiento/medición.
- **Rendimiento:** indexar `Workout(userId, startedAt)`, `WorkoutExercise(exerciseId)`, `BodyWeightEntry(userId, measuredAt)` y slugs únicos; ajustar según el esquema real.
- **Seguridad:** contraseñas hasheadas, tokens no expuestos en logs, secretos fuera de Git, HTTPS al publicar, backups probados y manejo de errores sin detalles internos.
- **Pruebas mínimas:** usuario A no accede a datos de usuario B; no puede modificarse catálogo vía API; una importación repetida no duplica ejercicios; no se registran valores imposibles.
- **Git:** commits pequeños por fase; `.env` y archivos privados de base de datos fuera del repositorio.

## 10. Crecimiento previsto: módulo de nutrición (NO incluido en 1.0)

En una versión futura se podrán agregar `NutritionModule` y entidades propias, por ejemplo:

- `Food`: alimento y valores nutricionales por unidad/100 g.
- `Meal`: desayuno, almuerzo, cena o colación con fecha y usuario.
- `MealEntry`: alimento, cantidad y unidad dentro de una comida.
- `NutritionGoal`: metas configuradas de calorías y macronutrientes.

**Diseño pensado para evolucionar:** todas estas entidades referenciarán `User`; no se mezclarán con `WorkoutSet` o `Exercise`. Si alguna vista quiere mostrar entrenamiento y alimentación del mismo día, será una consulta de lectura/composición sobre módulos distintos. Evitar meter campos como `calories` o `foodId` en las entidades de entrenamiento solo «por si acaso».

Otros posibles módulos posteriores: `Goals`, `BodyMeasurements`, `Routines`, `Notifications`, `DataExport` y sincronización offline. Cada uno debe justificar su existencia antes de crearse.

## 11. Decisiones cerradas y asuntos pendientes

| Decisiones cerradas | Temas a confirmar durante el desarrollo |
|---|---|
| Backend NestJS/TypeScript; proyecto creado en CJS. | Versiones exactas de dependencias y configuración Prisma correspondiente. |
| Catálogo oficial, administrado solo por desarrollador. | Licencia/origen de imágenes del catálogo. |
| Registro completo y marca rápida con un modelo común. | Reglas finas para dominadas con lastre/asistencia y ejercicios especiales. |
| Serie con `workoutExerciseId`, sin duplicar usuario/ejercicio. | Política de editar/eliminar series y entrenamientos. |
| Perfil, historial, récords, peso e IMC en MVP. | Si se permite el registro público de cuentas al desplegar o mediante invitaciones. |
| Nutrición se agrega después como módulo independiente. | Motor y plataforma de producción; frecuencia de backups. |
| Frontend web responsive; PWA posterior. | Diseño visual detallado y necesidad futura de offline. |

**Criterio de decisiones:** ante una duda, elegir la solución más simple que mantenga integridad de datos y no complique innecesariamente las versiones futuras. Documentar cualquier cambio importante.

## 12. Estado actual y próximo paso exacto

**Realizado antes de este documento:** Node.js instalado; proyecto NestJS `gymtracker` creado y ejecutado; CJS elegido; recurso `exercises` generado mediante `nest g resource exercises`; requisitos y arquitectura conceptual discutidos.

**Todavía no hay evidencia de implementación:** persistencia, DTO personalizados, validación global, autenticación, frontend, importador y lógica de entrenamientos.

**Siguiente tarea concreta (Fase 0 → Fase 1):** abrir `src/exercises/exercises.controller.ts` y `src/exercises/exercises.service.ts`; identificar las rutas CRUD que generó el CLI y decidir cómo dejar exclusivamente los GET del catálogo. Después definir `MuscleGroup`, `Equipment` y `TrackingMode` y diseñar `ExerciseQueryDto`. **No comenzar aún con las tablas de nutrición ni con React.**

### Lista de comprobación para retomar el proyecto en otro chat

1. Adjuntar este documento y decir qué fase y subtarea estás trabajando.
2. Compartir solo los archivos del repositorio relacionados con esa subtarea, si es necesario.
3. Pedir revisión de diseño y pistas antes de solicitar una solución completa.
4. Al terminar, actualizar en este documento las casillas, decisiones nuevas, endpoints terminados y el próximo paso.
5. Guardar los cambios en Git, de modo que el documento describa lo que realmente está implementado.

**Mensaje corto para continuar en otro chat:**

> Estoy desarrollando GymTracker con NestJS para aprender backend programando yo mismo. Adjunté el documento maestro del proyecto. Respeta el alcance del MVP y sus decisiones arquitectónicas; no me entregues el código completo de inmediato. Ayúdame en la fase indicada, con explicaciones, ejercicios pequeños, revisión de mi código y pruebas. Si algo del documento no coincide con el repositorio, pregúntame por los archivos concretos o explícame la discrepancia.

## 13. Referencias técnicas

- NestJS — documentación: https://docs.nestjs.com/
- NestJS + Prisma — receta oficial: https://docs.nestjs.com/recipes/prisma
- Prisma + SQLite — guía oficial: https://docs.prisma.io/docs/prisma-orm/quickstart/sqlite
- MDN — Progressive Web Apps: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- CDC — IMC y limitaciones: https://www.cdc.gov/bmi/about/

**Nota de mantenimiento:** las herramientas evolucionan. Antes de ejecutar comandos de Prisma o publicar una aplicación, verificar la documentación actual correspondiente a las versiones instaladas. Este documento fija los criterios arquitectónicos, no reemplaza los manuales oficiales.
