import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auditTasks, formatCurrency, getStatusColor } from "@/data/mockData";
import { Search, Filter, Clock, AlertTriangle, CheckCircle2, Pause, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const AuditTasks = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = auditTasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status.toLowerCase().replace(" ", "-") === filter;
    const matchesSearch = 
      task.taxpayerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.riskName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const tasksByStatus = {
    assigned: auditTasks.filter((t) => t.status === "Assigned").length,
    inProgress: auditTasks.filter((t) => t.status === "In Progress").length,
    underReview: auditTasks.filter((t) => t.status === "Under Review").length,
    completed: auditTasks.filter((t) => t.status === "Completed").length,
    onHold: auditTasks.filter((t) => t.status === "On Hold").length,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-destructive text-destructive-foreground";
      case "High":
        return "bg-warning text-warning-foreground";
      case "Medium":
        return "bg-accent text-accent-foreground";
      case "Low":
        return "bg-info text-info-foreground";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Assigned":
        return <Clock className="h-4 w-4" />;
      case "In Progress":
        return <PlayCircle className="h-4 w-4" />;
      case "Under Review":
        return <AlertTriangle className="h-4 w-4" />;
      case "Completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "On Hold":
        return <Pause className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Audit Tasks Management">
      <div className="space-y-6">
        {/* Status Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilter("assigned")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tasksByStatus.assigned}</p>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilter("in-progress")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <PlayCircle className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tasksByStatus.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilter("under-review")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tasksByStatus.underReview}</p>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilter("completed")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tasksByStatus.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilter("on-hold")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Pause className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tasksByStatus.onHold}</p>
                  <p className="text-sm text-muted-foreground">On Hold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Audit Task Queue</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[250px]"
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  New Task
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Taxpayer</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Exposure</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{task.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.taxpayerName}</p>
                        <p className="text-xs text-muted-foreground">{task.tin}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.riskName}</Badge>
                    </TableCell>
                    <TableCell>{task.assignedTo}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", getStatusColor(task.status))}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        new Date(task.dueDate) < new Date() && task.status !== "Completed" 
                          ? "text-destructive font-medium" 
                          : ""
                      )}>
                        {task.dueDate}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(task.exposureAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tasks found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AuditTasks;
