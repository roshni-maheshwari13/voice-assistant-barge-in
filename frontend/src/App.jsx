import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const speakingRef = useRef(false);
  const processingRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const restartTimeoutRef = useRef(null);

  // =========================
  // TEXT TO SPEECH
  // =========================

  const speak = (message) => {
    window.speechSynthesis.cancel();

    speakingRef.current = true;
    setSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(message);

    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      speakingRef.current = true;
      setSpeaking(true);
    };

    utterance.onend = () => {
      speakingRef.current = false;
      setSpeaking(false);

      if (listeningRef.current && recognitionRef.current) {
        restartRecognition();
      }
    };

    utterance.onerror = () => {
      speakingRef.current = false;
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // =========================
  // RESTART SPEECH RECOGNITION
  // =========================

  const restartRecognition = () => {
    if (!listeningRef.current || !recognitionRef.current) {
      return;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    restartTimeoutRef.current = setTimeout(() => {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // Recognition is already running
      }
    }, 150);
  };

  // =========================
  // ASK AI
  // =========================

  const askAI = async (transcript) => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;
    setThinking(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: transcript,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Backend request failed");
      }

      const data = await res.json();

      setResponse(data.reply);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: transcript,
        },
        {
          role: "assistant",
          text: data.reply,
        },
      ]);

      speak(data.reply);
    } catch (error) {
      console.error("Backend error:", error);

      const errorMessage =
        "Sorry, I could not connect to the AI.";

      setResponse(errorMessage);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: transcript,
        },
        {
          role: "assistant",
          text: errorMessage,
        },
      ]);

      speak(errorMessage);
    } finally {
      processingRef.current = false;
      setThinking(false);
    }
  };

  // =========================
  // START LISTENING
  // =========================

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Please use Google Chrome.");
      return;
    }

    // Already created
    if (recognitionRef.current) {
      listeningRef.current = true;
      setListening(true);

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log("Recognition already running.");
      }

      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    // =========================
    // RECOGNITION START
    // =========================

    recognition.onstart = () => {
      listeningRef.current = true;
      setListening(true);

      console.log("🎤 Speech recognition started");
    };

    // =========================
    // SPEECH RESULT
    // =========================

    recognition.onresult = (event) => {
      const result =
        event.results[event.results.length - 1];

      const transcript =
        result[0].transcript.trim();

      if (!transcript) {
        return;
      }

      // =========================
      // BARGE-IN
      // =========================

      if (speakingRef.current) {
        console.log("🔥 BARGE-IN DETECTED!");

        // Stop AI voice immediately
        window.speechSynthesis.cancel();

        speakingRef.current = false;
        setSpeaking(false);
      }

      // Show speech on screen
      setText(transcript);

      // =========================
      // IMPORTANT:
      // Don't send interim speech
      // =========================

      if (!result.isFinal) {
        return;
      }

      // =========================
      // DUPLICATE PROTECTION
      // =========================

      if (
        transcript === lastTranscriptRef.current
      ) {
        console.log(
          "⛔ Duplicate transcript ignored:",
          transcript
        );

        return;
      }

      lastTranscriptRef.current = transcript;

      console.log(
        "🟢 FINAL TRANSCRIPT:",
        transcript
      );

      console.log(
        "⏱️ Sending to AI at:",
        new Date().toLocaleTimeString()
      );

      askAI(transcript);
    };

    // =========================
    // ERROR
    // =========================

    recognition.onerror = (event) => {
      console.log(
        "Speech recognition error:",
        event.error
      );

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        listeningRef.current = false;
        setListening(false);
      }
    };

    // =========================
    // RECOGNITION END
    // =========================

    recognition.onend = () => {
      console.log("🎤 Speech recognition ended");

      if (listeningRef.current) {
        restartRecognition();
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    listeningRef.current = true;
    setListening(true);

    try {
      recognition.start();
    } catch (error) {
      console.log("Recognition start error:", error);
    }
  };

  // =========================
  // STOP LISTENING
  // =========================

  const stopListening = () => {
    listeningRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    window.speechSynthesis.cancel();

    speakingRef.current = false;
    setSpeaking(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log("Recognition already stopped.");
      }
    }

    setListening(false);

    console.log("⏹ Listening stopped");
  };

  // =========================
  // CLEAR CONVERSATION
  // =========================

  const clearConversation = () => {
    setMessages([]);
    setText("");
    setResponse("");
    setThinking(false);

    lastTranscriptRef.current = "";

    window.speechSynthesis.cancel();

    speakingRef.current = false;
    setSpeaking(false);

    console.log("🗑️ Conversation cleared");
  };

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {
    return () => {
      listeningRef.current = false;

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      window.speechSynthesis.cancel();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log("Recognition cleanup error.");
        }
      }
    };
  }, []);

  // =========================
  // UI
  // =========================

  return (
    <div className="app">
      <div className="container">

        {/* HEADER */}

        <div className="header">
          <div className="logo">🎙️</div>

          <h1>Voice Assistant</h1>

          <p>
            Speak naturally. Interrupt anytime.
          </p>
        </div>

        {/* STATUS CARD */}

        <div className="status-card">

          <div
            className={`orb ${
              thinking
                ? "thinking"
                : speaking
                ? "speaking"
                : listening
                ? "listening"
                : ""
            }`}
          >
            🎙️
          </div>

          <h2>
            {thinking
              ? "Thinking..."
              : speaking
              ? "Speaking..."
              : listening
              ? "Listening..."
              : "Ready"}
          </h2>

          <p className="status-text">
            {thinking
              ? "Getting your answer..."
              : speaking
              ? "Say something to interrupt"
              : listening
              ? "I'm listening to you"
              : "Press the microphone to start"}
          </p>

          {/* BUTTONS */}

          <div className="buttons">

            {!listening ? (
              <button
                className="start-btn"
                onClick={startListening}
              >
                🎤 Start Listening
              </button>
            ) : (
              <button
                className="stop-btn"
                onClick={stopListening}
              >
                ⏹ Stop
              </button>
            )}

            <button
              className="clear-btn"
              onClick={clearConversation}
            >
              🗑️ Clear Conversation
            </button>

          </div>
        </div>

        {/* CONVERSATION */}

        <div className="conversation">

          {messages.length === 0 ? (
            <div className="message assistant-message">

              <div className="message-title">
                🤖 Assistant
              </div>

              <div className="message-text">
                Your conversation will appear here...
              </div>

            </div>
          ) : (
            messages.map((message, index) => (

              <div
                key={index}
                className={`message ${
                  message.role === "user"
                    ? "user-message"
                    : "assistant-message"
                }`}
              >

                <div className="message-title">
                  {message.role === "user"
                    ? "👤 You"
                    : "🤖 Assistant"}
                </div>

                <div className="message-text">
                  {message.text}
                </div>

              </div>

            ))
          )}

        </div>

        {/* FOOTER */}

        <div className="footer">

          <span>⚡ Gemini AI</span>

          <span>•</span>

          <span>🎤 Speech Recognition</span>

          <span>•</span>

          <span>🔊 Text-to-Speech</span>

          <span>•</span>

          <span>⚡ Barge-In</span>

        </div>

      </div>
    </div>
  );
}

export default App;