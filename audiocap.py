#audiocap.property
import os
import sounddevice as sd
import numpy as np
import queue
import threading
from faster_whisper import WhisperModel
from scipy.io.wavfile import write

# Model setup
model = WhisperModel("small", device="cpu", compute_type="float32")

# Audio config
sample_rate = 16000
block_duration = 4
channels = 1

q = queue.Queue()
stop_flag = threading.Event()
stream = None
transcription_thread = None

# Language code (can be changed by function argument)
language_code = "en"

def callback(indata, frames, time, status):
    if status:
        print("Audio status:", status)
    q.put(indata.copy())

def transcribe_audio(save_output=False, output_file="translated_output.txt"):
    buffer = np.empty((0, channels), dtype='float32')
    saved_once = False
    result_text = ""

    while not stop_flag.is_set():
        try:
            data = q.get(timeout=1)
            buffer = np.concatenate((buffer, data), axis=0)

            if len(buffer) >= sample_rate * block_duration:
                chunk = buffer[:sample_rate * block_duration]
                buffer = buffer[sample_rate * block_duration:]

                chunk = chunk.flatten()
                chunk = np.nan_to_num(chunk)

                if np.max(np.abs(chunk)) < 1e-6:
                    continue

                max_val = np.max(np.abs(chunk))
                if max_val == 0 or np.isnan(max_val) or np.isinf(max_val):
                    continue

                chunk = np.clip(chunk / max_val, -1.0, 1.0)

                if not saved_once:
                    write("debug_chunk.wav", sample_rate, chunk.astype(np.float32))
                    saved_once = True

                try:
                    segments, _ = model.transcribe(chunk, beam_size=1, language=language_code, task="translate")
                    for segment in segments:
                        print("⏺ Translated:", segment.text)
                        result_text += segment.text + " "
                except Exception as transcribe_error:
                    print("Transcription error:", transcribe_error)

        except queue.Empty:
            continue
        except Exception as e:
            print("Unexpected error:", e)

    if save_output and result_text.strip():
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(result_text.strip())
            print(f"✅ Translation saved to {output_file}")
        except Exception as e:
            print(f"❌ Error saving translation: {e}")

    return result_text.strip()

def start_translation(lang="en", save_output=False, output_file="translated_output.txt"):
    global stream, transcription_thread, language_code
    language_code = lang
    stop_flag.clear()

    transcription_thread = threading.Thread(
        target=transcribe_audio, kwargs={"save_output": save_output, "output_file": output_file}, daemon=True
    )
    transcription_thread.start()

    stream = sd.InputStream(samplerate=sample_rate, channels=channels, dtype='float32', callback=callback)
    stream.start()
    print(f"🎙️ Translation started for spoken language: {lang}")

def stop_translation():
    global stream
    stop_flag.set()
    if stream:
        stream.stop()
        stream.close()
        stream = None
    print("🛑 Translation stopped.")

# Optional CLI usage
if __name__ == "__main__":
    try:
        start_translation(lang="hi", save_output=True)
        input("Press Enter to stop recording...\n")
    finally:
        stop_translation()
