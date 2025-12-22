"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Gem, Moon, Star, Sun, Ghost } from "lucide-react";

export default function FloatingBackground() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tarotImage = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/download-1766307003173.png?width=800&height=800&resize=contain";

  // Configuration for different pages
  const getPageConfig = () => {
    if (pathname === "/") {
      return {
        cards: 10,
        gems: 15,
        moons: 8,
        stars: 12,
        opacity: 0.18,
      };
    } else if (pathname?.startsWith("/shop") || pathname?.startsWith("/products")) {
      return {
        cards: 6,
        gems: 25,
        moons: 5,
        stars: 10,
        opacity: 0.22,
      };
    } else if (pathname?.startsWith("/sessions") || pathname?.includes("success")) {
      return {
        cards: 15,
        gems: 10,
        moons: 12,
        stars: 15,
        opacity: 0.25,
      };
    } else if (pathname === "/contact") {
      return {
        cards: 8,
        gems: 8,
        moons: 15,
        stars: 10,
        opacity: 0.2,
      };
    } else if (pathname?.startsWith("/admin")) {
      return {
        cards: 4,
        gems: 8,
        moons: 4,
        stars: 6,
        opacity: 0.1,
      };
    }
    // Default config
    return {
      cards: 8,
      gems: 12,
      moons: 6,
      stars: 8,
      opacity: 0.15,
    };
  };

  const config = getPageConfig();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-[-1]">
      <div className="absolute inset-0">
        {/* Floating Tarot Cards */}
        {[...Array(config.cards)].map((_, i) => {
          const size = 180 + Math.random() * 220;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 20;
          const duration = 25 + Math.random() * 25;
          const randomTilt = (Math.random() - 0.5) * 40; // Randomized initial tilt
          const opacity = config.opacity + Math.random() * 0.1;
          
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
                transform: `rotate(${randomTilt}deg)`,
              }}
            >
              <img 
                src={tarotImage} 
                alt="Floating Tarot Card"
                className="w-full h-auto drop-shadow-[0_0_15px_rgba(184,134,11,0.3)] blur-[0.5px] hover:blur-0 transition-all duration-1000"
                style={{ transform: `rotate(${(Math.random() - 0.5) * 20}deg)` }}
              />
            </div>
          );
        })}
        
        {/* Floating Crystals (Gems) */}
        {[...Array(config.gems)].map((_, i) => {
          const size = 40 + Math.random() * 60;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 15;
          const duration = 15 + Math.random() * 20;
          const opacity = (config.opacity * 1.2) + Math.random() * 0.15;
          
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
                transform: `rotate(${Math.random() * 360}deg) skew(${Math.random() * 10}deg)`,
              }}
            >
              <Gem 
                size={size} 
                className="text-primary/40 drop-shadow-[0_0_10px_rgba(184,134,11,0.4)]"
                strokeWidth={1}
              />
            </div>
          );
        })}

        {/* Floating Moons */}
        {[...Array(config.moons)].map((_, i) => {
          const size = 30 + Math.random() * 40;
          const opacity = config.opacity + Math.random() * 0.1;
          
          return (
            <div
              key={`moon-${i}`}
              className="absolute animate-floating"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${20 + Math.random() * 20}s`,
                opacity: opacity,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              <Moon size={size} className="text-primary/30" strokeWidth={1} />
            </div>
          );
        })}

        {/* Floating Stars */}
        {[...Array(config.stars)].map((_, i) => {
          const size = 15 + Math.random() * 25;
          
          return (
            <div
              key={`star-${i}`}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                opacity: 0.3 + Math.random() * 0.2,
              }}
            >
              <Star size={size} className="text-primary/40 fill-primary/10" strokeWidth={1} />
            </div>
          );
        })}
        
        {/* Mystic dust/particles */}
        {[...Array(40)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute bg-primary/40 rounded-full blur-[1px] animate-pulse"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
            }}
          />
        ))}

        {/* Floating Sparkles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute animate-bounce-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              opacity: 0.4,
            }}
          >
            <Sparkles size={24} className="text-primary/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

