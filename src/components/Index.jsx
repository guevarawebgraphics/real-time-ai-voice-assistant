// src/components/IndexPage.jsx
import React, { useState, useRef, useEffect } from 'react';

function IndexPage({ page = 'Guest', contentSelector = 'body' }) {
  // State values
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [typingReply, setTypingReply] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [userTranscript, setUserTranscript] = useState('');

  // Refs for storing mutable objects (WebRTC, Speech Recognition, etc.)
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const transcriptContainerRef = useRef(null);

  // Helper function to get page content by selector (used for context)
  const getPageContent = () => {
    const element = document.querySelector(contentSelector);
    return element ? element.innerText : '';
  };

  // Scroll transcript container to bottom
  const scrollToBottom = () => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
  };

  // Animate typing text (live transcript effect)
  const animateText = (fullText) => {
    setTypingReply('');
    let charIndex = 0;
    const intervalSpeed = 50; // in milliseconds
    const interval = setInterval(() => {
      if (charIndex < fullText.length) {
        setTypingReply((prev) => prev + fullText[charIndex]);
        charIndex++;
        scrollToBottom();
      } else {
        clearInterval(interval);
        // Once done, add the finalized text to chatHistory
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: fullText },
        ]);
        setTypingReply('');
      }
    }, intervalSpeed);
  };

  // Configure data channel
  const configureData = () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      const pageContent = getPageContent();
      const event = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          voice: 'ash',
          // Add your instructions if needed.
        },
      };
      dataChannelRef.current.send(JSON.stringify(event));
      console.log('Sent session.update:', event);
    }
  };

  // Function to start recording and establish WebRTC & SpeechRecognition
  const startRecording = async () => {
    setRecording(true);

    // Initialize Speech Recognition if available
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            if (transcript.length > 0) {
              setUserTranscript(transcript);
              setChatHistory((prev) => [
                ...prev,
                { role: 'user', content: transcript },
              ]);
              scrollToBottom();
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (recording) {
          recognition.start();
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    }

    // Reset speaking and transcript state
    setSpeaking(false);
    setChatHistory([]);
    setTypingReply('');

    try {
      // 1. Create a new RTCPeerConnection with a STUN server.
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnectionRef.current = peerConnection;

      // 2. Handle inbound audio tracks.
      peerConnection.ontrack = (event) => {
        let remoteAudio = document.getElementById('remoteAudio');
        if (!remoteAudio) {
          remoteAudio = document.createElement('audio');
          remoteAudio.id = 'remoteAudio';
          remoteAudio.autoplay = true;
          remoteAudio.controls = true;
          remoteAudio.style.display = 'none';
          document.body.appendChild(remoteAudio);
        }
        remoteAudio.srcObject = event.streams[0];
      };

      // 3. Create a data channel for signaling.
      const dataChannel = peerConnection.createDataChannel('ai-signaling');
      dataChannelRef.current = dataChannel;
      dataChannel.addEventListener('open', () => {
        console.log('Data channel open');
        configureData();
      });
      dataChannel.addEventListener('message', (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch (error) {
          console.error('Unable to parse message data:', ev.data);
          return;
        }
        console.log('Received message:', msg);

        // Live transcription while AI is speaking
        if (msg.type === 'response.audio_transcript.delta' && msg.delta) {
          setTypingReply((prev) => prev + msg.delta);
          scrollToBottom();
        }

        // When AI is done speaking, add final transcript
        if (msg.type === 'response.audio_transcript.done' && msg.transcript) {
          setChatHistory((prev) => [
            ...prev,
            { role: 'assistant', content: msg.transcript },
          ]);
          setTypingReply('');
        }

        // Final user transcript from AI response
        if (
          msg.type === 'response.item.done' &&
          msg.item?.role === 'user' &&
          msg.item?.content?.[0]?.text
        ) {
          const userText = msg.item.content[0].text;
          setChatHistory((prev) => [
            ...prev,
            { role: 'user', content: userText },
          ]);
          scrollToBottom();
        }
      });

      // 4. Capture microphone audio.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // 5. Create an SDP offer.
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // 6. Send the SDP offer to the OpenAI Realtime endpoint.
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });
      const answerSdp = await sdpResponse.text();
      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });
    } catch (error) {
      console.error('Error establishing WebRTC connection:', error);
    }
  };

  // Function to stop recording
  const stopRecording = async () => {
    setRecording(false);
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    setSpeaking(true);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  // Cleanup on unmount (stop recording if still active)
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return (
    <div className="mt-20 mb-20">
      <div className="max-w-lg mx-auto p-6 text-center">
        {/* Dynamic Conversation State Heading */}
        <div className="text-gray-800 mb-4 text-center">
          {recording ? (
            <>
              <h2 className="text-4xl font-semibold leading-tight">Listening...</h2>
              <p className="text-4xl text-gray-500 mt-1">Speak now</p>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-semibold leading-tight">Talk to Pabs</h2>
              <p className="text-2xl text-gray-500 mt-1">
                Press the button to start talking
              </p>
            </>
          )}
        </div>

        {/* Scrollable Transcript Log */}
        <div
          ref={transcriptContainerRef}
          className="w-full max-w-2xl h-80 overflow-y-auto px-4 py-2 mb-6 text-center space-y-2"
        >
          {chatHistory.map((msg, index) => {
            const baseClasses =
              'leading-snug transition-all duration-300 cursor-default';
            const roleClasses =
              msg.role === 'user' ? 'text-[#232850FF]' : 'text-blue-300';
            let dynamicClasses = 'text-lg opacity-40';
            if (
              hoveredIndex === index ||
              (index === chatHistory.length - 1 && hoveredIndex === null)
            ) {
              dynamicClasses = 'text-base font-semibold opacity-100';
            }
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`${baseClasses} ${dynamicClasses} ${roleClasses}`}
              >
                <span className="mr-2">
                  {msg.role === 'user' ? 'You:' : 'DAX:'}
                </span>
                <span className="text-[#333]">{msg.content}</span>
              </div>
            );
          })}

          {/* Typing (live transcript) effect */}
          {typingReply && (
            <div className="leading-snug text-base font-semibold text-blue-300">
              <span className="mr-2">Pabs:</span>
              <span className="text-[#333]">{typingReply}</span>
            </div>
          )}
        </div>

        <div className="relative">
          {/* Toggle Recording Button */}
          <button
            onClick={() => (recording ? stopRecording() : startRecording())}
            className={`absolute left-1/2 transform -translate-x-1/2 -translate-y-full w-20 h-20 rounded-full shadow-lg flex items-center justify-center text-white text-3xl transition ${
              recording ? 'bg-red-500 pulse-active' : 'bg-blue-500 hover:scale-110'
            }`}
          >
            <i className={recording ? 'fas fa-stop' : 'fas fa-microphone'}></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default IndexPage;
