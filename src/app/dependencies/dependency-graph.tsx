"use client";

import { Card } from "@/components/ui/card";
import {
  Fingerprint,
  Server,
  Database,
  BrainCircuit,
  MessageSquare,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceNodeProps {
  id: string;
  title: string;
  icon: LucideIcon;
  position: { top: string; left: string };
}

const ServiceNode = ({ title, icon: Icon, position }: ServiceNodeProps) => (
  <Card
    id={title.replace(/\s+/g, '-')}
    className="absolute w-40 h-24 flex flex-col items-center justify-center gap-2 p-2 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl"
    style={position}
  >
    <Icon className="w-8 h-8 text-primary" />
    <p className="text-sm font-semibold text-center">{title}</p>
  </Card>
);

const Connector = ({ from, to }: { from: {x: number, y: number}, to: {x: number, y: number} }) => (
    <line
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${to.x}%`}
        y2={`${to.y}%`}
        className="stroke-muted-foreground/50"
        strokeWidth="2"
        markerEnd="url(#arrow)"
    />
);


export function DependencyGraph() {
  const nodes: ServiceNodeProps[] = [
    { id: "hosting", title: "Firebase Hosting", icon: Server, position: { top: "2rem", left: "5%" } },
    { id: "auth", title: "Firebase Auth", icon: Fingerprint, position: { top: "12rem", left: "5%" } },
    { id: "firestore", title: "Firestore", icon: Database, position: { top: "22rem", left: "5%" } },
    { id: "llm", title: "Gemini LLM", icon: BrainCircuit, position: { top: "2rem", left: "calc(95% - 10rem)" } },
    { id: "twilio", title: "Twilio", icon: MessageSquare, position: { top: "12rem", left: "calc(95% - 10rem)" } },
    { id: "nodemailer", title: "Nodemailer", icon: Mail, position: { top: "22rem", left: "calc(95% - 10rem)" } },
  ];
  
  const connections = [
    { from: {x: 23, y: 19}, to: {x: 23, y: 36} }, // Hosting -> Auth
    { from: {x: 23, y: 49}, to: {x: 23, y: 66} }, // Auth -> Firestore
    { from: {x: 23, y: 19}, to: {x: 77, y: 19} }, // Hosting -> LLM
    { from: {x: 77, y: 19}, to: {x: 77, y: 36} }, // LLM -> Twilio
    { from: {x: 77, y: 19}, to: {x: 77, y: 66} }, // LLM -> Nodemailer
  ];

  return (
    <div className="relative w-full h-[32rem] rounded-lg border bg-card/50 overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6"
                    orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground/50" />
                </marker>
            </defs>
            {connections.map((conn, i) => (
                <Connector key={i} from={conn.from} to={conn.to} />
            ))}
        </svg>
      {nodes.map((node) => (
        <ServiceNode key={node.id} {...node} />
      ))}
    </div>
  );
}
