from transformers import pipeline

class CurriculumQuizGenerator:
    def __init__(self, model_name="mrm8488/t5-base-finetuned-question-generation-ap"):
        print("Loading quiz generation model...")
        self.generator = pipeline("text2text-generation", model=model_name)
        print("Model loaded successfully.")

    def generate_quiz(self, context: str) -> str:
        try:
            prompt = f"generate questions: {context.strip()}"
            print("Quiz prompt:", prompt[:300])
            output = self.generator(prompt, max_length=256, num_return_sequences=1)
            print("Quiz generation output:", output)

            quiz_text = output[0]["generated_text"].strip()

            # Post-process: Split into lines if multiple questions
            questions = [
                q.strip()
                for q in quiz_text.split("\n")
                if len(q.strip()) > 5
            ]
            return "\n".join(questions)

        except Exception as e:
            print("Quiz generation error:", str(e))
            return "Error: Quiz generation failed."
