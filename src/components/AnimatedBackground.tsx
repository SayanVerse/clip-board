import { motion } from "framer-motion";

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - Light mode: soft blue, Dark mode: pure black */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 dark:from-black dark:via-black dark:to-black" />
      
      {/* Animated orbs - Larger, more prominent */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 dark:bg-primary/20 blur-[120px]"
        animate={{
          x: [0, 80, 40, 0],
          y: [0, 40, 80, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ top: "5%", left: "5%" }}
      />
      
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-400/15 blur-[100px]"
        animate={{
          x: [0, -60, -30, 0],
          y: [0, 60, 30, 0],
          scale: [1, 0.85, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ top: "40%", right: "5%" }}
      />
      
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full bg-indigo-400/10 dark:bg-indigo-500/15 blur-[90px]"
        animate={{
          x: [0, 50, -25, 0],
          y: [0, -50, 25, 0],
          scale: [1, 1.1, 0.85, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ bottom: "5%", left: "25%" }}
      />

      {/* Additional orb for more depth */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full bg-violet-400/8 dark:bg-violet-500/12 blur-[80px]"
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ top: "60%", left: "60%" }}
      />

      {/* Floating particles - highly visible */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-500 dark:bg-blue-400"
          initial={{ opacity: 0.4 }}
          animate={{
            y: [0, -60 - (i % 3) * 20, 0],
            x: [0, (i % 2 === 0 ? 20 : -20), 0],
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
          }}
        />
      ))}

      {/* Secondary particles layer */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`secondary-${i}`}
          className="absolute rounded-full bg-indigo-500 dark:bg-indigo-400"
          initial={{ opacity: 0.3 }}
          animate={{
            y: [0, 40 + (i % 2) * 20, 0],
            x: [0, (i % 2 === 0 ? -15 : 15), 0],
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
          }}
        />
      ))}

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

      {/* Radial glow at center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(221_83%_53%/0.08)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_hsl(217_91%_60%/0.12)_0%,_transparent_50%)]" />
    </div>
  );
};