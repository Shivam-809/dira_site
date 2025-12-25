"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Slot {
  id: number;
  serviceId: number | null;
  date: string;
  time: string;
  isAvailable: boolean;
}

interface SlotManagementDialogProps {
  serviceId: number | null;
  serviceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SlotManagementDialog({ serviceId, serviceName, open, onOpenChange }: SlotManagementDialogProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newTime, setNewTime] = useState("10:00 AM");

  useEffect(() => {
    if (open) {
      fetchSlots();
    }
  }, [open, serviceId]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const url = serviceId 
        ? `/api/admin/services/slots?serviceId=${serviceId}`
        : "/api/admin/services/slots";
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (error) {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    setAdding(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/services/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId,
          date: newDate,
          time: newTime,
          isAvailable: true
        }),
      });

      if (response.ok) {
        toast.success("Slot added!");
        fetchSlots();
      } else {
        toast.error("Failed to add slot");
      }
    } catch (error) {
      toast.error("Error adding slot");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/services/slots?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setSlots(slots.filter(s => s.id !== id));
        toast.success("Slot deleted");
      }
    } catch (error) {
      toast.error("Failed to delete slot");
    }
  };

  const toggleAvailability = async (slot: Slot) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/services/slots?id=${slot.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: !slot.isAvailable }),
      });

      if (response.ok) {
        setSlots(slots.map(s => s.id === slot.id ? { ...s, isAvailable: !slot.isAvailable } : s));
      }
    } catch (error) {
      toast.error("Failed to update slot");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            Manage Slots: {serviceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Date
              </label>
              <Input 
                type="date" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Time
              </label>
              <Input 
                placeholder="e.g. 10:00 AM" 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleAddSlot} disabled={adding} className="rounded-xl font-bold">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Slot
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900">Existing Slots</h3>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-2xl text-slate-400">
                No slots defined for this service yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm transition-all">
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-slate-400" />
                        {format(new Date(slot.date), "MMM dd, yyyy")}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {slot.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`cursor-pointer ${slot.isAvailable ? 'bg-emerald-500' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        onClick={() => toggleAvailability(slot)}
                      >
                        {slot.isAvailable ? "Available" : "Booked"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSlot(slot.id)} className="text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
