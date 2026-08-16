import { useState } from "react";
import OfficerDashboard from "./OfficerDashboard";
import "./App.css";

function App() {

  // ==========================================
  // BACKEND API
  // ==========================================

  const API_URL = "https://railai-backend-l6lr.onrender.com";


  // ==========================================
  // STATE
  // ==========================================

  const [complaint, setComplaint] = useState("");

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


  // ==========================================
  // IMAGE SELECT
  // ==========================================

  const handleImageChange = (event) => {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);

    setResult(null);
  };


  // ==========================================
  // VOICE RECOGNITION
  // ==========================================

  const startVoiceRecording = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    // ----------------------------------------
    // CHECK BROWSER SUPPORT
    // ----------------------------------------

    if (!SpeechRecognition) {

      alert(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );

      return;
    }


    // ----------------------------------------
    // CREATE RECOGNITION
    // ----------------------------------------

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    // ----------------------------------------
    // START
    // ----------------------------------------

    recognition.onstart = () => {

      setIsRecording(true);
    };


    // ----------------------------------------
    // RESULT
    // ----------------------------------------

    recognition.onresult = (event) => {

      const spokenText =
        event.results[0][0].transcript;

      console.log(
        "Voice input:",
        spokenText
      );

      setComplaint(
        spokenText
      );

      setResult(null);
    };


    // ----------------------------------------
    // ERROR
    // ----------------------------------------

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
      }

      else {

        alert(
          "Could not recognize your voice. Please try again."
        );
      }
    };


    // ----------------------------------------
    // END
    // ----------------------------------------

    recognition.onend = () => {

      setIsRecording(false);
    };


    // ----------------------------------------
    // START RECORDING
    // ----------------------------------------

    recognition.start();
  };


  // ==========================================
  // ANALYZE COMPLAINT
  // ==========================================

  const analyzeComplaint = async () => {

    // ----------------------------------------
    // CHECK INPUT
    // ----------------------------------------

    if (
      !complaint.trim() &&
      !selectedImage
    ) {

      alert(
        "Please describe your problem or upload an image."
      );

      return;
    }


    // ----------------------------------------
    // START LOADING
    // ----------------------------------------

    setLoading(true);

    setResult(null);


    try {

      // --------------------------------------
      // CREATE FORM DATA
      // --------------------------------------

      const formData =
        new FormData();


      // --------------------------------------
      // ADD COMPLAINT
      // --------------------------------------

      formData.append(
        "complaint",
        complaint.trim()
      );


      // --------------------------------------
      // ADD IMAGE
      // --------------------------------------

      if (selectedImage) {

        formData.append(
          "image",
          selectedImage
        );
      }


      // --------------------------------------
      // DEBUG
      // --------------------------------------

      console.log(
        "Sending complaint:",
        complaint.trim()
      );

      console.log(
        "Sending image:",
        selectedImage
          ? selectedImage.name
          : "No image"
      );


      // --------------------------------------
      // SEND TO PUBLIC BACKEND
      // --------------------------------------

      const response =
        await fetch(
          `${API_URL}/analyze`,
          {
            method: "POST",
            body: formData
          }
        );


      // --------------------------------------
      // READ RESPONSE
      // --------------------------------------

      const data =
        await response.json();

      console.log(
        "Backend response:",
        data
      );


      // --------------------------------------
      // SERVER ERROR
      // --------------------------------------

      if (!response.ok) {

        throw new Error(
          `Server returned ${response.status}: ${
            JSON.stringify(data)
          }`
        );
      }


      // --------------------------------------
      // SHOW RESULT
      // --------------------------------------

      setResult(data);

    }


    catch (error) {

      console.error(
        "Analyze error:",
        error
      );

      setResult({

        error:
          "Could not analyze the complaint. Please check the RailAI backend connection."

      });

    }


    finally {

      setLoading(false);
    }

  };


  // ==========================================
  // OFFICER DASHBOARD
  // ==========================================

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


  // ==========================================
  // PASSENGER PORTAL
  // ==========================================

  return (

    <div className="app">


      {/* ======================================
          NAVIGATION
      ====================================== */}

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


      {/* ======================================
          MAIN
      ====================================== */}

      <main>


        {/* ====================================
            HERO
        ==================================== */}

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


        {/* ====================================
            COMPLAINT CARD
        ==================================== */}

        <section className="complaint-card">


          {/* ==================================
              TEXT INPUT
          ================================== */}

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


          {/* ==================================
              INPUT OPTIONS
          ================================== */}

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


          {/* ==================================
              SELECTED IMAGE
          ================================== */}

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


          {/* ==================================
              VOICE STATUS
          ================================== */}

          {isRecording && (

            <div
              className="voice-status"
            >

              🎤 Listening...

              Speak your complaint now.

            </div>

          )}


          {/* ==================================
              ANALYZE BUTTON
          ================================== */}

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


        {/* ====================================
            ERROR
        ==================================== */}

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


        {/* ====================================
            RESULT
        ==================================== */}

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


              {/* =================================
                  COMPUTER VISION
              ================================= */}

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


              {/* =================================
                  RECOMMENDATION
              ================================= */}

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


            </section>

          )}

      </main>

    </div>

  );
}


export default App;