import re


# ============================================================
# RAILAI LIGHTWEIGHT NLP ENGINE
# ============================================================
# This version is designed for cloud deployment.
# It does NOT load SentenceTransformer/PyTorch models.
# ============================================================


# ============================================================
# KNOWN COMPLAINT TYPES
# ============================================================

complaint_types = {

    "AC Failure": [
        "air conditioner",
        "air conditioning",
        "air conditioner is not working",
        "ac not working",
        "ac stopped working",
        "ac failure",
        "no cooling",
        "no air conditioning",
        "coach is hot",
        "coach is very hot",
        "air conditioning failed",
        "air conditioner stopped"
    ],

    "Toilet Problem": [
        "toilet",
        "bathroom",
        "washroom",
        "toilet is dirty",
        "toilet is blocked",
        "toilet is unusable",
        "bathroom is dirty",
        "washroom needs cleaning",
        "toilet not clean"
    ],

    "Garbage Problem": [
        "garbage",
        "trash",
        "waste",
        "rubbish",
        "garbage is lying around",
        "trash everywhere",
        "waste not collected",
        "garbage in coach",
        "coach has trash"
    ],

    "Security Concern": [
        "security",
        "suspicious",
        "threat",
        "threatening",
        "fight",
        "harassment",
        "harassed",
        "violence",
        "someone is threatening",
        "security problem",
        "someone behaving suspiciously"
    ],

    "Theft": [
        "stolen",
        "steal",
        "theft",
        "robbed",
        "robbery",
        "luggage stolen",
        "phone stolen",
        "bag stolen",
        "wallet stolen",
        "belongings stolen",
        "bag is missing",
        "luggage missing"
    ],

    "Medical Emergency": [
        "medical",
        "doctor",
        "ambulance",
        "unconscious",
        "injured",
        "injury",
        "bleeding",
        "blood",
        "medical emergency",
        "needs medical help",
        "passenger is injured",
        "passenger unconscious"
    ],

    "Electrical Problem": [
        "electrical",
        "electricity",
        "power",
        "light",
        "lights",
        "lights not working",
        "power gone",
        "power failure",
        "electrical system",
        "electrical problem",
        "coach lights failed"
    ]
}


# ============================================================
# KEYWORDS USED FOR CLASSIFICATION
# ============================================================

issue_keywords = {

    "AC Failure": [
        "ac",
        "air conditioner",
        "air conditioning",
        "cooling",
        "hot coach",
        "coach is hot",
        "no cooling"
    ],

    "Toilet Problem": [
        "toilet",
        "bathroom",
        "washroom",
        "restroom",
        "urinal"
    ],

    "Garbage Problem": [
        "garbage",
        "trash",
        "waste",
        "rubbish",
        "dirty coach",
        "litter"
    ],

    "Security Concern": [
        "security",
        "suspicious",
        "threat",
        "threatening",
        "fight",
        "harassment",
        "harassed",
        "violence",
        "attack"
    ],

    "Theft": [
        "stolen",
        "steal",
        "theft",
        "robbed",
        "robbery",
        "missing luggage",
        "missing bag",
        "missing phone",
        "wallet stolen"
    ],

    "Medical Emergency": [
        "medical",
        "doctor",
        "ambulance",
        "unconscious",
        "injured",
        "injury",
        "bleeding",
        "blood",
        "emergency",
        "sick",
        "fainted",
        "fainting"
    ],

    "Electrical Problem": [
        "electrical",
        "electricity",
        "power",
        "light",
        "lights",
        "switch",
        "socket",
        "charging point"
    ]
}


# ============================================================
# EMERGENCY KEYWORDS
# ============================================================

emergency_words = [
    "fire",
    "smoke",
    "bleeding",
    "unconscious",
    "explosion",
    "accident",
    "injured",
    "injury",
    "threat",
    "weapon",
    "attack",
    "violence",
    "fainted",
    "fainting",
    "medical emergency"
]


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text):

    if not text:
        return ""

    text = str(text).lower()

    # Replace punctuation with spaces
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


# ============================================================
# CLASSIFY COMPLAINT
# ============================================================

def classify_complaint(text):

    complaint = normalize_text(text)

    if not complaint:
        return {
            "issue": "Other",
            "confidence": 0.0
        }

    scores = {}

    # --------------------------------------------------------
    # Score each complaint category
    # --------------------------------------------------------

    for complaint_type, keywords in issue_keywords.items():

        score = 0

        for keyword in keywords:

            keyword = normalize_text(keyword)

            if not keyword:
                continue

            # Exact phrase match
            if keyword in complaint:

                # Longer phrases receive higher weight
                words = len(keyword.split())

                if words >= 3:
                    score += 3
                elif words == 2:
                    score += 2
                else:
                    score += 1

        scores[complaint_type] = score

    # --------------------------------------------------------
    # Find highest scoring category
    # --------------------------------------------------------

    best_type = max(
        scores,
        key=scores.get
    )

    best_score = scores[best_type]

    # --------------------------------------------------------
    # No matching category
    # --------------------------------------------------------

    if best_score == 0:

        return {
            "issue": "Other",
            "confidence": 0.30
        }

    # --------------------------------------------------------
    # Convert score to confidence
    # --------------------------------------------------------

    # Strong phrase/keyword matches receive higher confidence.
    if best_score >= 6:
        confidence = 0.95

    elif best_score >= 4:
        confidence = 0.90

    elif best_score >= 3:
        confidence = 0.85

    elif best_score >= 2:
        confidence = 0.75

    else:
        confidence = 0.65

    return {
        "issue": best_type,
        "confidence": round(confidence, 3)
    }


# ============================================================
# GET INCIDENT DETAILS
# ============================================================

def get_incident_details(issue, complaint):

    complaint = normalize_text(complaint)

    category = "Other"

    severity = "LOW"

    safety_risk = False

    department = "General Helpdesk"


    # ========================================================
    # AC
    # ========================================================

    if issue == "AC Failure":

        category = "Electrical"

        department = "Electrical Maintenance"

        severity = "HIGH"


    # ========================================================
    # ELECTRICAL
    # ========================================================

    elif issue == "Electrical Problem":

        category = "Electrical"

        department = "Electrical Maintenance"

        severity = "HIGH"


    # ========================================================
    # TOILET
    # ========================================================

    elif issue == "Toilet Problem":

        category = "Cleanliness"

        department = "Housekeeping"

        severity = "MEDIUM"


    # ========================================================
    # GARBAGE
    # ========================================================

    elif issue == "Garbage Problem":

        category = "Cleanliness"

        department = "Housekeeping"

        severity = "MEDIUM"


    # ========================================================
    # SECURITY
    # ========================================================

    elif issue == "Security Concern":

        category = "Security"

        department = "Railway Security"

        severity = "CRITICAL"

        safety_risk = True


    # ========================================================
    # THEFT
    # ========================================================

    elif issue == "Theft":

        category = "Security"

        department = "Railway Security"

        severity = "CRITICAL"

        safety_risk = True


    # ========================================================
    # MEDICAL
    # ========================================================

    elif issue == "Medical Emergency":

        category = "Medical"

        department = "Medical Unit"

        severity = "CRITICAL"

        safety_risk = True


    # ========================================================
    # EMERGENCY OVERRIDE
    # ========================================================

    for word in emergency_words:

        if word in complaint:

            severity = "CRITICAL"

            safety_risk = True

            # If the complaint was not already categorized,
            # route emergency complaints appropriately.

            if issue == "Other":

                if any(
                    x in complaint
                    for x in [
                        "medical",
                        "bleeding",
                        "unconscious",
                        "injured",
                        "ambulance",
                        "fainted",
                        "fainting"
                    ]
                ):

                    category = "Medical"

                    department = "Medical Unit"

                elif any(
                    x in complaint
                    for x in [
                        "fire",
                        "smoke",
                        "explosion"
                    ]
                ):

                    category = "Emergency"

                    department = "Emergency Response"

                else:

                    category = "Security"

                    department = "Railway Security"

            break


    # ========================================================
    # RETURN INCIDENT DETAILS
    # ========================================================

    return {
        "category": category,
        "severity": severity,
        "safety_risk": safety_risk,
        "department": department
    }