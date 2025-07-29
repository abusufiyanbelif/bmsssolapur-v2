import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Users, Briefcase } from "lucide-react";

const metrics = [
  {
    title: "Total Donations",
    value: "$42,854",
    icon: DollarSign,
    description: "+12.5% from last month",
  },
  {
    title: "Upcoming Events",
    value: "5",
    icon: Calendar,
    description: "2 scheduled for this week",
  },
  {
    title: "New Members",
    value: "152",
    icon: Users,
    description: "+28% from last month",
  },
  {
    title: "Active Projects",
    value: "8",
    icon: Briefcase,
    description: "3 new projects started",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="font-headline">Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Overview chart placeholder</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Recent activity feed placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
