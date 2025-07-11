from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
from answer_generator import CurriculumAnswerGenerator
from quiz_generator import CurriculumQuizGenerator  # if you've separated it

# ------------------- FastAPI Setup ------------------- #
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Model Instances ------------------- #
generator = CurriculumAnswerGenerator()
quizgen = CurriculumQuizGenerator()

# Summarizer
class TextSummarizer:
    def __init__(self):
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

    def summarize(self, text: str) -> str:
        if len(text) > 1024:
            text = text[:1024]  # Truncate input if too long
        summary = self.summarizer(text, max_length=150, min_length=40, do_sample=False)
        return summary[0]["summary_text"]

summarizer = TextSummarizer()

# ------------------- Request Models ------------------- #
class QARequest(BaseModel):
    question: str
    context: str

class SummaryRequest(BaseModel):
    context: str

# ------------------- Routes ------------------- #
@app.post("/generate-answer/")
async def generate_answer(data: QARequest):
    answer = generator.generate_answer(data.question, data.context)
    return {"answer": answer}

@app.post("/generate-quiz/")
async def generate_quiz(data: SummaryRequest):
    quiz = quizgen.generate_quiz(data.context)
    return {"quiz": quiz}

@app.post("/summarize/")
async def summarize(data: SummaryRequest):
    summary = summarizer.summarize(data.context)
    return {"summary": summary}
