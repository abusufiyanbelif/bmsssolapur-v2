
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Banknote } from "lucide-react";

// Static data for Board Members
const boardMembers = {
  founder: [
    { name: "Moosa Shaikh", phone: "8421708907" },
  ],
  cofounder: [
    { name: "Abu Rehan Bedrekar", phone: "7276224160" },
  ],
  finance: [
    { name: "Maaz Shaikh", phone: "9372145889" },
  ],
  members: [
    { name: "Abusufiyan Belif", phone: "7887646583" },
    { name: "Nayyar Ahmed Karajgi", phone: "9028976036" },
    { name: "Arif Baig", phone: "9225747045" },
    { name: "Mazhar Shaikh", phone: "8087669914" },
    { name: "Mujahid Chabukswar", phone: "8087420544" },
    { name: "Muddasir", phone: "7385557820" },
  ]
};

const MemberCard = ({ member }: { member: { name: string, phone: string } }) => {
    const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return (
        <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Avatar>
                <AvatarImage src={`https://placehold.co/100x100.png?text=${initials}`} alt={member.name} data-ai-hint="male portrait" />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.phone}</p>
            </div>
        </div>
    );
};


export default function BoardMembersPage() {
  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Board Members</h2>
         <Card id="board-members">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    Our Team
                </CardTitle>
                <CardDescription>
                    The dedicated individuals leading our organization and its mission.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {boardMembers.founder.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Founder</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {boardMembers.founder.map(member => <MemberCard key={member.phone} member={member} />)}
                        </div>
                    </div>
                )}
                    {boardMembers.cofounder.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Co-Founder</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {boardMembers.cofounder.map(member => <MemberCard key={member.phone} member={member} />)}
                        </div>
                    </div>
                    )}
                    {boardMembers.finance.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Banknote className="h-5 w-5" /> Finance</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {boardMembers.finance.map(member => <MemberCard key={member.phone} member={member} />)}
                        </div>
                    </div>
                )}
                {boardMembers.members.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Members</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {boardMembers.members.map(member => <MemberCard key={member.phone} member={member} />)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
