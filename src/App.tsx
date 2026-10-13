import { useEffect, useState } from "react";

import "./App.css";

import {
  Home,
  CalendarDays,
  BarChart3,
} from "lucide-react";

import {
  exerciseLibrary,
  type ExerciseDefinition,
} from "./data/exercises";

import {
  db,
  type TrainingFocus,
  type WorkoutSet,
  type WorkoutExercise,
  type Workout,
  type CustomExercise,
} from "./db/database";

type PastWorkout = {
  workout: Workout;
  exercises: WorkoutExercise[];
};

type WorkoutStats = {
  workoutsThisWeek: number;
  exercisesThisWeek: number;
  totalSetsThisWeek: number;

  setsByMuscle: Record<string, number>;
};

function App() {
  const muscleGroups = [
    {
      name: "Chest",
      image: "/muscle-images/chest.png",
    },
    {
      name: "Back",
      image: "/muscle-images/back.png",
    },
    {
      name: "Shoulders",
      image: "/muscle-images/shoulders.png",
    },
    {
      name: "Biceps",
      image: "/muscle-images/biceps.png",
    },
    {
      name: "Triceps",
      image: "/muscle-images/triceps.png",
    },
    {
      name: "Legs",
      image: "/muscle-images/legs.png",
    },
    {
      name: "Abs/Core",
      image: "/muscle-images/abs-core.png",
    },
    {
      name: "Cardio",
      image: "/muscle-images/cardio.png",
    },
  ];

  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const [showExerciseSheet, setShowExerciseSheet] = useState(false);

  const [exerciseName, setExerciseName] = useState("");

  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);

  const [pastWorkouts, setPastWorkouts] = useState<PastWorkout[]>([]);

  const [expandedWorkoutId, setExpandedWorkoutId] = useState<number | null>(null);

  const [lastExercisePerformance, setLastExercisePerformance] = useState<WorkoutExercise | null>(null);

  const [workoutStats, setWorkoutStats] =
    useState<WorkoutStats>({
      workoutsThisWeek: 0,
      exercisesThisWeek: 0,
      totalSetsThisWeek: 0,
      setsByMuscle: {},
    });

  const [activeTab, setActiveTab] =
    useState<"home" | "log" | "stats">("home");

  type DailyLogEntry = {
    date: string;
    workouts: PastWorkout[];
  };

  const [customExercises, setCustomExercises] =
    useState<ExerciseDefinition[]>([]);

  const [dailyLog, setDailyLog] =
    useState<DailyLogEntry[]>([]);

  const [expandedLogDate, setExpandedLogDate] =
    useState<string | null>(null);

  const [lastExerciseDate, setLastExerciseDate] = useState<string | null>(null);
  const [trainingFocus, setTrainingFocus] =
    useState<TrainingFocus>("Moderate");

  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseDefinition | null>(null);

  const [sets, setSets] = useState<WorkoutSet[]>([
    { weight: "", reps: "" },
    { weight: "", reps: "" },
    { weight: "", reps: "" },
  ]);

  const [activeWorkoutId, setActiveWorkoutId] =
    useState<number | null>(null);

  /*
   * Reads exercises belonging to the currently active workout.
   * useLiveQuery automatically updates the screen whenever
   * something changes inside IndexedDB.
   */
  const [loggedExercises, setLoggedExercises] =
  useState<WorkoutExercise[]>([]);

  useEffect(() => {
    async function loadCustomExercises() {
      const saved =
        await db.customExercises
          .orderBy("createdAt")
          .toArray();

      const converted: ExerciseDefinition[] =
        saved.map((exercise) => ({
          id: exercise.customId,
          name: exercise.name,
          primaryMuscle:
            exercise.primaryMuscle,
          secondaryMuscles:
            exercise.secondaryMuscles,
          isCustom: true,
        }));

      setCustomExercises(converted);
    }

    loadCustomExercises();
  }, []);

  useEffect(() => {
    async function initializeApp() {
      await autoCompleteOldWorkouts();

      if (activeTab === "log") {
        await loadWorkoutLog();
      }
    }

    initializeApp();
  }, []);
  useEffect(() => {
  async function loadExercises() {
    if (!activeWorkoutId) {
      setLoggedExercises([]);
      return;
    }

    const exercises = await db.workoutExercises
      .where("workoutId")
      .equals(activeWorkoutId)
      .sortBy("createdAt");

    setLoggedExercises(exercises);
  }

  loadExercises();
}, [activeWorkoutId]);

  /*
   * Date information
   */
  const today = new Date();

  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const dayName = today.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const fullDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  /*
   * Exercise search
   */
  const allExercises = [
    ...exerciseLibrary,
    ...customExercises,
  ];

  const filteredExercises = allExercises.filter((exercise) => {
    const search = exerciseName.toLowerCase().trim();

    if (!search) {
      return exercise.primaryMuscle === selectedMuscle;
    }

    return exercise.name.toLowerCase().includes(search);
  });

  const visibleExercises = filteredExercises.slice(0, 6);

  async function loadWorkoutStats() {
    const now = new Date();

    /*
    * Start of current week.
    * Sunday = start of week for now.
    */
    const startOfWeek =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay(),
      );

    startOfWeek.setHours(0, 0, 0, 0);

    const completedWorkouts =
      await db.workouts
        .where("status")
        .equals("completed")
        .toArray();

    const thisWeekWorkouts =
      completedWorkouts.filter(
        (workout) =>
          workout.startedAt >=
          startOfWeek.getTime(),
      );

    let exercisesThisWeek = 0;
    let totalSetsThisWeek = 0;

    const setsByMuscle: Record<
      string,
      number
    > = {};

    for (const workout of thisWeekWorkouts) {
      if (!workout.id) {
        continue;
      }

      const exercises =
        await db.workoutExercises
          .where("workoutId")
          .equals(workout.id)
          .toArray();

      exercisesThisWeek +=
        exercises.length;

      for (const exercise of exercises) {
        const numberOfSets =
          exercise.sets.length;

        totalSetsThisWeek +=
          numberOfSets;

        const muscle =
          exercise.primaryMuscle;

        if (!setsByMuscle[muscle]) {
          setsByMuscle[muscle] = 0;
        }

        setsByMuscle[muscle] +=
          numberOfSets;
      }
    }

    setWorkoutStats({
      workoutsThisWeek:
        thisWeekWorkouts.length,

      exercisesThisWeek,

      totalSetsThisWeek,

      setsByMuscle,
    });
  }
  /*
   * Open Add Exercise sheet
   */
  function openExerciseSheet() {
    setEditingExerciseId(null);
    setExerciseName("");
    setSelectedExercise(null);
    setLastExercisePerformance(null);
    setLastExerciseDate(null);
    setTrainingFocus("Moderate");

    setSets([
      { weight: "", reps: "" },
      { weight: "", reps: "" },
      { weight: "", reps: "" },
    ]);

    setShowExerciseSheet(true);
  }

  async function loadPastWorkouts(muscle: string) {
    const completedWorkouts = await db.workouts
      .where("muscle")
      .equals(muscle)
      .filter(
        (workout) =>
          workout.status === "completed",
      )
      .toArray();

    completedWorkouts.sort(
      (a, b) => b.startedAt - a.startedAt,
    );

    const workoutsWithExercises =
      await Promise.all(
        completedWorkouts.map(
          async (workout) => {
            if (!workout.id) {
              return {
                workout,
                exercises: [],
              };
            }

            const exercises =
              await db.workoutExercises
                .where("workoutId")
                .equals(workout.id)
                .sortBy("createdAt");

            return {
              workout,
              exercises,
            };
          },
        ),
      );

    setPastWorkouts(workoutsWithExercises);
  }

  function editExercise(exercise: WorkoutExercise) {
    setEditingExerciseId(exercise.id ?? null);

    setExerciseName(exercise.name);

    setTrainingFocus(exercise.focus);

    setSets(exercise.sets);

    setLastExercisePerformance(null);
    setLastExerciseDate(null);

    const libraryExercise =
      exerciseLibrary.find(
        (item) => item.id === exercise.exerciseId,
      ) ?? null;

    setSelectedExercise(libraryExercise);

    setShowExerciseSheet(true);
  }

  /*
   * Close Add Exercise sheet
   */
  function closeExerciseSheet() {
    setShowExerciseSheet(false);
  }

  /*
   * Update weight or reps for a particular set
   */
  function updateSet(
    index: number,
    field: "weight" | "reps",
    value: string,
  ) {
    const updatedSets = [...sets];

    updatedSets[index] = {
      ...updatedSets[index],
      [field]: value,
    };

    setSets(updatedSets);
  }

  /*
   * Add another set
   */
  function addSet() {
    setSets([...sets, { weight: "", reps: "" }]);
  }

  /*
   * Remove a set
   */
  function removeSet(index: number) {
    if (sets.length <= 1) {
      return;
    }

    setSets(
      sets.filter((_, setIndex) => setIndex !== index),
    );
  }

  async function loadLastExercisePerformance(
    exercise: ExerciseDefinition,
  ) {
    const previousExercises =
      await db.workoutExercises
        .where("exerciseId")
        .equals(exercise.id)
        .toArray();

    if (previousExercises.length === 0) {
      setLastExercisePerformance(null);
      setLastExerciseDate(null);
      return;
    }

    const completedMatches: {
      exercise: WorkoutExercise;
      workout: Workout;
    }[] = [];

    for (const previousExercise of previousExercises) {
      const workout = await db.workouts.get(
        previousExercise.workoutId,
      );

      if (
        workout &&
        workout.status === "completed"
      ) {
        completedMatches.push({
          exercise: previousExercise,
          workout,
        });
      }
    }

    completedMatches.sort(
      (a, b) =>
        b.workout.startedAt -
        a.workout.startedAt,
    );

    const latest =
      completedMatches[0];

    if (!latest) {
      setLastExercisePerformance(null);
      setLastExerciseDate(null);
      return;
    }

    setLastExercisePerformance(
      latest.exercise,
    );

    setLastExerciseDate(
      latest.workout.date,
    );

    /*
    * Prefill today's weights using
    * the previous workout.
    *
    * Reps remain empty because those
    * should reflect today's performance.
    */
    setSets(
      latest.exercise.sets.map(
        (set) => ({
          weight: set.weight,
          reps: "",
        }),
      ),
    );

    setTrainingFocus(
      latest.exercise.focus,
    );
  }
  /*
   * Save exercise to IndexedDB
   */
  async function saveExercise() {
    if (!exerciseName.trim()) {
      alert("Please enter an exercise name.");
      return;
    }

    const completedSets = sets.filter(
      (set) =>
        set.weight.trim() !== "" ||
        set.reps.trim() !== "",
    );

    if (completedSets.length === 0) {
      alert("Please enter at least one set.");
      return;
    }

    let workoutId =
      activeWorkoutId;

    if (!workoutId) {
      if (!selectedMuscle) {
        alert(
          "No muscle group selected.",
        );
        return;
      }

      workoutId =
        await db.workouts.add({
          muscle:
            selectedMuscle,
          date: dateKey,
          startedAt:
            Date.now(),
          status: "active",
        });

      setActiveWorkoutId(
        workoutId,
      );
    }

    let primaryMuscle = selectedMuscle || "Other";
    let secondaryMuscles: string[] = [];
    let exerciseId: string | undefined;

    if (selectedExercise) {
      primaryMuscle =
        selectedExercise.primaryMuscle;

      secondaryMuscles =
        selectedExercise.secondaryMuscles;

      exerciseId = selectedExercise.id;
    }

    if (editingExerciseId !== null) {
      await db.workoutExercises.update(
        editingExerciseId,
        {
          exerciseId,
          name: exerciseName.trim(),
          primaryMuscle,
          secondaryMuscles,
          focus: trainingFocus,
          sets: completedSets,
        },
      );
    } else {
      const exercise: WorkoutExercise = {
        workoutId,
        exerciseId,
        name: exerciseName.trim(),
        primaryMuscle,
        secondaryMuscles,
        focus: trainingFocus,
        sets: completedSets,
        createdAt: Date.now(),
      };

      await db.workoutExercises.add(exercise);
    }

    const updatedExercises =
      await db.workoutExercises
        .where("workoutId")
        .equals(workoutId)
        .sortBy("createdAt");

    setLoggedExercises(updatedExercises);

    closeExerciseSheet();
  }

  async function createCustomExercise() {
    const name = exerciseName.trim();

    if (!name) {
      return;
    }

    if (!selectedMuscle) {
      alert("Select a muscle group first.");
      return;
    }

    const alreadyExists = allExercises.some(
      (exercise) =>
        exercise.name.toLowerCase() ===
        name.toLowerCase(),
    );

    if (alreadyExists) {
      alert("That exercise already exists.");
      return;
    }

    const customId = `custom-${Date.now()}`;

    const customExercise: ExerciseDefinition = {
      id: customId,
      name,
      primaryMuscle: selectedMuscle,
      secondaryMuscles: [],
      isCustom: true,
    };

    const databaseExercise: CustomExercise = {
      customId,
      name,
      primaryMuscle: selectedMuscle,
      secondaryMuscles: [],
      createdAt: Date.now(),
    };

    await db.customExercises.add(
      databaseExercise,
    );

    setCustomExercises((current) => [
      ...current,
      customExercise,
    ]);

    setSelectedExercise(customExercise);
  }

  async function loadWorkoutLog() {
    const completedWorkouts = await db.workouts
      .filter(
        (workout) =>
          workout.status === "completed",
      )
      .toArray();

    completedWorkouts.sort(
      (a, b) => b.startedAt - a.startedAt,
    );

    const grouped: Record<string, PastWorkout[]> = {};

    for (const workout of completedWorkouts) {
      if (!workout.id) continue;

      const exercises =
        await db.workoutExercises
          .where("workoutId")
          .equals(workout.id)
          .sortBy("createdAt");

      if (!grouped[workout.date]) {
        grouped[workout.date] = [];
      }

      grouped[workout.date].push({
        workout,
        exercises,
      });
    }

    const result: DailyLogEntry[] =
      Object.entries(grouped)
        .map(([date, workouts]) => ({
          date,
          workouts,
        }))
        .sort(
          (a, b) =>
            new Date(`${b.date}T12:00:00`).getTime() -
            new Date(`${a.date}T12:00:00`).getTime(),
        );

    setDailyLog(result);
  }

  async function deleteExercise() {
    if (editingExerciseId === null) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${exerciseName} from this workout?`,
    );

    if (!confirmed) {
      return;
    }

    await db.workoutExercises.delete(
      editingExerciseId,
    );

    if (activeWorkoutId) {
      const updatedExercises =
        await db.workoutExercises
          .where("workoutId")
          .equals(activeWorkoutId)
          .sortBy("createdAt");

      setLoggedExercises(updatedExercises);
    }

    closeExerciseSheet();
  }

  async function autoCompleteOldWorkouts() {
    const activeWorkouts = await db.workouts
      .where("status")
      .equals("active")
      .toArray();

    const twentyHours =
      20 * 60 * 60 * 1000;

    const now = Date.now();

    for (const workout of activeWorkouts) {
      const age =
        now - workout.startedAt;

      if (
        age >= twentyHours &&
        workout.id
      ) {
        await db.workouts.update(
          workout.id,
          {
            status: "completed",
            finishedAt:
              workout.startedAt +
              twentyHours,
          },
        );
      }
    }
  }

  async function finishWorkout() {
    if (!activeWorkoutId) {
      return;
    }

    if (loggedExercises.length === 0) {
      alert(
        "Add at least one exercise before finishing the workout.",
      );

      return;
    }

    const confirmed = window.confirm(
      `Finish today's ${selectedMuscle} workout?`,
    );

    if (!confirmed) {
      return;
    }

    await db.workouts.update(
      activeWorkoutId,
      {
        status: "completed",
        finishedAt: Date.now(),
      },
    );

    if (selectedMuscle) {
      await loadPastWorkouts(
        selectedMuscle,
      );
    }

    setLoggedExercises([]);
    setActiveWorkoutId(null);
    setExpandedWorkoutId(null);

    alert("Workout completed!");

    setSelectedMuscle(null);
  }

  /*
   * Open existing workout for today,
   * or create a new workout if one does not exist.
   */
  async function openMuscleWorkout(
    muscle: string,
  ) {
    const existingWorkout =
      await db.workouts
        .where("muscle")
        .equals(muscle)
        .filter(
          (workout) =>
            workout.date ===
              dateKey &&
            workout.status ===
              "active",
        )
        .first();

    if (existingWorkout?.id) {
      setActiveWorkoutId(
        existingWorkout.id,
      );
    } else {
      setActiveWorkoutId(null);
    }

    await loadPastWorkouts(
      muscle,
    );

    setSelectedMuscle(
      muscle,
    );
  }

  /*
   * MUSCLE WORKOUT SCREEN
   */
  if (selectedMuscle) {
    return (
      <div className="app">
        <div className="mobile-container">
          <header className="workout-header">
            <button
              className="back-button"
              onClick={() => {
                setSelectedMuscle(null);
                setActiveWorkoutId(null);
              }}
            >
              ←
            </button>

            <div>
              <h1>{selectedMuscle}</h1>

              <p>
                {dayName} • {fullDate}
              </p>
            </div>
          </header>

          <main>
            <section className="today-section">
              <div className="section-heading-row">
                <div>
                  <h2>Today's Workout</h2>

                  {loggedExercises.length > 0 && (
                    <p className="workout-summary">
                      {loggedExercises.length}{" "}
                      {loggedExercises.length === 1
                        ? "exercise"
                        : "exercises"}{" "}
                      •{" "}
                      {loggedExercises.reduce(
                        (total, exercise) =>
                          total +
                          exercise.sets.length,
                        0,
                      )}{" "}
                      sets
                    </p>
                  )}
                </div>
              </div>

              {loggedExercises.length === 0 ? (
                <div className="empty-workout-card">
                  <div className="empty-icon">
                    🏋️
                  </div>

                  <h3>No exercises yet</h3>

                  <p>
                    Add your first exercise for
                    today's{" "}
                    {selectedMuscle.toLowerCase()}{" "}
                    workout.
                  </p>

                  <button
                    className="primary-button"
                    onClick={openExerciseSheet}
                  >
                    + Add Exercise
                  </button>
                </div>
              ) : (
                <>
                  <div className="exercise-list">
                    {loggedExercises.map(
                      (exercise) => (
                        <div
                          className="logged-exercise-card"
                          key={
                            exercise.id ??
                            exercise.createdAt
                          }
                        >
                          <div className="exercise-title-row">
                            <h3>
                              {exercise.name}
                            </h3>

                            <span
                              className={`focus-badge ${exercise.focus
                                .toLowerCase()
                                .replace(
                                  " ",
                                  "-",
                                )}`}
                            >
                              {exercise.focus}
                            </span>
                          </div>

                          <div className="saved-sets">
                            {exercise.sets.map(
                              (set, index) => (
                                <div
                                  className="saved-set-row"
                                  key={index}
                                >
                                  <span>
                                    Set{" "}
                                    {index + 1}
                                  </span>

                                  <strong>
                                    {set.weight ||
                                      "—"}{" "}
                                    lb ×{" "}
                                    {set.reps ||
                                      "—"}
                                  </strong>
                                </div>
                              ),
                            )}
                          </div>
                          <button
                            className="edit-exercise-button"
                            onClick={() => editExercise(exercise)}
                          >
                            Edit
                          </button>
                        </div>
                      ),
                    )}
                  </div>

                  <button
                    className="primary-button add-another-button"
                    onClick={openExerciseSheet}
                  >
                    + Add Exercise
                  </button>

                  <button
                    className="finish-button"
                    onClick={finishWorkout}
                  >
                    ✓ Finish Workout
                  </button>
                </>
              )}
            </section>

            <section className="history-section">
              <h2>
                Past {selectedMuscle} Workouts
              </h2>

              {pastWorkouts.length === 0 ? (
                <div className="empty-history">
                  <p>No past workouts yet.</p>

                  <span>
                    Your completed workouts will
                    appear here.
                  </span>
                </div>
              ) : (
                <div className="past-workout-list">
                  {pastWorkouts.map(
                    ({ workout, exercises }) => {
                      const isExpanded =
                        expandedWorkoutId ===
                        workout.id;

                      const workoutDate =
                        new Date(
                          `${workout.date}T12:00:00`,
                        );

                      const formattedDate =
                        workoutDate.toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        );

                      const formattedDay =
                        workoutDate.toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                          },
                        );

                      const totalSets =
                        exercises.reduce(
                          (total, exercise) =>
                            total +
                            exercise.sets.length,
                          0,
                        );

                      return (
                        <div
                          className="past-workout-card"
                          key={workout.id}
                        >
                          <button
                            className="past-workout-header"
                            onClick={() =>
                              setExpandedWorkoutId(
                                isExpanded
                                  ? null
                                  : workout.id ??
                                      null,
                              )
                            }
                          >
                            <div>
                              <strong>
                                {formattedDate} •{" "}
                                {formattedDay}
                              </strong>

                              <span>
                                {exercises.length}{" "}
                                {exercises.length ===
                                1
                                  ? "exercise"
                                  : "exercises"}{" "}
                                • {totalSets} sets
                              </span>
                            </div>

                            <span className="history-arrow">
                              {isExpanded
                                ? "▲"
                                : "▼"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="past-workout-details">
                              {exercises.map(
                                (exercise) => (
                                  <div
                                    className="past-exercise"
                                    key={
                                      exercise.id ??
                                      exercise.createdAt
                                    }
                                  >
                                    <div className="past-exercise-title">
                                      <strong>
                                        {
                                          exercise.name
                                        }
                                      </strong>

                                      <span>
                                        {
                                          exercise.focus
                                        }
                                      </span>
                                    </div>

                                    {exercise.sets.map(
                                      (
                                        set,
                                        index,
                                      ) => (
                                        <div
                                          className="past-set-row"
                                          key={index}
                                        >
                                          <span>
                                            Set{" "}
                                            {index +
                                              1}
                                          </span>

                                          <strong>
                                            {set.weight ||
                                              "—"}{" "}
                                            lb ×{" "}
                                            {set.reps ||
                                              "—"}
                                          </strong>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </main>
        </div>

        {/* ADD EXERCISE BOTTOM SHEET */}

        {showExerciseSheet && (
          <div
            className="sheet-overlay"
            onClick={closeExerciseSheet}
          >
            <div
              className="exercise-sheet"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="sheet-handle" />

              <div className="sheet-header">
                <h2>
                {editingExerciseId !== null
                  ? "Edit Exercise"
                  : "Add Exercise"}
                </h2>

                <button
                  className="close-button"
                  onClick={closeExerciseSheet}
                >
                  ×
                </button>
              </div>

              <label className="field-label">
                Exercise
              </label>

              <input
                className="exercise-search"
                type="text"
                placeholder="Search or enter exercise..."
                value={exerciseName}
                onChange={(event) => {
                  setExerciseName(
                    event.target.value,
                  );

                  setSelectedExercise(null);
                }}
              />

              {/* EXERCISE SEARCH RESULTS */}

              <div className="exercise-results">
                {visibleExercises.map(
                  (exercise) => (
                    <button
                      className={
                        selectedExercise?.id ===
                        exercise.id
                          ? "exercise-result selected"
                          : "exercise-result"
                      }
                      key={exercise.id}
                      onClick={async () => {
                        setSelectedExercise(exercise);
                        setExerciseName(exercise.name);

                        await loadLastExercisePerformance(
                          exercise,
                        );
                      }}
                    >
                      <div className="exercise-result-main">
                        <strong>
                          {exercise.name}
                        </strong>

                        <span>
                          {
                            exercise.primaryMuscle
                          }
                        </span>
                      </div>

                      {exercise
                        .secondaryMuscles
                        .length > 0 && (
                        <div className="secondary-muscles">
                          {exercise.secondaryMuscles.join(
                            " • ",
                          )}
                        </div>
                      )}
                    </button>
                  ),
                )}

                {exerciseName.trim() !== "" &&
                  !allExercises.some(
                    (exercise) =>
                      exercise.name.toLowerCase() ===
                      exerciseName.trim().toLowerCase(),
                  ) && (
                    <button
                      type="button"
                      className="create-custom-exercise"
                      onClick={createCustomExercise}
                    >
                      <span className="custom-plus">+</span>

                      <div>
                        <strong>
                          Create "{exerciseName.trim()}"
                        </strong>

                        <span>
                          Add as a custom exercise
                        </span>
                      </div>
                    </button>
                  )}
              </div>

              {/* SELECTED EXERCISE MUSCLE INFO */}

              {selectedExercise && (
                <div className="selected-exercise-info">
                  <div>
                    <span className="info-label">
                      Primary
                    </span>

                    <strong>
                      {
                        selectedExercise.primaryMuscle
                      }
                    </strong>
                  </div>

                  {selectedExercise
                    .secondaryMuscles.length >
                    0 && (
                    <div>
                      <span className="info-label">
                        Secondary
                      </span>

                      <strong>
                        {selectedExercise.secondaryMuscles.join(
                          ", ",
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {editingExerciseId === null &&
                selectedExercise &&
                lastExercisePerformance && (
                  <div className="last-performance-card">
                    <div className="last-performance-header">
                      <div>
                        <span className="last-performance-label">
                          LAST TIME
                        </span>

                        {lastExerciseDate && (
                          <strong>
                            {new Date(
                              `${lastExerciseDate}T12:00:00`,
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </strong>
                        )}
                      </div>

                      <span className="last-focus">
                        {
                          lastExercisePerformance.focus
                        }
                      </span>
                    </div>

                    <div className="last-sets">
                      {lastExercisePerformance.sets.map(
                        (set, index) => (
                          <div
                            className="last-set-row"
                            key={index}
                          >
                            <span>
                              Set {index + 1}
                            </span>

                            <strong>
                              {set.weight || "—"} lb ×{" "}
                              {set.reps || "—"}
                            </strong>
                          </div>
                        ),
                      )}
                    </div>

                    <p className="prefill-note">
                      Previous weights were copied into
                      today's sets.
                    </p>
                  </div>
                )}

              {/* TRAINING FOCUS */}

              <div className="form-section">
                <label className="field-label">
                  Training Focus
                </label>

                <div className="focus-options">
                  {(
                    [
                      "Heavy",
                      "Moderate",
                      "High Reps",
                    ] as TrainingFocus[]
                  ).map((focus) => (
                    <button
                      key={focus}
                      className={
                        trainingFocus ===
                        focus
                          ? "focus-button selected"
                          : "focus-button"
                      }
                      onClick={() =>
                        setTrainingFocus(
                          focus,
                        )
                      }
                    >
                      {focus}
                    </button>
                  ))}
                </div>
              </div>

              {/* SETS */}

              <div className="form-section">
                <div className="sets-heading">
                  <label className="field-label">
                    Today's Sets
                  </label>

                  <div className="set-column-labels">
                    <span>Weight</span>
                    <span>Reps</span>
                  </div>
                </div>

                <div className="sets-list">
                  {sets.map(
                    (set, index) => (
                      <div
                        className="set-input-row"
                        key={index}
                      >
                        <span className="set-number">
                          {index + 1}
                        </span>

                        <div className="weight-input-wrapper">
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            value={set.weight}
                            onChange={(
                              event,
                            ) =>
                              updateSet(
                                index,
                                "weight",
                                event.target
                                  .value,
                              )
                            }
                          />

                          <span>lb</span>
                        </div>

                        <input
                          className="reps-input"
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={set.reps}
                          onChange={(
                            event,
                          ) =>
                            updateSet(
                              index,
                              "reps",
                              event.target
                                .value,
                            )
                          }
                        />

                        <button
                          className="remove-set-button"
                          onClick={() =>
                            removeSet(
                              index,
                            )
                          }
                          disabled={
                            sets.length ===
                            1
                          }
                        >
                          ×
                        </button>
                      </div>
                    ),
                  )}
                </div>

                <button
                  className="add-set-button"
                  onClick={addSet}
                >
                  + Add Set
                </button>
              </div>

              {editingExerciseId !== null && (
                <button
                  className="delete-exercise-button"
                  onClick={deleteExercise}
                >
                  Delete Exercise
                </button>
              )}

              <button
                className="save-exercise-button"
                onClick={saveExercise}
              >
                {editingExerciseId !== null
                  ? "Save Changes"
                  : "Save Exercise"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
    * LOG SCREEN
    */
  if (activeTab === "log") {
    return (
      <div className="app">
        <div className="mobile-container">
          <header className="header">
            <h1>Workout Log</h1>
            <p>Completed workouts by day</p>
          </header>

          <main>
            {dailyLog.length === 0 ? (
              <div className="empty-history">
                <p>No completed workouts yet.</p>
                <span>
                  Finished workouts will appear here.
                </span>
              </div>
            ) : (
              <div className="log-list">
                {dailyLog.map((day) => {
                  const isExpanded =
                    expandedLogDate === day.date;

                  const date = new Date(
                    `${day.date}T12:00:00`,
                  );

                  const formattedDay =
                    date.toLocaleDateString("en-US", {
                      weekday: "long",
                    });

                  const formattedDate =
                    date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                  return (
                    <div
                      className="log-day-card"
                      key={day.date}
                    >
                      <button
                        className="log-day-header"
                        onClick={() =>
                          setExpandedLogDate(
                            isExpanded
                              ? null
                              : day.date,
                          )
                        }
                      >
                        <div>
                          <strong>
                            {formattedDay}
                          </strong>

                          <span>
                            {formattedDate}
                          </span>
                        </div>

                        <div className="log-muscle-summary">
                          {day.workouts.map(
                            ({ workout }) => (
                              <span key={workout.id}>
                                {workout.muscle}
                              </span>
                            ),
                          )}
                        </div>

                        <span className="history-arrow">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="log-day-details">
                          {day.workouts.map(
                            ({
                              workout,
                              exercises,
                            }) => (
                              <div
                                className="log-muscle-section"
                                key={workout.id}
                              >
                                <h3>
                                  {workout.muscle}
                                </h3>

                                {exercises.map(
                                  (exercise) => (
                                    <div
                                      className="log-exercise"
                                      key={
                                        exercise.id ??
                                        exercise.createdAt
                                      }
                                    >
                                      <div className="log-exercise-title">
                                        <strong>
                                          {exercise.name}
                                        </strong>

                                        <span>
                                          {exercise.focus}
                                        </span>
                                      </div>

                                      {exercise.sets.map(
                                        (
                                          set,
                                          index,
                                        ) => (
                                          <div
                                            className="log-set-row"
                                            key={index}
                                          >
                                            <span>
                                              Set{" "}
                                              {index + 1}
                                            </span>

                                            <strong>
                                              {set.weight ||
                                                "—"}{" "}
                                              lb ×{" "}
                                              {set.reps ||
                                                "—"}
                                            </strong>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        <nav className="bottom-nav">
          <button
            onClick={() => {
              setActiveTab("home");
            }}
          >
            <Home size={21} />
            <span>Home</span>
          </button>

          <button className="active">
            <CalendarDays size={21} />
            <span>Log</span>
          </button>

          <button
            onClick={async () => {
              await loadWorkoutStats();
              setActiveTab("stats");
            }}
          >
            <BarChart3 size={21} />
            <span>Stats</span>
          </button>
        </nav>
      </div>
    );
  }

  /*
  * STATS SCREEN
  */

  /*
 * STATS SCREEN
 */
  if (activeTab === "stats") {
    const muscleOrder = [
      "Chest",
      "Back",
      "Shoulders",
      "Biceps",
      "Triceps",
      "Legs",
      "Abs/Core",
      "Cardio",
    ];

    const maximumSets = Math.max(
      ...muscleOrder.map(
        (muscle) =>
          workoutStats.setsByMuscle[
            muscle
          ] || 0,
      ),
      1,
    );

    return (
      <div className="app">
        <div className="mobile-container">
          <header className="header">
            <h1>Stats</h1>

            <p>This Week</p>
          </header>

          <main>
            {/* WEEK SUMMARY */}

            <section className="stats-summary">
              <div className="stat-box">
                <strong>
                  {
                    workoutStats.workoutsThisWeek
                  }
                </strong>

                <span>Workouts</span>
              </div>

              <div className="stat-box">
                <strong>
                  {
                    workoutStats.exercisesThisWeek
                  }
                </strong>

                <span>Exercises</span>
              </div>

              <div className="stat-box">
                <strong>
                  {
                    workoutStats.totalSetsThisWeek
                  }
                </strong>

                <span>Total Sets</span>
              </div>
            </section>

            {/* MUSCLE SETS */}

            <section className="muscle-stats-section">
              <h2>
                Sets per Muscle Group
              </h2>

              <div className="muscle-stat-list">
                {muscleOrder.map(
                  (muscle) => {
                    const count =
                      workoutStats
                        .setsByMuscle[
                        muscle
                      ] || 0;

                    const percentage =
                      (count /
                        maximumSets) *
                      100;

                    return (
                      <div
                        className="muscle-stat-row"
                        key={muscle}
                      >
                        <div className="muscle-stat-label">
                          <span>
                            {muscle}
                          </span>

                          <strong>
                            {count}
                          </strong>
                        </div>

                        <div className="muscle-stat-track">
                          <div
                            className="muscle-stat-bar"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </section>
          </main>
        </div>

        <nav className="bottom-nav">
          <button
            onClick={() => {
              setActiveTab("home");
            }}
          >
            <Home size={21} />
            <span>Home</span>
          </button>

          <button
            onClick={async () => {
              await loadWorkoutLog();
              setActiveTab("log");
            }}
          >
            <CalendarDays size={21} />
            <span>Log</span>
          </button>

          <button className="active">
            <BarChart3 size={21} />
            <span>Stats</span>
          </button>
        </nav>
      </div>
    );
  }

  /*
   * HOME SCREEN
   */
  return (
    <div className="app">
      <div className="mobile-container">
        <header className="header">
          <div>
            <h1>{dayName}</h1>
            <p>{fullDate}</p>
          </div>
        </header>

        <main>
          <h2>
            What are you training today?
          </h2>

          <div className="muscle-grid">
            {muscleGroups.map((muscle) => (
              <button
                className="muscle-card"
                key={muscle.name}
                onClick={() =>
                  openMuscleWorkout(muscle.name)
                }
              >
                <div className="muscle-image-wrapper">
                  <img
                    src={muscle.image}
                    alt={`${muscle.name} muscle`}
                    className="muscle-image"
                  />
                </div>

                <span>{muscle.name}</span>
              </button>
            ))}
          </div>
        </main>
      </div>

      <nav className="bottom-nav">
        <button className="active">
          <Home size={21} />
          <span>Home</span>
        </button>

        <button
          onClick={async () => {
            await loadWorkoutLog();

            setActiveTab("log");
            setSelectedMuscle(null);
            setActiveWorkoutId(null);
          }}
        >
          <CalendarDays size={21} />
          <span>Log</span>
        </button>

        <button
          onClick={async () => {
            await loadWorkoutStats();

            setActiveTab("stats");
            setSelectedMuscle(null);
            setActiveWorkoutId(null);
          }}
        >
          <BarChart3 size={21} />
          <span>Stats</span>
        </button>
      </nav>
    </div>
  );
}

export default App;