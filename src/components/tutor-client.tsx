"use client";

import { useState } from "react";
import Link from "next/link";
import type { TutorMode, TutorResponse } from "@/lib/ai/tutor";
import type { QuotaStatus } from "@/lib/quota";
import type { LevelId, StageId } from "@/lib/curriculum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send,
  Lock,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  Headphones,
  MessageSquare,
  CheckSquare,
  ShieldAlert,
  Clock,
} from "lucide-react";

interface TutorClientProps {
  user: {
    name: string;
    plan: "FREE" | "PRO";
    currentStage: StageId;
    currentLevel: string;
  };
  initialQuota: QuotaStatus;
  initialMode?: TutorMode;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  structured?: TutorResponse["structured"];
}

const MODES: {
  id: TutorMode;
  label: string;
  proOnly: boolean;
  icon: React.ReactNode;
  placeholder: string;
}[] = [
  {
    id: "chat",
    label: "Грамматика",
    proOnly: false,
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    placeholder: "Спросите правило или напишите предложение для проверки...",
  },
  {
    id: "quiz",
    label: "Квизы",
    proOnly: false,
    icon: <CheckSquare className="h-3.5 w-3.5" />,
    placeholder: "Напишите тему для мини-теста (например: падежи, -тся/-ться)...",
  },
  {
    id: "speaking",
    label: "Speaking",
    proOnly: true,
    icon: <Mic className="h-3.5 w-3.5" />,
    placeholder: "Начните диалог голосом или текстом (например: В кофейне)...",
  },
  {
    id: "listening",
    label: "Listening",
    proOnly: true,
    icon: <Headphones className="h-3.5 w-3.5" />,
    placeholder: "Укажите тему для аудирования (например: путешествие, работа)...",
  },
  {
    id: "pronunciation",
    label: "Произношение",
    proOnly: true,
    icon: <Volume2 className="h-3.5 w-3.5" />,
    placeholder: "Нажмите микрофон или введите произнесённую фразу...",
  },
  {
    id: "error_analysis",
    label: "Разбор ошибок",
    proOnly: true,
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    placeholder: "Вставьте текст на русском для полного разбора ошибок...",
  },
];

export function TutorClient({
  user,
  initialQuota,
  initialMode = "chat",
}: TutorClientProps) {
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [quota, setQuota] = useState<QuotaStatus>(initialQuota);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [targetPhrase, setTargetPhrase] = useState(
    "Здравствуйте, я изучаю русский язык с удовольствием!"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listeningChoice, setListeningChoice] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const isPro = user.plan === "PRO";
  const currentModeMeta = MODES.find((m) => m.id === mode) ?? MODES[0];
  const isLocked = currentModeMeta.proOnly && !isPro;

  function speakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  function startSpeechRecognition() {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };

    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Ваш браузер не поддерживает распознавание речи. Введите текст вручную.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    setIsRecording(true);
    setError(null);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      setError("Не удалось распознать речь. Проверьте доступ к микрофону.");
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.start();
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading || isLocked) return;

    const userText = input.trim();
    setInput("");
    setError(null);
    setListeningChoice(null);
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          message: userText,
          stage: user.currentStage,
          level: user.currentLevel as LevelId,
          targetPhrase: mode === "pronunciation" ? targetPhrase : undefined,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          elapsedSeconds: 45,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка запроса к AI-репетитору");
        if (data.quota) setQuota(data.quota);
        return;
      }

      if (data.quota) setQuota(data.quota);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          structured: data.structured,
        },
      ]);

      if (mode === "speaking") {
        speakText(data.reply);
      } else if (mode === "listening" && data.structured?.listeningScript) {
        speakText(data.structured.listeningScript);
      }
    } catch {
      setError("Сетевая ошибка при обращении к AI-репетитору");
    } finally {
      setLoading(false);
    }
  }

  const remainingMin =
    quota.remainingSeconds !== null
      ? Math.ceil(quota.remainingSeconds / 60)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl text-[#2E3604]">
            AI-репетитор «Слово»
          </h1>
          <p className="text-xs text-[#8D8179]">
            Модель: <span className="text-[#4E5E07] font-semibold">gemini-3.5-flash-lite</span> · Уровень:{" "}
            <strong className="text-[#2E3604]">{user.currentLevel}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-white border border-[#D8D2CF] text-[#2E3604] py-1.5 px-3">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-[#4E5E07]" />
            {isPro
              ? "Pro · Безлимит"
              : `Осталось: ${remainingMin} мин (сброс в 12:00)`}
          </Badge>
        </div>
      </div>

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as TutorMode)}>
        <TabsList className="flex flex-wrap h-auto gap-1.5 bg-[#EBE7E4] p-1.5">
          {MODES.map((m) => (
            <TabsTrigger
              key={m.id}
              value={m.id}
              className="text-xs data-[state=active]:bg-[#2E3604] data-[state=active]:text-white flex items-center gap-1.5"
            >
              {m.icon}
              <span>{m.label}</span>
              {m.proOnly && !isPro && (
                <Lock className="h-3 w-3 text-[#E19D29]" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Main Workspace */}
      <Card className="border-[#D8D2CF] bg-white">
        <CardHeader className="border-b border-[#D8D2CF]/60 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-sm font-semibold text-[#2E3604] flex items-center gap-2">
              {currentModeMeta.icon}
              Режим: {currentModeMeta.label}
            </CardTitle>
            {currentModeMeta.proOnly && (
              <Badge className="bg-[#E19D29] text-[#2E3604]">PRO</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {isLocked ? (
            <div className="rounded-xl border-2 border-dashed border-[#E19D29] bg-[#F6F4F2] p-8 text-center space-y-4">
              <Lock className="mx-auto h-10 w-10 text-[#E19D29]" />
              <div className="space-y-1">
                <h3 className="font-heading text-3xl text-[#2E3604]">
                  Режим «{currentModeMeta.label}» доступен на тарифе Pro
                </h3>
                <p className="text-xs text-[#8D8179] max-w-md mx-auto">
                  Перейдите на Pro, чтобы тренировать Speaking, Listening,
                  произношение и получать детальный разбор ошибок без ограничений по времени.
                </p>
              </div>
              <Link href="/pricing">
                <Button className="bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90 font-semibold">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Перейти на Pro через Stripe
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {mode === "pronunciation" && (
                <div className="rounded-lg bg-[#F6F4F2] p-3.5 space-y-2 border border-[#D8D2CF]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#2E3604]">
                      Целевая фраза для тренировки:
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => speakText(targetPhrase)}
                      className="text-xs text-[#4E5E07]"
                    >
                      <Volume2 className="mr-1 h-3.5 w-3.5" />
                      Образец
                    </Button>
                  </div>
                  <Input
                    value={targetPhrase}
                    onChange={(e) => setTargetPhrase(e.target.value)}
                    className="bg-white border-[#D8D2CF] text-xs"
                  />
                </div>
              )}

              {/* Messages */}
              <div className="min-h-[260px] max-h-[420px] overflow-y-auto space-y-4 rounded-xl bg-[#F6F4F2] p-4 border border-[#D8D2CF]/60">
                {messages.length === 0 ? (
                  <div className="h-52 flex flex-col items-center justify-center text-center text-xs text-[#8D8179] space-y-2">
                    <Sparkles className="h-6 w-6 text-[#E19D29]" />
                    <p>
                      Начните занятие в режиме «{currentModeMeta.label}».
                      <br />
                      Модель <strong>gemini-3.5-flash-lite</strong> подстроится под ваш уровень {user.currentLevel}.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col gap-2 ${
                        m.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-[#4E5E07] text-white"
                            : "bg-white border border-[#D8D2CF] text-[#2E3604]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="text-[10px] opacity-70 uppercase">
                            {m.role === "user" ? "Вы" : "Слово AI"}
                          </span>
                          {m.role === "assistant" && (
                            <button
                              type="button"
                              onClick={() => speakText(m.text)}
                              className="text-[#4E5E07] hover:opacity-80"
                              title="Озвучить ответ"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {m.text}
                      </div>

                      {/* Structured Listening Quiz */}
                      {m.structured?.listeningScript && (
                        <div className="w-full max-w-[85%] rounded-xl border border-[#D8D2CF] bg-white p-4 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#2E3604]">
                              Аудио-фрагмент
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                speakText(m.structured!.listeningScript!)
                              }
                              className="border-[#4E5E07] text-[#4E5E07]"
                            >
                              <Volume2 className="mr-1.5 h-3.5 w-3.5" />
                              Прослушать
                            </Button>
                          </div>
                          {m.structured.listeningQuestion && (
                            <p className="font-semibold text-[#2E3604]">
                              {m.structured.listeningQuestion}
                            </p>
                          )}
                          <div className="grid gap-2 sm:grid-cols-2">
                            {m.structured.listeningOptions?.map((opt, oIdx) => {
                              const picked = listeningChoice === oIdx;
                              const correct =
                                oIdx === m.structured?.listeningAnswerIndex;
                              return (
                                <Button
                                  key={oIdx}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setListeningChoice(oIdx)}
                                  className={`justify-start text-xs ${
                                    listeningChoice !== null && correct
                                      ? "bg-[#4E5E07]/15 border-[#4E5E07]"
                                      : picked
                                        ? "bg-red-50 border-red-400"
                                        : "border-[#D8D2CF]"
                                  }`}
                                >
                                  {opt}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Structured Pronunciation Feedback */}
                      {m.structured?.pronunciationScore !== undefined && (
                        <div className="w-full max-w-[85%] rounded-xl border border-[#E19D29] bg-white p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#2E3604]">
                              Оценка произношения:
                            </span>
                            <Badge className="bg-[#E19D29] text-[#2E3604]">
                              {m.structured.pronunciationScore} / 100
                            </Badge>
                          </div>
                          {m.structured.stressTips?.map((tip, tIdx) => (
                            <div key={tIdx} className="text-[#8D8179]">
                              • {tip}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Structured Error Breakdown */}
                      {m.structured?.errors && (
                        <div className="w-full max-w-[85%] rounded-xl border border-[#D8D2CF] bg-white p-4 space-y-3 text-xs">
                          {m.structured.correctedText && (
                            <div className="rounded-lg bg-[#4E5E07]/10 p-3">
                              <div className="text-[11px] font-semibold text-[#4E5E07] mb-1">
                                Исправленный вариант:
                              </div>
                              <div className="text-[#2E3604]">
                                {m.structured.correctedText}
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            {m.structured.errors.map((err, eIdx) => (
                              <div
                                key={eIdx}
                                className="rounded-lg border border-[#D8D2CF]/70 p-2.5 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-red-700 line-through">
                                    {err.fragment}
                                  </span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {err.type}
                                  </Badge>
                                </div>
                                <div className="font-semibold text-[#4E5E07]">
                                  → {err.correction}
                                </div>
                                <div className="text-[#8D8179]">{err.rule}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSend} className="space-y-3">
                <Textarea
                  rows={3}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentModeMeta.placeholder}
                  className="border-[#D8D2CF] bg-white text-xs"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {(mode === "speaking" || mode === "pronunciation") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startSpeechRecognition}
                        disabled={isRecording}
                        className="border-[#4E5E07] text-[#4E5E07]"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                            Слушаю...
                          </>
                        ) : (
                          <>
                            <Mic className="mr-1.5 h-3.5 w-3.5" />
                            Голосовой ввод
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !input.trim() || quota.isExhausted}
                    className="bg-[#4E5E07] text-white hover:bg-[#2E3604]"
                  >
                    <Send className="mr-2 h-3.5 w-3.5" />
                    {loading ? "Думаю..." : "Отправить"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
