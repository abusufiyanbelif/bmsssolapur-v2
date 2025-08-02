import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Fingerprint, Server, MessageSquare, Mail, BrainCircuit, Database } from "lucide-react"

const services = [
  { name: "Firebase Authentication", type: "Authentication", id: "baitulmal-connect-auth", status: "Active", icon: Fingerprint },
  { name: "Firebase Hosting", type: "Hosting", id: "baitulmal-connect-web", status: "Active", icon: Server },
  { name: "Firestore", type: "Database", id: "baitulmal-connect-db", status: "Active", icon: Database },
  { name: "Gemini LLM", type: "AI/ML", id: "genai-gemini-api", status: "Active", icon: BrainCircuit },
  { name: "Twilio", type: "Messaging", id: "ACxxxxxxxxxxxxxxxxxxxxx", status: "Active", icon: MessageSquare },
  { name: "Nodemailer", type: "Email", id: "nodemailer-smtp-pool", status: "Inactive", icon: Mail },
];

export default function ServicesPage() {
  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Services Summary</h2>
        <Card>
            <CardHeader>
                <CardTitle>Configuration Overview</CardTitle>
                <CardDescription>
                    List of all Firebase and external services used in the project.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Service</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>ID / Account</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.name}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <service.icon className="h-5 w-5 text-muted-foreground" />
                                        {service.name}
                                    </div>
                                </TableCell>
                                <TableCell>{service.type}</TableCell>
                                <TableCell className="font-mono text-sm">{service.id}</TableCell>
                                <TableCell>
                                    <Badge variant={service.status === "Active" ? "default" : "secondary"} className={service.status === "Active" ? "bg-green-500/20 text-green-700 border-green-500/30" : ""}>
                                        {service.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
