import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Asset, Employee } from "@shared/schema";

// Helper function per ottenere il nome dell'employee
const getEmployeeName = (employee: Employee): string => {
  return employee.name || 'Nome non disponibile';
};

export default function AssignedDevices() {
  const [location] = useLocation();
  const search = typeof window !== 'undefined' ? window.location.search : (location.includes('?') ? location.slice(location.indexOf('?')) : '');
  const params = new URLSearchParams(search);
  const selectedEmployeeId = params.get('employeeId') || (typeof window !== 'undefined' ? sessionStorage.getItem('selectedEmployeeId') : null);
  
  const { data: allAssets = [], isLoading: assetsLoading } = useQuery<Asset[]>({ 
    queryKey: ["/api/assets/all-including-pcs"] 
  });
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({ 
    queryKey: ["/api/employees"] 
  });

  const employeeMap = new Map(employees.map(e => [e.id, e]));
  
  // Filtra solo asset assegnati
  const assignedAssets = allAssets.filter((asset) => 
    asset.employeeId && (!selectedEmployeeId || asset.employeeId === selectedEmployeeId)
  );
  
  // Separare Computer e altri asset
  const assignedComputers = assignedAssets.filter(asset => asset.assetType === 'computer');
  const assignedOtherAssets = assignedAssets.filter(asset => asset.assetType !== 'computer');
  
  const currentEmployee = selectedEmployeeId ? employeeMap.get(selectedEmployeeId) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dispositivi Assegnati</h1>
          {currentEmployee ? (
            <p className="text-muted-foreground">
              Per: <span className="font-semibold">{getEmployeeName(currentEmployee)}</span> • {currentEmployee.email}
            </p>
          ) : (
            <p className="text-muted-foreground">Computer e asset associati ai collaboratori</p>
          )}
        </div>
        <Link href="/employees" className="text-sm text-blue-600">← Torna ai Collaboratori</Link>
      </div>

      {selectedEmployeeId && !currentEmployee && (
        <div className="text-sm text-red-600">Collaboratore non trovato.</div>
      )}

      {assetsLoading || employeesLoading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Caricamento dispositivi...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Computer Assegnati <Badge variant="secondary" className="ml-2">{assignedComputers.length}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Modello</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Collaboratore</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedComputers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">Nessun computer assegnato</TableCell>
                      </TableRow>
                    ) : assignedComputers.map((computer) => {
                      const employee = computer.employeeId ? employeeMap.get(computer.employeeId) : undefined;
                      return (
                        <TableRow key={computer.id}>
                          <TableCell className="font-medium">{computer.assetCode}</TableCell>
                          <TableCell>{computer.brand} {computer.model}</TableCell>
                          <TableCell>{computer.serialNumber}</TableCell>
                          <TableCell>
                            {employee ? (
                              <>
                                <div className="font-medium">{getEmployeeName(employee)}</div>
                                <div className="text-xs text-muted-foreground">{employee.email}</div>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
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
              <CardTitle>Altri Asset Assegnati <Badge variant="secondary" className="ml-2">{assignedOtherAssets.length}</Badge></CardTitle>
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
                    {assignedOtherAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">Nessun asset assegnato</TableCell>
                      </TableRow>
                    ) : assignedOtherAssets.map((asset) => {
                      const employee = asset.employeeId ? employeeMap.get(asset.employeeId) : undefined;
                      return (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.assetCode}</TableCell>
                          <TableCell><Badge variant="outline">{asset.assetType}</Badge></TableCell>
                          <TableCell>{asset.brand} {asset.model}</TableCell>
                          <TableCell>
                            {employee ? (
                              <>
                                <div className="font-medium">{getEmployeeName(employee)}</div>
                                <div className="text-xs text-muted-foreground">{employee.email}</div>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


