import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, PiggyBank, Send, TrendingUp, TrendingDown, Hourglass, CheckCircle, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";

const metrics = [
  {
    title: "Total Raised",
    value: "₹50,000",
    icon: TrendingUp,
    description: "Total donations received.",
  },
  {
    title: "Total Distributed",
    value: "₹32,000",
    icon: HandCoins,
    description: "Total funds given to leads.",
  },
  {
    title: "Pending to Disburse",
    value: "₹18,000",
    icon: Hourglass,
    description: "Available funds for distribution.",
  },
  {
    title: "Total Beneficiaries Helped",
    value: "12 leads",
    icon: Users,
    description: "Total number of cases managed.",
  },
  {
    title: "Cases Fully Closed",
    value: "8",
    icon: CheckCircle,
    description: "Leads where help is complete.",
  },
  {
    title: "Cases Pending",
    value: "4",
    icon: PiggyBank,
    description: "Leads awaiting assistance.",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Test Notifications
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <CardTitle className="font-headline">Donations Overview (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Donations chart placeholder</p>
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
