import { useState } from "react";
import { useMaterials } from "@/hooks/use-materials";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Package, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Search() {
  const [query, setQuery] = useState("");
  const { data: materials, isLoading } = useMaterials(query);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Inventory Search</h1>
          <p className="text-muted-foreground">Find materials across all racks and bins.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input 
          className="pl-10 h-12 text-lg" 
          placeholder="Search by Code, Name, or Rack..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-24 w-full rounded-xl" />
           ))
        ) : materials?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No materials found matching "{query}"</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/entry">Register New Material</Link>
            </Button>
          </div>
        ) : (
          materials?.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg font-mono">{material.materialCode}</h3>
                      {material.quantity < 10 && (
                        <Badge variant="destructive" className="text-[10px] h-5">LOW STOCK</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{material.name || "No description"}</p>
                    <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Rack: <span className="text-foreground">{material.rackId}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        Bin: <span className="text-foreground">{material.binNumber}</span>
                      </span>
                      {material.lastUpdated && (
                        <span className="hidden sm:inline">
                          Updated: {format(new Date(material.lastUpdated), "MMM d, HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0">
                  <div className="text-right flex-1 md:flex-none">
                    <span className="block text-2xl font-bold font-display">{material.quantity}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Available</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/entry?code=${material.materialCode}`}>Add Stock</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/issue?code=${material.materialCode}`}>Issue</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
