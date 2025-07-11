import cv2
from deepface import DeepFace
import time
import json


# Open webcam
cap = cv2.VideoCapture(0)
window_name = "Engagement Detection"
cv2.namedWindow(window_name)

# Initialize engagement state and timer
last_engagement = "Initializing..."
last_update_time = time.time()

# Optional: Log list to store engagement history
engagement_log = []

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    current_time = time.time()

    # Only analyze every 10 seconds
    if current_time - last_update_time >= 10:
        try:
            result = DeepFace.analyze(frame, actions=['emotion'], detector_backend='mtcnn', enforce_detection=True)
            emotion = result[0]['dominant_emotion']

            if emotion in ['happy', 'surprise']:
                last_engagement = "Engaged"
            elif emotion in ['sad', 'angry', 'disgust']:
                last_engagement = "Disengaged"
            elif emotion == 'fear':
                last_engagement = "Confused / Distracted"
            else:
                last_engagement = "Neutral"

            # Update timestamp and log
            last_update_time = current_time
            engagement_log.append((time.strftime("%H:%M:%S"), last_engagement))
            with open("engagement.json", "w") as f:
                json.dump({"state": last_engagement}, f)

        except Exception as e:
            last_engagement = "No face detected"
            last_update_time = current_time
            engagement_log.append((time.strftime("%H:%M:%S"), last_engagement))

    # Display current (frozen) engagement state
    cv2.putText(frame, f'{last_engagement}', (30, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow(window_name, frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

# Optional: Save to file
with open("engagement_log.txt", "w") as f:
    for entry in engagement_log:
        f.write(f"{entry[0]} - {entry[1]}\n")
