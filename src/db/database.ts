import Dexie, { type Table } from "dexie";

export type TrainingFocus =
  | "Heavy"
  | "Moderate"
  | "High Reps";

export type WorkoutSet = {
  weight: string;
  reps: string;
};

export type Workout = {
  id?: number;

  muscle: string;
  date: string;

  startedAt: number;
  finishedAt?: number;

  status: "active" | "completed";
};

export type WorkoutExercise = {
  id?: number;

  workoutId: number;

  exerciseId?: string;

  name: string;

  primaryMuscle: string;
  secondaryMuscles: string[];

  focus: TrainingFocus;

  sets: WorkoutSet[];

  createdAt: number;
};

export type CustomExercise = {
  id?: number;

  customId: string;

  name: string;

  primaryMuscle: string;
  secondaryMuscles: string[];

  createdAt: number;
};

class GymLogDatabase extends Dexie {
  workouts!: Table<Workout, number>;

  workoutExercises!: Table<
    WorkoutExercise,
    number
  >;

  customExercises!: Table<
    CustomExercise,
    number
  >;

  constructor() {
    super("GymLogDatabase");

    /*
     * Original database
     */
    this.version(1).stores({
      workouts:
        "++id, muscle, date, status, startedAt",

      workoutExercises:
        "++id, workoutId, exerciseId, name, createdAt",
    });

    /*
     * Version 2 adds custom exercises.
     *
     * We repeat the existing tables here so
     * Dexie knows the complete schema for V2.
     */
    this.version(2).stores({
      workouts:
        "++id, muscle, date, status, startedAt",

      workoutExercises:
        "++id, workoutId, exerciseId, name, createdAt",

      customExercises:
        "++id, customId, name, primaryMuscle, createdAt",
    });

    /*
     * Explicitly connect the class properties
     * to the Dexie tables.
     */
    this.workouts =
      this.table("workouts");

    this.workoutExercises =
      this.table("workoutExercises");

    this.customExercises =
      this.table("customExercises");
  }
}

export const db =
  new GymLogDatabase();