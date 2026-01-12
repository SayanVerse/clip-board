import { useEffect, useRef } from "react";

export const AnimatedBackground = () => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate particle keyframes dynamically
    const style = document.createElement('style');
    const total = 120; // More particles for better visibility
    const orbSize = 80; // Larger orb for better visibility on all screens
    const baseHue = 200; // Blue-ish base color

    let keyframes = '';
    let particleStyles = '';

    for (let i = 1; i <= total; i++) {
      const z = Math.random() * 360;
      const y = Math.random() * 360;
      const hue = ((40 / total) * i) + baseHue;
      
      keyframes += `
        @keyframes orbit${i} {
          0% {
            opacity: 0;
            transform: rotateZ(0deg) rotateY(0deg) translateX(0px) rotateZ(0deg);
          }
          20% {
            opacity: 0.8;
          }
          30% {
            transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${orbSize}px) rotateZ(${z}deg);
          }
          80% {
            transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${orbSize}px) rotateZ(${z}deg);
            opacity: 0.8;
          }
          100% {
            transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${orbSize * 3}px) rotateZ(${z}deg);
            opacity: 0;
          }
        }
      `;

      particleStyles += `
        .particle-orb .c:nth-child(${i}) {
          animation: orbit${i} 18s infinite;
          animation-delay: ${i * 0.025}s;
          background-color: hsla(${hue}, 70%, 60%, 0.9);
        }
      `;
    }

    style.textContent = keyframes + particleStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Generate particles
  const particles = Array.from({ length: 120 }, (_, i) => (
    <div key={i} className="c" />
  ));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Gradient base with better visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50" />
      
      {/* Particle Orb Container - centered and visible on all screens */}
      <div className="particle-orb absolute inset-0 flex items-center justify-center">
        <div 
          ref={wrapRef}
          className="wrap relative"
          style={{
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            perspective: '1000px',
            animation: 'orb-rotate 25s infinite linear',
          }}
        >
          {particles}
        </div>
      </div>

      {/* Lighter overlay for glassmorphism to show through */}
      <div className="absolute inset-0 bg-background/30 dark:bg-background/40" />

      {/* Additional floating particles for mobile visibility */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`float-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: `hsla(${200 + Math.random() * 60}, 70%, 60%, ${0.3 + Math.random() * 0.3})`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* CSS for orb animation */}
      <style>{`
        @keyframes orb-rotate {
          100% {
            transform: rotateY(360deg) rotateX(360deg);
          }
        }
        
        .particle-orb .c {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          opacity: 0;
          box-shadow: 0 0 6px currentColor;
        }
        
        .particle-orb .wrap {
          position: relative;
        }
        
        @media (max-width: 768px) {
          .particle-orb .c {
            width: 4px;
            height: 4px;
          }
        }
      `}</style>
    </div>
  );
};