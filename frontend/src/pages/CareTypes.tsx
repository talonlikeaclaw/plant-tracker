import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2Icon, PencilIcon, AlertCircleIcon } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getDefaultCareTypes,
  getUserCareTypes,
  createCareType,
  updateCareType,
  deleteCareType,
} from "@/api/careTypes";
import type { CareType } from "@/types";

export default function CareTypes() {
  const navigate = useNavigate();
  const [defaultCareTypes, setDefaultCareTypes] = useState<CareType[]>([]);
  const [userCareTypes, setUserCareTypes] = useState<CareType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingType, setEditingType] = useState<CareType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CareType | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCareTypes = async () => {
    try {
      const [defaultRes, userRes] = await Promise.all([
        getDefaultCareTypes(),
        getUserCareTypes().catch(() => ({ care_types: [] })),
      ]);

      setDefaultCareTypes(defaultRes.care_types ?? []);
      setUserCareTypes(userRes.care_types ?? []);
    } catch (err) {
      console.error("Failed to load care types:", err);
      setError("Failed to load care types");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCareTypes();
  }, []);

  const handleAdd = async () => {
    if (!formName) {
      setError("Name is required");
      return;
    }

    setFormLoading(true);
    setError("");
    try {
      await createCareType({
        name: formName,
        description: formDesc,
      });

      setSuccess("Care type added successfully!");
      setFormName("");
      setFormDesc("");
      setShowAddForm(false);
      loadCareTypes();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to create care type"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingType || !formName) return;

    setFormLoading(true);
    setError("");
    try {
      await updateCareType(editingType.id, {
        name: formName,
        description: formDesc,
      });

      setSuccess("Care type updated successfully!");
      setFormName("");
      setFormDesc("");
      setEditingType(null);
      loadCareTypes();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to update care type"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    setFormLoading(true);
    setError("");
    try {
      await deleteCareType(typeToDelete.id);
      setSuccess("Care type deleted successfully!");
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      loadCareTypes();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to delete care type"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (careType: CareType) => {
    setEditingType(careType);
    setFormName(careType.name);
    setFormDesc(careType.description || "");
  };

  const closeEditDialog = () => {
    setEditingType(null);
    setFormName("");
    setFormDesc("");
  };

  const openDeleteDialog = (careType: CareType) => {
    setTypeToDelete(careType);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Care Types
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your plant care activity types
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
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

          {/* Add Custom Care Type */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Add Custom Care Type</CardTitle>
                  <CardDescription>
                    Create your own care activity types
                  </CardDescription>
                </div>
                <Button
                  variant={showAddForm ? "outline" : "default"}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? "Hide Form" : "Add Custom Type"}
                </Button>
              </div>
            </CardHeader>
            {showAddForm && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Pruning, Misting, Repotting"
                    disabled={formLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief description"
                    disabled={formLoading}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleAdd}
                    disabled={formLoading || !formName}
                    className="flex-1"
                  >
                    {formLoading ? "Adding..." : "Add Care Type"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Your Custom Care Types */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Your Custom Types ({userCareTypes.length})
            </h2>
            {isLoading ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    Loading...
                  </p>
                </CardContent>
              </Card>
            ) : userCareTypes.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    No custom care types yet. Create one above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCareTypes.map((type) => (
                  <Card key={type.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                          {type.description && (
                            <CardDescription>{type.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {/* Edit Dialog */}
                          <Dialog
                            open={editingType?.id === type.id}
                            onOpenChange={(open) => {
                              if (!open) closeEditDialog();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(type)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Care Type</DialogTitle>
                                <DialogDescription>
                                  Update the name and description
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    disabled={formLoading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-desc">Description</Label>
                                  <Input
                                    id="edit-desc"
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    disabled={formLoading}
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleEdit}
                                    disabled={formLoading || !formName}
                                    className="flex-1"
                                  >
                                    {formLoading ? "Saving..." : "Save Changes"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={closeEditDialog}
                                    disabled={formLoading}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(type)}
                          >
                            <Trash2Icon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* System Default Care Types */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              System Default Types ({defaultCareTypes.length})
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              These are standard care types available to all users and cannot be
              edited or deleted.
            </p>
            {isLoading ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    Loading...
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {defaultCareTypes.map((type) => (
                  <Card key={type.id} className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      {type.description && (
                        <CardDescription>{type.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Care Type</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{typeToDelete?.name}"? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={formLoading}
                >
                  {formLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
