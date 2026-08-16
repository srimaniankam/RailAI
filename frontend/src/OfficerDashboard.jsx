import { useEffect, useState } from "react";
import "./OfficerDashboard.css";

const API_URL =
  "https://railai-backend-l6lr.onrender.com";

function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH COMPLAINTS
  // ==========================================

  const fetchComplaints = async () => {
    try {
      const response = await fetch(
        `${API_URL}/complaints`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch complaints");
      }

      const data = await response.json();

      setComplaints(data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Unable to connect to RailAI backend.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // FETCH INCIDENTS
  // ==========================================

  const fetchIncidents = async () => {
    try {
      const response = await fetch(
        `${API_URL}/incidents`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch incidents");
      }

      const data = await response.json();

      setIncidents(data);
    } catch (error) {
      console.error("Incident fetch error:", error);
    }
  };


  // ==========================================
  // FETCH EVERYTHING
  // ==========================================

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchComplaints(),
      fetchIncidents()
    ]);
  };


  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const updateStatus = async (
    complaintId,
    newStatus
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/complaints/${complaintId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await fetchDashboardData();
    } catch (error) {
      console.error(error);

      alert(
        "Could not update complaint status."
      );
    }
  };


  // ==========================================
  // AUTO REFRESH
  // ==========================================

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(
      fetchDashboardData,
      5000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);


  // ==========================================
  // BASIC STATISTICS
  // ==========================================

  const totalComplaints =
    complaints.length;

  const criticalComplaints =
    complaints.filter(
      item => item.severity === "CRITICAL"
    ).length;

  const highComplaints =
    complaints.filter(
      item => item.severity === "HIGH"
    ).length;

  const pendingComplaints =
    complaints.filter(
      item => item.status === "Pending"
    ).length;

  const resolvedComplaints =
    complaints.filter(
      item => item.status === "Resolved"
    ).length;


  // ==========================================
  // ISSUE ANALYTICS
  // ==========================================

  const issueCounts = {};

  complaints.forEach(complaint => {
    const issue =
      complaint.issue ||
      complaint.category ||
      "Other";

    issueCounts[issue] =
      (issueCounts[issue] || 0) + 1;
  });

  const issueRanking =
    Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1]);

  const topIssue =
    issueRanking.length > 0
      ? issueRanking[0]
      : ["No data", 0];

  const maxIssueCount =
    issueRanking.length > 0
      ? issueRanking[0][1]
      : 1;


  // ==========================================
  // TRAIN ANALYTICS
  // ==========================================

  const trainCounts = {};

  complaints.forEach(complaint => {
    const train =
      complaint.train_number ||
      "Unknown";

    trainCounts[train] =
      (trainCounts[train] || 0) + 1;
  });

  const trainRanking =
    Object.entries(trainCounts)
      .sort((a, b) => b[1] - a[1]);

  const topTrain =
    trainRanking.length > 0
      ? trainRanking[0]
      : ["No data", 0];


  // ==========================================
  // LOCATION ANALYTICS
  // ==========================================

  const locationCounts = {};

  complaints.forEach(complaint => {
    const location =
      complaint.location ||
      "Unknown";

    locationCounts[location] =
      (locationCounts[location] || 0) + 1;
  });

  const locationRanking =
    Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1]);


  // ==========================================
  // DEPARTMENT ANALYTICS
  // ==========================================

  const departmentCounts = {};

  complaints.forEach(complaint => {
    const department =
      complaint.department ||
      "General Helpdesk";

    departmentCounts[department] =
      (departmentCounts[department] || 0) + 1;
  });

  const departmentRanking =
    Object.entries(departmentCounts)
      .sort((a, b) => b[1] - a[1]);


  // ==========================================
  // SEVERITY ANALYTICS
  // ==========================================

  const severityCounts = {
    CRITICAL:
      complaints.filter(
        item => item.severity === "CRITICAL"
      ).length,

    HIGH:
      complaints.filter(
        item => item.severity === "HIGH"
      ).length,

    MEDIUM:
      complaints.filter(
        item => item.severity === "MEDIUM"
      ).length,

    LOW:
      complaints.filter(
        item => item.severity === "LOW"
      ).length
  };


  // ==========================================
  // RESOLUTION RATE
  // ==========================================

  const resolutionRate =
    totalComplaints > 0
      ? Math.round(
          (
            resolvedComplaints /
            totalComplaints
          ) * 100
        )
      : 0;


  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div className="dashboard">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="dashboard-header">

        <div>
          <h1>
            RailAI Command Center
          </h1>

          <p>
            AI-powered railway complaint monitoring
          </p>
        </div>


        <div className="officer-profile">

          <div className="officer-avatar">
            👮
          </div>

          <div>
            <strong>
              Railway Officer
            </strong>

            <span>
              Control Room
            </span>
          </div>

        </div>

      </header>


      {/* ======================================
          STATISTICS
      ====================================== */}

      <section className="stats">

        <div className="stat-card">

          <span>
            Total Complaints
          </span>

          <strong>
            {totalComplaints}
          </strong>

        </div>


        <div className="stat-card critical">

          <span>
            Critical
          </span>

          <strong>
            {criticalComplaints}
          </strong>

        </div>


        <div className="stat-card high">

          <span>
            High Priority
          </span>

          <strong>
            {highComplaints}
          </strong>

        </div>


        <div className="stat-card pending">

          <span>
            Pending
          </span>

          <strong>
            {pendingComplaints}
          </strong>

        </div>


        <div className="stat-card resolved">

          <span>
            Resolution Rate
          </span>

          <strong>
            {resolutionRate}%
          </strong>

        </div>

      </section>


      {/* ======================================
          AI OPERATIONAL INSIGHT
      ====================================== */}

      <section className="ai-insight">

        <div className="ai-insight-icon">
          🤖
        </div>

        <div>

          <span>
            AI Operational Insight
          </span>

          {totalComplaints === 0 ? (

            <p>
              Waiting for passenger complaints
              to generate operational insights.
            </p>

          ) : (

            <p>

              <strong>
                {topIssue[0]}
              </strong>

              {" "}is currently the most reported
              issue with{" "}

              <strong>
                {topIssue[1]}
              </strong>

              {" "}report
              {topIssue[1] !== 1 ? "s" : ""}.

              {" "}

              {topTrain[0] !== "No data" && (
                <>
                  Train{" "}

                  <strong>
                    {topTrain[0]}
                  </strong>

                  {" "}has the highest number of
                  reported issues.
                </>
              )}

            </p>

          )}

        </div>

      </section>


      {/* ======================================
          CRITICAL SAFETY ALERTS
      ====================================== */}

      {incidents.some(
        incident =>
          incident.safety_risk === true ||
          incident.severity === "CRITICAL"
      ) && (

        <section className="safety-alert-section">

          <div className="safety-alert-header">

            <div className="safety-alert-icon">
              🚨
            </div>

            <div>

              <span>
                CRITICAL SAFETY ALERT
              </span>

              <h2>
                Immediate Attention Required
              </h2>

            </div>

          </div>


          <div className="safety-alert-list">

            {incidents
              .filter(
                incident =>
                  incident.safety_risk === true ||
                  incident.severity === "CRITICAL"
              )
              .map(incident => (

                <div
                  className="safety-alert-card"
                  key={`safety-${incident.incident_id}`}
                >

                  <div className="safety-alert-main">

                    <div>

                      <span className="safety-incident-id">
                        {incident.incident_id}
                      </span>

                      <h3>
                        {incident.issue ||
                          "Safety Incident"}
                      </h3>

                    </div>


                    <span className="safety-critical-badge">
                      CRITICAL
                    </span>

                  </div>


                  <div className="safety-alert-details">

                    <div>
                      <span>Train</span>

                      <strong>
                        {incident.train_number
                          ? `Train ${incident.train_number}`
                          : "Unknown"}
                      </strong>
                    </div>


                    <div>
                      <span>Coach</span>

                      <strong>
                        {incident.coach ||
                          "Unknown"}
                      </strong>
                    </div>


                    <div>
                      <span>Location</span>

                      <strong>
                        {incident.location ||
                          "Unknown"}
                      </strong>
                    </div>


                    <div>
                      <span>Reports</span>

                      <strong>
                        {incident.report_count}
                      </strong>
                    </div>

                  </div>


                  <div className="safety-action">

                    <strong>
                      ⚡ Immediate Action
                    </strong>

                    <p>
                      {incident.recommended_action ||
                        "Alert railway safety personnel immediately."}
                    </p>

                  </div>

                </div>

              ))}

          </div>

        </section>

      )}


      {/* ======================================
          AI INCIDENT BRIEFS
      ====================================== */}

      <section className="ai-incidents-section">

        <div className="section-header">

          <div>

            <h2>
              🧠 AI Incident Briefs
            </h2>

            <p>
              Automated incident summaries and
              recommended operational actions
            </p>

          </div>

          <span className="live-indicator">
            ● AI LIVE
          </span>

        </div>


        {incidents.length === 0 ? (

          <div className="dashboard-message">
            No incidents available for AI analysis.
          </div>

        ) : (

          <div className="ai-incident-grid">

            {incidents.map(incident => (

              <div
                className={
                  `ai-incident-card ${
                    (
                      incident.severity ||
                      "LOW"
                    ).toLowerCase()
                  }`
                }

                key={incident.incident_id}
              >

                <div className="ai-incident-header">

                  <div>

                    <span className="incident-id">
                      {incident.incident_id}
                    </span>

                    <h3>
                      {incident.issue ||
                        "General Incident"}
                    </h3>

                  </div>


                  <span
                    className={
                      `priority ${
                        (
                          incident.severity ||
                          "LOW"
                        ).toLowerCase()
                      }`
                    }
                  >
                    {incident.severity || "LOW"}
                  </span>

                </div>


                <div className="ai-incident-details">

                  <div>
                    <span>🚆 Train</span>

                    <strong>
                      {incident.train_number
                        ? `Train ${incident.train_number}`
                        : "Unknown"}
                    </strong>
                  </div>


                  <div>
                    <span>🚪 Coach</span>

                    <strong>
                      {incident.coach ||
                        "Unknown"}
                    </strong>
                  </div>


                  <div>
                    <span>📍 Location</span>

                    <strong>
                      {incident.location ||
                        "Unknown"}
                    </strong>
                  </div>


                  <div>
                    <span>👥 Reports</span>

                    <strong>
                      {incident.report_count}
                    </strong>
                  </div>

                </div>


                <div className="ai-summary-box">

                  <div className="ai-summary-title">
                    🤖 AI Summary
                  </div>

                  <p>
                    {incident.ai_summary ||
                      "AI summary unavailable."}
                  </p>

                </div>


                <div className="recommended-action">

                  <div className="recommended-title">
                    ⚡ Recommended Action
                  </div>

                  <p>
                    {incident.recommended_action ||
                      "Assign incident to the appropriate department for assessment."}
                  </p>

                </div>


                <div className="incident-footer">

                  <div>

                    <span>
                      Urgency
                    </span>

                    <strong
                      className={
                        `urgency ${
                          (
                            incident.urgency ||
                            "LOW"
                          ).toLowerCase()
                        }`
                      }
                    >
                      {incident.urgency || "LOW"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Department
                    </span>

                    <strong>
                      {incident.department ||
                        "General Helpdesk"}
                    </strong>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* ======================================
          OPERATIONAL ANALYTICS
      ====================================== */}

      <section className="analytics-section">

        <div className="section-header">

          <div>

            <h2>
              📊 Operational Analytics
            </h2>

            <p>
              AI-generated complaint patterns
            </p>

          </div>

        </div>


        <div className="analytics-grid">


          {/* ISSUE DISTRIBUTION */}

          <div className="analytics-card">

            <h3>
              Issue Distribution
            </h3>

            {issueRanking.length === 0 ? (

              <p className="no-data">
                No complaint data available.
              </p>

            ) : (

              <div className="bar-list">

                {issueRanking
                  .slice(0, 6)
                  .map(([issue, count]) => (

                    <div
                      className="bar-item"
                      key={issue}
                    >

                      <div className="bar-label">

                        <span>
                          {issue}
                        </span>

                        <strong>
                          {count}
                        </strong>

                      </div>


                      <div className="bar-background">

                        <div
                          className="bar-fill"
                          style={{
                            width:
                              `${(
                                count /
                                maxIssueCount
                              ) * 100}%`
                          }}
                        />

                      </div>

                    </div>

                  ))}

              </div>

            )}

          </div>


          {/* PRIORITY BREAKDOWN */}

          <div className="analytics-card">

            <h3>
              Priority Breakdown
            </h3>

            <div className="severity-chart">

              {[
                ["Critical", "CRITICAL"],
                ["High", "HIGH"],
                ["Medium", "MEDIUM"],
                ["Low", "LOW"]
              ].map(([label, key]) => (

                <div
                  className="severity-row"
                  key={key}
                >

                  <span>
                    {label}
                  </span>

                  <div className="severity-bar">

                    <div
                      className={
                        `severity-fill ${
                          key.toLowerCase()
                        }-fill`
                      }

                      style={{
                        width:
                          `${
                            totalComplaints
                              ? (
                                  severityCounts[key] /
                                  totalComplaints
                                ) * 100
                              : 0
                          }%`
                      }}
                    />

                  </div>

                  <strong>
                    {severityCounts[key]}
                  </strong>

                </div>

              ))}

            </div>

          </div>


          {/* TRAIN IMPACT */}

          <div className="analytics-card">

            <h3>
              🚆 Most Affected Trains
            </h3>

            {trainRanking.length === 0 ? (

              <p className="no-data">
                No train data available.
              </p>

            ) : (

              <div className="ranking-list">

                {trainRanking
                  .slice(0, 5)
                  .map(([train, count], index) => (

                    <div
                      className="ranking-item"
                      key={train}
                    >

                      <span className="rank-number">
                        #{index + 1}
                      </span>

                      <div>

                        <strong>
                          {train === "Unknown"
                            ? "Unknown Train"
                            : `Train ${train}`}
                        </strong>

                        <span>
                          {count} complaint
                          {count !== 1 ? "s" : ""}
                        </span>

                      </div>

                    </div>

                  ))}

              </div>

            )}

          </div>


          {/* LOCATION HOTSPOTS */}

          <div className="analytics-card hotspot-card">

            <h3>
              📍 Incident Hotspots
            </h3>

            {locationRanking.length === 0 ? (

              <p className="no-data">
                No location data available.
              </p>

            ) : (

              <div className="hotspot-list">

                {locationRanking
                  .slice(0, 6)
                  .map(([location, count], index) => {

                    const maxLocationCount =
                      locationRanking[0][1];

                    const percentage =
                      (
                        count /
                        maxLocationCount
                      ) * 100;

                    return (

                      <div
                        className="hotspot-item"
                        key={location}
                      >

                        <div className="hotspot-header">

                          <div className="hotspot-location">

                            <span className="hotspot-rank">
                              #{index + 1}
                            </span>

                            <strong>
                              {location}
                            </strong>

                          </div>


                          <span className="hotspot-count">
                            {count}
                          </span>

                        </div>


                        <div className="hotspot-bar">

                          <div
                            className="hotspot-bar-fill"
                            style={{
                              width:
                                `${percentage}%`
                            }}
                          />

                        </div>


                        <span className="hotspot-label">

                          {count} complaint
                          {count !== 1 ? "s" : ""}

                        </span>

                      </div>

                    );
                  })}

              </div>

            )}

          </div>

        </div>


        {/* DEPARTMENT WORKLOAD */}

        <div className="department-card">

          <h3>
            Department Workload
          </h3>

          <div className="department-grid">

            {departmentRanking
              .slice(0, 6)
              .map(([department, count]) => (

                <div
                  className="department-item"
                  key={department}
                >

                  <span>
                    {department}
                  </span>

                  <strong>
                    {count}
                  </strong>

                </div>

              ))}

          </div>

        </div>

      </section>


      {/* ======================================
          ACTIVE INCIDENTS
      ====================================== */}

      <section className="incidents-section">

        <div className="section-header">

          <div>

            <h2>
              🚨 Active Incidents
            </h2>

            <p>
              AI-clustered passenger reports
            </p>

          </div>

          <span className="live-indicator">
            ● LIVE
          </span>

        </div>


        {incidents.length === 0 ? (

          <div className="dashboard-message">
            No incidents detected yet.
          </div>

        ) : (

          <div className="incident-grid">

            {incidents.map(incident => (

              <div
                className="incident-card"
                key={incident.incident_id}
              >

                <div className="incident-top">

                  <strong>
                    {incident.incident_id}
                  </strong>

                  <span
                    className={
                      `priority ${
                        (
                          incident.severity ||
                          "LOW"
                        ).toLowerCase()
                      }`
                    }
                  >
                    {incident.severity || "LOW"}
                  </span>

                </div>


                <h3>
                  {incident.issue ||
                    "Unknown Incident"}
                </h3>


                <div className="incident-details">

                  <div>
                    <span>Train</span>

                    <strong>
                      {incident.train_number || "—"}
                    </strong>
                  </div>


                  <div>
                    <span>Coach</span>

                    <strong>
                      {incident.coach || "—"}
                    </strong>
                  </div>


                  <div>
                    <span>Location</span>

                    <strong>
                      {incident.location || "—"}
                    </strong>
                  </div>

                </div>


                <div className="report-count">

                  <strong>
                    {incident.report_count}
                  </strong>

                  <span>
                    passenger report
                    {incident.report_count !== 1
                      ? "s"
                      : ""}
                  </span>

                </div>


                <div className="incident-department">

                  <span>
                    Assigned Department
                  </span>

                  <strong>
                    {incident.department ||
                      "General Helpdesk"}
                  </strong>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* ======================================
          LIVE COMPLAINTS
      ====================================== */}

      <section className="complaints-section">

        <div className="section-header">

          <div>

            <h2>
              Live Complaints
            </h2>

            <p>
              Individual passenger reports
            </p>

          </div>


          <button
            onClick={fetchDashboardData}
          >
            ↻ Refresh Now
          </button>

        </div>


        {loading && (

          <div className="dashboard-message">
            Loading complaints...
          </div>

        )}


        {!loading &&
          error && (

            <div className="dashboard-message error-message">
              {error}
            </div>

        )}


        {!loading &&
          !error &&
          complaints.length === 0 && (

            <div className="dashboard-message">
              No complaints have been submitted yet.
            </div>

        )}


        {!loading &&
          !error &&
          complaints.length > 0 && (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>ID</th>
                    <th>Issue</th>
                    <th>Train</th>
                    <th>Coach</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Department</th>
                    <th>Status</th>

                  </tr>

                </thead>


                <tbody>

                  {complaints.map(complaint => (

                    <tr key={complaint.id}>

                      <td>

                        <strong>
                          RAI-
                          {String(
                            complaint.id
                          ).padStart(3, "0")}
                        </strong>

                      </td>


                      <td>

                        <strong>
                          {complaint.issue ||
                            "Unknown"}
                        </strong>

                        <small>
                          {complaint.category ||
                            "Other"}
                        </small>

                      </td>


                      <td>
                        {complaint.train_number ||
                          "—"}
                      </td>


                      <td>
                        {complaint.coach ||
                          "—"}
                      </td>


                      <td>
                        {complaint.location ||
                          "—"}
                      </td>


                      <td>

                        <span
                          className={
                            `priority ${
                              (
                                complaint.severity ||
                                "LOW"
                              ).toLowerCase()
                            }`
                          }
                        >
                          {complaint.severity ||
                            "LOW"}
                        </span>

                      </td>


                      <td>
                        {complaint.department ||
                          "General Helpdesk"}
                      </td>


                      <td>

                        <select
                          className="status-select"

                          value={
                            complaint.status ||
                            "Pending"
                          }

                          onChange={
                            event =>
                              updateStatus(
                                complaint.id,
                                event.target.value
                              )
                          }
                        >

                          <option value="Pending">
                            Pending
                          </option>

                          <option value="Assigned">
                            Assigned
                          </option>

                          <option value="In Progress">
                            In Progress
                          </option>

                          <option value="Resolved">
                            Resolved
                          </option>

                        </select>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

        )}

      </section>

    </div>
  );
}

export default OfficerDashboard;