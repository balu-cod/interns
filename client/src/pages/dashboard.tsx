import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, RefreshCw, AlertTriangle, Trash2, FileDown, Radio } from "lucide-react";
import { format } from "date-fns";
import type { Material, Transaction, DashboardStats } from "@shared/schema";

const ADMIN_USERNAME = "ADMIN";
const ADMIN_PASSWORD = "54321";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuth", "true");
      setError("");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuth");
    setUsername("");
    setPassword("");
  };

  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const { data: materials, isLoading: isMaterialsLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    enabled: isAuthenticated,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-display">Security Clearance</CardTitle>
            <p className="text-muted-foreground text-sm">Restricted Area: Administrator Authentication Required</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ident-Code</label>
                <Input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pass-Key</label>
                <Input 
                  type="password" 
                  placeholder="********" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit"
                className="w-full"
                data-testid="button-authenticate"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Authenticate
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lowStockItems = materials?.filter(m => m.quantity <= 100) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
          LOGOUT
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">LOW STOCK WARNING</AlertTitle>
          <AlertDescription className="text-amber-700">
            The following items are at or below 100 units: {lowStockItems.map(item => item.materialCode).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-display font-bold tracking-tight">SYSTEM OVERVIEW</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" data-testid="button-export-report">
            <FileDown className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Radio className="h-4 w-4 animate-pulse" />
            <span className="font-medium">LIVE UPDATE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isStatsLoading ? (
          <>
            <Card className="h-32 animate-pulse bg-muted" />
            <Card className="h-32 animate-pulse bg-muted" />
            <Card className="h-32 animate-pulse bg-muted" />
          </>
        ) : (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalMaterials || 0}</div>
                <p className="text-xs text-primary">In Stock</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Entered Today</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.enteredToday || 0}</div>
                <p className="text-xs text-blue-600">+ Today</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Issued Today</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.issuedToday || 0}</div>
                <p className="text-xs text-orange-600">Today</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isMaterialsLoading ? (
                <div className="h-48 animate-pulse bg-muted rounded" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">MATERIAL CODE</TableHead>
                        <TableHead className="font-semibold text-center">ENTERED QTY</TableHead>
                        <TableHead className="font-semibold text-center">ISSUED QTY</TableHead>
                        <TableHead className="font-semibold text-center">BALANCE QTY</TableHead>
                        <TableHead className="font-semibold">LOCATION</TableHead>
                        <TableHead className="font-semibold">ENTERED BY</TableHead>
                        <TableHead className="font-semibold">ISSUED BY</TableHead>
                        <TableHead className="font-semibold">LAST UPDATED (IST)</TableHead>
                        <TableHead className="font-semibold text-center">ACT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No materials in inventory
                          </TableCell>
                        </TableRow>
                      ) : (
                        materials?.map((material) => {
                          const entryTx = transactions?.filter(t => t.materialCode === material.materialCode && t.type === "ENTRY");
                          const issueTx = transactions?.filter(t => t.materialCode === material.materialCode && t.type === "ISSUE");
                          const enteredQty = entryTx?.reduce((sum, t) => sum + t.quantity, 0) || 0;
                          const issuedQty = issueTx?.reduce((sum, t) => sum + t.quantity, 0) || 0;
                          const lastEntry = entryTx?.length ? entryTx[0] : null;
                          const lastIssue = issueTx?.length ? issueTx[0] : null;

                          return (
                            <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                              <TableCell className="font-medium">{material.materialCode}</TableCell>
                              <TableCell className="text-center">{enteredQty > 0 ? enteredQty : "-"}</TableCell>
                              <TableCell className="text-center">{issuedQty > 0 ? issuedQty : "-"}</TableCell>
                              <TableCell className="text-center font-bold">{material.quantity}</TableCell>
                              <TableCell>{material.rackId}-{material.binNumber}</TableCell>
                              <TableCell>{lastEntry?.personName || "-"}</TableCell>
                              <TableCell>{lastIssue?.personName || "-"}</TableCell>
                              <TableCell className="text-sm">
                                {material.lastUpdated ? format(new Date(material.lastUpdated), "dd/MM/yyyy HH:mm") : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    data-testid={`button-delete-${material.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display">Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions?.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {transactions?.slice(0, 8).map((tx) => (
                    <div key={tx.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${tx.type === "ENTRY" ? "bg-blue-500" : "bg-orange-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {tx.type === "ENTRY" ? "Entry" : "Issue"}: {tx.materialCode}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {tx.quantity} units by {tx.personName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {tx.timestamp ? format(new Date(tx.timestamp), "dd/MM/yyyy HH:mm") : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
