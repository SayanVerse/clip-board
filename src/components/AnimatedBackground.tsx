import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const normalizedX = (clientX / innerWidth - 0.5) * 2;
      const normalizedY = (clientY / innerHeight - 0.5) * 2;
      
      setMousePosition({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const orbOffset1 = { x: mousePosition.x * 40, y: mousePosition.y * 40 };
  const orbOffset2 = { x: mousePosition.x * -30, y: mousePosition.y * -30 };
  const orbOffset3 = { x: mousePosition.x * 20, y: mousePosition.y * 20 };

  // Pre-calculate particle data
  const primaryParticles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    depth: 0.3 + (i % 5) * 0.15,
    size: 14 + (i % 5) * 8,
    left: 3 + i * 3.8,
    top: 8 + (i % 7) * 13,
    duration: 3 + (i % 5) * 0.8,
    delay: i * 0.15,
    yOffset: -50 - (i % 4) * 15,
    xOffset: i % 2 === 0 ? 25 : -25,
  }));

  const secondaryParticles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    depth: 0.5 + (i % 4) * 0.12,
    size: 10 + (i % 4) * 6,
    left: 5 + i * 4.7,
    top: 20 + (i % 6) * 12,
    duration: 3.5 + (i % 4) * 0.6,
    delay: i * 0.2 + 0.3,
    yOffset: 35 + (i % 3) * 12,
  }));

  const tertiaryParticles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    depth: 0.4 + (i % 3) * 0.2,
    size: 8 + (i % 3) * 5,
    left: 10 + i * 5.5,
    top: 35 + (i % 5) * 11,
    duration: 2.5 + (i % 3) * 0.5,
    delay: i * 0.18 + 0.6,
    yOffset: -30 - (i % 2) * 10,
    xOffset: i % 2 === 0 ? -15 : 15,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-background to-indigo-50/30 dark:from-black dark:via-gray-950 dark:to-black" />
      
      {/* Animated orbs with parallax */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-60"
        style={{ 
          top: "5%", 
          left: "5%", 
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)",
          filter: "blur(60px)",
          transform: `translate(${orbOffset1.x}px, ${orbOffset1.y}px)`,
        }}
        animate={{ scale: [1, 1.15, 0.9, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-50"
        style={{ 
          top: "40%", 
          right: "5%", 
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)",
          filter: "blur(50px)",
          transform: `translate(${orbOffset2.x}px, ${orbOffset2.y}px)`,
        }}
        animate={{ scale: [1, 0.85, 1.1, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full opacity-50"
        style={{ 
          bottom: "5%", 
          left: "25%", 
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.1) 50%, transparent 70%)",
          filter: "blur(45px)",
          transform: `translate(${orbOffset3.x}px, ${orbOffset3.y}px)`,
        }}
        animate={{ scale: [1, 1.1, 0.85, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Primary floating particles - Blue */}
      {primaryParticles.map((p) => {
        const parallaxX = mousePosition.x * 35 * p.depth;
        const parallaxY = mousePosition.y * 35 * p.depth;
        
        return (
          <motion.div
            key={`primary-${p.id}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: "radial-gradient(circle at 30% 30%, #60a5fa, #3b82f6 40%, #2563eb 100%)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(255,255,255,0.3)",
              transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            }}
            animate={{
              y: [0, p.yOffset, 0],
              x: [0, p.xOffset, 0],
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        );
      })}

      {/* Secondary floating particles - Purple */}
      {secondaryParticles.map((p) => {
        const parallaxX = mousePosition.x * 28 * p.depth;
        const parallaxY = mousePosition.y * 28 * p.depth;
        
        return (
          <motion.div
            key={`secondary-${p.id}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: "radial-gradient(circle at 30% 30%, #c084fc, #a855f7 40%, #9333ea 100%)",
              boxShadow: "0 0 18px rgba(168, 85, 247, 0.7), 0 0 35px rgba(139, 92, 246, 0.35), inset 0 0 8px rgba(255,255,255,0.25)",
              transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            }}
            animate={{
              y: [0, p.yOffset, 0],
              scale: [1, 1.25, 1],
              opacity: [0.6, 0.95, 0.6],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        );
      })}

      {/* Tertiary small accent particles - Cyan */}
      {tertiaryParticles.map((p) => {
        const parallaxX = mousePosition.x * 20 * p.depth;
        const parallaxY = mousePosition.y * 20 * p.depth;
        
        return (
          <motion.div
            key={`tertiary-${p.id}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: "radial-gradient(circle at 30% 30%, #67e8f9, #22d3ee 40%, #06b6d4 100%)",
              boxShadow: "0 0 15px rgba(34, 211, 238, 0.7), 0 0 30px rgba(6, 182, 212, 0.35), inset 0 0 6px rgba(255,255,255,0.3)",
              transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            }}
            animate={{
              y: [0, p.yOffset, 0],
              x: [0, p.xOffset, 0],
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        );
      })}

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
};
