import { useEffect, useRef } from "react";

export const AnimatedBackground = () => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate particle keyframes dynamically
    const style = document.createElement('style');
    const total = 80; // Reduced particles for subtler effect
    const orbSize = 60; // Smaller orb
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
            opacity: 0.6;
          }
          30% {
            transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${orbSize}px) rotateZ(${z}deg);
          }
          80% {
            transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${orbSize}px) rotateZ(${z}deg);
            opacity: 0.6;
          }
          100% {
            transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${orbSize * 2.5}px) rotateZ(${z}deg);
            opacity: 0;
          }
        }
      `;

      particleStyles += `
        .particle-orb .c:nth-child(${i}) {
          animation: orbit${i} 20s infinite;
          animation-delay: ${i * 0.03}s;
          background-color: hsla(${hue}, 60%, 55%, 0.7);
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
  const particles = Array.from({ length: 80 }, (_, i) => (
    <div key={i} className="c" />
  ));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-black dark:via-gray-950 dark:to-black" />
      
      {/* Particle Orb Container */}
      <div className="particle-orb absolute inset-0 flex items-center justify-center">
        <div 
          ref={wrapRef}
          className="wrap relative"
          style={{
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            perspective: '1000px',
            animation: 'orb-rotate 20s infinite linear',
          }}
        >
          {particles}
        </div>
      </div>

      {/* Subtle overlay for better readability */}
      <div className="absolute inset-0 bg-background/50 dark:bg-background/70" />

      {/* CSS for orb animation */}
      <style>{`
        @keyframes orb-rotate {
          100% {
            transform: rotateY(360deg) rotateX(360deg);
          }
        }
        
        .particle-orb .c {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          opacity: 0;
        }
        
        .particle-orb .wrap {
          position: relative;
        }
      `}</style>
    </div>
  );
};
