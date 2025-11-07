import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export const HistorySkeleton = () => {
  return (
    <Card className="p-6 glass rounded-3xl shadow-elevated">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-40 bg-muted/30 rounded-2xl animate-pulse" />
      </div>

      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="p-5 glass-hover rounded-3xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-muted/30 animate-pulse" />
                    <div className="h-4 w-24 bg-muted/30 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted/30 rounded-full animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted/30 rounded-full animate-pulse" />
                  </div>
                  <div className="h-3 w-32 bg-muted/30 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded-2xl bg-muted/30 animate-pulse" />
                  <div className="h-10 w-10 rounded-2xl bg-muted/30 animate-pulse" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
