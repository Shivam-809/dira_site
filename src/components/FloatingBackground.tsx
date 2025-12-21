"use client";

import { useEffect, useState } from "react";
import { Sparkles, Gem } from "lucide-react";

export default function FloatingBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tarotImage = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/download-1766307003173.png?width=800&height=800&resize=contain";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-[-1]">
      <div className="absolute inset-0">
        {/* Floating Tarot Cards */}
        {[...Array(8)].map((_, i) => {
          const size = 180 + Math.random() * 220;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 20;
          const duration = 25 + Math.random() * 25;
          const opacity = 0.08 + Math.random() * 0.12;
          
          return (
            <div
              key={`card-${i}`}
              className="absolute animate-floating"
              style={{
                width: `${size}px`,
                height: "auto",
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                opacity: opacity,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              <img 
                src={tarotImage} 
                alt="Floating Tarot Card"
                className="w-full h-auto drop-shadow-[0_0_15px_rgba(184,134,11,0.2)] blur-[1px] hover:blur-0 transition-all duration-1000"
              />
            </div>
          );
        })}
        
        {/* Floating Crystals (Gems) */}
        {[...Array(12)].map((_, i) => {
          const size = 40 + Math.random() * 60;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 15;
          const duration = 15 + Math.random() * 20;
          const opacity = 0.1 + Math.random() * 0.15;
          
          return (
            <div
              key={`gem-${i}`}
              className="absolute animate-floating"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                opacity: opacity,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              <Gem 
                size={size} 
                className="text-primary/40 drop-shadow-[0_0_10px_rgba(184,134,11,0.3)]"
                strokeWidth={1}
              />
            </div>
          );
        })}
        
        {/* Mystic dust/particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute bg-primary/30 rounded-full blur-[1px] animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
            }}
          />
        ))}

        {/* Floating Sparkles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.2,
            }}
          >
            <Sparkles size={20} className="text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}
