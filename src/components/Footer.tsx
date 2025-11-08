import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-16 py-8 border-t border-border/50"
    >
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.p
            className="text-muted-foreground text-sm md:text-base"
            whileHover={{ scale: 1.05 }}
          >
            Developed by <span className="font-semibold text-foreground">Sayan</span>
          </motion.p>
          <Link to="/contact">
            <motion.button
              className="px-6 py-2 rounded-full glass-hover text-sm md:text-base font-medium transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Developer
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.footer>
  );
};
