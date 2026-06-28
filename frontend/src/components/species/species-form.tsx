import { useState } from "react";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSpecies } from "@/api/species";

interface SpeciesFormProps {
  onSuccess?: (species: any) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export default function SpeciesForm({
  onSuccess,
  onCancel,
  compact = false,
}: SpeciesFormProps) {
  const [form, setForm] = useState({
    common_name: "",
    scientific_name: "",
    sunlight: "",
    water_requirements: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.common_name) {
      setError("Common name is required");
      return;
    }

    setLoading(true);
    try {
      const speciesData: any = {
        common_name: form.common_name,
      };

      if (form.scientific_name) speciesData.scientific_name = form.scientific_name;
      if (form.sunlight) speciesData.sunlight = form.sunlight;
      if (form.water_requirements)
        speciesData.water_requirements = form.water_requirements;

      const result = await createSpecies(speciesData);
      setSuccess("Species added successfully!");

      // Reset form
      setForm({
        common_name: "",
        scientific_name: "",
        sunlight: "",
        water_requirements: "",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result.species);
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to add species. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-4" : "space-y-6"}>
      {/* Common Name */}
      <div className="space-y-2">
        <Label htmlFor="common_name">
          Common Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="common_name"
          name="common_name"
          type="text"
          placeholder="e.g., Monstera Deliciosa"
          value={form.common_name}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      {/* Scientific Name */}
      <div className="space-y-2">
        <Label htmlFor="scientific_name">Scientific Name (Optional)</Label>
        <Input
          id="scientific_name"
          name="scientific_name"
          type="text"
          placeholder="e.g., Monstera deliciosa"
          value={form.scientific_name}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      {/* Sunlight */}
      <div className="space-y-2">
        <Label htmlFor="sunlight">Sunlight Requirements (Optional)</Label>
        <Input
          id="sunlight"
          name="sunlight"
          type="text"
          placeholder="e.g., Bright indirect light"
          value={form.sunlight}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      {/* Water Requirements */}
      <div className="space-y-2">
        <Label htmlFor="water_requirements">
          Water Requirements (Optional)
        </Label>
        <Input
          id="water_requirements"
          name="water_requirements"
          type="text"
          placeholder="e.g., Weekly, keep soil moist"
          value={form.water_requirements}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Adding Species..." : "Add Species"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
