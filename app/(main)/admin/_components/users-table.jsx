"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Loader2, Users, ExternalLink, ShieldCheck } from "lucide-react";
import { changeUserRole } from "@/actions/admin";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

export default function UsersTable({ users = [] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [changing, setChanging] = useState({});

  // Filtered users calculation
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || u.role === filter;
    return matchSearch && matchFilter;
  });

  // Role Counts
  const patientCount = users.filter((u) => u.role === "PATIENT").length;
  const doctorCount = users.filter((u) => u.role === "DOCTOR").length;
  const ashaCount = users.filter((u) => u.role === "ASHA_WORKER").length;
  const unassignedCount = users.filter((u) => u.role === "UNASSIGNED" || !u.role).length;

  const handleMakeAdmin = async (userId) => {
    if (!confirm("Are you sure you want to promote this user to Admin?")) return;

    setChanging((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await changeUserRole(userId, "ADMIN");
      if (res.success) {
        toast.success("User promoted to Admin successfully!");
      } else {
        toast.error("Failed to promote user to Admin.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to change user role.");
    } finally {
      setChanging((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm border-t-4 border-t-sky-500 animate-in fade-in duration-300">
      <CardHeader className="border-b border-border pb-4 bg-sky-50/30 dark:bg-sky-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-500" />
              Users
            </CardTitle>
            <Badge variant="outline" className="bg-sky-100/50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 font-bold border-sky-200">
              {users.length} Total
            </Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                className="pl-9 bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Role Filter Select */}
            <Select onValueChange={(val) => setFilter(val)} value={filter}>
              <SelectTrigger className="w-full sm:w-44 bg-background border-border">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="PATIENT">Patients</SelectItem>
                <SelectItem value="DOCTOR">Doctors</SelectItem>
                <SelectItem value="ASHA_WORKER">ASHA Workers</SelectItem>
                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Stats Row */}
        <div className="bg-muted/40 border-b border-border p-4 flex flex-wrap gap-4 text-xs font-bold text-foreground justify-center sm:justify-start">
          <Badge variant="outline" className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            {patientCount} Patients
          </Badge>
          <Badge variant="outline" className="bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            {doctorCount} Doctors
          </Badge>
          <Badge variant="outline" className="bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            {ashaCount} ASHA Workers
          </Badge>
          <Badge variant="outline" className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800">
            {unassignedCount} Unassigned
          </Badge>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Activity</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground italic">
                    No users match your search
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  // Role badge colors mapping
                  const getRoleBadge = (role) => {
                    switch (role) {
                      case "PATIENT":
                        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none text-[10px]">PATIENT</Badge>;
                      case "DOCTOR":
                        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none text-[10px]">DOCTOR</Badge>;
                      case "ASHA_WORKER":
                        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px]">ASHA WORKER</Badge>;
                      case "ADMIN":
                        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none text-[10px]">ADMIN</Badge>;
                      case "OWNER":
                        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-none text-[10px]">OWNER</Badge>;
                      default:
                        return <Badge className="bg-slate-400 hover:bg-slate-500 text-white border-none text-[10px]">{role || "UNASSIGNED"}</Badge>;
                    }
                  };

                  // Verification Status (for DOCTORs only)
                  const getStatusBadge = (user) => {
                    if (user.role !== "DOCTOR") return <span className="text-muted-foreground/30">—</span>;
                    switch (user.verificationStatus) {
                      case "VERIFIED":
                        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 text-[10px] hover:bg-emerald-100">VERIFIED</Badge>;
                      case "PENDING":
                        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 text-[10px] hover:bg-amber-100">PENDING</Badge>;
                      case "REJECTED":
                        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-200 text-[10px] hover:bg-red-100">REJECTED</Badge>;
                      default:
                        return <Badge className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] hover:bg-slate-100">UNKNOWN</Badge>;
                    }
                  };

                  // Activity mappings depending on role
                  const getActivityText = (user) => {
                    const count = user._count || {};
                    if (user.role === "PATIENT") {
                      return `${count.patientAppointments || 0} appointments`;
                    }
                    if (user.role === "DOCTOR") {
                      return `${count.doctorAppointments || 0} appointments`;
                    }
                    if (user.role === "ASHA_WORKER") {
                      return `${count.ashaFamilies || 0} families`;
                    }
                    return <span className="text-muted-foreground/40">—</span>;
                  };

                  // Avatar Initials
                  const nameParts = (u.name || "").split(" ").filter(Boolean);
                  const initials = nameParts.length > 0 
                    ? nameParts.map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                    : "?";

                  const joinDate = u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "N/A";

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      {/* User Avatar, Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-sky-50 dark:bg-sky-950 border border-sky-200 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold shrink-0 text-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate max-w-[180px]">{u.name || "Unnamed User"}</p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-4">{getStatusBadge(u)}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-foreground">{getActivityText(u)}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{joinDate}</td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {u.role !== "ADMIN" && u.role !== "OWNER" && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleMakeAdmin(u.id)}
                              disabled={changing[u.id]}
                              className="text-[10px] h-7 px-2.5 bg-background border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 cursor-pointer"
                            >
                              {changing[u.id] ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              )}
                              Make Admin
                            </Button>
                          )}
                          {u.role === "PATIENT" && (
                            <Button
                              size="xs"
                              variant="ghost"
                              asChild
                              className="text-[10px] h-7 px-2.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer"
                            >
                              <Link href={`/records?patientId=${u.id}`}>
                                <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Records
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
