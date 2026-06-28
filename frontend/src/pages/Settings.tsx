import { useEffect, useState } from "react";
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
import { ModeToggle } from "@/components/theme/mode-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { PageLayout } from "@/components/layout/page-layout";
import { StatusAlerts } from "@/components/feedback/status-alerts";
import { useAlerts } from "@/hooks/use-alerts";
import { getCurrentUser, changePassword } from "@/api/users";
import { getErrorMessage } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const { success, error, setSuccess, setError } = useAlerts();
  const [user, setUser] = useState<{ username: string; email: string } | null>(
    null,
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser({
          username: data.user.username,
          email: data.user.email,
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user information");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [setError]);

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (!user?.email) {
      setError("User email not found. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(
        user.email,
        currentPassword,
        newPassword,
        confirmPassword,
      );
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Settings"
      subtitle="Manage your account settings"
      maxWidth="2xl"
      headerActions={
        <>
          <div className="flex gap-2">
            <ModeToggle />
            <UserMenu />
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto"
          >
            Back to Dashboard
          </Button>
        </>
      }
    >
      <StatusAlerts success={success} error={error} />

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={userLoading ? "Loading..." : user?.username || "N/A"}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={userLoading ? "Loading..." : user?.email || "N/A"}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Changing Password..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
