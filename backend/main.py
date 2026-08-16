from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

import re
import os
import shutil

from difflib import SequenceMatcher

from nlp_engine import (
    classify_complaint,
    get_incident_details
)

from vision_engine import analyze_image

from database import (
    init_database,
    save_complaint,
    get_complaints,
    update_complaint_status
)


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="RailAI Backend",
    description="AI-powered railway complaint analysis system",
    version="1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:5173",

        "http://127.0.0.1:5173"

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)


# =========================================================
# INITIALIZE DATABASE
# =========================================================

init_database()


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {

        "message":
            "RailAI backend is working!",

        "status":
            "online"

    }


# =========================================================
# EXTRACT COACH
# =========================================================

def extract_coach(complaint):

    coach_match = re.search(

        r'\b(?:coach|carriage|compartment)'
        r'\s*([A-Za-z]{0,2}\d{1,3})\b',

        complaint,

        re.IGNORECASE

    )


    if coach_match:

        return coach_match.group(1).upper()


    return None


# =========================================================
# EXTRACT TRAIN NUMBER
# =========================================================

def extract_train_number(complaint):

    train_match = re.search(

        r'\b(?:train|rail|number|no\.?)'
        r'\s*(?:number|no\.?)?'
        r'\s*(\d{5})\b',

        complaint,

        re.IGNORECASE

    )


    if train_match:

        return train_match.group(1)


    return None


# =========================================================
# EXTRACT LOCATION
# =========================================================

def extract_location(complaint):

    location_match = re.search(

        r'\b(?:at|near|from|towards|station)'
        r'\s+([A-Za-z]+)',

        complaint,

        re.IGNORECASE

    )


    if location_match:

        return (

            location_match
            .group(1)
            .strip()
            .title()

        )


    return None


# =========================================================
# ANALYZE COMPLAINT
# =========================================================

@app.post("/analyze")
async def analyze_complaint(

    complaint: str = Form(...),

    image: UploadFile | None = File(None)

):

    complaint = complaint.strip().lower()


    # =====================================================
    # CHECK INPUT
    # =====================================================

    if not complaint and image is None:

        return {

            "error":
                "Please provide a complaint or image."

        }


    # =====================================================
    # DEFAULT TEXT VALUES
    # =====================================================

    nlp_issue = "General Complaint"

    nlp_confidence = 0.0

    category = "Other"

    issue = "General Complaint"

    severity = "LOW"

    safety_risk = False

    department = "General Helpdesk"


    # =====================================================
    # NLP ANALYSIS
    # =====================================================

    if complaint:

        nlp_result = classify_complaint(

            complaint

        )


        nlp_issue = nlp_result["issue"]

        nlp_confidence = (
            nlp_result["confidence"]
        )


        incident_details = (
            get_incident_details(

                nlp_issue,

                complaint

            )
        )


        if nlp_confidence >= 0.50:

            issue = incident_details[
                "issue"
            ] if "issue" in incident_details else nlp_issue


            category = incident_details[
                "category"
            ]


            severity = incident_details[
                "severity"
            ]


            safety_risk = incident_details[
                "safety_risk"
            ]


            department = incident_details[
                "department"
            ]


    # =====================================================
    # COMPUTER VISION
    # =====================================================

    vision_result = None


    if image is not None:

        os.makedirs(

            "uploaded_images",

            exist_ok=True

        )


        safe_filename = (

            image.filename

            or

            "uploaded_image.jpg"

        )


        image_path = os.path.join(

            "uploaded_images",

            safe_filename

        )


        with open(

            image_path,

            "wb"

        ) as buffer:

            shutil.copyfileobj(

                image.file,

                buffer

            )


        vision_result = analyze_image(

            image_path

        )


        # =================================================
        # COMBINE TEXT + VISION
        # =================================================

        if vision_result:

            vision_confidence = (
                vision_result[
                    "confidence"
                ]
            )


            if vision_confidence >= 0.45:

                # Critical visual problem

                if (
                    vision_result["severity"]
                    == "CRITICAL"
                ):

                    severity = "CRITICAL"

                    safety_risk = True


                # High visual problem

                elif (

                    vision_result["severity"]
                    == "HIGH"

                    and

                    severity != "CRITICAL"

                ):

                    severity = "HIGH"


                # Use vision when text confidence
                # is weak

                if nlp_confidence < 0.50:

                    issue = vision_result[
                        "issue"
                    ]


                    category = vision_result[
                        "category"
                    ]


                    department = vision_result[
                        "department"
                    ]


                    nlp_confidence = (
                        vision_confidence
                    )


    # =====================================================
    # EMERGENCY DETECTION
    # =====================================================

    emergency_words = [

        "fire",

        "smoke",

        "bleeding",

        "unconscious",

        "explosion",

        "accident",

        "injured",

        "threat",

        "weapon"

    ]


    if any(

        word in complaint

        for word in emergency_words

    ):

        severity = "CRITICAL"

        safety_risk = True


    # =====================================================
    # EXTRACT TRAIN / COACH / LOCATION
    # =====================================================

    coach = extract_coach(

        complaint

    )


    train_number = extract_train_number(

        complaint

    )


    location = extract_location(

        complaint

    )


    # =====================================================
    # ROUTING DECISION
    # =====================================================

    if nlp_confidence >= 0.60:

        decision = "AUTO_ROUTE"

    else:

        decision = "HUMAN_REVIEW"


    # =====================================================
    # FINAL RESULT
    # =====================================================

    result = {

        "complaint":
            complaint,

        "category":
            category,

        "issue":
            issue,

        "train_number":
            train_number,

        "coach":
            coach,

        "location":
            location,

        "severity":
            severity,

        "safety_risk":
            safety_risk,

        "department":
            department,

        "confidence":
            round(
                nlp_confidence,
                4
            ),

        "decision":
            decision,

        "vision":
            vision_result

    }


    # =====================================================
    # SAVE
    # =====================================================

    save_complaint(

        result

    )


    return result


# =========================================================
# GET COMPLAINTS
# =========================================================

@app.get("/complaints")
def complaints():

    return get_complaints()


# =========================================================
# UPDATE STATUS
# =========================================================

@app.put(
    "/complaints/{complaint_id}/status"
)

def change_complaint_status(

    complaint_id: int,

    data: dict

):

    status = data.get(

        "status",

        ""

    ).strip()


    valid_statuses = [

        "Pending",

        "Assigned",

        "In Progress",

        "Resolved"

    ]


    if status not in valid_statuses:

        return {

            "success":
                False,

            "message":
                "Invalid status."

        }


    updated = update_complaint_status(

        complaint_id,

        status

    )


    if updated == 0:

        return {

            "success":
                False,

            "message":
                "Complaint not found."

        }


    return {

        "success":
            True,

        "message":
            "Complaint status updated.",

        "complaint_id":
            complaint_id,

        "status":
            status

    }


# =========================================================
# NORMALIZE ISSUE
# =========================================================

def normalize_issue(

    complaint,

    issue

):

    text = (

        complaint

        + " "

        + issue

    ).lower()


    # -----------------------------------------------------
    # AC
    # -----------------------------------------------------

    ac_words = [

        "ac",

        "air conditioner",

        "air conditioning",

        "cooling",

        "no cool",

        "not cooling",

        "hot inside",

        "too hot",

        "no air"

    ]


    if any(

        word in text

        for word in ac_words

    ):

        return "AC_FAILURE"


    # -----------------------------------------------------
    # CLEANLINESS
    # -----------------------------------------------------

    cleanliness_words = [

        "dirty",

        "unclean",

        "garbage",

        "waste",

        "trash",

        "filthy",

        "cleanliness",

        "washroom dirty"

    ]


    if any(

        word in text

        for word in cleanliness_words

    ):

        return "CLEANLINESS"


    # -----------------------------------------------------
    # WATER
    # -----------------------------------------------------

    water_words = [

        "no water",

        "water not available",

        "water shortage",

        "drinking water",

        "tap not working",

        "water problem"

    ]


    if any(

        word in text

        for word in water_words

    ):

        return "WATER"


    # -----------------------------------------------------
    # ELECTRICAL
    # -----------------------------------------------------

    electrical_words = [

        "light not working",

        "lights not working",

        "fan not working",

        "power failure",

        "electricity",

        "socket",

        "charging point",

        "electrical",

        "switch not working"

    ]


    if any(

        word in text

        for word in electrical_words

    ):

        return "ELECTRICAL"


    # -----------------------------------------------------
    # THEFT
    # -----------------------------------------------------

    theft_words = [

        "stolen",

        "steal",

        "theft",

        "robbed",

        "robbery",

        "luggage missing",

        "bag missing",

        "phone missing"

    ]


    if any(

        word in text

        for word in theft_words

    ):

        return "THEFT"


    # -----------------------------------------------------
    # MEDICAL
    # -----------------------------------------------------

    medical_words = [

        "medical",

        "doctor",

        "ambulance",

        "fainted",

        "unconscious",

        "bleeding",

        "injured",

        "injury",

        "sick",

        "emergency"

    ]


    if any(

        word in text

        for word in medical_words

    ):

        return "MEDICAL"


    # -----------------------------------------------------
    # FIRE
    # -----------------------------------------------------

    fire_words = [

        "fire",

        "smoke",

        "burning",

        "flames",

        "explosion"

    ]


    if any(

        word in text

        for word in fire_words

    ):

        return "FIRE"


    return (

        issue

        .upper()

        .replace(

            " ",

            "_"

        )

    )


# =========================================================
# TEXT SIMILARITY
# =========================================================

def text_similarity(

    text_a,

    text_b

):

    text_a = text_a.lower()

    text_b = text_b.lower()


    sequence_score = SequenceMatcher(

        None,

        text_a,

        text_b

    ).ratio()


    words_a = set(

        re.findall(

            r"[a-z]+",

            text_a

        )

    )


    words_b = set(

        re.findall(

            r"[a-z]+",

            text_b

        )

    )


    if not words_a or not words_b:

        word_score = 0

    else:

        intersection = (

            words_a & words_b

        )


        union = (

            words_a | words_b

        )


        word_score = (

            len(intersection)

            /

            len(union)

        )


    return (

        sequence_score * 0.4

        +

        word_score * 0.6

    )


# =========================================================
# AI INCIDENT SUMMARY
# =========================================================

def generate_incident_summary(

    issue,

    category,

    severity,

    train_number,

    coach,

    location,

    report_count,

    department,

    safety_risk

):

    # =====================================================
    # SAFE DISPLAY VALUES
    # =====================================================

    train_text = (

        f"Train {train_number}"

        if train_number

        else

        "an unidentified train"

    )


    coach_text = (

        f"Coach {coach}"

        if coach

        else

        "an unidentified coach"

    )


    location_text = (

        location

        if location

        else

        "an unidentified location"

    )


    report_word = (

        "passenger report"

        if report_count == 1

        else

        "passenger reports"

    )


    # =====================================================
    # ISSUE-SPECIFIC RECOMMENDATIONS
    # =====================================================

    recommendations = {


        "AC_FAILURE":

            "Dispatch Electrical Maintenance to inspect "
            "the air-conditioning system and restore "
            "cooling in the affected coach.",


        "CLEANLINESS":

            "Dispatch Housekeeping staff to inspect "
            "and clean the affected coach or facility "
            "immediately.",


        "WATER":

            "Dispatch Maintenance staff to inspect "
            "the water supply, taps and leakage points "
            "in the affected area.",


        "ELECTRICAL":

            "Dispatch Electrical Maintenance to inspect "
            "the affected electrical equipment and "
            "isolate any unsafe component.",


        "THEFT":

            "Alert Railway Protection personnel and "
            "initiate an immediate security assessment "
            "of the affected coach.",


        "MEDICAL":

            "Alert the onboard medical response team "
            "and arrange medical assistance at the "
            "nearest suitable station.",


        "FIRE":

            "Initiate emergency safety procedures and "
            "alert Railway Safety personnel immediately.",


        "OVERcrowding":

            "Alert Railway Operations and assess "
            "passenger density and crowd-control "
            "requirements."

    }


    normalized = normalize_issue(

        "",

        issue

    )


    recommendation = recommendations.get(

        normalized,

        f"Assign the incident to {department} "
        "for immediate assessment and corrective action."

    )


    # =====================================================
    # URGENCY
    # =====================================================

    if severity == "CRITICAL":

        urgency = "IMMEDIATE"

    elif severity == "HIGH":

        urgency = "HIGH"

    elif severity == "MEDIUM":

        urgency = "MODERATE"

    else:

        urgency = "LOW"


    # =====================================================
    # SUMMARY
    # =====================================================

    summary = (

        f"{report_count} {report_word} indicate "

        f"{issue.lower()} involving "

        f"{coach_text} of {train_text} "

        f"at {location_text}. "

        f"The incident is classified as "

        f"{severity.lower()} priority."

    )


    # =====================================================
    # SAFETY ADDITION
    # =====================================================

    if safety_risk:

        summary += (

            " The reports indicate a potential "
            "safety risk requiring prompt attention."

        )


    return {

        "summary":
            summary,

        "recommended_action":
            recommendation,

        "urgency":
            urgency

    }


# =========================================================
# GET INCIDENTS
# =========================================================

@app.get("/incidents")
def get_incidents():

    complaints_list = get_complaints()


    incidents = []


    # =====================================================
    # GROUP COMPLAINTS
    # =====================================================

    for complaint in complaints_list:

        complaint_text = complaint.get(

            "complaint",

            ""

        )


        issue = complaint.get(

            "issue",

            "General Complaint"

        )


        normalized_issue = normalize_issue(

            complaint_text,

            issue

        )


        train = complaint.get(

            "train_number"

        )


        coach = complaint.get(

            "coach"

        )


        location = complaint.get(

            "location"

        )


        matched_incident = None


        # =================================================
        # SEARCH EXISTING INCIDENTS
        # =================================================

        for incident in incidents:


            # ---------------------------------------------
            # TRAIN
            # ---------------------------------------------

            if train and incident[
                "train_number"
            ]:

                if train != incident[
                    "train_number"
                ]:

                    continue


            # ---------------------------------------------
            # COACH
            # ---------------------------------------------

            if coach and incident[
                "coach"
            ]:

                if coach != incident[
                    "coach"
                ]:

                    continue


            # ---------------------------------------------
            # LOCATION
            # ---------------------------------------------

            if location and incident[
                "location"
            ]:

                if location.lower() != (

                    incident[
                        "location"
                    ].lower()

                ):

                    continue


            # ---------------------------------------------
            # NORMALIZED ISSUE
            # ---------------------------------------------

            if normalized_issue == (

                incident[
                    "normalized_issue"
                ]

            ):

                matched_incident = incident

                break


            # ---------------------------------------------
            # TEXT SIMILARITY
            # ---------------------------------------------

            similarity = text_similarity(

                complaint_text,

                incident[
                    "sample_complaint"
                ]

            )


            if similarity >= 0.45:

                matched_incident = incident

                break


        # =================================================
        # ADD TO EXISTING INCIDENT
        # =================================================

        if matched_incident:

            matched_incident[
                "reports"
            ].append(

                complaint

            )


            matched_incident[
                "report_count"
            ] += 1


            # ---------------------------------------------
            # ESCALATE SEVERITY
            # ---------------------------------------------

            severity_order = {

                "LOW": 1,

                "MEDIUM": 2,

                "HIGH": 3,

                "CRITICAL": 4

            }


            current = matched_incident[
                "severity"
            ]


            new = complaint.get(

                "severity",

                "LOW"

            )


            if severity_order.get(

                new,

                1

            ) > severity_order.get(

                current,

                1

            ):

                matched_incident[
                    "severity"
                ] = new


            # ---------------------------------------------
            # SAFETY ESCALATION
            # ---------------------------------------------

            if complaint.get(

                "safety_risk",

                False

            ):

                matched_incident[
                    "safety_risk"
                ] = True


        # =================================================
        # CREATE NEW INCIDENT
        # =================================================

        else:

            incident = {

                "incident_id":
                    f"INC-{len(incidents) + 1:03d}",

                "normalized_issue":
                    normalized_issue,

                "sample_complaint":
                    complaint_text,

                "train_number":
                    train,

                "coach":
                    coach,

                "location":
                    location,

                "issue":
                    issue,

                "category":
                    complaint.get(

                        "category",

                        "Other"

                    ),

                "severity":
                    complaint.get(

                        "severity",

                        "LOW"

                    ),

                "department":
                    complaint.get(

                        "department",

                        "General Helpdesk"

                    ),

                "safety_risk":
                    complaint.get(

                        "safety_risk",

                        False

                    ),

                "reports":
                    [

                        complaint

                    ],

                "report_count":
                    1

            }


            incidents.append(

                incident

            )


    # =====================================================
    # GENERATE AI SUMMARY
    # =====================================================

    for incident in incidents:

        ai_summary = generate_incident_summary(

            issue=incident[
                "issue"
            ],

            category=incident[
                "category"
            ],

            severity=incident[
                "severity"
            ],

            train_number=incident[
                "train_number"
            ],

            coach=incident[
                "coach"
            ],

            location=incident[
                "location"
            ],

            report_count=incident[
                "report_count"
            ],

            department=incident[
                "department"
            ],

            safety_risk=incident[
                "safety_risk"
            ]

        )


        incident[
            "ai_summary"
        ] = ai_summary[
            "summary"
        ]


        incident[
            "recommended_action"
        ] = ai_summary[
            "recommended_action"
        ]


        incident[
            "urgency"
        ] = ai_summary[
            "urgency"
        ]


    # =====================================================
    # REMOVE INTERNAL FIELDS
    # =====================================================

    for incident in incidents:

        incident.pop(

            "normalized_issue",

            None

        )


        incident.pop(

            "sample_complaint",

            None

        )


    # =====================================================
    # SORT BY REPORT COUNT
    # =====================================================

    incidents.sort(

        key=lambda item:
            item[
                "report_count"
            ],

        reverse=True

    )


    return incidents