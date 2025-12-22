import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Normalize mouse position to -1 to 1 range
      const normalizedX = (clientX / innerWidth - 0.5) * 2;
      const normalizedY = (clientY / innerHeight - 0.5) * 2;
      
      setMousePosition({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Calculate parallax offsets for different layers
  const orbOffset1 = { x: mousePosition.x * 40, y: mousePosition.y * 40 };
  const orbOffset2 = { x: mousePosition.x * -30, y: mousePosition.y * -30 };
  const orbOffset3 = { x: mousePosition.x * 20, y: mousePosition.y * 20 };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - Light mode: soft blue, Dark mode: pure black */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 dark:from-black dark:via-black dark:to-black" />
      
      {/* Animated orbs with parallax */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 dark:bg-primary/20 blur-[120px]"
        animate={{
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ 
          top: "5%", 
          left: "5%",
          transform: `translate(${orbOffset1.x}px, ${orbOffset1.y}px)`,
        }}
      />
      
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-400/15 blur-[100px]"
        animate={{
          scale: [1, 0.85, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ 
          top: "40%", 
          right: "5%",
          transform: `translate(${orbOffset2.x}px, ${orbOffset2.y}px)`,
        }}
      />
      
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full bg-indigo-400/10 dark:bg-indigo-500/15 blur-[90px]"
        animate={{
          scale: [1, 1.1, 0.85, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ 
          bottom: "5%", 
          left: "25%",
          transform: `translate(${orbOffset3.x}px, ${orbOffset3.y}px)`,
        }}
      />

      {/* Additional orb for more depth */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full bg-violet-400/10 dark:bg-violet-500/15 blur-[80px]"
        animate={{
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ 
          top: "60%", 
          left: "60%",
          transform: `translate(${orbOffset1.x * 0.5}px, ${orbOffset2.y * 0.5}px)`,
        }}
      />

      {/* Floating particles with parallax - highly visible */}
      {[...Array(20)].map((_, i) => {
        const depth = 0.3 + (i % 5) * 0.15;
        const parallaxX = mousePosition.x * 30 * depth;
        const parallaxY = mousePosition.y * 30 * depth;
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500 dark:bg-blue-400"
            animate={{
              y: [0, -60 - (i % 3) * 20, 0],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 2.5 + (i % 5) * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            style={{
              width: `${8 + (i % 4) * 4}px`,
              height: `${8 + (i % 4) * 4}px`,
              left: `${5 + i * 4.5}%`,
              top: `${10 + (i % 6) * 15}%`,
              transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            }}
          />
        );
      })}

      {/* Secondary particles layer with parallax */}
      {[...Array(15)].map((_, i) => {
        const depth = 0.5 + (i % 4) * 0.12;
        const parallaxX = mousePosition.x * 25 * depth;
        const parallaxY = mousePosition.y * 25 * depth;
        
        return (
          <motion.div
            key={`secondary-${i}`}
            className="absolute rounded-full bg-indigo-500 dark:bg-indigo-400"
            animate={{
              y: [0, 30 + (i % 2) * 15, 0],
              opacity: [0.4, 0.9, 0.4],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + (i % 4) * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.25 + 0.5,
            }}
            style={{
              width: `${6 + (i % 3) * 3}px`,
              height: `${6 + (i % 3) * 3}px`,
              left: `${8 + i * 6}%`,
              top: `${25 + (i % 5) * 12}%`,
              transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            }}
          />
        );
      })}

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow at center with parallax */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(221_83%_53%/0.08)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_hsl(217_91%_60%/0.12)_0%,_transparent_50%)]"
        style={{
          transform: `translate(${orbOffset3.x * 0.3}px, ${orbOffset3.y * 0.3}px)`,
        }}
      />
    </div>
  );
};
