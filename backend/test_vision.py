from vision_engine import analyze_image


IMAGE_PATH = "test_image.jpg"


result = analyze_image(
    IMAGE_PATH
)


print("\n")
print("==============================")
print("RAILAI COMPUTER VISION RESULT")
print("==============================")
print("\n")


print(
    "Visual Label:",
    result["visual_label"]
)


print(
    "Confidence:",
    result["confidence"]
)


print(
    "Issue:",
    result["issue"]
)


print(
    "Category:",
    result["category"]
)


print(
    "Severity:",
    result["severity"]
)


print(
    "Safety Risk:",
    result["safety_risk"]
)


print(
    "Department:",
    result["department"]
)