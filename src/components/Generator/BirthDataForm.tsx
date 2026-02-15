import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BirthData } from "@/lib/astrology/chartCalculator";

interface BirthDataFormProps {
  onSubmit: (data: BirthData) => void;
  isLoading?: boolean;
}

const BirthDataForm = ({ onSubmit, isLoading }: BirthDataFormProps) => {
  const [formData, setFormData] = useState<BirthData>({
    name: "",
    date: "",
    time: "",
    location: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.date && formData.time && formData.location) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof BirthData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid = formData.name && formData.date && formData.time && formData.location;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-body tracking-wide text-muted-foreground uppercase">
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-body tracking-wide text-muted-foreground uppercase">
            Birth Date
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="bg-secondary border-border text-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm font-body tracking-wide text-muted-foreground uppercase">
            Birth Time
          </Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => handleChange("time", e.target.value)}
            className="bg-secondary border-border text-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-body tracking-wide text-muted-foreground uppercase">
          Birth Location
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="City, Country"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          maxLength={200}
        />
      </div>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display text-lg tracking-wider uppercase py-6 border-glow disabled:opacity-30"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Reading the Stars…
          </span>
        ) : (
          "Generate Your Chart"
        )}
      </Button>
    </form>
  );
};

export default BirthDataForm;
