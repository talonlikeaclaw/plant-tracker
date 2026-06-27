import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PageMaxWidth = "2xl" | "4xl" | "6xl" | "none";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  /** Override the <h1> classes. Defaults to the standard page title style. */
  titleClassName?: string;
  /** Override the subtitle <p> classes. Defaults to a hidden-on-mobile style. */
  subtitleClassName?: string;
  /** Optional back link rendered above the title. */
  backLink?: { label: string; onClick: () => void };
  /** Right-aligned header actions (buttons, toggles, etc.). */
  headerActions?: ReactNode;
  /** Classes for the actions wrapper. */
  actionsClassName?: string;
  /** Max width of the content column. */
  maxWidth?: PageMaxWidth;
  /** Extra classes for the content wrapper. */
  contentClassName?: string;
  /** Skip the header entirely (used for loading/error states). */
  hideHeader?: boolean;
  children: ReactNode;
}

const maxWidthClass: Record<PageMaxWidth, string> = {
  "2xl": "max-w-2xl mx-auto",
  "4xl": "max-w-4xl mx-auto",
  "6xl": "max-w-6xl mx-auto",
  none: "",
};

/**
 * Standard authenticated-page shell: sticky-style header
 * (title + subtitle + actions) over a centered main content column.
 */
export function PageLayout({
  title,
  subtitle,
  titleClassName = "text-xl sm:text-2xl font-bold text-foreground truncate",
  subtitleClassName = "text-sm text-muted-foreground mt-1 hidden sm:block",
  backLink,
  headerActions,
  actionsClassName = "flex flex-col sm:flex-row gap-2 shrink-0",
  maxWidth = "4xl",
  contentClassName = "space-y-6",
  hideHeader = false,
  children,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && (
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {backLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={backLink.onClick}
                    className="mb-1 p-0 h-auto"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                    {backLink.label}
                  </Button>
                )}
                <h1 className={titleClassName}>{title}</h1>
                {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
              </div>
              {headerActions && (
                <div className={actionsClassName}>{headerActions}</div>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className={cn(maxWidthClass[maxWidth], contentClassName)}>
          {children}
        </div>
      </main>
    </div>
  );
}
