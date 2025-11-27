"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, Square, Sparkles } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";
import Link from "next/link";

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = 'chat-messages';

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = (): { messages: UIMessage[]; durations: Record<string, number> } => {
  if (typeof window === 'undefined') return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (messages: UIMessage[], durations: Record<string, number>) => {
  if (typeof window === 'undefined') return;
  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

  const stored = typeof window !== 'undefined' ? loadMessagesFromStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
  }, []);

  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages, durations);
    }
  }, [durations, messages, isClient]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prevDurations) => {
      const newDurations = { ...prevDurations };
      newDurations[key] = duration;
      return newDurations;
    });
  };

  useEffect(() => {
    if (isClient && initialMessages.length === 0 && !welcomeMessageShownRef.current) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: WELCOME_MESSAGE,
          },
        ],
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  function clearChat() {
    const newMessages: UIMessage[] = [];
    const newDurations = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  const showEmptyState = isClient && messages.length === 0;

  return (
    <>
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      
      <div className="flex h-screen items-center justify-center font-sans relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-purple-950 dark:via-slate-900 dark:to-blue-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <main className="w-full h-screen relative z-10">
          {/* Header with Glass Effect */}
          <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-white/20 dark:border-white/10">
            <div className="relative">
              <ChatHeader>
                <ChatHeaderBlock />
                <ChatHeaderBlock className="justify-center items-center gap-3">
                  <div className="size-14 rounded-full bg-white dark:bg-gray-800 ring-2 ring-purple-400 dark:ring-purple-600 shadow-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C10.5 2 9 2.5 8 3.5C7 4.5 6.5 6 6.5 7.5V9H5C4 9 3 10 3 11V13C3 14 4 15 5 15H6.5V16.5C6.5 18 7 19.5 8 20.5C9 21.5 10.5 22 12 22C13.5 22 15 21.5 16 20.5C17 19.5 17.5 18 17.5 16.5V15H19C20 15 21 14 21 13V11C21 10 20 9 19 9H17.5V7.5C17.5 6 17 4.5 16 3.5C15 2.5 13.5 2 12 2M8.5 7.5C8.5 6.5 8.8 5.5 9.5 4.8C10.2 4.1 11.1 3.8 12 3.8C12.9 3.8 13.8 4.1 14.5 4.8C15.2 5.5 15.5 6.5 15.5 7.5V9H8.5V7.5M9.5 12C10.3 12 11 12.7 11 13.5C11 14.3 10.3 15 9.5 15C8.7 15 8 14.3 8 13.5C8 12.7 8.7 12 9.5 12M14.5 12C15.3 12 16 12.7 16 13.5C16 14.3 15.3 15 14.5 15C13.7 15 13 14.3 13 13.5C13 12.7 13.7 12 14.5 12M9 17H15V18H9V17Z" />
                    </svg>
                  </div>
                  <p className="tracking-tight font-semibold text-gray-800 dark:text-white text-xl">
                    Chat with {AI_NAME}
                  </p>
                </ChatHeaderBlock>
                <ChatHeaderBlock className="justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/80 border-white/40 dark:border-white/20"
                    onClick={clearChat}
                  >
                    <Plus className="size-4" />
                    {CLEAR_CHAT_TEXT}
                  </Button>
                </ChatHeaderBlock>
              </ChatHeader>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="h-screen overflow-y-auto px-5 py-4 w-full pt-[88px] pb-[180px]">
            <div className="flex flex-col items-center justify-end min-h-full">
              {showEmptyState ? (
                <div className="flex flex-col items-center justify-center max-w-2xl w-full text-center space-y-8 mb-20">
                  {/* Large Avatar/Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-700 dark:to-pink-700 rounded-full p-8 shadow-2xl">
                      <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C10.5 2 9 2.5 8 3.5C7 4.5 6.5 6 6.5 7.5V9H5C4 9 3 10 3 11V13C3 14 4 15 5 15H6.5V16.5C6.5 18 7 19.5 8 20.5C9 21.5 10.5 22 12 22C13.5 22 15 21.5 16 20.5C17 19.5 17.5 18 17.5 16.5V15H19C20 15 21 14 21 13V11C21 10 20 9 19 9H17.5V7.5C17.5 6 17 4.5 16 3.5C15 2.5 13.5 2 12 2M8.5 7.5C8.5 6.5 8.8 5.5 9.5 4.8C10.2 4.1 11.1 3.8 12 3.8C12.9 3.8 13.8 4.1 14.5 4.8C15.2 5.5 15.5 6.5 15.5 7.5V9H8.5V7.5M9.5 12C10.3 12 11 12.7 11 13.5C11 14.3 10.3 15 9.5 15C8.7 15 8 14.3 8 13.5C8 12.7 8.7 12 9.5 12M14.5 12C15.3 12 16 12.7 16 13.5C16 14.3 15.3 15 14.5 15C13.7 15 13 14.3 13 13.5C13 12.7 13.7 12 14.5 12M9 17H15V18H9V17Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Welcome Text */}
                  <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">
                      Your AI Sidekick.
                      <br />
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        Always On. Always Smart.
                      </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                      Ask me anything. I'm here to help you with information, ideas, and conversations.
                    </p>
                  </div>

                  {/* Case Frameworks Interactive Cards */}
                  <div className="w-full max-w-4xl mt-8">
                    <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                      Choose Your Case Framework
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Profitability */}
                      <div className="group bg-gradient-to-br from-emerald-400/20 to-teal-500/20 dark:from-emerald-600/30 dark:to-teal-700/30 backdrop-blur-md rounded-2xl p-6 border border-emerald-300/40 dark:border-emerald-600/40 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 hover:scale-105">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform shadow-lg">
                          <span className="text-2xl">💰</span>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Profitability</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Analyze costs, revenues, and profit drivers</p>
                      </div>
                      
                      {/* Market Entry */}
                      <div className="group bg-gradient-to-br from-blue-400/20 to-indigo-500/20 dark:from-blue-600/30 dark:to-indigo-700/30 backdrop-blur-md rounded-2xl p-6 border border-blue-300/40 dark:border-blue-600/40 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 hover:scale-105">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform shadow-lg">
                          <span className="text-2xl">🚪</span>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Market Entry</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Evaluate new market opportunities</p>
                      </div>
                      
                      {/* Market Sizing */}
                      <div className="group bg-gradient-to-br from-purple-400/20 to-pink-500/20 dark:from-purple-600/30 dark:to-pink-700/30 backdrop-blur-md rounded-2xl p-6 border border-purple-300/40 dark:border-purple-600/40 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 hover:scale-105">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform shadow-lg">
                          <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Market Sizing</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Calculate total addressable market</p>
                      </div>
                      
                      {/* Growth */}
                      <div className="group bg-gradient-to-br from-orange-400/20 to-red-500/20 dark:from-orange-600/30 dark:to-red-700/30 backdrop-blur-md rounded-2xl p-6 border border-orange-300/40 dark:border-orange-600/40 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 hover:scale-105">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform shadow-lg">
                          <span className="text-2xl">📈</span>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Growth</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Explore expansion strategies</p>
                      </div>
                      
                      {/* Go-To-Market */}
                      <div className="group bg-gradient-to-br from-cyan-400/20 to-blue-500/20 dark:from-cyan-600/30 dark:to-blue-700/30 backdrop-blur-md rounded-2xl p-6 border border-cyan-300/40 dark:border-cyan-600/40 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 hover:scale-105">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform shadow-lg">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Go-To-Market</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Design launch and distribution strategies</p>
                      </div>
                      
                      {/* Custom Framework */}
                      <div className="group bg-gradient-to-br from-violet-400/20 to-fuchsia-500/20 dark:from-violet-600/30 dark:to-fuchsia-700/30 backdrop-blur-md rounded-2xl p-6 border border-violet-300/40 dark:border-violet-600/40 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 hover:scale-105">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform shadow-lg">
                          <span className="text-2xl">✨</span>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Custom Case</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Build your own framework approach</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isClient ? (
                <>
                  <MessageWall messages={messages} status={status} durations={durations} onDurationChange={handleDurationChange} />
                  {status === "submitted" && (
                    <div className="flex justify-start max-w-3xl w-full">
                      <Loader2 className="size-4 animate-spin text-purple-500" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center max-w-2xl w-full">
                  <Loader2 className="size-4 animate-spin text-purple-500" />
                </div>
              )}
            </div>
          </div>

          {/* Input Area with Glass Effect */}
          <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-t border-white/20 dark:border-white/10">
            <div className="w-full px-5 pt-5 pb-1 items-center flex justify-center relative">
              <div className="max-w-3xl w-full">
                <div>
                  <FieldGroup>
                    <Controller
                      name="message"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="chat-form-message" className="sr-only">
                            Message
                          </FieldLabel>
                          <div className="relative h-13">
                            <Input
                              {...field}
                              id="chat-form-message"
                              className="h-15 pr-15 pl-5 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-[20px] border-white/40 dark:border-white/20 shadow-lg focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600"
                              placeholder="Type your message here..."
                              disabled={status === "streaming"}
                              aria-invalid={fieldState.invalid}
                              autoComplete="off"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  form.handleSubmit(onSubmit)();
                                }
                              }}
                            />
                            {(status == "ready" || status == "error") && (
                              <Button
                                className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                                type="button"
                                disabled={!field.value.trim()}
                                size="icon"
                                onClick={() => form.handleSubmit(onSubmit)()}
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                            )}
                            {(status == "streaming" || status == "submitted") && (
                              <Button
                                className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                size="icon"
                                onClick={() => {
                                  stop();
                                }}
                              >
                                <Square className="size-4" />
                              </Button>
                            )}
                          </div>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>
              </div>
            </div>
            <div className="w-full px-5 py-3 items-center flex justify-center text-xs text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} {OWNER_NAME}&nbsp;
              <Link href="/terms" className="underline hover:text-purple-600 dark:hover:text-purple-400">
                Terms of Use
              </Link>
              &nbsp;Powered by&nbsp;
              <Link href="https://ringel.ai/" className="underline hover:text-purple-600 dark:hover:text-purple-400">
                Ringel.AI
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
