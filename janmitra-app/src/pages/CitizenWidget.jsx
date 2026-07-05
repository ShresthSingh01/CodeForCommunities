import React, { useState, useEffect, useRef } from 'react';
import { submitCitizenComplaint } from '../api/extractComplaint';

export default function CitizenWidget({ onNavigateToDashboard }) {
  const [language, setLanguage] = useState('hi');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'नमस्ते! जनमित्र AI में आपका स्वागत है। आपकी समस्या क्या है?',
      subtext: 'आप बोलकर या लिखकर अपनी समस्या बता सकते हैं।',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Voice Recognition setup using Browser Web Speech API
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser Speech Recognition not supported in this browser. Please type your message.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    const userMsgText = inputText.trim();
    setInputText('');

    // 1. Add User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userMsgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSubmitting(true);

    // 2. Submit & AI Extract
    const res = await submitCitizenComplaint(userMsgText, language);

    setIsSubmitting(false);

    if (res.success) {
      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `आपकी शिकायत दर्ज कर ली गई है! (केस #${res.complaint.id})`,
        extraction: res.extracted,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botReply]);
    } else {
      const errorReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'क्षमा करें, आपकी शिकायत दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-4 font-body">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md h-screen sm:h-[680px] bg-[#0B141A] text-white flex flex-col shadow-2xl rounded-none sm:rounded-2xl overflow-hidden border border-slate-700">
        
        {/* WhatsApp Top Header */}
        <div className="bg-[#1F2C34] px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-display font-bold text-white text-lg shadow">
              JM
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight text-slate-100">जनमित्र (JanMitra AI)</h2>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ऑनलाइन सहायता
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#2A3942] text-xs text-slate-200 border border-slate-600 rounded px-2 py-1 focus:outline-none"
            >
              <option value="hi">हिंदी</option>
              <option value="en">English</option>
            </select>

            {/* Dashboard Toggle */}
            <button
              onClick={onNavigateToDashboard}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] px-2.5 py-1 rounded shadow transition-colors"
              title="Switch to MP War Room Dashboard"
            >
              MP View ↗
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm shadow ${
                  msg.sender === 'user'
                    ? 'bg-[#005C4B] text-slate-100 rounded-tr-none'
                    : 'bg-[#202C33] text-slate-100 rounded-tl-none border border-slate-700/50'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.subtext && (
                  <p className="text-xs text-slate-400 mt-1">{msg.subtext}</p>
                )}

                {/* Extraction Receipt Badge */}
                {msg.extraction && (
                  <div className="mt-2.5 pt-2 border-t border-slate-600/50 font-mono text-[11px] space-y-1 text-emerald-300">
                    <div className="flex justify-between">
                      <span>प्रकार (Type):</span>
                      <span className="font-bold uppercase">{msg.extraction.issue_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>वार्ड (Ward):</span>
                      <span className="font-bold">{msg.extraction.location?.ward}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>प्राथमिकता:</span>
                      <span className="font-bold uppercase text-amber-400">{msg.extraction.urgency}</span>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block text-right mt-1 font-mono">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* AI Processing Bubble */}
          {isSubmitting && (
            <div className="flex items-start">
              <div className="bg-[#202C33] p-3 rounded-lg rounded-tl-none text-xs text-slate-300 font-mono flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                <span>AI द्वारा विश्लेषण किया जा रहा है... (Extracting Facts)</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Pulse Status Bar */}
        {isRecording && (
          <div className="bg-emerald-900/80 px-4 py-2 border-t border-emerald-600 text-xs font-mono text-emerald-200 flex items-center justify-between animate-pulse">
            <span>🎤 बोलिए, सुन रहे हैं... (Listening...)</span>
            <button
              onClick={() => setIsRecording(false)}
              className="text-white underline text-[10px]"
            >
              रुकें (Stop)
            </button>
          </div>
        )}

        {/* WhatsApp Bottom Input Bar */}
        <form onSubmit={handleSend} className="bg-[#202C33] p-2.5 flex items-center gap-2 border-t border-slate-700/50">
          {/* Voice Record Button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-full transition-colors flex items-center justify-center ${
              isRecording
                ? 'bg-rose-600 text-white animate-bounce ring-2 ring-rose-400'
                : 'bg-[#2A3942] hover:bg-slate-700 text-slate-300'
            }`}
            title="Hold/Click to Speak"
          >
            🎤
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={language === 'hi' ? 'अपनी शिकायत लिखें...' : 'Type your complaint...'}
            className="flex-1 bg-[#2A3942] text-sm text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-full focus:outline-none border border-transparent focus:border-emerald-600"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow transition-colors"
          >
            ➔
          </button>
        </form>
      </div>
    </div>
  );
}
