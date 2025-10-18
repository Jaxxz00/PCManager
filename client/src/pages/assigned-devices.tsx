import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Pc, Asset, Employee } from "@shared/schema";

type PcWithEmp = Pc & { employee?: Pick<Employee, 'id' | 'name' | 'email'> | null };

export default function AssignedDevices() {
  const [location] = useLocation();
  const search = typeof window !== 'undefined' ? window.location.search : (location.includes('?') ? location.slice(location.indexOf('?')) : '');
  const params = new URLSearchParams(search);
  const selectedEmployeeId = params.get('employeeId') || (typeof window !== 'undefined' ? sessionStorage.getItem('selectedEmployeeId') : null);
  const { data: pcs = [] } = useQuery<PcWithEmp[]>({ queryKey: ["/api/pcs"] });
  const { data: assets = [] } = useQuery<Asset[]>({ queryKey: ["/api/assets"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  const employeeMap = new Map(employees.map(e => [e.id, e]));
  const assignedPcs = pcs.filter((pc) => pc.employeeId && (!selectedEmployeeId || pc.employeeId === selectedEmployeeId));
  const assignedAssets = assets.filter((a) => a.employeeId && (!selectedEmployeeId || a.employeeId === selectedEmployeeId));
  const currentEmployee = selectedEmployeeId ? employeeMap.get(selectedEmployeeId) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dispositivi Assegnati</h1>
          {currentEmployee ? (
            <p className="text-muted-foreground">Per: <span className="font-semibold">{(currentEmployee as any).name || (currentEmployee as any).firstName?.concat(' ', (currentEmployee as any).lastName || '')}</span> • {(currentEmployee as any).email}</p>
          ) : (
            <p className="text-muted-foreground">PC e asset associati ai collaboratori</p>
          )}
        </div>
        <Link href="/employees" className="text-sm text-blue-600">← Torna ai Collaboratori</Link>
      </div>

      {selectedEmployeeId && !currentEmployee && (
        <div className="text-sm text-red-600">Collaboratore non trovato.</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PC Assegnati <Badge variant="secondary" className="ml-2">{assignedPcs.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PC ID</TableHead>
                    <TableHead>Modello</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Collaboratore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedPcs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Nessun PC assegnato</TableCell>
                    </TableRow>
                  ) : assignedPcs.map((pc) => {
                    const emp = pc.employee || (pc.employeeId ? employeeMap.get(pc.employeeId) : undefined) || null;
                    return (
                      <TableRow key={pc.id}>
                        <TableCell className="font-medium">{pc.pcId}</TableCell>
                        <TableCell>{pc.brand} {pc.model}</TableCell>
                        <TableCell>{pc.serialNumber}</TableCell>
                        <TableCell>{emp ? (<>
                          <div className="font-medium">{(emp as any).name || (emp as any).firstName?.concat(' ', (emp as any).lastName || '')}</div>
                          <div className="text-xs text-muted-foreground">{(emp as any).email}</div>
                        </>) : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Assegnati <Badge variant="secondary" className="ml-2">{assignedAssets.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Modello</TableHead>
                    <TableHead>Collaboratore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Nessun asset assegnato</TableCell>
                    </TableRow>
                  ) : assignedAssets.map((a) => {
                    const emp = a.employeeId ? employeeMap.get(a.employeeId) : undefined;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.assetCode}</TableCell>
                        <TableCell><Badge variant="outline">{a.assetType}</Badge></TableCell>
                        <TableCell>{a.brand} {a.model}</TableCell>
                        <TableCell>{emp ? (<>
                          <div className="font-medium">{(emp as any).name || (emp as any).firstName?.concat(' ', (emp as any).lastName || '')}</div>
                          <div className="text-xs text-muted-foreground">{(emp as any).email}</div>
                        </>) : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


