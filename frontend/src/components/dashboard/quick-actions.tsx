import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onNavigate: (path: string) => void;
}

/**
 * The dashboard "Quick Actions" grid: six navigation shortcuts.
 */
export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Button
          variant="default"
          className="w-full"
          onClick={() => onNavigate("/plants")}
        >
          Your Plants
        </Button>
        <Button
          variant="default"
          className="w-full"
          onClick={() => onNavigate("/plants/add")}
        >
          Add Plant
        </Button>
        <Button
          variant="default"
          className="w-full"
          onClick={() => onNavigate("/species")}
        >
          Species
        </Button>
        <Button
          variant="default"
          className="w-full"
          onClick={() => onNavigate("/log-care")}
        >
          Log Care
        </Button>
        <Button
          variant="default"
          className="w-full"
          onClick={() => onNavigate("/care-plans")}
        >
          Care Plans
        </Button>
        <Button
          variant="default"
          className="w-full"
          onClick={() => onNavigate("/care-types")}
        >
          Care Types
        </Button>
      </div>
    </section>
  );
}
