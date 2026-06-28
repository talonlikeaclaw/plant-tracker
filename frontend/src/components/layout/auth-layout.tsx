import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/theme/mode-toggle";

interface AuthLayoutProps {
  title: string;
  /** Override the CardTitle classes. */
  titleClassName?: string;
  children: ReactNode;
}

/**
 * Split-screen layout shared by the Login and Register pages.
 */
export function AuthLayout({
  title,
  titleClassName,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-muted">
        <Card className="w-[400px] p-6 bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className={titleClassName}>{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>

      <div className="hidden md:flex w-1/2 items-center justify-center bg-primary/10">
        <p className="text-2xl font-bold text-foreground">
          Welcome to PlantTracker 🌿
        </p>
      </div>
    </div>
  );
}
