import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Mail } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  phone_e164: string | null;
  email: string | null;
  tags: string[] | null;
  attributes: any;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

interface ContactStatsProps {
  contacts: Contact[];
  contactListsCount: number;
}

export function ContactStats({ contacts, contactListsCount }: ContactStatsProps) {
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => !c.is_blocked).length;
  const blockedContacts = contacts.filter(c => c.is_blocked).length;
  const contactsWithEmail = contacts.filter(c => c.email).length;

  const stats = [
    {
      title: "Total Contatos",
      value: totalContacts,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Ativos",
      value: activeContacts,
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Bloqueados",
      value: blockedContacts,
      icon: UserX,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Com Email",
      value: contactsWithEmail,
      icon: Mail,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    }
  ];

  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="gradient-text">Estatísticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-2xl ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{stat.title}</span>
              </div>
              <span className={`font-bold ${stat.color}`}>
                {stat.value.toLocaleString()}
              </span>
            </div>
          );
        })}
        
        <div className="border-t border-glass-border pt-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Listas Criadas</span>
            <span className="font-bold text-foreground">{contactListsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}