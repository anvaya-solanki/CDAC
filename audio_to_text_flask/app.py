from flask import Flask, jsonify, request
import speech_recognition as sr
import re
from gtts import gTTS
import os
import pygame
import tempfile

app = Flask(__name__)

pygame.mixer.init()

def speak_text(text):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tf:
        temp_filename = tf.name
    
    tts = gTTS(text=text, lang='en')
    tts.save(temp_filename)
    
    # Play the audio on the main thread and wait until it finishes
    pygame.mixer.music.load(temp_filename)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)
    
    pygame.mixer.music.unload()
    os.unlink(temp_filename)

def clean_text(text):
    text = text.lower()
    text = text.replace(" at the rate ", "@")
    text = text.replace(" at ", "@")
    text = text.replace(" dot ", ".")
    text = text.replace(" bullet ", ".")
    
    # Handle capital words
    text = re.sub(r'\bcapital\s+(\w)', lambda match: match.group(1).upper(), text)

    text = re.sub(r"\s+", "", text)  # Remove all spaces
    return text

def extract_email_password(text):
    email = ""
    password = ""
    
    email_match = re.search(r'email(?:is)?([\w\.-]+@[\w\.-]+\.com)', text)
    password_match = re.search(r'password(?:is)?(\S+)', text)
    
    if email_match:
        email = email_match.group(1)
    if password_match:
        password = password_match.group(1)
    
    return email, password

def recognize_speech_from_mic(recognizer, microphone):
    with microphone as source:
        print("Listening... Please say something related to email and password:")
        try:
            audio_data = recognizer.listen(source, timeout=15, phrase_time_limit=20)
        except sr.WaitTimeoutError:
            return "Listening timed out. No speech detected.", None

    try:
        print("Processing speech...")
        text = recognizer.recognize_google(audio_data)
        print(f"Recognized Text: {text}")
        
        cleaned_text = clean_text(text)
        email, password = extract_email_password(cleaned_text)
        
        return email, password
    
    except sr.UnknownValueError:
        return "Could not understand the audio", None
    except sr.RequestError as e:
        return f"Error with speech recognition service: {e}", None
    
def recognize_product(recognizer, microphone):
    with microphone as source:
        print("Listening... Please say something related to product name:")
        try:
            audio_data = recognizer.listen(source, timeout=15, phrase_time_limit=20)
        except sr.WaitTimeoutError:
            return "Listening timed out. No speech detected.", None

    try:
        print("Processing speech...")
        text = recognizer.recognize_google(audio_data)
        print(f"Recognized Text: {text}")
        
        return text
    
    except sr.UnknownValueError:
        return "Could not understand the audio", None
    except sr.RequestError as e:
        return f"Error with speech recognition service: {e}", None
    

@app.route('/texttospeech', methods=['POST'])
def text_to_speech_summary():
    data = request.get_json()

    summary = data.get('summary', '')

    if not summary:
        return jsonify({'status': 'error', 'message': 'No summary provided.'}), 400

    print('Received summary:', summary)

    summary = summary.replace("\n", " ").replace("*", "-").replace("\\","").replace("-n", "").replace("n-", "")

    # print(summary)
    # speak_text(summary)

    return jsonify({'status': 'success', 'message': 'Summary received successfully.'})


@app.route('/getemailpassword', methods=['GET'])
def recognize_speech():
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()

    with microphone as source:
        print("Adjusting for ambient noise...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)

    speak_text("Please start speaking now.")
    
    email, password = recognize_speech_from_mic(recognizer, microphone)
    
    if password is None:
        return jsonify({"error": email}), 400
    
    response = {
        "email": email if email else "No valid email found",
        "password": password if password else "No valid password found"
    }
    
    return jsonify(response), 200

@app.route('/getproduct', methods=['GET'])
def recognize_user_product():
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()

    with microphone as source:
        print("Adjusting for ambient noise...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)

    speak_text("Please start speaking now.")
    
    product = recognize_product(recognizer, microphone)
    
    response = {
        "product": product
    }
    
    return jsonify(response), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
