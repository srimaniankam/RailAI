import { useEffect, useState } from "react";
import OfficerDashboard from "./OfficerDashboard";
import "./App.css";
import "./StatusTracker.css";


// =========================================================
// BACKEND URL
// =========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8000"
      : "https://railai-backend-l6lr.onrender.com"
  );


// =========================================================
// STATUS STEPS
// =========================================================

const STATUS_STEPS = [
  "Pending",
  "Assigned",
  "In Progress",
  "Resolved"
];


function App() {

  // =======================================================
  // BASIC STATE
  // =======================================================

  const [complaint, setComplaint] =
    useState("");

  const [trainNumber, setTrainNumber] =
    useState("");

  const [coach, setCoach] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [page, setPage] =
    useState("passenger");


  // =======================================================
  // COMPLAINT TRACKING STATE
  // =======================================================

  const [complaintId, setComplaintId] =
    useState(null);

  const [trackedComplaint, setTrackedComplaint] =
    useState(null);

  const [trackingId, setTrackingId] =
    useState("");

  const [trackingLoading, setTrackingLoading] =
    useState(false);

  const [trackingError, setTrackingError] =
    useState("");


  // =======================================================
  // IMAGE SELECT
  // =======================================================

  const handleImageChange = (event) => {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);

    setResult(null);

  };


  // =======================================================
  // VOICE RECOGNITION
  // =======================================================

  const startVoiceRecording = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      alert(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );

      return;
    }


    const recognition =
      new SpeechRecognition();


    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = () => {

      setIsRecording(true);

    };


    recognition.onresult = (event) => {

      const spokenText =
        event.results[0][0].transcript;


      setComplaint(
        spokenText
      );

      setResult(null);

    };


    recognition.onerror = (event) => {

      console.error(
        "Voice recognition error:",
        event.error
      );


      setIsRecording(false);


      if (
        event.error ===
        "not-allowed"
      ) {

        alert(
          "Microphone permission was denied. Please allow microphone access in Chrome."
        );

      } else {

        alert(
          "Could not recognize your voice. Please try again."
        );

      }

    };


    recognition.onend = () => {

      setIsRecording(false);

    };


    recognition.start();

  };


  // =======================================================
  // GET SPECIFIC COMPLAINT
  // =======================================================

  const fetchComplaintStatus = async (
    id,
    showLoading = false
  ) => {

    if (!id) {
      return;
    }


    if (showLoading) {
      setTrackingLoading(true);
    }


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/complaints/${id}`
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          data.message ||
          "Complaint not found."
        );

      }


      setTrackedComplaint(data);

      setTrackingError("");

    }

    catch (error) {

      console.error(
        "Tracking error:",
        error
      );

      setTrackingError(
        error.message ||
        "Unable to find this complaint."
      );

    }

    finally {

      if (showLoading) {
        setTrackingLoading(false);
      }

    }

  };


  // =======================================================
  // AUTOMATIC STATUS REFRESH
  // =======================================================

  useEffect(() => {

    if (!complaintId) {
      return;
    }


    fetchComplaintStatus(
      complaintId
    );


    const interval =
      setInterval(
        () => {

          fetchComplaintStatus(
            complaintId
          );

        },
        5000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [complaintId]);


  // =======================================================
  // TRACK COMPLAINT BUTTON
  // =======================================================

  const trackComplaint = async () => {

    const cleanId =
      trackingId.trim();


    if (!cleanId) {

      alert(
        "Please enter your complaint ID."
      );

      return;
    }


    setTrackingError("");

    setTrackedComplaint(null);


    await fetchComplaintStatus(
      cleanId,
      true
    );

  };


  // =======================================================
  // ANALYZE COMPLAINT
  // =======================================================

  const analyzeComplaint = async () => {

    // -------------------------------------------------------
    // CHECK INPUT
    // -------------------------------------------------------

    if (
      !complaint.trim() &&
      !selectedImage
    ) {

      alert(
        "Please describe your problem or upload an image."
      );

      return;
    }


    if (!trainNumber.trim()) {

      alert(
        "Please enter the train number."
      );

      return;
    }


    if (!coach.trim()) {

      alert(
        "Please enter the coach number."
      );

      return;
    }


    // -------------------------------------------------------
    // START LOADING
    // -------------------------------------------------------

    setLoading(true);

    setResult(null);

    setComplaintId(null);

    setTrackedComplaint(null);

    setTrackingError("");


    try {

      // -----------------------------------------------------
      // CREATE FORM DATA
      // -----------------------------------------------------

      const formData =
        new FormData();


      // -----------------------------------------------------
      // COMPLAINT
      // -----------------------------------------------------

      formData.append(
        "complaint",
        complaint.trim()
      );


      // -----------------------------------------------------
      // TRAIN NUMBER
      // -----------------------------------------------------

      formData.append(
        "train_number",
        trainNumber.trim()
      );


      // -----------------------------------------------------
      // COACH
      // -----------------------------------------------------

      formData.append(
        "coach",
        coach.trim()
      );


      // -----------------------------------------------------
      // IMAGE
      // -----------------------------------------------------

      if (selectedImage) {

        formData.append(
          "image",
          selectedImage
        );

      }


      console.log(
        "Sending complaint:",
        complaint.trim()
      );

      console.log(
        "Train number:",
        trainNumber.trim()
      );

      console.log(
        "Coach:",
        coach.trim()
      );

      console.log(
        "Image:",
        selectedImage
          ? selectedImage.name
          : "No image"
      );


      // -----------------------------------------------------
      // SEND TO BACKEND
      // -----------------------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/analyze`,
          {
            method: "POST",
            body: formData
          }
        );


      // -----------------------------------------------------
      // READ RESPONSE
      // -----------------------------------------------------

      const data =
        await response.json();


      console.log(
        "Backend response:",
        data
      );


      // -----------------------------------------------------
      // SERVER ERROR
      // -----------------------------------------------------

      if (!response.ok) {

        throw new Error(
          `Server returned ${response.status}: ${
            JSON.stringify(data)
          }`
        );

      }


      // -----------------------------------------------------
      // SHOW RESULT
      // -----------------------------------------------------

      setResult(data);


      // -----------------------------------------------------
      // GET COMPLAINT ID
      // -----------------------------------------------------

      const newComplaintId =
        data.complaint_id ||
        data.id;


      if (newComplaintId) {

        setComplaintId(
          newComplaintId
        );

        setTrackingId(
          String(newComplaintId)
        );

        fetchComplaintStatus(
          newComplaintId
        );

      }


    }

    catch (error) {

      console.error(
        "Analyze error:",
        error
      );


      setResult({

        error:
          "Could not analyze the complaint. Please check that the RailAI backend is running."

      });

    }

    finally {

      setLoading(false);

    }

  };


  // =======================================================
  // GET STATUS INDEX
  // =======================================================

  const getStatusIndex = (status) => {

    const index =
      STATUS_STEPS.indexOf(
        status
      );

    return index >= 0
      ? index
      : 0;

  };


  // =======================================================
  // STATUS TRACKER COMPONENT
  // =======================================================

  const StatusTracker = ({
    complaintData
  }) => {

    if (!complaintData) {
      return null;
    }


    const currentStatus =
      complaintData.status ||
      "Pending";


    const currentIndex =
      getStatusIndex(
        currentStatus
      );


    return (

      <section
        className="status-tracker-card"
      >

        {/* ==============================================
            HEADER
        ============================================== */}

        <div className="status-tracker-header">

          <div>

            <span className="status-tracker-label">
              COMPLAINT TRACKING
            </span>

            <h2>
              Complaint #{complaintData.id}
            </h2>

          </div>


          <span
            className={
              `current-status-badge ${
                currentStatus
                  .toLowerCase()
                  .replaceAll(" ", "-")
              }`
            }
          >
            {currentStatus}
          </span>

        </div>


        {/* ==============================================
            DETAILS
        ============================================== */}

        <div className="tracking-details">

          <div>

            <span>
              Train Number
            </span>

            <strong>
              {complaintData.train_number ||
                trainNumber ||
                "Not available"}
            </strong>

          </div>


          <div>

            <span>
              Coach
            </span>

            <strong>
              {complaintData.coach ||
                coach ||
                "Not available"}
            </strong>

          </div>


          <div>

            <span>
              Issue
            </span>

            <strong>
              {complaintData.issue ||
                "Complaint"}
            </strong>

          </div>

        </div>


        {/* ==============================================
            PROGRESS TRACKER
        ============================================== */}

        <div className="status-progress">

          {STATUS_STEPS.map(
            (step, index) => {

              const completed =
                index <= currentIndex;

              const active =
                index === currentIndex;


              return (

                <div
                  className="status-step-wrapper"
                  key={step}
                >

                  <div
                    className={
                      `status-step ${
                        completed
                          ? "completed"
                          : ""
                      } ${
                        active
                          ? "active"
                          : ""
                      }`
                    }
                  >

                    <div className="status-circle">

                      {completed
                        ? "✓"
                        : index + 1}

                    </div>


                    <span>
                      {step}
                    </span>

                  </div>


                  {index <
                    STATUS_STEPS.length - 1 && (

                    <div
                      className={
                        `status-line ${
                          index <
                          currentIndex
                            ? "completed"
                            : ""
                        }`
                      }
                    />

                  )}

                </div>

              );

            }
          )}

        </div>


        {/* ==============================================
            CURRENT STATUS
        ============================================== */}

        <div className="status-message">

          <strong>
            Current Status:
          </strong>

          <span>
            {currentStatus}
          </span>

        </div>


        <p className="status-refresh-text">
          Status updates automatically every 5 seconds.
        </p>

      </section>

    );

  };


  // =======================================================
  // OFFICER DASHBOARD
  // =======================================================

  if (page === "officer") {

    return (

      <div>

        <button
          className="back-to-passenger"
          onClick={() =>
            setPage("passenger")
          }
        >

          ← Passenger Portal

        </button>


        <OfficerDashboard />

      </div>

    );

  }


  // =======================================================
  // PASSENGER PORTAL
  // =======================================================

  return (

    <div className="app">


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div className="top-navigation">

        <div className="brand">
          🚆 RailAI
        </div>


        <div className="navigation-buttons">

          <button
            className="nav-active"
            onClick={() =>
              setPage("passenger")
            }
          >
            Passenger Portal
          </button>


          <button
            onClick={() =>
              setPage("officer")
            }
          >
            Officer Dashboard
          </button>

        </div>

      </div>


      {/* =================================================
          MAIN
      ================================================= */}

      <main>


        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero">

          <h1>

            Report an issue.

            <br />

            Let <span>AI handle it.</span>

          </h1>


          <p>

            Submit a railway complaint using
            text, image or voice. RailAI
            analyzes the issue and routes it
            to the right railway department.

          </p>

        </section>


        {/* =================================================
            COMPLAINT CARD
        ================================================= */}

        <section className="complaint-card">


          {/* =================================================
              TRAIN + COACH
          ================================================= */}

          <div className="journey-details">


            {/* TRAIN */}

            <div className="journey-field">

              <label>
                Train Number
              </label>

              <input
                type="text"
                placeholder="e.g. 12727"
                value={trainNumber}
                onChange={(event) => {

                  setTrainNumber(
                    event.target.value
                  );

                  setResult(null);

                }}
              />

            </div>


            {/* COACH */}

            <div className="journey-field">

              <label>
                Coach Number
              </label>

              <input
                type="text"
                placeholder="e.g. B2"
                value={coach}
                onChange={(event) => {

                  setCoach(
                    event.target.value
                  );

                  setResult(null);

                }}
              />

            </div>

          </div>


          {/* =================================================
              TEXT INPUT
          ================================================= */}

          <textarea

            placeholder="Describe your problem..."

            value={complaint}

            onChange={(event) => {

              setComplaint(
                event.target.value
              );

              setResult(null);

            }}

          />


          {/* =================================================
              INPUT OPTIONS
          ================================================= */}

          <div className="input-options">


            {/* IMAGE */}

            <label
              className="input-option"
            >

              📷 Upload Image


              <input

                type="file"

                accept="image/*"

                onChange={
                  handleImageChange
                }

                style={{
                  display: "none"
                }}

              />

            </label>


            {/* VOICE */}

            <button

              type="button"

              className="input-option"

              onClick={
                startVoiceRecording
              }

              disabled={isRecording}

            >

              {isRecording

                ? "🔴 Listening..."

                : "🎤 Record Voice"}

            </button>


          </div>


          {/* =================================================
              SELECTED IMAGE
          ================================================= */}

          {selectedImage && (

            <div className="selected-image">

              <span>

                📷 Selected:
                {" "}
                {selectedImage.name}

              </span>


              <button

                type="button"

                onClick={() => {

                  setSelectedImage(
                    null
                  );

                }}

              >

                ✕

              </button>

            </div>

          )}


          {/* =================================================
              VOICE STATUS
          ================================================= */}

          {isRecording && (

            <div
              className="voice-status"
            >

              🎤 Listening...

              Speak your complaint now.

            </div>

          )}


          {/* =================================================
              ANALYZE BUTTON
          ================================================= */}

          <button

            type="button"

            className="analyze-btn"

            onClick={
              analyzeComplaint
            }

            disabled={loading}

          >

            {loading

              ? "Analyzing Text + Image..."

              : "Analyze Complaint →"}

          </button>


        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {result?.error && (

          <div className="result-card">

            <h2>
              Analysis Error
            </h2>

            <p>
              {result.error}
            </p>

          </div>

        )}


        {/* =================================================
            AI RESULT
        ================================================= */}

        {result &&
          !result.error && (

            <section
              className="result-card"
            >


              {/* RESULT HEADER */}

              <div
                className="result-header"
              >

                <div
                  className="result-icon"
                >
                  🤖
                </div>


                <div>

                  <h2>
                    AI Analysis Result
                  </h2>

                  <p>
                    Multimodal AI analysis
                    completed
                  </p>

                </div>

              </div>


              {/* =================================================
                  COMPLAINT ID
              ================================================= */}

              {complaintId && (

                <div className="complaint-id-box">

                  <span>
                    Complaint ID
                  </span>

                  <strong>
                    #{complaintId}
                  </strong>

                  <p>
                    Save this ID to track your complaint.
                  </p>

                </div>

              )}


              {/* RESULT GRID */}

              <div
                className="result-grid"
              >


                {/* CATEGORY */}

                <div
                  className="result-item"
                >

                  <span>
                    Category
                  </span>

                  <strong>
                    {result.category ||
                      "Not detected"}
                  </strong>

                </div>


                {/* ISSUE */}

                <div
                  className="result-item"
                >

                  <span>
                    Issue
                  </span>

                  <strong>
                    {result.issue ||
                      "Not detected"}
                  </strong>

                </div>


                {/* TRAIN */}

                <div
                  className="result-item"
                >

                  <span>
                    Train Number
                  </span>

                  <strong>
                    {result.train_number ||
                      trainNumber ||
                      "Not detected"}
                  </strong>

                </div>


                {/* COACH */}

                <div
                  className="result-item"
                >

                  <span>
                    Coach
                  </span>

                  <strong>
                    {result.coach ||
                      coach ||
                      "Not detected"}
                  </strong>

                </div>


                {/* LOCATION */}

                <div
                  className="result-item"
                >

                  <span>
                    Location
                  </span>

                  <strong>
                    {result.location ||
                      "Not detected"}
                  </strong>

                </div>


                {/* SEVERITY */}

                <div
                  className="result-item"
                >

                  <span>
                    Severity
                  </span>

                  <strong

                    className={

                      result.severity ===
                      "CRITICAL"

                        ? "severity-critical"

                        : result.severity ===
                          "HIGH"

                        ? "severity-high"

                        : result.severity ===
                          "MEDIUM"

                        ? "severity-medium"

                        : "severity-low"

                    }

                  >

                    {result.severity ||
                      "UNKNOWN"}

                  </strong>

                </div>


                {/* SAFETY */}

                <div
                  className="result-item"
                >

                  <span>
                    Safety Risk
                  </span>

                  <strong>

                    {result.safety_risk

                      ? "⚠️ YES"

                      : "✓ NO"}

                  </strong>

                </div>


                {/* DEPARTMENT */}

                <div
                  className="result-item"
                >

                  <span>
                    Department
                  </span>

                  <strong>

                    {result.department ||
                      "Not assigned"}

                  </strong>

                </div>


                {/* CONFIDENCE */}

                <div
                  className="result-item"
                >

                  <span>
                    AI Confidence
                  </span>

                  <strong>

                    {result.confidence !==
                    undefined

                      ? `${Math.round(
                          result.confidence *
                          100
                        )}%`

                      : "N/A"}

                  </strong>

                </div>


                {/* ROUTING */}

                <div
                  className="result-item"
                >

                  <span>
                    Routing Decision
                  </span>

                  <strong

                    className={

                      result.decision ===
                      "AUTO_ROUTE"

                        ? "route-auto"

                        : "route-human"

                    }

                  >

                    {result.decision ===
                    "AUTO_ROUTE"

                      ? "✓ Auto Routed"

                      : "⚠ Human Review"}

                  </strong>

                </div>


              </div>


              {/* =================================================
                  COMPUTER VISION
              ================================================= */}

              {result.vision && (

                <div
                  className="vision-result"
                >

                  <div>

                    <span>
                      📸 Computer Vision
                    </span>

                    <strong>
                      {result.vision.issue ||
                        "No visible issue detected"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Visual Evidence
                    </span>

                    <strong>

                      {result.vision.confidence !==
                      undefined

                        ? `${Math.round(
                            result.vision.confidence *
                            100
                          )}%`

                        : "N/A"}

                    </strong>

                  </div>

                </div>

              )}


              {/* =================================================
                  RECOMMENDATION
              ================================================= */}

              <div
                className="recommendation"
              >

                <span>
                  Recommended Action
                </span>

                <p>

                  This complaint has been
                  analyzed and routed to the{" "}

                  <strong>
                    {result.department ||
                      "appropriate"}
                  </strong>{" "}

                  team.

                </p>

              </div>


              {/* =================================================
                  LIVE STATUS
              ================================================= */}

              {trackedComplaint && (

                <StatusTracker
                  complaintData={
                    trackedComplaint
                  }
                />

              )}

            </section>

          )}


        {/* =================================================
            TRACK EXISTING COMPLAINT
        ================================================= */}

        <section
          className="track-complaint-card"
        >

          <div>

            <span className="status-tracker-label">
              EXISTING COMPLAINT
            </span>

            <h2>
              Track Your Complaint
            </h2>

            <p>
              Enter your complaint ID to check its
              latest status.
            </p>

          </div>


          <div className="track-input-row">

            <input
              type="text"
              placeholder="Enter complaint ID"
              value={trackingId}
              onChange={(event) => {

                setTrackingId(
                  event.target.value
                );

                setTrackingError("");

              }}
            />


            <button
              type="button"
              onClick={
                trackComplaint
              }
              disabled={
                trackingLoading
              }
            >

              {trackingLoading
                ? "Checking..."
                : "Track Complaint"}

            </button>

          </div>


          {trackingError && (

            <div className="tracking-error">

              {trackingError}

            </div>

          )}


          {trackedComplaint && (

            <StatusTracker
              complaintData={
                trackedComplaint
              }
            />

          )}

        </section>


      </main>

    </div>

  );

}


export default App;