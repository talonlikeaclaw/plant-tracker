import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CameraIcon,
  XIcon,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCareLog } from "@/api/careLogs";
import { uploadCareLogPhotos } from "@/api/photos";
import { getAllPlants } from "@/api/plants";
import { getDefaultCareTypes, getUserCareTypes } from "@/api/careTypes";
import { getPastCareLogs } from "@/api/dashboard";
import type { Plant, CareType, CareLog } from "@/types";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

export default function LogCare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [careTypes, setCareTypes] = useState<CareType[]>([]);
  const [recentLogs, setRecentLogs] = useState<CareLog[]>([]);

  // Helper to get today's date in local timezone
  const getTodayLocal = () => {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  // Single plant logging
  const [singleForm, setSingleForm] = useState({
    plant_id: "",
    care_type_id: "",
    care_date: getTodayLocal(),
    note: "",
  });

  // Multi plant logging
  const [multiMode, setMultiMode] = useState(false);
  const [selectedPlants, setSelectedPlants] = useState<number[]>([]);
  const [multiCareType, setMultiCareType] = useState("");
  const [multiNote, setMultiNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Photo selection for single-plant mode
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; preview: string }[]
  >([]);
  const filesRef = useRef(selectedFiles);
  filesRef.current = selectedFiles;

  useEffect(() => {
    return () =>
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearFiles = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    setSelectedFiles([]);
  };

  const loadData = async () => {
    try {
      const [plantsRes, defaultTypes, userTypes, logsRes] = await Promise.all([
        getAllPlants(),
        getDefaultCareTypes(),
        getUserCareTypes().catch(() => ({ care_types: [] })),
        getPastCareLogs().catch(() => []),
      ]);

      setPlants(plantsRes.plants ?? []);
      setRecentLogs(logsRes ?? []);

      const allCareTypes = [
        ...(defaultTypes.care_types ?? []),
        ...(userTypes.care_types ?? []),
      ];
      setCareTypes(allCareTypes);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-select plant from URL query parameter once plants are loaded
  useEffect(() => {
    const plantId = searchParams.get("plant");
    if (plantId && plants.length > 0 && !singleForm.plant_id) {
      setSingleForm((prev) => ({ ...prev, plant_id: plantId }));
    }
  }, [plants, searchParams, singleForm.plant_id]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!singleForm.plant_id || !singleForm.care_type_id) {
      setError("Plant and care type are required");
      return;
    }

    setLoading(true);
    try {
      const logData: any = {
        plant_id: parseInt(singleForm.plant_id),
        care_type_id: parseInt(singleForm.care_type_id),
      };

      if (singleForm.care_date) logData.care_date = singleForm.care_date;
      if (singleForm.note) logData.note = singleForm.note;

      const result = await createCareLog(logData);

      // Upload photos if any were selected
      if (selectedFiles.length > 0) {
        try {
          await uploadCareLogPhotos(
            result.care_log.id,
            selectedFiles.map((f) => f.file),
          );
        } catch {
          setSuccess("Care logged, but photo upload failed.");
          clearFiles();
          loadData();
          return;
        }
      }

      setSuccess("Care logged successfully!");
      clearFiles();

      // Reset form
      setSingleForm({
        plant_id: "",
        care_type_id: "",
        care_date: getTodayLocal(),
        note: "",
      });

      // Reload recent logs
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to log care. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSubmit = async () => {
    setError("");
    setSuccess("");

    if (selectedPlants.length === 0 || !multiCareType) {
      setError("Please select at least one plant and a care type");
      return;
    }

    setLoading(true);
    try {
      const careDate = getTodayLocal();

      // Log care for each selected plant
      await Promise.all(
        selectedPlants.map((plantId) =>
          createCareLog({
            plant_id: plantId,
            care_type_id: parseInt(multiCareType),
            care_date: careDate,
            note: multiNote || undefined,
          }),
        ),
      );

      setSuccess(
        `Care logged for ${selectedPlants.length} plant${
          selectedPlants.length > 1 ? "s" : ""
        }!`,
      );

      // Reset
      setSelectedPlants([]);
      setMultiCareType("");
      setMultiNote("");

      // Reload recent logs
      loadData();
    } catch (err: any) {
      console.error(err);
      setError("Failed to log care for some plants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlantSelection = (plantId: number) => {
    setSelectedPlants((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId],
    );
  };

  const getPlantName = (plantId: number) => {
    const plant = plants.find((p) => p.id === plantId);
    return plant?.nickname || `Plant #${plantId}`;
  };

  const getCareTypeName = (careTypeId: number) => {
    const careType = careTypes.find((ct) => ct.id === careTypeId);
    return careType?.name || `Care Type #${careTypeId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Log Care
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Record care activities for your plants
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={!multiMode ? "default" : "outline"}
              onClick={() => setMultiMode(false)}
            >
              Single Plant
            </Button>
            <Button
              variant={multiMode ? "default" : "outline"}
              onClick={() => setMultiMode(true)}
            >
              Multiple Plants
            </Button>
          </div>

          {/* Single Plant Logging */}
          {!multiMode && (
            <Card>
              <CardHeader>
                <CardTitle>Log Care Activity</CardTitle>
                <CardDescription>
                  Record a care activity for one plant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  {/* Plant Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="plant_id">
                      Plant <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={singleForm.plant_id}
                      onValueChange={(value) =>
                        setSingleForm({ ...singleForm, plant_id: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plant" />
                      </SelectTrigger>
                      <SelectContent>
                        {plants.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No plants available
                          </SelectItem>
                        ) : (
                          plants.map((plant) => (
                            <SelectItem
                              key={plant.id}
                              value={plant.id.toString()}
                            >
                              {plant.nickname}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Care Type */}
                  <div className="space-y-2">
                    <Label htmlFor="care_type_id">
                      Care Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={singleForm.care_type_id}
                      onValueChange={(value) =>
                        setSingleForm({ ...singleForm, care_type_id: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select care type" />
                      </SelectTrigger>
                      <SelectContent>
                        {careTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="care_date">Date</Label>
                    <Input
                      id="care_date"
                      type="date"
                      value={singleForm.care_date}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          care_date: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label htmlFor="note">Notes (Optional)</Label>
                    <Input
                      id="note"
                      type="text"
                      placeholder="Any observations or details"
                      value={singleForm.note}
                      onChange={(e) =>
                        setSingleForm({ ...singleForm, note: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  {/* Photos */}
                  <div className="space-y-2">
                    <Label>Photos (Optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((item, idx) => (
                        <div
                          key={item.preview}
                          className="group relative h-16 w-16 overflow-hidden rounded-lg"
                        >
                          <img
                            src={item.preview}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-muted-foreground/50">
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                          className="hidden"
                          onChange={(e) => {
                            addFiles(e.target.files);
                            e.target.value = "";
                          }}
                          disabled={loading}
                        />
                        <CameraIcon className="h-5 w-5 text-muted-foreground" />
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Logging..." : "Log Care"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Multi Plant Logging */}
          {multiMode && (
            <Card>
              <CardHeader>
                <CardTitle>Log Care for Multiple Plants</CardTitle>
                <CardDescription>
                  Select multiple plants to log the same care activity for all
                  at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Care Type */}
                <div className="space-y-2">
                  <Label>
                    Care Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={multiCareType}
                    onValueChange={setMultiCareType}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select care type" />
                    </SelectTrigger>
                    <SelectContent>
                      {careTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plant Selection */}
                <div className="space-y-2">
                  <Label>
                    Select Plants <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                    {plants.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-2">
                        No plants available
                      </p>
                    ) : (
                      plants.map((plant) => (
                        <div
                          key={plant.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`plant-${plant.id}`}
                            checked={selectedPlants.includes(plant.id)}
                            onCheckedChange={() =>
                              togglePlantSelection(plant.id)
                            }
                            disabled={loading}
                          />
                          <Label
                            htmlFor={`plant-${plant.id}`}
                            className="cursor-pointer flex-1"
                          >
                            {plant.nickname}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlants.length} plant
                    {selectedPlants.length !== 1 && "s"} selected
                  </p>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="multi-note">Notes (Optional)</Label>
                  <Input
                    id="multi-note"
                    type="text"
                    placeholder="Notes for all selected plants"
                    value={multiNote}
                    onChange={(e) => setMultiNote(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleMultiSubmit}
                  disabled={loading || selectedPlants.length === 0}
                  className="w-full"
                >
                  {loading
                    ? "Logging..."
                    : `Log Care for ${selectedPlants.length} Plant${
                        selectedPlants.length !== 1 ? "s" : ""
                      }`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Logs */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Recent Care Logs ({recentLogs.length})
            </h2>
            {recentLogs.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    No care logs yet. Start logging care activities above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentLogs.slice(0, 10).map((log, index) => (
                  <Card
                    key={
                      log.id ||
                      `log-${log.plant_id}-${log.care_type_id}-${index}`
                    }
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {getPlantName(log.plant_id)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getCareTypeName(log.care_type_id)}
                            {log.care_date &&
                              ` • ${format(parseLocalDate(log.care_date), "PPP")}`}
                          </p>
                          {log.note && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
