import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCardProps {
  title: string;
  description: string;
  value: number | string;
  loading?: boolean;
}

/**
 * "At a Glance" statistic card.
 *
 * Shows a muted "Loading..." placeholder while data is being fetched.
 */
export function StatCard({
  title,
  description,
  value,
  loading,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-2xl font-bold text-muted-foreground">Loading...</p>
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
