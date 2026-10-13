export type ExerciseDefinition = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  isCustom?: boolean;
};

export const exerciseLibrary: ExerciseDefinition[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
  },
  {
    id: "incline-bench-press",
    name: "Incline Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    primaryMuscle: "Chest",
    secondaryMuscles: [],
  },
  {
    id: "pec-deck",
    name: "Pec Deck",
    primaryMuscle: "Chest",
    secondaryMuscles: [],
  },

  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps"],
  },
  {
    id: "pull-up",
    name: "Pull Up",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps"],
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps", "Shoulders"],
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps"],
  },
  {
    id: "deadlift",
    name: "Deadlift",
    primaryMuscle: "Back",
    secondaryMuscles: ["Legs"],
  },

  {
    id: "shoulder-press",
    name: "Shoulder Press",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Triceps"],
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Triceps"],
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    primaryMuscle: "Shoulders",
    secondaryMuscles: [],
  },
  {
    id: "front-raise",
    name: "Front Raise",
    primaryMuscle: "Shoulders",
    secondaryMuscles: [],
  },
  {
    id: "reverse-fly",
    name: "Reverse Fly",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Back"],
  },

  {
    id: "barbell-curl",
    name: "Barbell Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
  },
  {
    id: "dumbbell-curl",
    name: "Dumbbell Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
  },
  {
    id: "preacher-curl",
    name: "Preacher Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: [],
  },

  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
  },
  {
    id: "overhead-tricep-extension",
    name: "Overhead Tricep Extension",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
  },
  {
    id: "skull-crusher",
    name: "Skull Crusher",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
  },
  {
    id: "close-grip-bench-press",
    name: "Close Grip Bench Press",
    primaryMuscle: "Triceps",
    secondaryMuscles: ["Chest", "Shoulders"],
  },

  {
    id: "squat",
    name: "Squat",
    primaryMuscle: "Legs",
    secondaryMuscles: ["Core"],
  },
  {
    id: "leg-press",
    name: "Leg Press",
    primaryMuscle: "Legs",
    secondaryMuscles: [],
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    primaryMuscle: "Legs",
    secondaryMuscles: [],
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    primaryMuscle: "Legs",
    secondaryMuscles: [],
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    primaryMuscle: "Legs",
    secondaryMuscles: ["Back"],
  },
  {
    id: "calf-raise",
    name: "Calf Raise",
    primaryMuscle: "Legs",
    secondaryMuscles: [],
  },

  {
    id: "crunch",
    name: "Crunch",
    primaryMuscle: "Abs/Core",
    secondaryMuscles: [],
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    primaryMuscle: "Abs/Core",
    secondaryMuscles: [],
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    primaryMuscle: "Abs/Core",
    secondaryMuscles: [],
  },
  {
    id: "plank",
    name: "Plank",
    primaryMuscle: "Abs/Core",
    secondaryMuscles: [],
  },

  {
    id: "treadmill",
    name: "Treadmill",
    primaryMuscle: "Cardio",
    secondaryMuscles: ["Legs"],
  },
  {
    id: "stationary-bike",
    name: "Stationary Bike",
    primaryMuscle: "Cardio",
    secondaryMuscles: ["Legs"],
  },
  {
    id: "elliptical",
    name: "Elliptical",
    primaryMuscle: "Cardio",
    secondaryMuscles: ["Legs"],
  },
];
