import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, PhoneOff, Copy,
  Check, Settings, Users, ShieldAlert, Monitor, Volume2, Redo2, Circle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/room/$roomId")({
  head: () => ({
    meta: [
      { title: "Live Interview Room — HireNexa" },
      { name: "description", content: "Secure enterprise video and audio conferencing room for campus placement interviews." },
    ],
  }),
  component: () => <VideoInterviewRoom />
});

function VideoInterviewRoom() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();

  const [audioActive, setAudioActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(true);
  const [copied, setCopied] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(2);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera/mic feed using navigator.mediaDevices.getUserMedia
  useEffect(() => {
    async function startCamera() {
      if (!videoActive) {
        stopCamera();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable. Falling back to avatar placeholder.");
      }
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [videoActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Meeting link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndCall = () => {
    stopCamera();
    toast.success("Interview session completed.");
    navigate({ to: "/chat" });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans">
      {/* Video Room Top Info bar */}
      <div className="p-4 bg-neutral-900/80 backdrop-blur border-b border-neutral-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-semibold tracking-tight">Room: {roomId}</span>
          {recording && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/10 text-red-500 font-bold border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Circle className="h-2 w-2 fill-red-500" /> REC Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {participantsCount} in Call</span>
          <button
            onClick={handleCopyLink}
            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 font-semibold text-white flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            Copy Meeting Link
          </button>
        </div>
      </div>

      {/* Main Video Streams Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
        {/* Remote Candidate Stream Mock Card */}
        <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-video flex items-center justify-center shadow-glow">
          <div className="absolute top-4 left-4 z-10 bg-black/60 px-3 py-1 rounded-lg text-xs font-medium border border-neutral-800">
            Hiren Patel (Interviewer Lead)
          </div>
          {/* Simulated remote stream avatar gradient fallback */}
          <div className="h-full w-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-indigo-950 flex flex-col items-center justify-center gap-3 animate-pulse">
            <div className="h-20 w-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
              HP
            </div>
            <p className="text-xs text-neutral-400">Google Interviewer stream active</p>
          </div>
        </div>

        {/* Local Candidate Stream Card */}
        <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-video flex items-center justify-center shadow-glow">
          <div className="absolute top-4 left-4 z-10 bg-black/60 px-3 py-1 rounded-lg text-xs font-medium border border-neutral-800">
            You (Ashwin Kumar Candidate)
          </div>

          {videoActive ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="h-full w-full bg-neutral-900 flex flex-col items-center justify-center gap-3">
              <div className="h-20 w-20 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl font-bold text-neutral-400">
                AK
              </div>
              <p className="text-xs text-neutral-500">Camera Feed is Muted</p>
            </div>
          )}

          {screenSharing && (
            <div className="absolute inset-0 bg-neutral-950/90 z-20 flex flex-col items-center justify-center gap-3 animate-in fade-in">
              <Monitor className="h-10 w-10 text-primary animate-bounce" />
              <p className="text-sm font-semibold">You are presenting your screen</p>
              <button
                onClick={() => setScreenSharing(false)}
                className="rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs text-red-500 font-bold transition"
              >
                Stop Presenting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Control Bar Dashboard */}
      <div className="p-6 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="text-xs text-neutral-400 font-medium">
          Secure, end-to-end encrypted session.
        </div>

        {/* Center controllers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioActive(!audioActive)}
            className={`rounded-full p-4 border transition hover:scale-105 ${audioActive ? "border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700" : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"}`}
          >
            {audioActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setVideoActive(!videoActive)}
            className={`rounded-full p-4 border transition hover:scale-105 ${videoActive ? "border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700" : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"}`}
          >
            {videoActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setScreenSharing(!screenSharing)}
            className={`rounded-full p-4 border transition hover:scale-105 ${screenSharing ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20" : "border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"}`}
          >
            {screenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
          </button>
          <button
            onClick={handleEndCall}
            className="rounded-full p-4 bg-red-500 text-white hover:bg-red-600 transition hover:scale-105 shadow-lg shadow-red-500/20"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>

        {/* Right tools */}
        <div className="flex gap-2">
          <button className="rounded-xl border border-neutral-700 bg-neutral-800 p-2.5 hover:bg-neutral-700 transition" title="Audio Settings">
            <Volume2 className="h-4 w-4 text-neutral-400" />
          </button>
          <button className="rounded-xl border border-neutral-700 bg-neutral-800 p-2.5 hover:bg-neutral-700 transition" title="Room Preferences">
            <Settings className="h-4 w-4 text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
