from sentence_transformers import SentenceTransformer, util


# ==========================================
# LOAD NLP MODEL
# ==========================================

model = SentenceTransformer("all-MiniLM-L6-v2")


# ==========================================
# KNOWN COMPLAINT TYPES
# ==========================================

complaint_types = {

    "AC Failure": [
        "air conditioner is not working",
        "AC stopped working",
        "no cooling in the coach",
        "coach is very hot",
        "air conditioning has failed",
        "AC is not functioning",
        "there is no air conditioning"
    ],

    "Toilet Problem": [
        "toilet is dirty",
        "toilet is not clean",
        "toilet is unusable",
        "bathroom is dirty",
        "washroom needs cleaning",
        "toilet is blocked"
    ],

    "Garbage Problem": [
        "garbage is lying around",
        "there is garbage in the coach",
        "waste has not been collected",
        "coach has trash",
        "trash is everywhere"
    ],

    "Security Concern": [
        "someone is behaving suspiciously",
        "there is a security problem",
        "someone is threatening passengers",
        "there is a fight",
        "someone is being harassed"
    ],

    "Theft": [
        "my luggage was stolen",
        "my phone was stolen",
        "someone stole my belongings",
        "my bag is missing",
        "my wallet was stolen"
    ],

    "Medical Emergency": [
        "a passenger is unconscious",
        "someone needs medical help",
        "a passenger is injured",
        "someone is bleeding",
        "there is a medical emergency"
    ],

    "Electrical Problem": [
        "electrical system is not working",
        "lights are not working",
        "power has gone out",
        "electrical problem in the coach",
        "coach lights have failed"
    ]
}


# ==========================================
# CREATE EMBEDDINGS
# ==========================================

complaint_embeddings = {}

for complaint_type, examples in complaint_types.items():

    complaint_embeddings[complaint_type] = model.encode(
        examples,
        convert_to_tensor=True
    )


# ==========================================
# CLASSIFY COMPLAINT
# ==========================================

def classify_complaint(text):

    user_embedding = model.encode(
        text,
        convert_to_tensor=True
    )

    best_type = None

    best_score = -1

    for complaint_type, embeddings in complaint_embeddings.items():

        scores = util.cos_sim(
            user_embedding,
            embeddings
        )

        score = float(scores.max())

        if score > best_score:

            best_score = score

            best_type = complaint_type

    return {
        "issue": best_type,
        "confidence": round(best_score, 3)
    }


# ==========================================
# GET INCIDENT DETAILS
# ==========================================

def get_incident_details(issue, complaint):

    category = "Other"

    severity = "LOW"

    safety_risk = False

    department = "General Helpdesk"


    # --------------------------------------
    # AC / ELECTRICAL
    # --------------------------------------

    if issue == "AC Failure":

        category = "Electrical"

        department = "Electrical Maintenance"

        severity = "HIGH"


    elif issue == "Electrical Problem":

        category = "Electrical"

        department = "Electrical Maintenance"

        severity = "HIGH"


    # --------------------------------------
    # TOILET
    # --------------------------------------

    elif issue == "Toilet Problem":

        category = "Cleanliness"

        department = "Housekeeping"

        severity = "MEDIUM"


    # --------------------------------------
    # GARBAGE
    # --------------------------------------

    elif issue == "Garbage Problem":

        category = "Cleanliness"

        department = "Housekeeping"

        severity = "MEDIUM"


    # --------------------------------------
    # SECURITY
    # --------------------------------------

    elif issue == "Security Concern":

        category = "Security"

        department = "Railway Security"

        severity = "CRITICAL"

        safety_risk = True


    # --------------------------------------
    # THEFT
    # --------------------------------------

    elif issue == "Theft":

        category = "Security"

        department = "Railway Security"

        severity = "CRITICAL"

        safety_risk = True


    # --------------------------------------
    # MEDICAL
    # --------------------------------------

    elif issue == "Medical Emergency":

        category = "Medical"

        department = "Medical Unit"

        severity = "CRITICAL"

        safety_risk = True


    # --------------------------------------
    # EMERGENCY OVERRIDE
    # --------------------------------------

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

    if any(word in complaint for word in emergency_words):

        severity = "CRITICAL"

        safety_risk = True


    return {
        "category": category,
        "severity": severity,
        "safety_risk": safety_risk,
        "department": department
    }