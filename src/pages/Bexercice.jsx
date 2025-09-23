import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

/**
 * Exercise submission component with extended DXF validation handling.
 * - Adds DXF-specific entity checks (lines, circles, arcs, dimensions, text, mtext, polylines, lwpolylines).
 * - Displays bounding box and entity counts for DXF submissions.
 * - Compares counts against expected counts if provided (from backend or exercise.dxf_requirements).
 * - Shows a DXF-specific status message and allows progression when appropriate.
 *
 * Replace your existing BeginnerExercise component with this file.
 */
export default function BeginnerExercise() {
  const { id } = useParams();
  const { token, fetchWithAuth, logout } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [feedback, setFeedback] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [allExercises, setAllExercises] = useState([]); // AJOUTÉ
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/exercises`);
        const data = await res.json();
        if (!cancelled && data.success) {
          setAllExercises(data.exercises);
          // FIX: compare _id as string
          const found = data.exercises.find((ex) => ex._id.toString() === id);
          setExercise(found || null);

          // Fetch course info using course_id
          if (found && found.course_id) {
            const cRes = await fetch(
              `${import.meta.env.VITE_API_URL}/api/courses/${found.course_id}`
            );
            const courseData = await cRes.json();
            if (!cancelled && courseData.success) {
              setCourse(courseData.course);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch exercise/course", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  // AJOUTÉ : Fonction pour trouver l'id du prochain exercice du même cours
  function getNextExerciseId() {
    if (!exercise || !allExercises.length) return null;
    const currentCourseId = exercise.course_id;
    const currentExerciseId = exercise._id.toString();

    const sorted = allExercises
      .filter((ex) => ex.course_id === currentCourseId)
      .sort((a, b) => a.order - b.order);

    const idx = sorted.findIndex((ex) => ex._id.toString() === currentExerciseId);

    if (idx >= 0 && idx < sorted.length - 1) {
      return sorted[idx + 1]._id.toString();
    }
    return null;
  }

  if (loading) return <div>Loading...</div>;
  if (!exercise) return <div>Exercise not found</div>;

  // === Determine required file type ===
  let requiredFileType = ".step";
  const level = course?.level || ""; // Get level from course object
  const order = exercise.order;

  if (level === "advanced" && order === 11) {
    requiredFileType = ".dxf";
  } else if (
    (level === "intermediate" && order === 18) ||
    (level === "advanced" && [13, 14].includes(order))
  ) {
    requiredFileType = ".sldasm";
  } else if (level === "advanced" && [6, 7].includes(order)) {
    requiredFileType = ".sldprt";
  }

  // default expected DXF entity types we care about
  const DEFAULT_DXF_ENTITY_KEYS = [
    "LINE",
    "CIRCLE",
    "ARC",
    "POLYLINE",
    "LWPOLYLINE",
    "DIMENSION",
    "TEXT",
    "MTEXT",
  ];

  // === Helpers for parsing CAD/DXF result objects (defensive) ===
  function extractDXFEntityCounts(cadResult) {
    // possible shapes:
    // cadResult.entity_counts = { LINE: 10, CIRCLE: 2, ... }
    // cadResult.dxf = { entity_counts: {...}, bounding_box: {...}, matched_entities: [...] }
    // cadResult.entities = [{type: 'LINE', ...}, ...] -> convert to counts
    if (!cadResult) return null;

    // 1. direct map
    if (cadResult.entity_counts && typeof cadResult.entity_counts === "object") {
      return cadResult.entity_counts;
    }
    // 2. nested dxf.* structure
    if (
      cadResult.dxf &&
      cadResult.dxf.entity_counts &&
      typeof cadResult.dxf.entity_counts === "object"
    ) {
      return cadResult.dxf.entity_counts;
    }
    // 3. alternative names
    if (cadResult.entities_count && typeof cadResult.entities_count === "object") {
      return cadResult.entities_count;
    }
    // 4. list of entities -> convert to counts
    if (Array.isArray(cadResult.entities)) {
      const counts = {};
      cadResult.entities.forEach((e) => {
        const t = (e.type || e.entity_type || e.name || "").toString().toUpperCase();
        if (!t) return;
        counts[t] = (counts[t] || 0) + 1;
      });
      return counts;
    }
    // 5. fallback: maybe counts are inside feedback
    if (cadResult.feedback && typeof cadResult.feedback === "object") {
      const fb = cadResult.feedback;
      if (fb.entity_counts && typeof fb.entity_counts === "object") return fb.entity_counts;
      if (fb.dxf && fb.dxf.entity_counts && typeof fb.dxf.entity_counts === "object")
        return fb.dxf.entity_counts;
    }
    return null;
  }

  function extractBoundingBox(cadResult) {
    // expected forms: cadResult.bounding_box or cadResult.dxf.bounding_box or cadResult.bbox
    const bb =
      cadResult?.bounding_box || cadResult?.dxf?.bounding_box || cadResult?.bbox || null;
    // Normalize to {min: {x,y}, max: {x,y}} if possible
    if (!bb) return null;
    // many possible shapes - just return what we have
    return bb;
  }

  function extractMatchedEntities(cadResult) {
    // matched_entities, matches, dxf.matched_entities
    return (
      cadResult?.matched_entities ||
      cadResult?.matches ||
      cadResult?.dxf?.matched_entities ||
      null
    );
  }

  // === Handle submission ===
  const handleSubmission = async () => {
    if (!uploadFile) {
      alert(`Please upload your ${requiredFileType.toUpperCase()} file before submitting.`);
      return;
    }
    if (!uploadFile.name.toLowerCase().endsWith(requiredFileType)) {
      alert(`Invalid file type. This exercise requires a ${requiredFileType.toUpperCase()} file.`);
      return;
    }

    setResultLoading(true);
    setResultOpen(true);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append(
      "quizAnswers",
      JSON.stringify(
        Object.fromEntries(
          Object.entries(quizAnswers).map(([i, arr]) => [i, arr.map((idx) => idx + 1)])
        )
      )
    );
    formData.append("feedback", feedback); // existing
    formData.append("user_feedback", feedback); // link to backend "user_feedback"

    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/exercises/${exercise._id}/submit`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Submission failed");
      }

      // Determine exercise type and validation strategy
      const courseLevel = exercise.course_level || exercise.level || "";
      const order = exercise.order;
      const exerciseType = (() => {
        if (courseLevel === "advanced" && order === 11) return "dxf";
        if ((courseLevel === "advanced" && [6, 7, 13].includes(order)) ||
            (courseLevel === "intermediate" && order === 18)) return "manual";
        if (requiredFileType === ".sldasm") return "assembly";
        return "cad";
      })();

      // Parse submission & cad result
      const submission = data.submission || {};
      const cadResult = submission.cad_comparison || submission.cadResult || {};

      // Initialize validation state
      const validationState = {
        cadResults: [],
        message: "",
        allowNext: false,
        score: submission.score ?? cadResult.global_score ?? cadResult.score ?? null
      };

      // Helper function to process assembly validation results
      function processAssemblyValidation(data) {
        const assemblyData = data.cad_comparison || data;
        
        // Check if we have valid assembly data
        if (!assemblyData || !assemblyData.num_components || !Array.isArray(assemblyData.components_match)) {
          return {
            isValid: false,
            results: [],
            success: false,
            message: "Invalid assembly validation data"
          };
        }

        // Process component count
        const componentCountResult = {
          type: "component_count",
          label: "Component Count",
          status: assemblyData.num_components.ok ? "success" : "fail",
          message: assemblyData.num_components.message,
          actual: assemblyData.num_components.submitted,
          expected: assemblyData.num_components.reference
        };

        // Process individual components
        const componentResults = assemblyData.components_match.map((comp, idx) => ({
          type: "component",
          label: `Component ${idx + 1}`,
          checks: {
            volume: {
              ok: comp.volume_ok,
              score: comp.volume_score
            },
            centerOfMass: {
              ok: comp.center_of_mass_ok,
              submitted: comp.center_of_mass_sub,
              reference: comp.center_of_mass_ref
            },
            topology: {
              ok: comp.topology_match
            }
          },
          allPassed: comp.volume_ok && comp.center_of_mass_ok && comp.topology_match
        }));

        const allComponentsPassed = componentResults.every(comp => comp.allPassed);
        const success = assemblyData.num_components.ok && allComponentsPassed;

        return {
          isValid: true,
          results: [componentCountResult, ...componentResults],
          success,
          message: success 
            ? "Assembly validation successful! All components match the reference."
            : "Assembly validation failed. Please check component details."
        };
      }

      // Process QCM results
      const qcmResults = exercise.qcm?.map((q, i) => {
        const selected = (quizAnswers[i] || []).map((idx) => idx + 1);
        const correct = [...q.answers].sort();
        const user = [...selected].sort();
        const isCorrect =
          correct.length === user.length &&
          correct.every((ans, idx) => ans === user[idx]);
        return {
          question: q.question,
          isCorrect,
          selected,
          correct,
          options: q.options,
        };
      }) || [];

      // Process validation results based on exercise type
      const processValidationResults = () => {
        const baseData = cadResult.cad_comparison || cadResult;
        
        // For assembly validation
        if (exerciseType === "assembly") {
          if (!baseData?.num_components || !Array.isArray(baseData.components_match)) {
            return {
              success: false,
              message: "Invalid assembly data format",
              results: [],
              allowNext: false
            };
          }

          const components = baseData.components_match.map((comp, idx) => ({
            type: "component",
            label: `Component ${idx + 1}`,
            checks: {
              volume: {
                ok: comp.volume_ok,
                score: Number(comp.volume_score).toFixed(1)
              },
              centerOfMass: {
                ok: comp.center_of_mass_ok,
                submitted: comp.center_of_mass_sub,
                reference: comp.center_of_mass_ref
              },
              topology: {
                ok: comp.topology_match
              }
            },
            allPassed: comp.volume_ok && comp.center_of_mass_ok && comp.topology_match
          }));

          const allValid = components.every(c => c.allPassed) && baseData.num_components.ok;

          return {
            success: allValid,
            message: allValid 
              ? "All components match the reference model perfectly!"
              : "Some components don't match the reference. Check the details below.",
            results: [
              {
                type: "count",
                label: "Component Count",
                status: baseData.num_components.ok ? "success" : "fail",
                actual: baseData.num_components.submitted,
                expected: baseData.num_components.reference
              },
              ...components
            ],
            allowNext: allValid
          };
        }
        
        return { success: false, message: "Unknown validation type", results: [], allowNext: false };
      };
      function processAssemblyValidation(data) {
        const assemblyData = data.cad_comparison || data;
        
        // Check if we have valid assembly data
        if (!assemblyData || !assemblyData.num_components || !Array.isArray(assemblyData.components_match)) {
          return {
            isValid: false,
            results: [],
            success: false,
            message: "Invalid assembly validation data"
          };
        }

        // Process component count
        const componentCountResult = {
          type: "component_count",
          label: "Component Count",
          status: assemblyData.num_components.ok ? "success" : "fail",
          message: assemblyData.num_components.message,
          actual: assemblyData.num_components.submitted,
          expected: assemblyData.num_components.reference
        };

        // Process individual components
        const componentResults = assemblyData.components_match.map((comp, idx) => ({
          type: "component",
          label: `Component ${idx + 1}`,
          checks: {
            volume: {
              ok: comp.volume_ok,
              score: comp.volume_score
            },
            centerOfMass: {
              ok: comp.center_of_mass_ok,
              submitted: comp.center_of_mass_sub,
              reference: comp.center_of_mass_ref
            },
            topology: {
              ok: comp.topology_match
            }
          },
          allPassed: comp.volume_ok && comp.center_of_mass_ok && comp.topology_match
        }));

        const allComponentsPassed = componentResults.every(comp => comp.allPassed);
        const success = assemblyData.num_components.ok && allComponentsPassed;

        return {
          isValid: true,
          results: [componentCountResult, ...componentResults],
          success,
          message: success 
            ? "Assembly validation successful! All components match the reference."
            : "Assembly validation failed. Please check component details."
        };
      }

      // Helper function to process assembly validation results
      const processAssemblyResult = (data) => {
        const assemblyData = data.cad_comparison || data;
        
        if (!assemblyData || !assemblyData.num_components || !Array.isArray(assemblyData.components_match)) {
          return {
            results: [],
            isValid: false,
            message: "Invalid assembly data format",
            allowNext: false
          };
        }

        const componentCountResult = {
          type: "component_count",
          label: "Component Count",
          status: assemblyData.num_components.ok ? "success" : "fail",
          actual: assemblyData.num_components.submitted,
          expected: assemblyData.num_components.reference
        };

        const componentResults = assemblyData.components_match.map((comp, idx) => ({
          type: "component",
          label: `Component ${idx + 1}`,
          checks: {
            volume: {
              ok: comp.volume_ok,
              score: comp.volume_score
            },
            centerOfMass: {
              ok: comp.center_of_mass_ok,
              submitted: comp.center_of_mass_sub,
              reference: comp.center_of_mass_ref
            },
            topology: {
              ok: comp.topology_match
            }
          }
        }));

        const allComponentsMatch = componentResults.every(comp =>
          comp.checks.volume.ok && 
          comp.checks.centerOfMass.ok && 
          comp.checks.topology.ok
        );

        const success = assemblyData.num_components.ok && allComponentsMatch;

        return {
          results: [componentCountResult, ...componentResults],
          isValid: true,
          message: success 
            ? "Assembly validation successful! All components match the reference model."
            : "Some components do not match the reference model. Please check the details.",
          allowNext: success
        };
      };

      // Score detection (defensive)
      const score =
        submission.score ??
        (cadResult.global_score ??
          cadResult.score ??
          cadResult.feedback?.global_score ??
          null);

      // Check the type of validation we need
      const isAssemblyExercise = requiredFileType === ".sldasm";
      const isDxfExercise = requiredFileType === ".dxf";

      // Initialize results
      let cadResults = [];
      let statusMessage = "";
      let allowNext = false;

      // Get validation results based on exercise type
      if (isAssemblyExercise) {
        const assemblyValidation = processAssemblyValidation(cadResult);
        cadResults = assemblyValidation.results;
        statusMessage = assemblyValidation.message;
        allowNext = assemblyValidation.success;

      // Get the correct assembly data object
      const assemblyData = cadResult.cad_comparison || cadResult;

      if (isAssemblyResponse) {
        // Assembly validation results
        cadResults = [
          {
            label: "Component Count",
            status: assemblyData.num_components.ok ? "success" : "fail",
            message: assemblyData.num_components.message,
            actual: assemblyData.num_components.submitted,
            expected: assemblyData.num_components.reference
          },
          ...assemblyData.components_match.map((comp, idx) => ({
            label: `Component ${idx + 1}`,
            isComponent: true,
            volume: {
              status: comp.volume_ok ? "success" : "fail",
              score: comp.volume_score
            },
            centerOfMass: {
              status: comp.center_of_mass_ok ? "success" : "fail",
              submitted: comp.center_of_mass_sub,
              reference: comp.center_of_mass_ref
            },
            topology: {
              status: comp.topology_match ? "success" : "fail"
            },
            allPassed: comp.volume_ok && comp.center_of_mass_ok && comp.topology_match
          }))
        ];

        const allComponentsPassed = assemblyData.components_match.every(comp => 
          comp.volume_ok && comp.center_of_mass_ok && comp.topology_match
        );

        const globalSuccessful = assemblyData.global_score === 100.0 && 
                               assemblyData.num_components.ok &&
                               allComponentsPassed;

        statusMessage = globalSuccessful
          ? "Assembly validation successful! All components match the reference."
          : "Assembly validation failed. Please check component details.";
        
        allowNext = globalSuccessful;

      } else if (isDXF) {
        // extract entity counts & bounding box & matches
        const entityCounts = extractDXFEntityCounts(cadResult) || {};
        const boundingBox = extractBoundingBox(cadResult);
        const matchedEntities = extractMatchedEntities(cadResult);

        // expected counts: backend might provide expected_counts or exercise might have dxf_requirements
        const expectedCounts =
          cadResult.expected_counts ||
          cadResult.dxf?.expected_counts ||
          exercise?.dxf_requirements ||
          null;

        // Build checks for each entity type of interest
        const entityChecks = DEFAULT_DXF_ENTITY_KEYS.map((key) => {
          const actual = Number(entityCounts[key] ?? 0);
          const expected = expectedCounts && typeof expectedCounts[key] !== "undefined"
            ? Number(expectedCounts[key])
            : null;

          // Decide status:
          // - if expected is provided => pass if actual >= expected (you can change to exact === if desired)
          // - else if actual > 0 => success (some entities present)
          // - else fail
          let status = "unknown";
          if (expected !== null) {
            status = actual >= expected ? "success" : "fail";
          } else {
            status = actual > 0 ? "success" : "fail";
          }

          return {
            label: key,
            key,
            actual,
            expected,
            status,
          };
        });

        // bounding box check: success if bounding box exists and has non-zero size (defensive)
        let bboxStatus = "fail";
        if (boundingBox) {
          // try common forms: {min:{x,y}, max:{x,y}} or {xmin, ymin, xmax, ymax}
          const size = (() => {
            if (boundingBox.min && boundingBox.max) {
              const dx = Number(boundingBox.max.x) - Number(boundingBox.min.x);
              const dy = Number(boundingBox.max.y) - Number(boundingBox.min.y);
              return Math.abs(dx) + Math.abs(dy);
            }
            if (
              typeof boundingBox.xmin !== "undefined" &&
              typeof boundingBox.xmax !== "undefined"
            ) {
              const dx = Number(boundingBox.xmax) - Number(boundingBox.xmin);
              const dy = Number(boundingBox.ymax || 0) - Number(boundingBox.ymin || 0);
              return Math.abs(dx) + Math.abs(dy);
            }
            return 0;
          })();
          bboxStatus = size > 0 ? "success" : "fail";
        }

        // overall DXF auto-validation policy:
        // - If backend declares dxf_valid === true or cadResult.dxf_valid === true => allowNext
        // - else allowNext if all required entity checks are success and bbox success
        const backendDXFValid =
          cadResult.dxf_valid === true || cadResult.dxf?.valid === true;
        const allEntitiesOk = entityChecks.every((e) => e.status === "success");
        const allowAdvance = backendDXFValid || (allEntitiesOk && bboxStatus === "success");

        statusMessage = backendDXFValid
          ? "DXF automatically validated by backend."
          : allowAdvance
          ? "DXF passed local checks (entity counts and bounding box)."
          : "DXF validation failed one or more checks (entities / bounding box). Please review.";

        allowNext = allowAdvance;

        // Assemble cadResults array (only DXF relevant items)
        cadResults = [
          {
            label: "Bounding Box",
            status: bboxStatus,
            value: boundingBox || null,
          },
          // entity checks expanded below
          ...entityChecks.map((e) => ({
            label: `Entities: ${e.label}`,
            status: e.status,
            actual: e.actual,
            expected: e.expected,
          })),
          {
            label: "Matched Entities",
            status: matchedEntities ? "success" : "fail",
            value: matchedEntities || null,
          },
        ];

        cadProperties = {
          entityCounts,
          boundingBox,
          matchedEntities,
          expectedCounts,
          rawCadResult: cadResult,
        };
      } else {
        // Non-DXF: reuse previous logic, show the cadChecks mapping
        const hidePrincipalMoments =
          ["68c4831609f681ae64cc4e5c", "68c4831609f681ae64cc4e5f"].includes(
            exercise._id
          );

        const cadChecks = [
          { key: "volume", label: "Volume" },
          { key: "topology", label: "Topology" },
          ...(!hidePrincipalMoments
            ? [{ key: "principal_moments", label: "Principal Moments" }]
            : []),
          { key: "dimensions", label: "Dimensions" },
        ];

        const feedbackObj =
          cadResult && typeof cadResult === "object"
            ? cadResult.feedback ?? cadResult
            : {};

        cadResults = cadChecks.map((check) => {
          const prop = feedbackObj[check.key];
          let status = "unknown";
          if (prop && typeof prop === "object" && "ok" in prop) {
            status = prop.ok === true ? "success" : "fail";
          } else if (typeof prop === "boolean") {
            status = prop ? "success" : "fail";
          } else if (typeof prop === "number" || typeof prop === "string") {
            status = "success";
          } else {
            status = "fail";
          }
          return {
            label: check.label,
            status,
          };
        });

        // status message for other levels
        if (isManualValidation) {
          statusMessage =
            "Submission pending instructor validation. You may continue; your score will be updated after review.";
          allowNext = true; // Always allow next for manual validation
        } else {
          // automatic pass if score >= 80, else set informative text
          if (score !== null && score >= 80) {
            statusMessage = "Your submission passed automatic checks.";
            allowNext = true;
          } else {
            allowNext = score !== null && score >= 50;
          }
        }
      }

      // Process validation based on exercise type
      const validationResults = processValidationResults();
      const finalScore = validationResults.success ? 100 : 0;

      // Put together final resultData
      setResultData({
        qcmResults,
        cadResults: validationResults.results,
        score: finalScore,
        feedback: validationResults.message,
        statusMessage: validationResults.message,
        allowNext: validationResults.allowNext,
      });
    } catch (err) {
      console.error("Submission error", err);
      setResultData({
        error: "Session expired or network error. Please log in again.",
      });
    } finally {
      setResultLoading(false);
    }
  };

  // helper to render assembly component validation
  function renderAssemblyComponent(comp) {
    return (
      <div key={comp.label} className="bg-[#fafafd] rounded-lg p-4 mb-3">
        <div className="flex items-center gap-3 mb-2">
          {!comp.isComponent ? (
            <>
              {comp.status === "success" ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
              <div className="flex-1">
                <div className="flex justify-between">
                  <div className="text-base">{comp.label}</div>
                  {(typeof comp.actual !== 'undefined' && typeof comp.expected !== 'undefined') && (
                    <div className="text-sm text-[#303033]">
                      {comp.actual} / {comp.expected}
                    </div>
                  )}
                </div>
                {comp.message && (
                  <div className="text-sm text-[#666]">{comp.message}</div>
                )}
              </div>
            </>
          ) : (
            <>
              {comp.allPassed ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
              <div className="text-base font-semibold">{comp.label}</div>
            </>
          )}
        </div>
        
        {comp.isComponent && (
          <div className="pl-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              {comp.volume.status === "success" ? (
                <CheckCircle className="text-green-600" size={16} />
              ) : (
                <XCircle className="text-red-600" size={16} />
              )}
              <span>Volume Match: {comp.volume.score}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              {comp.centerOfMass.status === "success" ? (
                <CheckCircle className="text-green-600" size={16} />
              ) : (
                <XCircle className="text-red-600" size={16} />
              )}
              <span>Center of Mass</span>
            </div>
            
            <div className="flex items-center gap-2">
              {comp.topology.status === "success" ? (
                <CheckCircle className="text-green-600" size={16} />
              ) : (
                <XCircle className="text-red-600" size={16} />
              )}
              <span>Topology Match</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // small helper to render DXF entity rows
  function renderEntityRow(e) {
    return (
      <div key={e.label} className="flex items-center gap-3 mb-2">
        {e.status === "success" ? (
          <CheckCircle className="text-green-600" size={20} />
        ) : e.status === "fail" ? (
          <XCircle className="text-red-600" size={20} />
        ) : (
          <Loader2 className="animate-spin text-[#b0b3c6]" size={18} />
        )}
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="text-base">{e.label}</div>
            <div className="text-sm text-[#303033]">
              {typeof e.actual !== "undefined" ? (
                <>
                  {e.actual}
                  {typeof e.expected !== "undefined" ? (
                    <span className="text-xs text-[#7a1a1a]"> / {e.expected}</span>
                  ) : null}
                </>
              ) : e.value ? (
                <span className="text-xs">present</span>
              ) : (
                <span className="text-xs">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("Selected answers:", quizAnswers);
  console.log("Correct answers:", exercise.qcm?.map((q) => q.answers));
  console.log("Token used for submission:", token);
  console.log("course_id value:", exercise.course_id, typeof exercise.course_id);

  // Helper to detect manual validation exercises using course.level and exercise.order
  function isManualValidationExercise() {
    const level = course?.level || "";
    const order = exercise.order;
    return (
      (level === "advanced" && [6, 7, 13].includes(order)) ||
      (level === "intermediate" && order === 18)
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2fa] mt-18 px-2 py-4 font-worksans flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <button
          onClick={() => navigate("/Course")}
          className="flex items-center text-[#5c0000] font-semibold text-sm mb-4"
        >
          <ArrowLeft className="mr-1" size={16} />
          Back to Course
        </button>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* === Redesigned Left Panel === */}
          <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-lg flex flex-col gap-4">
            <h2 className="font-kanit font-bold text-2xl mb-2 text-[#5c0000] tracking-tight">
              {exercise.title}
            </h2>
            <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-[#d1cfd7] shadow-sm">
              <iframe
                src={exercise.video_url}
                className="w-full h-full"
                allowFullScreen
                title="SolidWorks Lesson"
                style={{ background: '#f8f8fa' }}
              ></iframe>
            </div>
            <p className="text-base text-[#303033] leading-relaxed mb-2">
              {exercise.description}
            </p>
            {exercise.instructions && (
              <div className="bg-[#f8f8fa] border-l-4 border-[#5c0000] px-4 py-2 rounded-md text-sm text-[#5c0000] font-medium mb-2">
                <span className="font-semibold">Instructions:</span> {exercise.instructions}
              </div>
            )}
            {exercise.drawing_url && (
              <a
                href={exercise.drawing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-gradient-to-r from-[#5c0000] to-[#7a1a1a] text-white rounded-full font-semibold shadow-lg hover:scale-105 transition-transform duration-150"
                style={{ boxShadow: '0 2px 8px rgba(92,0,0,0.08)' }}
              >
                <Upload size={20} />
                Download Help Files
              </a>
            )}
          </div>

          {/* === QUIZ + UPLOAD + FEEDBACK + SUBMIT === */}
          <div className="bg-white border border-[#d1cfd7] rounded-xl p-4 shadow-md flex flex-col gap-6">
            {/* QUIZ */}
            <div>
              <h3 className="font-semibold text-[#5c0000] mb-2">Knowledge Check</h3>
              {exercise.qcm &&
                exercise.qcm.map((q, i) => (
                  <div key={i} className="mb-4">
                    <p className="text-sm mb-1 font-medium">
                      {i + 1}. {q.question}
                    </p>
                    {q.options.map((opt, idx) => (
                      <label key={idx} className="flex items-center text-sm mb-1">
                        <input
                          type="checkbox"
                          name={`q${i}`}
                          className="mr-2"
                          checked={quizAnswers[i]?.includes(idx) || false}
                          onChange={() => {
                            setQuizAnswers((prev) => {
                              const prevArr = prev[i] || [];
                              let newArr;
                              if (prevArr.includes(idx)) {
                                newArr = prevArr.filter((v) => v !== idx);
                              } else {
                                newArr = [...prevArr, idx];
                              }
                              return { ...prev, [i]: newArr };
                            });
                          }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ))}
            </div>

            {/* UPLOAD */}
            <div className="border border-dashed border-[#5c0000] rounded-xl p-4 text-center bg-[#fafafd]">
              <h3 className="font-semibold text-[#5c0000] mb-2">
                Upload Your Work ({requiredFileType.toUpperCase()})
              </h3>
              <input
                type="file"
                accept={requiredFileType}
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="hidden"
                id="upload"
              />
              <label htmlFor="upload" className="cursor-pointer inline-block">
                <Upload className="mx-auto mb-2 text-[#5c0000]" size={32} />
                <p className="text-sm">
                  Click to upload your {requiredFileType.toUpperCase()} file
                </p>
                <p className="text-xs text-[#b0b3c6]">
                  Only {requiredFileType.toUpperCase()} files are accepted
                </p>
              </label>
              {uploadFile && (
                <p className="mt-2 text-sm font-medium text-[#303033]">
                  ✅ Uploaded: {uploadFile.name}
                </p>
              )}
            </div>

            {/* FEEDBACK */}
            <div>
              <h3 className="font-semibold text-[#5c0000] mb-2">Your Feedback</h3>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full border border-[#d1cfd7] rounded-lg p-2 text-sm resize-none focus:outline-[#5c0000]"
                placeholder="Share your thoughts about this lesson or ask questions..."
              ></textarea>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="text-center">
              <button
                onClick={handleSubmission}
                className="bg-[#5c0000] text-white px-8 py-3 rounded-full text-base font-bold hover:bg-[#7a1a1a] transition flex items-center gap-2 mx-auto"
              >
                <Send size={18} /> Submit All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === RESULT CARD === */}
      {resultOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(245, 245, 250, 0.85)",
            backdropFilter: "blur(2px)",
          }}
        >
          {isManualValidationExercise() ? (
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in flex flex-col items-center">
              <button
                className="absolute top-4 right-4 text-[#5c0000] hover:text-[#7a1a1a] text-xl font-bold"
                onClick={() => setResultOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="font-kanit text-2xl font-bold mb-6 text-[#5c0000] text-center">
                Submission Received
              </h2>
              <div className="flex flex-col items-center gap-4 py-6">
                <CheckCircle className="text-[#5c0000]" size={48} />
                <span className="text-lg font-semibold text-[#5c0000] text-center">
                  Your work has been submitted for manual review.
                </span>
                <span className="text-base text-[#303033] text-center">
                  An instructor will review your submission and update your score soon.<br />
                  <span className="font-bold text-[#5c0000]">
                    You can continue to the next exercise now!
                  </span>
                </span>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <button
                  className="bg-[#5c0000] text-white px-8 py-2 rounded-full font-bold hover:bg-[#7a1a1a] transition"
                    onClick={() => {
                      // Mark this exercise as completed in localStorage using user-specific key
                      const completedKey = token ? `completedExercises_${token}` : null;
                      if (completedKey) {
                        let completed = JSON.parse(localStorage.getItem(completedKey) || "[]");
                        const idStr = exercise._id.toString();
                        if (!completed.includes(idStr)) {
                          completed.push(idStr);
                          localStorage.setItem(completedKey, JSON.stringify(completed));
                          // Also set lastSubmission for instant UI feedback
                          localStorage.setItem("lastSubmission", JSON.stringify({
                            exercise_id: idStr,
                            isManualValidation: true
                          }));
                        }
                      }
                      setResultOpen(false);
                      navigate("/Course");
                    }}
                >
                  OK
                </button>
                <button
                  className="bg-[#d1cfd7] text-[#5c0000] px-8 py-2 rounded-full font-bold hover:bg-[#b0b3c6] transition"
                    onClick={() => {
                      // Mark this exercise as completed in localStorage using user-specific key
                      const completedKey = token ? `completedExercises_${token}` : null;
                      if (completedKey) {
                        let completed = JSON.parse(localStorage.getItem(completedKey) || "[]");
                        const idStr = exercise._id.toString();
                        if (!completed.includes(idStr)) {
                          completed.push(idStr);
                          localStorage.setItem(completedKey, JSON.stringify(completed));
                          // Also set lastSubmission for instant UI feedback
                          localStorage.setItem("lastSubmission", JSON.stringify({
                            exercise_id: idStr,
                            isManualValidation: true
                          }));
                        }
                      }
                      setResultOpen(false);
                      const nextId = getNextExerciseId();
                      if (nextId) {
                        navigate(`/exercise/${nextId}`);
                      } else {
                        navigate("/Course");
                      }
                    }}
                >
                  Next Exercise
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in">
              <button
                className="absolute top-4 right-4 text-[#5c0000] hover:text-[#7a1a1a] text-xl font-bold"
                onClick={() => setResultOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="font-kanit text-2xl font-bold mb-6 text-[#5c0000] text-center">
                Submission Results
              </h2>
              {resultLoading ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Loader2 className="animate-spin text-[#5c0000]" size={32} />
                  <span className="text-[#5c0000] font-semibold">Checking your answers...</span>
                </div>
              ) : resultData?.error ? (
                <div className="text-red-600 text-center">{resultData.error}</div>
              ) : (
                <>
                  {/* QCM Results */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-[#5c0000] mb-3">QCM Correction</h3>
                    {resultData.qcmResults.map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        {q.isCorrect ? (
                          <CheckCircle className="text-green-600" size={22} />
                        ) : (
                          <XCircle className="text-red-600" size={22} />
                        )}
                        <span className="text-base">{q.question}</span>
                      </div>
                    ))}
                  </div>

                  {/* CAD / DXF Results */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-[#5c0000] mb-3">
                      {requiredFileType === ".dxf"
                        ? "DXF Entity Validation"
                        : requiredFileType === ".sldasm"
                        ? "Assembly Validation"
                        : "CAD Model Validation"}
                    </h3>

                    {(() => {
                      // Handle assembly validation results
                      if (requiredFileType === ".sldasm" && resultData.cadResults[0]?.type === "component") {
                        return (
                          <div className="space-y-4">
                            {resultData.cadResults.map((result, idx) => (
                              <div key={idx} className="bg-[#fafafd] rounded-lg p-4">
                                {result.type === "component_count" ? (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {result.status === "success" ? (
                                        <CheckCircle className="text-green-600" size={20} />
                                      ) : (
                                        <XCircle className="text-red-600" size={20} />
                                      )}
                                      <span className="font-medium">{result.label}</span>
                                    </div>
                                    <span className="text-sm">
                                      {result.actual} / {result.expected}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      {result.checks.volume.ok && result.checks.centerOfMass.ok && result.checks.topology.ok ? (
                                        <CheckCircle className="text-green-600" size={20} />
                                      ) : (
                                        <XCircle className="text-red-600" size={20} />
                                      )}
                                      <span className="font-medium">{result.label}</span>
                                    </div>
                                    <div className="pl-6 space-y-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        {result.checks.volume.ok ? (
                                          <CheckCircle className="text-green-600" size={16} />
                                        ) : (
                                          <XCircle className="text-red-600" size={16} />
                                        )}
                                        <span>Volume Match: {result.checks.volume.score}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {result.checks.centerOfMass.ok ? (
                                          <CheckCircle className="text-green-600" size={16} />
                                        ) : (
                                          <XCircle className="text-red-600" size={16} />
                                        )}
                                        <span>Center of Mass Match</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {result.checks.topology.ok ? (
                                          <CheckCircle className="text-green-600" size={16} />
                                        ) : (
                                          <XCircle className="text-red-600" size={16} />
                                        )}
                                        <span>Topology Match</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      // Handle DXF validation
                      if (requiredFileType === ".dxf") {
                      <>
                        <div className="mb-3 text-sm text-[#303033]">
                          Drawing entity check (lines, circles, text, etc.)
                        </div>
                        <div className="mb-3">
                          {resultData.cadResults
                            .filter(
                              c =>
                                c.label === "Bounding Box" ||
                                c.label.startsWith("Entities:") ||
                                c.label === "Matched Entities"
                            )
                            .map((c) => renderEntityRow(c))}
                        </div>
                        {resultData.cadProperties?.boundingBox && (
                          <div className="text-xs text-[#303033] bg-[#fafafd] p-3 rounded-lg">
                            <div className="font-semibold mb-1">Détails du cadre englobant</div>
                            <pre className="text-[12px] overflow-auto">
                              {JSON.stringify(resultData.cadProperties.boundingBox, null, 2)}
                            </pre>
                          </div>
                        )}
                        {resultData.cadProperties?.matchedEntities && (
                          <div className="text-xs text-[#303033] bg-[#fafafd] p-3 rounded-lg mt-3">
                            <div className="font-semibold mb-1">Entités correspondantes</div>
                            <pre className="text-[12px] overflow-auto">
                              {JSON.stringify(resultData.cadProperties.matchedEntities, null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="mb-3">
                        {resultData.cadResults.map((c) => (
                          <div key={c.label} className="flex items-center gap-2 mb-2">
                            {c.status === "success" ? (
                              <CheckCircle className="text-green-600" size={22} />
                            ) : c.status === "fail" ? (
                              <XCircle className="text-red-600" size={22} />
                            ) : (
                              <span className="text-[#b0b3c6] flex items-center">
                                <Loader2 className="animate-spin mr-1" size={18} />
                                <span>En attente...</span>
                              </span>
                            )}
                            <span className="text-base">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="mb-6 text-center">
                    <span className="font-bold text-xl text-[#5c0000]">
                      Score:{" "}
                      {resultData.score !== null && typeof resultData.score !== "undefined"
                        ? `${resultData.score}/100`
                        : "N/A"}
                    </span>
                    <div className="text-base mt-2 text-[#303033]">
                      {typeof resultData.score === "number" && resultData.score >= 80
                        ? "🎉 You have successfully completed this exercise!"
                        : "Review the results and try again if needed."}
                    </div>
                  </div>

                  {/* Status Message */}
                  {resultData.statusMessage && (
                    <div className="mb-4 text-center text-[#5c0000] font-semibold">
                      {resultData.statusMessage}
                    </div>
                  )}

                  <div className="flex justify-center gap-6 mt-2">
                    <button
                      className="bg-[#5c0000] text-white px-8 py-2 rounded-full font-bold hover:bg-[#7a1a1a] transition"
                      onClick={() => {
                        setResultOpen(false);
                        // Unlock this exercise locally for the session
                        let completed = JSON.parse(localStorage.getItem("completedExercises") || "[]");
                        const idStr = exercise._id.toString();
                        if (!completed.includes(idStr)) {
                          completed.push(idStr);
                          localStorage.setItem("completedExercises", JSON.stringify(completed));
                        }
                        // For normal exercises, save lastSubmission for instant tick
                        const level = course?.level || "";
                        const isManualValidation = (level === "advanced" && [6, 7, 13].includes(exercise.order)) || (level === "intermediate" && exercise.order === 18);
                        if (!isManualValidation && resultData?.score >= 90) {
                          localStorage.setItem("lastSubmission", JSON.stringify({ exercise_id: idStr, score: resultData.score }));
                        }
                        navigate("/Course");
                      }}
                    >
                      OK
                    </button>
                    {resultData.allowNext && (
                      <button
                        className="bg-[#d1cfd7] text-[#5c0000] px-8 py-2 rounded-full font-bold hover:bg-[#b0b3c6] transition"
                        onClick={() => {
                          setResultOpen(false);
                          setQuizAnswers({});      // Reset QCM answers
                          setUploadFile(null);     // Reset uploaded file
                          setFeedback("");         // Optionally reset feedback
                          const nextId = getNextExerciseId();
                          if (nextId) {
                            navigate(`/exercise/${nextId}`);
                          } else {
                            navigate("/Course");
                          }
                        }}
                      >
                        Next Exercise
                      </button>
                    )}
                    <button
                      className="bg-[#d1cfd7] text-[#5c0000] px-8 py-2 rounded-full font-bold hover:bg-[#b0b3c6] transition"
                      onClick={() => setResultOpen(false)}
                    >
                      Retry
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
