import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircleIcon, CheckCircle2Icon, PlusCircleIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import SpeciesForm from "@/components/SpeciesForm";
import type { Species } from "@/types";

export default function AddPlant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nickname: "",
    species_id: "",
    location: "",
    date_added: "",
    last_watered: "",
  });

  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadSpecies = async () => {
    try {
      const data = await getAllSpecies();
      setSpecies(data.species ?? []);
    } catch (err) {
      console.error("Failed to load species:", err);
      setError("Failed to load species list");
    }
  };

  useEffect(() => {
    loadSpecies();
  }, []);

  const handleSpeciesAdded = (newSpecies: any) => {
    setDialogOpen(false);
    loadSpecies();
    // Auto-select the newly added species
    if (newSpecies?.id) {
      setForm({ ...form, species_id: newSpecies.id.toString() });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nickname) {
      setError("Plant nickname is required");
      return;
    }

    setLoading(true);
    try {
      const plantData: any = {
        nickname: form.nickname,
      };

      // Only include optional fields if they have values
      if (form.species_id) plantData.species_id = parseInt(form.species_id);
      if (form.location) plantData.location = form.location;
      if (form.date_added) plantData.date_added = form.date_added;
      if (form.last_watered) plantData.last_watered = form.last_watered;

      await createPlant(plantData);
      setSuccess("Plant added successfully!");

      // Reset form
      setForm({
        nickname: "",
        species_id: "",
        location: "",
        date_added: "",
        last_watered: "",
      });

      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to add plant. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Add New Plant
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Add a new plant to your collection
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="shrink-0 w-full sm:w-auto"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Plant Information</CardTitle>
              <CardDescription>
                Fill in the details about your new plant. Only the nickname is
                required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nickname */}
                <div className="space-y-2">
                  <Label htmlFor="nickname">
                    Nickname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    type="text"
                    placeholder="e.g., My Favorite Monstera"
                    value={form.nickname}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Species */}
                <div className="space-y-2">
                  <Label htmlFor="species_id">Species (Optional)</Label>
                  <Select
                    value={form.species_id}
                    onValueChange={(value) =>
                      setForm({ ...form, species_id: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a species" />
                    </SelectTrigger>
                    <SelectContent>
                      {species.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No species available
                        </SelectItem>
                      ) : (
                        species.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.common_name}
                            {s.scientific_name && ` (${s.scientific_name})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 pt-1">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-sm"
                        >
                          <PlusCircleIcon className="h-3 w-3 mr-1" />
                          Quick add species
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Species</DialogTitle>
                          <DialogDescription>
                            Add a new species to the community database
                          </DialogDescription>
                        </DialogHeader>
                        <SpeciesForm
                          onSuccess={handleSpeciesAdded}
                          onCancel={() => setDialogOpen(false)}
                          compact
                        />
                      </DialogContent>
                    </Dialog>
                    <span className="text-sm text-muted-foreground">or</span>
                    <Link
                      to="/species"
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      Browse all species
                    </Link>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g., Living room window"
                    value={form.location}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Date Added */}
                <div className="space-y-2">
                  <Label htmlFor="date_added">Date Added (Optional)</Label>
                  <Input
                    id="date_added"
                    name="date_added"
                    type="date"
                    value={form.date_added}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Last Watered */}
                <div className="space-y-2">
                  <Label htmlFor="last_watered">
                    Last Watered (Optional)
                  </Label>
                  <Input
                    id="last_watered"
                    name="last_watered"
                    type="date"
                    value={form.last_watered}
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
                    {loading ? "Adding Plant..." : "Add Plant"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
