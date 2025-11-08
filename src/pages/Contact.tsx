import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Phone, Mail, Github, MessageCircle, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Contact = () => {
  const contactMethods = [
    {
      icon: Phone,
      label: "Call",
      value: "9609800163",
      href: "tel:9609800163",
      color: "text-green-500",
    },
    {
      icon: Mail,
      label: "Email",
      value: "sayan.official.2024@gmail.com",
      href: "mailto:sayan.official.2024@gmail.com",
      color: "text-blue-500",
    },
    {
      icon: Github,
      label: "GitHub",
      value: "SayanVerse",
      href: "https://github.com/SayanVerse",
      color: "text-foreground",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "9609800163",
      href: "https://wa.me/919609800163",
      color: "text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          className="absolute top-6 right-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ThemeToggle />
        </motion.div>

        <Link to="/">
          <motion.button
            className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full glass-hover"
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </motion.button>
        </Link>

        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            Contact Developer
          </h1>
          <p className="text-muted-foreground text-lg">
            Get in touch with Sayan
          </p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactMethods.map((method, index) => (
            <motion.a
              key={method.label}
              href={method.href}
              target={method.label === "GitHub" ? "_blank" : undefined}
              rel={method.label === "GitHub" ? "noopener noreferrer" : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 rounded-3xl glass-hover transition-all duration-300 border-2 border-border/50"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl bg-background/50 ${method.color}`}>
                  <method.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1">{method.label}</h3>
                  <p className="text-muted-foreground text-sm break-all">
                    {method.value}
                  </p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center p-6 rounded-3xl glass-hover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-muted-foreground">
            Feel free to reach out for any queries, suggestions, or collaboration opportunities.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
