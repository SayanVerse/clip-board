import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { FileUp, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadProgressProps {
  isUploading: boolean;
  progress: number;
  fileName?: string;
  onCancel?: () => void;
}

export const UploadProgress = ({ isUploading, progress, fileName, onCancel }: UploadProgressProps) => {
  const isComplete = progress >= 100;

  return (
    <AnimatePresence>
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-50 w-72 p-4 rounded-xl bg-card border border-border shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-500/10' : 'bg-primary/10'}`}>
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <FileUp className="h-5 w-5 text-primary animate-pulse" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate pr-2">
                  {isComplete ? 'Upload complete' : 'Uploading...'}
                </p>
                {!isComplete && onCancel && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={onCancel}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              
              {fileName && (
                <p className="text-xs text-muted-foreground truncate mb-2">{fileName}</p>
              )}
              
              <Progress value={progress} className="h-1.5" />
              
              <p className="text-xs text-muted-foreground mt-1.5">
                {isComplete ? 'File uploaded successfully' : `${Math.round(progress)}%`}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
