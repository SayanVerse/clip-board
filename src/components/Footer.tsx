import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-16 py-8 border-t border-border"
    >
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Developed by <span className="font-semibold text-foreground">Sayan</span>
          </p>
          <Link to="/contact">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-primary hover:text-primary-glow transition-colors font-medium"
            >
              Contact Developer
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.footer>
  );
};
