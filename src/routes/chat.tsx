import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Send, Paperclip, Smile, Eye, Phone, Video, Search, CheckCheck, Check,
  MoreVertical, ShieldAlert, Circle, UserPlus, Image, FileText, X
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { StudentSidebar, RecruiterSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyProfile, fetchMyRecruiter } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Live Messaging — HireNexa" },
      { name: "description", content: "Instant direct message threads between student candidates and company talent recruiters." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student", "recruiter"]}>
      <ChatPage />
    </AuthGate>
  ),
});

interface ChatChannel {
  id: string;
  name: string;
  avatarInitials: string;
  tagline: string;
  online: boolean;
  unreadCount: number;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: string;
  read: boolean;
  attachment?: { type: "image" | "file"; name: string; size: string };
}

const INITIAL_STUDENT_CHANNELS: ChatChannel[] = [
  {
    id: "1",
    name: "Hiren Patel (Google Tech Lead)",
    avatarInitials: "HP",
    tagline: "Software Engineer Lead",
    online: true,
    unreadCount: 2,
    messages: [
      { id: "m1", sender: "them", text: "Hello Ashwin! We reviewed your profile and liked your CGPA score.", timestamp: "10:30 AM", read: true },
      { id: "m2", sender: "me", text: "Thank you Hiren! I am excited about the opportunity.", timestamp: "10:32 AM", read: true },
      { id: "m3", sender: "them", text: "Are you comfortable with React, TypeScript and Node.js backend integrations?", timestamp: "10:35 AM", read: false },
      { id: "m4", sender: "them", text: "Let me know when we can connect for a quick screening video interview.", timestamp: "10:36 AM", read: false }
    ]
  },
  {
    id: "2",
    name: "Sarah Jenkins (Microsoft Talent)",
    avatarInitials: "SJ",
    tagline: "Technical Recruiter",
    online: false,
    unreadCount: 0,
    messages: [
      { id: "m5", sender: "them", text: "Hi Ashwin, your application for Frontend Dev has been shortlisted.", timestamp: "Yesterday", read: true },
      { id: "m6", sender: "me", text: "Awesome! I am available on weekdays for interviews.", timestamp: "Yesterday", read: true }
    ]
  }
];

const INITIAL_RECRUITER_CHANNELS: ChatChannel[] = [
  {
    id: "1",
    name: "Ashwin Kumar (Student Candidate)",
    avatarInitials: "AK",
    tagline: "B.Tech CSE Student · 8.5 CGPA",
    online: true,
    unreadCount: 0,
    messages: [
      { id: "r1", sender: "me", text: "Hi Ashwin, we saw your resume in the placement drive. Are you free to talk today?", timestamp: "11:00 AM", read: true },
      { id: "r2", sender: "them", text: "Yes sir! I am free anytime after 2:00 PM.", timestamp: "11:05 AM", read: true }
    ]
  }
];

function ChatPage() {
  const { user, role } = useAuth();
  const uid = user?.id || "";

  const studQ = useAsync(() => (uid && role === "student" ? fetchMyProfile(uid) : Promise.resolve({ profile: null, student: null })), [uid, role]);
  const recQ = useAsync(() => (uid && role === "recruiter" ? fetchMyRecruiter(uid) : Promise.resolve({ profile: null, recruiter: null })), [uid, role]);

  const [channels, setChannels] = useState<ChatChannel[]>(
    role === "recruiter" ? INITIAL_RECRUITER_CHANNELS : INITIAL_STUDENT_CHANNELS
  );
  const [activeChannelId, setActiveChannelId] = useState("1");
  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  useEffect(() => {
    // Reset unread count when opening channel
    setChannels((prev) =>
      prev.map((c) => (c.id === activeChannelId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannel?.messages, typing]);

  const name =
    role === "recruiter"
      ? recQ.data?.recruiter?.company_name || recQ.data?.profile?.name || "Recruiter"
      : studQ.data?.profile?.name || "Student";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleSend = () => {
    if (!inputText.trim() && !attachment) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: "me",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      attachment: attachment || undefined
    };

    setChannels((prev) =>
      prev.map((c) =>
        c.id === activeChannelId
          ? { ...c, messages: [...c.messages, newMessage] }
          : c
      )
    );

    setInputText("");
    setAttachment(null);

    // Simulate double-check read receipts
    setTimeout(() => {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === activeChannelId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newMessage.id ? { ...m, read: true } : m
                )
              }
            : c
        )
      );
    }, 1500);

    // Simulate auto-reply from candidate or recruiter
    setTimeout(() => {
      setTyping(true);
    }, 2500);

    setTimeout(() => {
      setTyping(false);
      const replyMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: "them",
        text: role === "recruiter"
          ? "Thank you for the update! I look forward to the session details."
          : "That sounds excellent. I've updated my calendar invite for our chat.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setChannels((prev) =>
        prev.map((c) =>
          c.id === activeChannelId
            ? { ...c, messages: [...c.messages, replyMessage] }
            : c
        )
      );
    }, 4500);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const triggerAttachment = (type: "image" | "file") => {
    setAttachment({
      type,
      name: type === "image" ? "Screenshot_Design.png" : "Candidate_Placement_Records.xlsx",
      size: type === "image" ? "1.2 MB" : "340 KB"
    });
  };

  const sidebar = role === "recruiter" ? <RecruiterSidebar /> : <StudentSidebar />;

  return (
    <AppShell sidebar={sidebar} user={{ name, initials, role: role === "recruiter" ? "Recruiter" : "Student" }}>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft h-[82vh] flex">
        {/* Left Channels List Panel */}
        <div className="w-80 border-r border-border flex flex-col bg-card shrink-0">
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="text-lg font-bold tracking-tight">Placement Chat</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search chats..."
                className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left relative ${c.id === activeChannelId ? "bg-accent/40 text-foreground border border-border/55" : "hover:bg-accent/20 text-muted-foreground"}`}
              >
                <div className="relative h-10 w-10 shrink-0 rounded-full gradient-accent flex items-center justify-center font-bold text-xs text-primary-foreground">
                  {c.avatarInitials}
                  {c.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate text-foreground">{c.name}</p>
                    {c.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] truncate text-muted-foreground mt-0.5">{c.tagline}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Active Message Area */}
        <div className="flex-1 flex flex-col bg-background/30">
          {/* Active Chat Header */}
          <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-accent flex items-center justify-center font-bold text-xs text-primary-foreground">
                {activeChannel.avatarInitials}
              </div>
              <div>
                <p className="font-semibold text-sm leading-none">{activeChannel.name}</p>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${activeChannel.online ? "bg-success" : "bg-muted"}`} />
                  {activeChannel.online ? "Active Now" : "Offline"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/room/$roomId"
                params={{ roomId: `interview-${activeChannel.id}-room` }}
                className="rounded-xl border border-border p-2 hover:bg-accent/40 transition flex items-center gap-1.5 text-xs font-semibold"
                title="Launch Live Video Interview Lobby"
              >
                <Video className="h-4 w-4 text-primary animate-pulse" /> Launch Interview Room
              </Link>
            </div>
          </div>

          {/* Messages Stack */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeChannel.messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-md rounded-2xl p-4 text-sm relative border ${m.sender === "me" ? "bg-primary text-primary-foreground border-transparent rounded-tr-none shadow-soft" : "bg-card text-foreground border-border rounded-tl-none"}`}>
                  {m.attachment && (
                    <div className="mb-2 p-2 rounded-xl bg-black/10 flex items-center gap-2 text-xs border border-white/10">
                      {m.attachment.type === "image" ? <Image className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{m.attachment.name}</p>
                        <p className="text-[10px] opacity-80">{m.attachment.size}</p>
                      </div>
                    </div>
                  )}
                  <p className="leading-relaxed">{m.text}</p>
                  <div className="mt-2 flex items-center justify-end gap-1 text-[9px] opacity-75">
                    <span>{m.timestamp}</span>
                    {m.sender === "me" && (
                      m.read ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" /> : <Check className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-card text-foreground border border-border rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-1.5">
                  <span className="text-muted-foreground font-medium">{activeChannel.name.split(" ")[0]} is typing</span>
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Area Controls */}
          <div className="p-4 border-t border-border bg-card space-y-3 shrink-0 relative">
            {attachment && (
              <div className="p-2 rounded-xl border border-border bg-background flex items-center justify-between text-xs max-w-sm">
                <div className="flex items-center gap-2">
                  {attachment.type === "image" ? <Image className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                  <span className="font-medium truncate max-w-[200px]">{attachment.name}</span>
                </div>
                <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-destructive transition"><X className="h-4 w-4" /></button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowEmoji(!showEmoji)} className="rounded-xl border border-border p-2.5 hover:bg-accent/40 transition text-muted-foreground">
                  <Smile className="h-4 w-4" />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-12 left-0 bg-card border border-border p-2 rounded-xl shadow-glow grid grid-cols-5 gap-1 z-10 w-44">
                    {["😊", "👍", "💡", "🙌", "🔥", "🚀", "🎉", "📅", "💻", "✨"].map(e => (
                      <button key={e} onClick={() => handleAddEmoji(e)} className="hover:bg-accent/40 p-1.5 rounded text-sm transition">{e}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button className="rounded-xl border border-border p-2.5 hover:bg-accent/40 transition text-muted-foreground" title="Add attachments">
                  <Paperclip className="h-4 w-4" />
                </button>
                <div className="absolute bottom-12 left-0 hidden group-hover:block bg-card border border-border p-1.5 rounded-lg shadow-soft text-xs space-y-1">
                  <button onClick={() => triggerAttachment("image")} className="flex items-center gap-1 hover:bg-accent/40 px-2 py-1 rounded w-full">Image</button>
                  <button onClick={() => triggerAttachment("file")} className="flex items-center gap-1 hover:bg-accent/40 px-2 py-1 rounded w-full">File</button>
                </div>
              </div>

              {/* Direct access attachment helper buttons next to input */}
              <button onClick={() => triggerAttachment("image")} className="text-xs border border-border px-2 py-1.5 rounded-lg hover:bg-accent/30 text-muted-foreground hidden sm:inline-flex items-center gap-1">
                <Image className="h-3.5 w-3.5" /> Image
              </button>
              <button onClick={() => triggerAttachment("file")} className="text-xs border border-border px-2 py-1.5 rounded-lg hover:bg-accent/30 text-muted-foreground hidden sm:inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Doc
              </button>

              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-border bg-background py-2.5 px-4 text-sm outline-none focus:border-primary"
              />
              <button onClick={handleSend} className="rounded-xl gradient-primary p-2.5 text-primary-foreground shadow-soft hover:opacity-90 transition">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
