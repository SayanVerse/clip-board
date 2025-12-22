import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Smooth spring physics for mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Normalize mouse position to -1 to 1 range
      const normalizedX = (clientX / innerWidth - 0.5) * 2;
      const normalizedY = (clientY / innerHeight - 0.5) * 2;
      
      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
      setMousePosition({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Different parallax depths for layers
  const orbParallax1X = useTransform(smoothMouseX, [-1, 1], [-40, 40]);
  const orbParallax1Y = useTransform(smoothMouseY, [-1, 1], [-40, 40]);
  const orbParallax2X = useTransform(smoothMouseX, [-1, 1], [30, -30]);
  const orbParallax2Y = useTransform(smoothMouseY, [-1, 1], [30, -30]);
  const orbParallax3X = useTransform(smoothMouseX, [-1, 1], [-20, 20]);
  const orbParallax3Y = useTransform(smoothMouseY, [-1, 1], [-20, 20]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - Light mode: soft blue, Dark mode: pure black */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 dark:from-black dark:via-black dark:to-black" />
      
      {/* Animated orbs with parallax - Larger, more prominent */}
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
          x: orbParallax1X,
          y: orbParallax1Y,
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
          x: orbParallax2X,
          y: orbParallax2Y,
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
          x: orbParallax3X,
          y: orbParallax3Y,
        }}
      />

      {/* Additional orb for more depth */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full bg-violet-400/8 dark:bg-violet-500/12 blur-[80px]"
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
          x: orbParallax1X,
          y: orbParallax2Y,
        }}
      />

      {/* Floating particles with parallax - highly visible */}
      {[...Array(20)].map((_, i) => {
        const depth = 0.3 + (i % 5) * 0.15; // Different depths for each particle
        const parallaxX = mousePosition.x * 30 * depth;
        const parallaxY = mousePosition.y * 30 * depth;
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500 dark:bg-blue-400"
            initial={{ opacity: 0.4 }}
            animate={{
              y: [parallaxY, parallaxY - 60 - (i % 3) * 20, parallaxY],
              x: [parallaxX, parallaxX + (i % 2 === 0 ? 20 : -20), parallaxX],
              opacity: [0.4, 0.9, 0.4],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 2.5 + (i % 5) * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            style={{
              width: `${6 + (i % 4) * 3}px`,
              height: `${6 + (i % 4) * 3}px`,
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
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + (i % 4) * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.25 + 0.5,
            }}
            style={{
              width: `${5 + (i % 3) * 2}px`,
              height: `${5 + (i % 3) * 2}px`,
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
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(221_83%_53%/0.08)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_hsl(217_91%_60%/0.12)_0%,_transparent_50%)]"
        style={{
          x: orbParallax3X,
          y: orbParallax3Y,
        }}
      />
    </div>
  );
};
