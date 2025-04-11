# PABS: Your Real-Time AI Voice Assistant (Inspired by Jarvis)

Welcome to **PABS (Personal Assistant with Brain & Speech)** — a cutting-edge, real-time AI voice assistant built with **React.js**, **Tailwind CSS**, and **WebRTC**, and powered by **OpenAI's GPT-4o Realtime API**.

Just like _Jarvis_ from Iron Man, PABS listens, thinks, and responds — all in real time.

---

https://github.com/user-attachments/assets/b4201b36-945b-4c99-b104-42b59825bd99

## 🚀 Features

- 🎙️ **Real-time Speech Recognition** using Web Speech API
- 🧠 **OpenAI GPT-4o Realtime Integration** via WebRTC
- 🗣️ **Live Audio Streaming + AI Response Generation**
- 💬 **Transcription Display with Live Typing Effect**
- 🧵 **Conversation History Log with Role-based Styling**
- 🎨 **Responsive UI** built with **Tailwind CSS**
- 📱 **Mobile-ready interface**
- 🛠️ **Modular, Component-based React Architecture**

---

## 🧱 Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **AI**: OpenAI GPT-4o Realtime API
- **Voice & Audio**: WebRTC, Web Speech API
- **Icons**: Font Awesome

---

## 📁 Folder Structure

```
/src
  ├── components
  │   ├── IndexPage.jsx      # Main PABS Page
  ├── index.css              # Tailwind CSS Directives
  ├── App.js                 # App Entry Point
  └── index.js               # Root Renderer
/public
  └── index.html             # HTML Shell
```

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/real-time-ai-voice-assistant.git
cd pabs-ai-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file in the root with your OpenAI API key:

```
REACT_APP_OPENAI_API_KEY=sk-xxx-your-api-key-xxx
```

### 4. Run the App

```bash
npm start
```

Visit `http://localhost:3000` in your browser.

---

## 💡 Usage

- Click the **microphone button** to start recording.
- Speak naturally — your words will be transcribed in real time.
- PABS sends audio + page context to OpenAI GPT-4o.
- AI responds with live speech and onscreen transcript.

---

## 📷 Screenshots

![image](https://github.com/user-attachments/assets/d8b81fab-872f-4e2b-a869-670197b71486)

---

## 🧪 Future Enhancements

- ✅ Whisper fallback for transcription accuracy
- ✅ Voice selection (e.g., Jarvis, Friday, etc.)
- ✅ Persistent conversation logs (via Firebase / Supabase)
- ✅ Commands for smart device control / APIs

---

## 🤖 Credits

- Developed by Richard Guevara
- Powered by [OpenAI GPT-4o](https://openai.com)
- Inspired by _Jarvis_ from Marvel’s Iron Man

---

## 📄 License

MIT License. Use freely, build boldly.

---

> "PABS isn't just a chatbot — it's your real-time AI co-pilot."
