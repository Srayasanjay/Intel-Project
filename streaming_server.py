#streaming server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from answer_generator import CurriculumAnswerGenerator
from quiz_generator import CurriculumQuizGenerator


# Initialize FastAPI
app = FastAPI()

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Home route ✅
@app.get("/")
def read_root():
    return {"message": "Welcome to the Curriculum Answer Generator API!"}

# Load QA model
generator = CurriculumAnswerGenerator()

# Request body model
class QARequest(BaseModel):
    question: str
    context: str
class SummaryRequest(BaseModel):
    context: str

# Answer generation route ✅
@app.post("/generate-answer/")
async def generate_answer(data: QARequest):
    answer = generator.generate_answer(data.question, data.context)
    return {"answer": answer}

quizgen = CurriculumQuizGenerator()
@app.post("/generate-quiz/")
async def generate_quiz(data: SummaryRequest):
    try:
        print("Received context:", data.context[:100])
        quiz = quizgen.generate_quiz(data.context)
        print("Generated quiz successfully.")
        return {"quiz": quiz}
    except Exception as e:
        print("Quiz generation failed:", str(e))
        return {"quiz": "Error generating quiz."}
