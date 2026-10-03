"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Mic, MicOff, Volume2, VolumeX, Loader2, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { stylistApi, voiceApi } from "@/lib/api";

type Message = {
  role: "user" | "ai";
  text: string;
  image?: string | null;
  canGenerateImage?: boolean;
  imageLoading?: boolean;
};

const PENDING_MESSAGE_KEY = "fitsense_pending_stylist_message";

const OCCASION_KEYWORDS: Array<[string, string]> = [
  ["wedding", "Wedding"],
  ["formal", "Formal"],
  ["dinner", "Formal"],
  ["date", "Date"],
  ["party", "Party"],
  ["interview", "Work"],
  ["work", "Work"],
  ["office", "Work"],
  ["college", "College"],
  ["school", "College"],
  ["travel", "Travel"],
  ["trip", "Travel"],
  ["event", "Event"],
  ["gym", "Sporty"],
  ["workout", "Sporty"],
];
function guessOccasion(text: string): string | null {
  const t = text.toLowerCase();
  const hit = OCCASION_KEYWORDS.find(([k]) => t.includes(k));
  return hit ? hit[1] : null;
}

export default function StylistPage() {
  const [input, setInput] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Good evening. I'm FitSense, your personal stylist. What's the occasion we're dressing for today?" }
  ]);

  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lastOccasionRef = useRef("Casual");

  const speak = async (text: string) => {
    if (muted) return;
    try {
      const blob = await voiceApi.synthesize(text);
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
      }
    } catch {
      // Speech is a bonus on top of the text reply — fail silently.
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const detectedOccasion = guessOccasion(text);
    if (detectedOccasion) lastOccasionRef.current = detectedOccasion;

    setMessages(prev => [...prev, { role: "user", text }]);
    setIsLoading(true);

    try {
      const reply = await stylistApi.chat(text);
      setMessages(prev => [...prev, { role: "ai", text: reply, canGenerateImage: true }]);
      speak(reply);
    } catch (error) {
      const text = "I'm sorry, I'm having trouble connecting to the styling server right now.";
      setMessages(prev => [...prev, { role: "ai", text }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generates the image straight from THIS message's own text, so what you
  // see actually matches what you just read, instead of a separately
  // wardrobe-generated outfit that might not match at all.
  const generateImageForMessage = async (index: number) => {
    const description = messages[index]?.text;
    if (!description) return;
    setMessages(prev => prev.map((m, i) => (i === index ? { ...m, imageLoading: true } : m)));
    try {
      const res = await stylistApi.visualize(description);
      setMessages(prev =>
        prev.map((m, i) =>
          i === index ? { ...m, image: res.outfit_image, imageLoading: false, canGenerateImage: false } : m
        )
      );
    } catch {
      setMessages(prev => prev.map((m, i) => (i === index ? { ...m, imageLoading: false } : m)));
    }
  };

  useEffect(() => {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem(PENDING_MESSAGE_KEY) : null;
    if (pending) {
      sessionStorage.removeItem(PENDING_MESSAGE_KEY);
      const timer = setTimeout(() => sendMessage(pending), 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input;
    setInput("");
    await sendMessage(userMessage);
  };

  const handleRecommend = async () => {
    if (isLoading) return;
    const askText = city
      ? `Can you recommend an outfit for the weather in ${city}?`
      : "Can you recommend an outfit?";
    setMessages(prev => [...prev, { role: "user", text: askText }]);
    setIsLoading(true);
    try {
      const res = await stylistApi.recommend(22, lastOccasionRef.current, "Minimalist", city);
      const weatherLine = res.weather
        ? `Currently ${Math.round(res.weather.temp_c)}°C and ${res.weather.description} in ${res.weather.city}.\n\n`
        : "";
      const text = `${weatherLine}I recommend: ${res.outfit.join(" and ")}.\n\nWhy? ${res.explainability_log.join(" ")}`;
      setMessages(prev => [...prev, { role: "ai", text, image: res.outfit_image }]);
      speak(text);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "I couldn't fetch a recommendation." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.start();
      setRecording(true);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Microphone access was denied. Please allow it in your browser settings." }]);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    setRecording(false);
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setIsLoading(true);
      try {
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        const { text } = await voiceApi.transcribe(file);
        setIsLoading(false);
        await sendMessage(text);
      } catch {
        setIsLoading(false);
        setMessages(prev => [...prev, { role: "ai", text: "I had trouble understanding that. Please try again." }]);
      }
    };
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-2">AI Stylist</h1>
          <p className="text-foreground/60">Type, or tap the mic and talk — I&apos;ll suggest outfits, combinations, and styling tips, and read my answers back to you.</p>
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          className="p-2.5 rounded-xl border border-border text-foreground/60 hover:text-foreground hover:bg-[#595800]/5 transition-colors shrink-0"
          title={muted ? "Unmute replies" : "Mute replies"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`rounded-2xl p-4 ${
                msg.role === "user" 
                  ? "max-w-[70%] bg-primary text-primary-foreground rounded-tr-sm" 
                  : `bg-surface border border-border rounded-tl-sm text-foreground ${
                      msg.image || msg.canGenerateImage ? "max-w-[85%] md:max-w-[520px]" : "max-w-[70%]"
                    }`
              }`}>
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">FitSense</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Outfit visualization"
                    className="mt-3 rounded-xl w-full max-h-[480px] object-cover border border-white/10"
                  />
                )}
                {msg.role === "ai" && msg.canGenerateImage && !msg.image && (
                  <button
                    onClick={() => generateImageForMessage(i)}
                    disabled={msg.imageLoading}
                    className="mt-3 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-border text-primary hover:bg-[#595800]/5 transition-colors disabled:opacity-60"
                  >
                    {msg.imageLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="w-3.5 h-3.5" />
                    )}
                    {msg.imageLoading ? "Generating..." : "Generate Image"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
             <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex justify-start"
           >
             <div className="bg-surface border border-border rounded-2xl rounded-tl-sm p-4 text-primary">
               <Loader2 className="w-5 h-5 animate-spin" />
             </div>
           </motion.div>
          )}
        </div>

        <div className="p-4 bg-surface border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City for live weather (optional)"
              className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground/80 focus:outline-none focus:border-primary/50 transition-colors w-56"
            />
            <span className="text-xs text-foreground/40">
              Used for outfit suggestions and the recommend button
            </span>
          </div>
          <div className="flex items-end gap-2 bg-background border border-border rounded-2xl p-2 focus-within:border-primary/50 transition-colors">
            <button 
              onClick={handleRecommend}
              disabled={isLoading}
              className="p-3 text-primary hover:text-primary/80 transition-colors rounded-xl hover:bg-[#595800]/5 shrink-0"
              title="Get Outfit Recommendation"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`relative p-3 rounded-xl transition-colors shrink-0 ${
                recording
                  ? "bg-red-500 text-white"
                  : "text-foreground/40 hover:text-foreground hover:bg-[#595800]/5"
              }`}
              title={recording ? "Stop recording" : "Speak instead"}
            >
              {recording && (
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl bg-red-500/30"
                />
              )}
              {recording ? <MicOff className="w-5 h-5 relative" /> : <Mic className="w-5 h-5 relative" />}
            </button>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || recording}
              placeholder={recording ? "Listening…" : "Ask about outfits, style advice, or upload an inspiration photo..."}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-3 text-sm min-h-[44px] max-h-32 disabled:opacity-50"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}