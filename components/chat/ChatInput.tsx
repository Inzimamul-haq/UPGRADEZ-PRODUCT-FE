"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Square, Loader2, Settings2 } from "lucide-react";
import { ChatInputProps } from "@/lib/types";
import api from "@/lib/api";

type MicState = "idle" | "recording" | "processing" | "error";

export function ChatInput({
  onSend,
  disabled,
  onDisabledClick,
  showNewGenerationButton,
  onNewGenerationClick,
}: ChatInputProps & { 
  onDisabledClick?: () => void;
  showNewGenerationButton?: boolean;
  onNewGenerationClick?: () => void;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [micState, setMicState] = useState<MicState>("idle");
  const [micError, setMicError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartRef = useRef<number>(0);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }

      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;

    onSend(input);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "32px";
    }
  };

  const handleVoiceError = (msg: string, isRateLimit = false) => {
    setMicState("error");

    if (isRateLimit) {
      setCooldownSeconds(60);
      setMicError("Transcription limit reached. Wait 60s.");

      cooldownTimerRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) {
              clearInterval(cooldownTimerRef.current);
            }

            setMicState("idle");
            setMicError("");

            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      setMicError(msg);

      setTimeout(() => {
        setMicState("idle");
        setMicError("");
      }, 4000);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      const mimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, {
        mimeType,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const elapsed = Date.now() - recordingStartRef.current;

        if (elapsed < 500) {
          setMicState("idle");
          return;
        }

        setMicState("processing");

        const blob = new Blob(chunks, {
          type: mimeType,
        });

        const formData = new FormData();

        formData.append(
          "audio",
          blob,
          `audio-${Date.now()}.${
            mimeType.includes("webm") ? "webm" : "mp4"
          }`
        );

        try {
          const res = await api.post(
            "/api/chats/voice/transcribe",
            formData
          );

          if (res.data?.success && res.data?.text) {
            setInput((prev) =>
              prev
                ? `${prev} ${res.data.text}`
                : res.data.text
            );

            textareaRef.current?.focus();
          }

          setMicState("idle");
        } catch (err: any) {
          if (err.response?.status === 429) {
            handleVoiceError("", true);
          } else {
            handleVoiceError(
              "Transcription failed. Please try again."
            );
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();

      recorder.start(250);

      setMicState("recording");

      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 60000);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        handleVoiceError(
          "Mic blocked. Go to browser Settings → Site Permissions to allow access."
        );
      } else {
        handleVoiceError("Could not start microphone.");
      }
    }
  };

  const handleMicClick = () => {
    if (disabled || cooldownSeconds > 0) return;

    if (micState === "idle" || micState === "error") {
      startRecording();
    } else if (micState === "recording") {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const renderMicIcon = () => {
    if (cooldownSeconds > 0) {
      return (
        <div className="flex items-center justify-center gap-1 text-orange-500 text-[11px] font-medium min-w-[36px]">
          ~{cooldownSeconds}s
        </div>
      );
    }

    switch (micState) {
      case "recording":
        return (
          <div className="relative flex items-center justify-center w-full h-full text-red-500">
            <Square size={14} className="fill-current" />
            <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75" />
          </div>
        );

      case "processing":
        return (
          <Loader2
            size={17}
            className="animate-spin text-[#8C8C8A]"
          />
        );

      case "error":
        return (
          <Mic
            size={17}
            className="text-orange-500"
          />
        );

      default:
        return <Mic size={17} />;
    }
  };

  return (
    <div
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-40
        bg-[#1C1C1B]
        pb-[14px]
        sm:absolute
        sm:bottom-0
        sm:left-0
        sm:right-0
        sm:z-20
        sm:pb-4
      "
    >
      <div className="max-w-3xl mx-auto px-2 sm:px-4 w-full flex flex-col items-center">
        <div
          className="
            relative
            flex
            items-end
            gap-1
            sm:gap-2
            bg-[#2C2C2A]
            border
            border-[#3A3A38]
            rounded-xl
            px-2
            py-1
            sm:px-4
            sm:py-2
            focus-within:border-[#4A4A48]
            focus-within:shadow-sm
            transition-all
            w-full
          "
        >
          {disabled && onDisabledClick && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation();
                onDisabledClick();
              }}
            />
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={
              disabled || micState === "processing"
            }
            placeholder="Ask a question or name a topic..."
            className="
              flex-1
              bg-transparent
              text-[14px]
              text-[#ECECEA]
              placeholder:text-[#5A5A58]
              focus:outline-none
              disabled:opacity-40
              disabled:cursor-not-allowed
              py-0.5
              sm:py-1.5
              resize-none
              max-h-[120px]
              overflow-y-auto
            "
            style={{
              minHeight: "32px",
            }}
          />

          <div className="flex items-center gap-0.5 sm:gap-1 pb-[1px]">
            {showNewGenerationButton && onNewGenerationClick && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onNewGenerationClick();
                }}
                className={`
                  flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  rounded-lg
                  transition-colors
                  hover:bg-[#3A3A38]
                  text-[#8C8C8A]
                  hover:text-[#ECECEA]
                `}
                title="Context Setup / New Generation"
              >
                <Settings2 size={16} />
              </button>
            )}

            <button
              className={`
                flex
                items-center
                justify-center
                w-8
                h-8
                rounded-lg
                transition-colors
                ${
                  micState === "recording"
                    ? "bg-red-500/10"
                    : ""
                }
                ${
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-[#3A3A38]"
                }
              `}
              onClick={handleMicClick}
              disabled={
                disabled || micState === "processing"
              }
              title="Voice input"
            >
              {renderMicIcon()}
            </button>

            <button
              onClick={handleSend}
              disabled={
                disabled ||
                !input.trim() ||
                micState === "processing"
              }
              className="
                w-8
                h-8
                flex
                items-center
                justify-center
                bg-orange-500
                text-white
                rounded-lg
                hover:bg-orange-400
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition-colors
              "
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>

        {micState === "error" && micError && (
          <p className="text-[12px] text-orange-500 mt-2 text-center">
            {micError}
          </p>
        )}
      </div>
    </div>
  );
}