# answer_generator.py

from transformers import T5Tokenizer, T5ForConditionalGeneration
from gtts import gTTS
import os

class CurriculumAnswerGenerator:
    def __init__(self, model_name="t5-base", use_speech=False):
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        self.model = T5ForConditionalGeneration.from_pretrained(model_name)
        self.use_speech = use_speech

    def generate_answer(self, question: str, context: str, speak: bool = False) -> str:
        input_text = f"question: {question} context: {context}"
        input_ids = self.tokenizer.encode(input_text, return_tensors='pt', truncation=True)

        output_ids = self.model.generate(
            input_ids, max_length=128, num_beams=4, early_stopping=True
        )
        answer = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)

        if speak or self.use_speech:
            self._speak(answer)

        return answer

    def _speak(self, text: str):
        tts = gTTS(text)
        tts.save("answer.mp3")
        try:
            if os.name == "nt":
                os.system("start answer.mp3")  # Windows
            else:
                os.system("afplay answer.mp3")  # macOS
        except Exception as e:
            print("Audio playback failed:", e)
