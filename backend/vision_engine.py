from PIL import Image
from transformers import pipeline


# ==========================================
# COMPUTER VISION CLASSIFIER
# ==========================================

print("Loading RailAI Computer Vision model...")


vision_classifier = pipeline(
    "zero-shot-image-classification",
    model="openai/clip-vit-base-patch32"
)


print("Computer Vision model loaded.")


# ==========================================
# VISUAL LABELS
# ==========================================

VISION_LABELS = [

    "fire or smoke inside a railway coach",

    "garbage or dirty railway coach",

    "water leakage inside a railway coach",

    "damaged railway seat or broken interior",

    "electrical damage inside a railway coach",

    "crowded railway coach",

    "normal clean railway coach",

    "railway equipment problem"

]


# ==========================================
# ANALYZE IMAGE
# ==========================================

def analyze_image(image_path):

    try:

        image = Image.open(
            image_path
        ).convert("RGB")


        results = vision_classifier(

            image,

            candidate_labels=VISION_LABELS

        )


        # ----------------------------------
        # BEST RESULT
        # ----------------------------------

        best_result = results[0]


        label = best_result[
            "label"
        ]


        confidence = best_result[
            "score"
        ]


        # ----------------------------------
        # MAP VISION RESULT
        # ----------------------------------

        if "fire" in label.lower():

            issue = "Fire / Smoke"

            category = "Safety"

            severity = "CRITICAL"

            safety_risk = True

            department = "Railway Safety"


        elif "garbage" in label.lower():

            issue = "Cleanliness Issue"

            category = "Cleanliness"

            severity = "MEDIUM"

            safety_risk = False

            department = "Housekeeping"


        elif "water leakage" in label.lower():

            issue = "Water Leakage"

            category = "Maintenance"

            severity = "HIGH"

            safety_risk = True

            department = "Maintenance"


        elif "damaged railway seat" in label.lower():

            issue = "Damaged Interior"

            category = "Maintenance"

            severity = "MEDIUM"

            safety_risk = False

            department = "Carriage Maintenance"


        elif "electrical" in label.lower():

            issue = "Electrical Problem"

            category = "Electrical"

            severity = "HIGH"

            safety_risk = True

            department = "Electrical Maintenance"


        elif "crowded" in label.lower():

            issue = "Overcrowding"

            category = "Passenger Safety"

            severity = "HIGH"

            safety_risk = True

            department = "Railway Operations"


        elif "normal" in label.lower():

            issue = "No Visible Issue"

            category = "General"

            severity = "LOW"

            safety_risk = False

            department = "General Helpdesk"


        else:

            issue = "Railway Equipment Problem"

            category = "Maintenance"

            severity = "MEDIUM"

            safety_risk = False

            department = "Maintenance"


        # ----------------------------------
        # RETURN RESULT
        # ----------------------------------

        return {

            "visual_label": label,

            "confidence": round(
                confidence,
                4
            ),

            "issue": issue,

            "category": category,

            "severity": severity,

            "safety_risk": safety_risk,

            "department": department

        }


    except Exception as error:

        print(
            "Vision error:",
            error
        )


        return {

            "visual_label":
                "Unable to analyze image",

            "confidence": 0,

            "issue":
                "Vision Analysis Failed",

            "category":
                "Unknown",

            "severity":
                "LOW",

            "safety_risk":
                False,

            "department":
                "Human Review"

        }