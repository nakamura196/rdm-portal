"use client";

import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

interface AudioPlayerProps {
  src: string;
  title?: string;
}

export default function AudioPlayerComponent({
  src,
  title,
}: AudioPlayerProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎧</span>
          <div>
            <h2 className="text-white font-bold text-lg">
              {title || "音声再生"}
            </h2>
            <p className="text-blue-200 text-sm">Now Playing</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <AudioPlayer
          src={src}
          showJumpControls={true}
          showSkipControls={false}
          autoPlayAfterSrcChange={false}
          layout="stacked-reverse"
          customAdditionalControls={[]}
          style={{
            boxShadow: "none",
            borderRadius: "0.75rem",
          }}
        />
      </div>
    </div>
  );
}
