import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { PageLayout } from "@/components/layout/page-layout";
import { StatusAlerts } from "@/components/feedback/status-alerts";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { CareTypeCard } from "@/components/care/care-type-card";
import { EditCareTypeDialog } from "@/components/care/edit-care-type-dialog";
import { useCareTypes } from "@/hooks/use-care-types";
import { useAlerts } from "@/hooks/use-alerts";
import { getErrorMessage } from "@/lib/utils";
import { createCareType, deleteCareType } from "@/api/careTypes";
import type { CareType } from "@/types";

export default function CareTypes() {
  const navigate = useNavigate();
  const {
    defaultCareTypes,
    userCareTypes,
    loading,
    error: loadError,
    reload,
  } = useCareTypes();
  const { success, error, setSuccess, setError } = useAlerts();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingType, setEditingType] = useState<CareType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<CareType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Add form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const handleAdd = async () => {
    if (!formName) {
      setError("Name is required");
      return;
    }

    setFormLoading(true);
    setError("");
    try {
      await createCareType({ name: formName, description: formDesc });
      setSuccess("Care type added successfully!");
      setFormName("");
      setFormDesc("");
      setShowAddForm(false);
      reload();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create care type"));
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
      reload();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete care type"));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <PageLayout
      title="Care Types"
      subtitle="Manage your plant care activity types"
      maxWidth="4xl"
      contentClassName="space-y-8"
      headerActions={
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="shrink-0 w-full sm:w-auto"
        >
          Back to Dashboard
        </Button>
      }
    >
      <StatusAlerts success={success} error={error || loadError} />

      {/* Add Custom Care Type */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">Add Custom Care Type</CardTitle>
              <CardDescription className="hidden sm:block">
                Create your own care activity types
              </CardDescription>
            </div>
            <Button
              variant={showAddForm ? "outline" : "default"}
              onClick={() => setShowAddForm(!showAddForm)}
              className="shrink-0 w-full sm:w-auto"
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
        {loading ? (
          <LoadingState />
        ) : userCareTypes.length === 0 ? (
          <EmptyState message="No custom care types yet. Create one above!" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCareTypes.map((type) => (
              <CareTypeCard
                key={type.id}
                careType={type}
                onEdit={setEditingType}
                onDelete={(ct) => {
                  setTypeToDelete(ct);
                  setDeleteDialogOpen(true);
                }}
              />
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
        {loading ? (
          <LoadingState />
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

      {/* Edit Dialog */}
      <EditCareTypeDialog
        careType={editingType}
        open={editingType !== null}
        onOpenChange={(open) => {
          if (!open) setEditingType(null);
        }}
        onSuccess={() => {
          setSuccess("Care type updated successfully!");
          reload();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Care Type"
        description={
          <>
            Are you sure you want to delete &quot;{typeToDelete?.name}&quot;?
            This will also delete all associated care plans and care logs. This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={formLoading}
        onConfirm={handleDelete}
        error={error}
      />
    </PageLayout>
  );
}
