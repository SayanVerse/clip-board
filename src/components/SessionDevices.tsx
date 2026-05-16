import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, UserMinus, Crown } from "lucide-react";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/deviceId";
import { motion, AnimatePresence } from "framer-motion";

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  joined_at: string;
}

interface Props {
  sessionId: string;
  onKicked: () => void;
}

export const SessionDevices = ({ sessionId, onKicked }: Props) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [creatorDeviceId, setCreatorDeviceId] = useState<string | null>(null);
  const myDeviceId = getDeviceId();

  const load = async () => {
    const [{ data: devs }, { data: sess }] = await Promise.all([
      supabase
        .from("session_devices")
        .select("id,device_id,device_name,joined_at")
        .eq("session_id", sessionId)
        .order("joined_at", { ascending: true }),
      supabase.from("sessions").select("creator_device_id").eq("id", sessionId).maybeSingle(),
    ]);
    setDevices((devs as Device[]) || []);
    setCreatorDeviceId((sess as any)?.creator_device_id ?? null);

    // Was my device removed by the admin?
    if (devs && !devs.find((d: any) => d.device_id === myDeviceId)) {
      toast.error("You were removed from this session");
      onKicked();
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`session_devices:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_devices", filter: `session_id=eq.${sessionId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const isAdmin = creatorDeviceId === myDeviceId;

  const kick = async (device: Device) => {
    if (!isAdmin) return;
    if (device.device_id === myDeviceId) {
      toast.error("You can't remove yourself");
      return;
    }
    const { error } = await supabase.from("session_devices").delete().eq("id", device.id);
    if (error) {
      toast.error("Failed to remove device");
      return;
    }
    toast.success(`${device.device_name} removed`);
  };

  return (
    <div className="pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          Connected devices ({devices.length})
        </p>
        {isAdmin && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
            <Crown className="h-3 w-3" /> Admin
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {devices.map((d) => {
            const isMe = d.device_id === myDeviceId;
            const isCreator = d.device_id === creatorDeviceId;
            const isMobile = /mobile|android|iphone/i.test(d.device_name);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isMobile ? (
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs truncate">
                    {d.device_name}
                    {isMe && <span className="text-muted-foreground"> (you)</span>}
                  </span>
                  {isCreator && <Crown className="h-3 w-3 text-primary shrink-0" />}
                </div>
                {isAdmin && !isMe && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => kick(d)}
                    title="Remove device"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
