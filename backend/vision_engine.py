from PIL import Image
import os


# ============================================================
# LIGHTWEIGHT RAILAI VISION ENGINE
# ============================================================
# Cloud-friendly version.
#
# This version does NOT load CLIP / Transformers / PyTorch.
# It keeps image upload and basic visual analysis working
# without consuming large amounts of RAM.
# ============================================================


print("RailAI lightweight Computer Vision engine loaded.")


# ============================================================
# VISUAL ANALYSIS
# ============================================================

def analyze_image(image_path):

    try:

        # ----------------------------------------------------
        # Open image
        # ----------------------------------------------------

        image = Image.open(image_path).convert("RGB")

        width, height = image.size

        # ----------------------------------------------------
        # Basic image statistics
        # ----------------------------------------------------

        # Resize for quick processing
        small_image = image.resize((100, 100))

        pixels = list(small_image.getdata())

        total_pixels = len(pixels)

        if total_pixels == 0:

            raise ValueError("Image contains no pixels")


        # Average RGB values
        avg_r = sum(pixel[0] for pixel in pixels) / total_pixels
        avg_g = sum(pixel[1] for pixel in pixels) / total_pixels
        avg_b = sum(pixel[2] for pixel in pixels) / total_pixels

        brightness = (
            avg_r + avg_g + avg_b
        ) / 3


        # ----------------------------------------------------
        # Basic color detection
        # ----------------------------------------------------

        red_or_orange_pixels = 0

        dark_pixels = 0

        gray_pixels = 0

        for r, g, b in pixels:

            # Possible fire-like colors
            if (
                r > 150
                and r > g * 1.25
                and g > b * 1.15
            ):

                red_or_orange_pixels += 1


            # Very dark pixels
            if (
                r < 60
                and g < 60
                and b < 60
            ):

                dark_pixels += 1


            # Gray pixels
            if (
                abs(r - g) < 15
                and abs(g - b) < 15
            ):

                gray_pixels += 1


        fire_ratio = (
            red_or_orange_pixels / total_pixels
        )

        dark_ratio = (
            dark_pixels / total_pixels
        )

        gray_ratio = (
            gray_pixels / total_pixels
        )


        # ====================================================
        # BASIC VISUAL RULES
        # ====================================================

        # ----------------------------------------------------
        # Possible fire / smoke
        # ----------------------------------------------------

        if fire_ratio > 0.12:

            label = "Possible fire or smoke"

            issue = "Fire / Smoke"

            category = "Safety"

            severity = "CRITICAL"

            safety_risk = True

            department = "Railway Safety"

            confidence = min(
                0.70,
                0.40 + fire_ratio
            )


        # ----------------------------------------------------
        # Very dark image
        # ----------------------------------------------------

        elif dark_ratio > 0.45:

            label = "Very dark image - possible smoke or low visibility"

            issue = "Low Visibility"

            category = "Safety"

            severity = "MEDIUM"

            safety_risk = False

            department = "Railway Safety"

            confidence = 0.45


        # ----------------------------------------------------
        # Predominantly gray image
        # ----------------------------------------------------

        elif gray_ratio > 0.55:

            label = "Railway interior / equipment image"

            issue = "Railway Equipment Problem"

            category = "Maintenance"

            severity = "MEDIUM"

            safety_risk = False

            department = "Maintenance"

            confidence = 0.40


        # ----------------------------------------------------
        # Otherwise
        # ----------------------------------------------------

        else:

            label = "Railway image received - manual review recommended"

            issue = "Visual Inspection Required"

            category = "General"

            severity = "LOW"

            safety_risk = False

            department = "General Helpdesk"

            confidence = 0.30


        # ====================================================
        # RETURN RESULT
        # ====================================================

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

            "confidence":
                0,

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