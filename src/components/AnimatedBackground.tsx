import { motion } from "framer-motion";

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - Light mode: soft blue, Dark mode: pure black */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 dark:from-black dark:via-black dark:to-black" />
      
      {/* Animated orbs - Larger, more prominent in light mode */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-primary/8 dark:bg-primary/15 blur-[120px]"
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
        className="absolute w-[500px] h-[500px] rounded-full bg-accent/6 dark:bg-primary-glow/10 blur-[100px]"
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
        className="absolute w-[450px] h-[450px] rounded-full bg-secondary/50 dark:bg-accent/8 blur-[90px]"
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
        className="absolute w-[350px] h-[350px] rounded-full bg-primary/5 dark:bg-primary/8 blur-[80px]"
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

      {/* Floating particles - more visible */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/30 dark:bg-primary/50"
          animate={{
            y: [0, -50, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + (i % 4) * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
          style={{
            width: `${4 + (i % 3) * 2}px`,
            height: `${4 + (i % 3) * 2}px`,
            left: `${8 + i * 7.5}%`,
            top: `${12 + (i % 5) * 18}%`,
          }}
        />
      ))}

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow at center - softer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.06)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.1)_0%,_transparent_50%)]" />

      {/* Corner accent glow */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--accent)/0.04)_0%,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--accent)/0.08)_0%,_transparent_40%)]" />
    </div>
  );
};