
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DependencyGraph } from "./dependency-graph";

export default function DependencyMapPage() {
  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dependency Map</h2>
      <Card>
        <CardHeader>
          <CardTitle>Service Dependencies</CardTitle>
          <CardDescription>
            Visual diagram illustrating the connections between services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DependencyGraph />
        </CardContent>
      </Card>
    </div>
  );
}

    