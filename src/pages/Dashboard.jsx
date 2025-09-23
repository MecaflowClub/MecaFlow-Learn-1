import React, { useEffect, useState } from "react";
import { FiBookOpen, FiUser, FiTarget, FiLogOut, FiArrowLeft, FiEdit3, FiX, FiCheck } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { fetchWithAuth } from "../utils/auth";


export default function Dashboard() {
  const { user: contextUser, logout } = useAuth();
  const [user, setUser] = useState(contextUser);
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [courses, setCourses] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(null); // Changed to null to indicate no edit
  const [updateStatus, setUpdateStatus] = useState({ type: "", message: "" });
  const [exercisesByCourse, setExercisesByCourse] = useState({});
  const [completedExercises, setCompletedExercises] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/courses`)
      .then((res) => res.json())
      .then((data) => {
        // Sort courses by level before setting state
        const sortedCourses = (data.courses || []).sort((a, b) => {
          const levelOrder = { "beginner": 1, "intermediate": 2, "advanced": 3 };
          return levelOrder[a.level] - levelOrder[b.level];
        });
        setCourses(sortedCourses);
      })
      .catch(error => {
        console.error("Error fetching courses:", error);
        setCourses([]);
      });
  }, []);

  // Always fetch user data directly for up-to-date rank/score
  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auth/me`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(error => {
        console.error("Error fetching user data:", error);
      });
  }, []);

  // Fetch exercises for each course
  useEffect(() => {
    if (!courses || !courses.length) return;
    
    courses.forEach((course) => {
      if (!course?._id) return;
      
      fetch(`${import.meta.env.VITE_API_URL}/api/exercises?course_id=${course._id}`)
        .then((res) => res.json())
        .then((data) => {
          setExercisesByCourse((prev) => ({
            ...prev,
            [course._id]: data.exercises || [],
          }));
        })
        .catch(error => {
          console.error(`Error fetching exercises for course ${course._id}:`, error);
        });
    });
  }, [courses]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validate that at least one change is being made
    const isNameBeingUpdated = editedName !== null && editedName.trim() !== "";
    
    // Skip if no changes are being made at all
    if (!isNameBeingUpdated && !showPasswordSection) return;
    
    if (showPasswordSection) {
      // Enhanced password validation with strict checks
      const trimmedCurrentPassword = currentPassword.trim();
      const trimmedNewPassword = newPassword.trim();
      const trimmedConfirmPassword = confirmPassword.trim();

      // Check for empty fields
      if (!trimmedCurrentPassword || !trimmedNewPassword || !trimmedConfirmPassword) {
        setUpdateStatus({ type: 'error', message: 'Please fill in all password fields.' });
        return;
      }

      // Check for whitespace in passwords
      if ([trimmedCurrentPassword, trimmedNewPassword, trimmedConfirmPassword].some(
        pwd => pwd.includes(' ')
      )) {
        setUpdateStatus({ type: 'error', message: 'Passwords cannot contain spaces.' });
        return;
      }

      // Exact match check for new password and confirmation
      if (trimmedNewPassword !== trimmedConfirmPassword) {
        setUpdateStatus({ type: 'error', message: 'New password and confirmation must match exactly.' });
        return;
      }

      // Length validation
      if (trimmedNewPassword.length < 6) {
        setUpdateStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
        return;
      }

      // Check if new password is different from current
      if (trimmedCurrentPassword === trimmedNewPassword) {
        setUpdateStatus({ type: 'error', message: 'New password must be different from current password.' });
        return;
      }
    }
    
    setUpdateStatus({ type: 'loading', message: 'Updating your profile...' });
    
    try {
      // Prepare request body with trimmed values
      const requestBody = {};
      
      // Add name only if it was actually edited (not null and not empty)
      if (editedName !== null && editedName.trim()) {
        requestBody.name = editedName.trim();
      }
      
      // Add password fields if changing password, using trimmed values
      if (showPasswordSection) {
        // Use trimmed values to ensure no whitespace issues
        requestBody.current_password = currentPassword.trim();
        requestBody.new_password = newPassword.trim();
        requestBody.confirm_password = newPassword.trim(); // Use same exact value as new_password
      }

      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auth/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle FastAPI validation errors
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Handle validation errors array
            const errorMessage = data.detail[0]?.msg || 'Validation error';
            throw new Error(errorMessage);
          } else if (typeof data.detail === 'string') {
            // Handle string error messages
            throw new Error(data.detail);
          }
        }
        // Handle other error formats
        if (data.message) {
          throw new Error(data.message);
        } else if (typeof data === 'string') {
          throw new Error(data);
        }
        throw new Error('Failed to update profile');
      }
      
      if (editedName.trim()) {
        setUser({ ...user, name: editedName.trim() });
      }
      
      setUpdateStatus({ type: 'success', message: data.message || 'Profile updated successfully!' });
      
      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
      
      // Close modal after short delay
      setTimeout(() => {
        setIsEditingProfile(false);
        setUpdateStatus(null);
      }, 1500);
      
    } catch (error) {
      setUpdateStatus({ 
        type: 'error', 
        message: error.message || 'Failed to update profile. Please try again.'
      });
    }
  };

  // Fetch user progress
  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auth/me`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProgress(data.user.progress || {});
          setCompletedExercises(data.user.completedExercises || []);
        }
      });
  }, []);

  // Compute per-course progress and overall progress
  const courseProgressData = (courses || []).map((course) => {
    if (!course?._id) return null;
    
    const exercises = (exercisesByCourse[course._id] || []).filter(
      (ex) => ex?.course_id === course._id
    );
    const total = exercises.length;
    const completed = exercises.filter((ex) => ex?._id && completedExercises.includes(ex._id)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { level: course.level, title: course.title || 'Untitled Course', percent, completed, total };
  });

  const validProgressData = courseProgressData.filter(Boolean); // Remove null entries
  const totalCompleted = validProgressData.reduce((acc, c) => acc + (c?.completed || 0), 0);
  const totalCount = validProgressData.reduce((acc, c) => acc + (c?.total || 0), 0);
  const overallProgress = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;

  // Rank card definitions and progress logic
  const rankThresholds = [
    { name: "Bronze", min: 0, max: 1000, color: "from-[#8C4A2F] to-[#D97745]", text: "text-orange-100", bar: "bg-gradient-to-r from-[#8C4A2F] to-[#D97745]" },
    { name: "Silver", min: 1000, max: 2000, color: "from-[#9CA3AF] to-[#6B7280]", text: "text-gray-100", bar: "bg-gradient-to-r from-[#9CA3AF] to-[#6B7280]" },
    { name: "Gold", min: 2000, max: 3500, color: "from-[#FACC15] to-[#CA8A04]", text: "text-yellow-100", bar: "bg-gradient-to-r from-[#FACC15] to-[#CA8A04]" },
    { name: "Platinum", min: 3500, max: 5200, color: "from-[#D1D5DB] to-[#6B7280]", text: "text-gray-100", bar: "bg-gradient-to-r from-[#D1D5DB] to-[#6B7280]" },
    { name: "Diamond", min: 5200, max: Infinity, color: "from-[#3B82F6] to-[#1E3A8A]", text: "text-blue-100", bar: "bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A]" },
  ];
  const totalScore = user?.total_score || 0;
  const userRankObj = rankThresholds.find(tier => totalScore >= tier.min && totalScore < tier.max) || rankThresholds[2];
  const userRank = userRankObj.name;
  const userCard = userRankObj;
  const showScore = user && typeof user.total_score === "number";
  const globalScore = showScore ? user.total_score : null;
  // Progress toward next rank
  const nextTier = rankThresholds[rankThresholds.indexOf(userRankObj) + 1];
  let progressToNext = 100;
  let progressLabel = "Max Rank";
  if (nextTier) {
    progressToNext = Math.min(100, Math.round(((totalScore - userRankObj.min) / (nextTier.min - userRankObj.min)) * 100));
    progressLabel = `${nextTier.name} at ${nextTier.min}`;
  }

  return (
    <div className="min-h-screen bg-[#e7e7f2] font-worksans relative">
      {/* === User Rank Card Top Right === */}
      {/* Top right User Rank Card removed as requested */}
      {/* === Navbar === */}
      <nav className="bg-white shadow-md h-18 px-6 py-4 mb-0 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[#303033] hover:text-[#5c0000] font-semibold transition"
          >
            <FiArrowLeft className="text-lg" />
            Back
          </button>
          <h1 className="text-xl font-bold text-[#5c0000]">MecaFlow Learn</h1>
        </div>

        <div className="flex items-center gap-4 text-[#303033]">
          <FiUser className="text-xl" />
          <span className="text-sm font-medium">
            Hi, {user?.name || "Student"}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-[#5c0000] hover:underline font-semibold transition"
          >
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </div>
      </nav>
      {/* === User Rank Card Full Width Professional === */}
        <div className="w-full -mt-5 mb-10 px-0">
          <div className={`w-full max-w-7xl mx-auto min-h-[200px] rounded-3xl shadow-2xl bg-gradient-to-r ${userCard.color} flex flex-col md:flex-row items-center justify-between text-white transition scale-100 ring-2 ring-[#5c0000] p-8 relative overflow-hidden`}>
            {/* Decorative background circles */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full z-0" />
          <div className="absolute -bottom-16 right-0 w-72 h-72 bg-white/5 rounded-full z-0" />
          <div className="flex-1 z-10 flex flex-col items-start justify-center">
            <h2 className="text-3xl md:text-4xl font-extrabold font-kanit drop-shadow-lg mb-2">Welcome back{user?.name ? `, ${user.name}` : "!"}</h2>
            <p className="text-base md:text-lg text-white/90 mb-4">Continue your learning journey today.</p>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-lg md:text-xl font-bold">Score:</span>
              {showScore ? (
                <span className="text-2xl md:text-3xl font-extrabold text-yellow-300 drop-shadow">{globalScore}</span>
              ) : (
                <span className="text-2xl text-[#b0b3c6] animate-pulse">...</span>
              )}
            </div>
            {/* Rank Progress Bar - Professional Overlay */}
            <div className="w-full flex justify-center items-center relative" style={{ minHeight: '70px' }}>
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-lg z-20">
                <div className="flex justify-between items-center mb-1 px-3">
                  <span className="text-xs md:text-sm font-semibold text-white/90 tracking-wide">{userCard.name}</span>
                  <span className="text-xs md:text-sm font-semibold text-white/90 tracking-wide">{nextTier ? nextTier.name : "Max"}</span>
                </div>
                <div className="w-full bg-white/30 backdrop-blur-md rounded-full h-6 shadow-lg border border-white/20 relative flex items-center">
                  <div
                    className={`h-6 rounded-full ${userCard.bar} transition-all duration-700 shadow-xl`}
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm md:text-base font-bold drop-shadow text-white whitespace-nowrap px-2">
                    {nextTier ? `${progressToNext}% to ${nextTier.name}` : "Max Rank"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-1 justify-end items-center z-10">
            <img src="/src/assets/hero.svg" alt="Learning Hero" className="w-60 h-60 object-contain drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* === Progress Cards === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 -mt-20 z-10 relative">
        {courseProgressData.map((course) => (
          <Card
            key={course.level}
            title={course.title + " Course"}
            progress={course.percent}
            completed={course.completed}
            total={course.total}
          />
        ))}
      </div>

      {/* === Profile Summary === */}
      <div className="bg-white shadow-md rounded-2xl p-6 m-6 flex flex-col md:flex-row gap-6 items-center">
        {/* Avatar */}
        <div className="w-24 h-24 bg-[#e7e7f2] rounded-full flex items-center justify-center text-4xl font-bold text-[#5c0000] shadow-inner">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="User avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            user?.name?.charAt(0).toUpperCase() || <FiUser />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-kanit text-[#303033] font-bold">
            {user?.name || "Student Name"}
          </h2>
          <p className="text-sm text-gray-600">
            {user?.email || "example@email.com"}
          </p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Overall Progress
            </div>
            <div className="w-full bg-[#e7e7f2] rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-[#5c0000] to-[#303033] transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {overallProgress}% completed
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <button 
          onClick={() => setIsEditingProfile(true)}
          className="mt-4 md:mt-0 px-4 py-2 rounded-full border border-[#5c0000] text-[#5c0000] hover:bg-[#5c0000] hover:text-white transition font-medium flex items-center gap-1"
        >
          <FiEdit3 />
          Edit Profile
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 relative">
            <button 
              onClick={() => setIsEditingProfile(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-[#5c0000] transition"
            >
              <FiX className="text-xl" />
            </button>
            
            <h2 className="text-2xl font-kanit text-[#303033] font-bold mb-6">Edit Profile</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Name Section */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={editedName === null ? "" : editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5c0000] focus:border-transparent transition"
                  placeholder="Leave empty to keep current name"
                />
              </div>

              {/* Password Change Toggle */}
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-[#5c0000] hover:text-[#4c0000] font-medium flex items-center gap-2"
                >
                  <span>{showPasswordSection ? "Cancel Password Change" : "Change Password"}</span>
                  {showPasswordSection ? <FiX /> : <FiEdit3 />}
                </button>
              </div>

              {/* Password Change Section */}
              {showPasswordSection && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5c0000] focus:border-transparent transition"
                      placeholder="Enter your current password"
                      required={showPasswordSection}
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5c0000] focus:border-transparent transition"
                      placeholder="Enter your new password"
                      required={showPasswordSection}
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5c0000] focus:border-transparent transition"
                      placeholder="Confirm your new password"
                      required={showPasswordSection}
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {updateStatus && (
                <p className={`text-sm ${
                  updateStatus.type === 'error' ? 'text-red-500' : 
                  updateStatus.type === 'success' ? 'text-green-500' : 
                  'text-gray-500'
                }`}>
                  {updateStatus.message}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setShowPasswordSection(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setEditedName(null); // Reset name edit state
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    // Button is disabled if:
                    // 1. No changes at all (no name change AND no password change)
                    // 2. Password section is open but password fields are incomplete
                    // 3. Loading state
                    ((!editedName?.trim() && !showPasswordSection) || 
                    (showPasswordSection && (!currentPassword || !newPassword || !confirmPassword)) ||
                    updateStatus?.type === 'loading')
                  }
                  className="px-4 py-2 rounded-lg bg-[#5c0000] text-white hover:bg-[#4c0000] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateStatus?.type === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      {showPasswordSection ? "Update Password" : "Update Profile"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <br />
      <br />
      <Footer />
    </div>
  );
}

function Card({ title, progress, completed, total }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:scale-105 transition-transform duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#303033]">{title}</h3>
        <FiBookOpen className="text-[#5c0000] text-xl" />
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-[#5c0000] h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-right text-[#303033] mt-2">
        {completed}/{total} ({progress}% completed)
      </p>
    </div>
  );
}
