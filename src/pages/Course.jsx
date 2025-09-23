// Helper to instantly unlock manual validation exercises after submission
  function unlockManualValidationExercise(exerciseId) {
    if (!completedKey) return;
    setCompletedExercises((prev) => {
      if (!prev.includes(exerciseId)) {
        const updated = [...prev, exerciseId];
        localStorage.setItem(completedKey, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }
  
  // Helper to detect if an exercise is a manual validation one
  function isManualValidationExercise(ex) {
    // If it's a lastSubmission object with isManualValidation flag
    if (ex.isManualValidation !== undefined) {
      return ex.isManualValidation;
    }
    // Otherwise check by level and order
    const level = ex.course_level || ex.level || "";
    const order = ex.order;
    return (
      (level === "advanced" && [6, 7, 13].includes(order)) ||
      (level === "intermediate" && order === 18)
    );
  }

  // Helper to detect if a submission is valid for instant unlock
  function isValidSubmission(lastSubmission, exerciseId) {
    if (!lastSubmission) return false;
    const submissionId = String(lastSubmission.exercise_id);
    const currentId = String(exerciseId);
    return submissionId === currentId && (
      lastSubmission.isManualValidation || // Manual validation submissions
      lastSubmission.score >= 90           // Or normal submissions with score >= 90
    );
  }
import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CheckCircle, Lock, PlayCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useCompletionModal } from "../components/CompletionModalContext";

export default function Course() {
  const navigate = useNavigate();
  const { user, token, fetchWithAuth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [exercisesByCourse, setExercisesByCourse] = useState({});
  const [progress, setProgress] = useState({}); // { courseId: completedCount }
  const [completedExercises, setCompletedExercises] = useState([]);
  const [scores, setScores] = useState([]);
  const previousProgress = useRef({});
  const previousCompletedExercises = useRef([]);
  const { showCompletionModal } = useCompletionModal();
  const [lastSubmission, setLastSubmission] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lastSubmission") || "null");
    } catch {
      return null;
    }
  });

  // Fetch all courses
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/courses`)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses || []);
      });
  }, []);

  // Fetch exercises for each course
  useEffect(() => {
    if (!courses.length) return;

    const fetchExercises = async () => {
      try {
        const exercisePromises = courses.map(course => 
          fetch(`${import.meta.env.VITE_API_URL}/api/exercises?course_id=${course._id}`)
            .then(res => res.json())
            .then(data => ({
              courseId: course._id,
              exercises: data.exercises || []
            }))
        );

        const results = await Promise.all(exercisePromises);
        const exercisesMap = {};
        results.forEach(({ courseId, exercises }) => {
          exercisesMap[courseId] = exercises;
        });

        setExercisesByCourse(exercisesMap);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };

    fetchExercises();
  }, [courses]);

  // Fetch user progress
  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auth/me`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProgress(data.user.progress || {});
          setScores(data.user.scores || []);
          // Just use backend data like Dashboard does
          setCompletedExercises(data.user.completedExercises || []);

          // Check for level completion
          if (courses.length > 0 && exercisesByCourse) {
            courses.forEach((course) => {
              const exercises = exercisesByCourse[course._id] || [];
              if (exercises.length > 0) {
                const completedCount = exercises.filter(ex => 
                  data.user.completedExercises.includes(ex._id.toString())
                ).length;
                
                const totalExercises = exercises.length;
                const courseProgress = Math.round((completedCount / totalExercises) * 100);
                
                // If all exercises are completed and this is new
                if (courseProgress === 100 && 
                    (!previousProgress.current[course._id] || 
                     previousProgress.current[course._id] !== 100)) {
                  // Find the next level
                  const levels = ["beginner", "intermediate", "advanced"];
                  const currentLevelIndex = levels.indexOf(course.level);
                  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null;
                  
                  // Show completion modal
                  showCompletionModal(course.level, nextLevel);
                  
                  // Update progress reference
                  previousProgress.current[course._id] = courseProgress;
                }
              }
            });
          }

          // Only clear lastSubmission if backend has registered the score
          if (data.user.scores && lastSubmission) {
            const found = data.user.scores.find(r => String(r.exercise_id) === String(lastSubmission.exercise_id));
            if (found) {
              localStorage.removeItem("lastSubmission");
              setLastSubmission(null);
            }
          }
        }
      });
  }, []); // Only run once on mount

  // No need for localStorage effect anymore since we're using backend data only

  // Add this sorting function before rendering
  const sortedExercises = exercises.sort((a, b) => {
    // Extract numbers from exercise IDs (e.g., "01", "02", etc.)
    const aNum = parseInt(a.exercise_id);
    const bNum = parseInt(b.exercise_id);
    return aNum - bNum;
  });

  return (
    <div className="min-h-screen mt-18 bg-[#e7e7f2] font-worksans flex flex-col">
      <Navbar />
      <div className="bg-gradient-to-r from-[#5c0000] to-[#303033] text-white py-10 px-6 rounded-b-3xl shadow-lg mb-0">
        <h1 className="text-4xl font-kanit font-bold text-center mb-2">
          SolidWorks Course
        </h1>
        <p className="text-center text-lg opacity-90 max-w-2xl mx-auto">
          Master 3D CAD design with our comprehensive SolidWorks training program.
          <br />
          Progress through three expertly crafted levels to become a professional
          designer.
        </p>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {courses.map((course) => {
          const exercises = (exercisesByCourse[course._id] || [])
            .filter((ex) => ex.course_id === course._id)
            .sort((a, b) => {
              // Sort by order field
              return (a.order || 0) - (b.order || 0);
            });
          
          // Same calculation as Dashboard
          const normalizedCompletedExercises = completedExercises.map(String);
          const total = exercises.length;
          const completed = exercises.filter(ex => {
            return normalizedCompletedExercises.includes(String(ex._id));
          }).length;
          const courseProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
          
          // Debug log for advanced course to verify counts
          if (course.level === "advanced") {
            console.log("Advanced Course:", {
              total,
              completed,
              progress: courseProgress,
              exercises: exercises.map(ex => ({ id: ex._id, title: ex.title })),
              completedIds: completedExercises.filter(id => 
                exercises.some(ex => String(ex._id) === String(id))
              )
            });
          }

          // Check if level was just completed
          const wasLevelComplete = previousProgress.current[course._id] === 100;
          if (courseProgress === 100 && !wasLevelComplete && user) {  // Only show if user is logged in
            // Find the next level
            const levels = ["beginner", "intermediate", "advanced"];
            const currentLevelIndex = levels.indexOf(course.level);
            const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null;
            
            // Update progress reference
            previousProgress.current[course._id] = courseProgress;
            
            // Show completion modal (will only show if not previously shown)
            showCompletionModal(course.level, nextLevel);
          }

          return (
            <section
              key={course._id}
              className={`mb-12 p-6 rounded-xl shadow-md border ${
                course.level === "beginner"
                  ? "bg-white border-[#5c0000]"
                  : course.level === "intermediate"
                  ? "bg-[#f3f4fa] border-[#303033]"
                  : "bg-gradient-to-br from-[#5c0000]/90 to-[#303033]/90 border-[#5c0000]"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2
                    className={`text-xl font-bold flex items-center gap-3 ${
                      course.level === "beginner"
                        ? "text-[#5c0000]"
                        : "text-[#303033]"
                    } ${
                      course.level === "advanced" ? "text-white" : ""
                    }`}
                  >
                    {course.title} Level
                    <span className="text-base font-normal">
                      ({completed}/{total} - {courseProgress}% completed)
                    </span>
                  </h2>
                  <p
                    className={`text-sm ${
                      course.level === "beginner"
                        ? "text-[#303033]"
                        : "text-[#5c0000]"
                    } ${course.level === "advanced" ? "text-[#e7e7f2]" : ""}`}
                  >
                    {course.description}
                  </p>
                </div>
                <div
                  className={`text-sm font-medium ${
                    course.level === "beginner"
                      ? "text-[#5c0000]"
                      : "text-[#303033]"
                  } ${course.level === "advanced" ? "text-white" : ""}`}
                >
                  Progress: {courseProgress}%
                </div>
              </div>
              <div
                className={`h-2 w-full rounded-full mb-6 ${
                  course.level === "beginner" 
                    ? "bg-[#d1cfd7]" 
                    : course.level === "advanced"
                    ? "bg-[#444]"
                    : "bg-[#e7e7f2]"
                }`}
              >
                <div
                  className={`h-2 rounded-full ${
                    course.level === "beginner"
                      ? "bg-[#5c0000]"
                      : course.level === "advanced"
                      ? "bg-[#e7e7f2]"
                      : "bg-[#303033]"
                  }`}
                  style={{
                    width: `${courseProgress}%`,
                  }}
                ></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {exercises.map((ex, i) => {
                  const isCompleted = completedExercises.includes(ex._id.toString());
                  let isNext = false;
                  if (i === 0) {
                    // Only unlock the very first exercise, always
                    isNext = true;
                  } else {
                    // For all other exercises, unlock only if previous is completed (and passed if required)
                    const prev = exercises[i - 1];
                    const prevId = prev._id.toString();
                    const prevCompleted = completedExercises.includes(prevId);
                    if (isManualValidationExercise(prev)) {
                      // Manual validation: unlock next as soon as submitted or completed
                      const prevSubmitted = lastSubmission && String(lastSubmission.exercise_id) === prevId && isManualValidationExercise(lastSubmission);
                      isNext = prevCompleted || prevSubmitted;
                    } else {
                      // Normal exercise: unlock next only if previous is passed (score >= 90)
                      const reviewed = scores.find(r => String(r.exercise_id) === prevId);
                      const reviewedPass = reviewed && typeof reviewed.score === "number" && reviewed.score >= 90;
                      const localJustSubmitted = isValidSubmission(lastSubmission, prevId);
                      isNext = reviewedPass || localJustSubmitted;
                    }
                  }
                  // Only unlock if previous is completed, or if it's the very first exercise
                  const isLocked = !isCompleted && !(isNext && (i === 0 || (i > 0 && completedExercises.includes(exercises[i - 1]._id.toString()))));


                  // Always initialize style variables before use
                  let borderColor = "border-[#d1cfd7]";
                  let bgColor = "bg-white";
                  let textColor = "text-[#303033]";
                  let icon = <Lock size={18} className="text-[#b0b3c6]" />;
                  let hover = "";
                  let cursor = "cursor-not-allowed";

                  // Find reviewed score from backend
                  const reviewed = scores.find(r => String(r.exercise_id) === String(ex._id));
                  const reviewedScore = reviewed ? reviewed.score : null;

                  // Local just submitted and passed
                  const localJustSubmitted = lastSubmission && 
                                            String(lastSubmission.exercise_id) === String(ex._id) &&
                                            lastSubmission.cad_comparison?.global_score >= 90;

                  if (isCompleted) {
                    if ((reviewedScore !== null && reviewedScore >= 90) || localJustSubmitted) {
                      // Tick icon for passed
                      borderColor = "border-[#5c0000]";
                      bgColor = "bg-[#fdfdfd]";
                      textColor = "text-[#5c0000]";
                      icon = <CheckCircle size={18} className="text-[#5c0000]" />;
                      hover = "hover:shadow-md hover:-translate-y-1";
                      cursor = "cursor-pointer";
                    } else if (reviewedScore !== null && reviewedScore < 90) {
                      // X icon for reviewed but not passed
                      borderColor = "border-[#b71c1c]";
                      bgColor = "bg-[#fff0f0]";
                      textColor = "text-[#b71c1c]";
                      icon = <XCircle size={18} className="text-[#b71c1c]" />;
                      hover = "hover:shadow-md hover:-translate-y-1";
                      cursor = "cursor-pointer";
                    } else {
                      // Play icon for completed but not reviewed
                      borderColor = "border-[#5c0000]";
                      bgColor = "bg-white";
                      textColor = "text-[#303033]";
                      icon = <PlayCircle size={18} className="text-[#5c0000]" />;
                      hover = "hover:shadow-md hover:-translate-y-1";
                      cursor = "cursor-pointer";
                    }
                  } else if (isNext) {
                    borderColor = "border-[#5c0000]";
                    bgColor = "bg-white";
                    textColor = "text-[#303033]";
                    icon = <PlayCircle size={18} className="text-[#5c0000]" />;
                    hover = "hover:shadow-md hover:-translate-y-1";
                    cursor = "cursor-pointer";
                  }

                  // === Simplify only for advanced cards ===
                  if (course.level === "advanced") {
                    return (
                      <div
                        key={ex._id}
                        onClick={() => {
                          if (!isLocked) {
                            navigate(`/${course.level}-exercise/${ex._id}`);
                          }
                        }}
                        className={`rounded-xl border ${borderColor} ${bgColor} p-3 h-[80px] flex items-center justify-between text-sm font-medium transition-all duration-300 ${hover} ${cursor}`}
                      >
                        <div className={`text-left ${textColor} w-[85%]`}>
                          <span className="block text-xs font-semibold">
                            {i + 1 < 10 ? `0${i + 1}` : i + 1}
                          </span>
                          <span
                            className="text-xs leading-tight overflow-hidden whitespace-nowrap text-ellipsis block max-w-[110px]"
                            title={ex.title}
                          >
                            {ex.title}
                          </span>
                        </div>
                        <div>{icon}</div>
                      </div>
                    );
                  }
                  // === Keep original for other levels ===
                  return (
                    <div
                      key={ex._id}
                      onClick={() => {
                        if (!isLocked) {
                          navigate(`/${course.level}-exercise/${ex._id}`);
                        }
                      }}
                      className={`rounded-xl border ${borderColor} ${bgColor} p-3 h-[80px] flex items-center justify-between text-sm font-medium transition-all duration-300 ${hover} ${cursor}`}
                    >
                      <div className={`text-left ${textColor} w-[85%]`}>
                        <span className="block text-xs font-semibold">
                          {i + 1 < 10 ? `0${i + 1}` : i + 1}
                        </span>
                        <span className="text-xs leading-tight">{ex.title}</span>
                      </div>
                      <div>{icon}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <Footer />
    </div>
  );
}
