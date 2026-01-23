import { Link } from "wouter";
import { Box, Search, BarChart3, ArrowRight, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Material Entry",
    description: "Register incoming materials into racks & bins.",
    icon: ArrowDownToLine,
    href: "/entry",
    color: "bg-blue-500/10 text-blue-600",
    hoverBorder: "hover:border-blue-500/50",
  },
  {
    title: "Material Issue",
    description: "Authorize and disburse materials for production.",
    icon: ArrowUpFromLine,
    href: "/issue",
    color: "bg-orange-500/10 text-orange-600",
    hoverBorder: "hover:border-orange-500/50",
  },
  {
    title: "Inventory Search",
    description: "Locate items quickly by code, rack, or status.",
    icon: Search,
    href: "/search",
    color: "bg-emerald-500/10 text-emerald-600",
    hoverBorder: "hover:border-emerald-500/50",
  },
  {
    title: "Dashboard",
    description: "View real-time analytics, logs, and stock alerts.",
    icon: BarChart3,
    href: "/dashboard",
    color: "bg-purple-500/10 text-purple-600",
    hoverBorder: "hover:border-purple-500/50",
  },
];

export default function Home() {
  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Inventory Control <span className="text-primary">System</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your trims, track stock movements, and optimize production flow with precision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.href} className="group">
            <Card className={cn(
              "h-full transition-all duration-300 hover:shadow-lg border-2 cursor-pointer",
              feature.hoverBorder
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={cn("p-3 rounded-xl", feature.color)}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="text-xl font-display">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats or Status Indicator could go here */}
      <div className="flex justify-center pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-medium border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          System Operational • v1.0.0
        </div>
      </div>
    </div>
  );
}
