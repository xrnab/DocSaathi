"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, UserCog, ExternalLink, ShieldCheck } from "lucide-react";
import { makeUserAdmin } from "@/actions/admin";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

export default function UsersTable({ users = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Filter users client-side
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  // Calculate stats
  const patientCount = users.filter((u) => u.role === "PATIENT").length;
  const doctorCount = users.filter((u) => u.role === "DOCTOR").length;
  const ashaCount = users.filter((u) => u.role === "ASHA_WORKER").length;

  const handleMakeAdmin = (userId) => {
    if (!confirm("Are you sure you want to promote this user to Admin?")) return;

    startTransition(async () => {
      try {
        const res = await makeUserAdmin(userId);
        if (res.success) {
          toast.success("User successfully promoted to Admin!");
        } else {
          toast.error("Failed to promote user.");
        }
      } catch (err) {
        toast.error(err.message || "Failed to promote user.");
      }
    });
  };

  return (
    <Card className="border-border bg-card shadow-sm border-t-4 border-t-sky-500 animate-in fade-in duration-300">
      <CardHeader className="border-b border-border pb-4 bg-sky-50/30 dark:bg-sky-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <UserCog className="h-5 w-5 text-sky-500" />
              User Directory & Management
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Search and manage roles, view medical records, and adjust platform access credentials.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 bg-background border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Counts Banner */}
        <div className="bg-muted/40 border-b border-border p-4 flex flex-wrap gap-4 text-xs sm:text-sm font-bold text-foreground justify-center sm:justify-start">
          <Badge variant="outline" className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            {patientCount} Patients
          </Badge>
          <Badge variant="outline" className="bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            {doctorCount} Doctors
          </Badge>
          <Badge variant="outline" className="bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            {ashaCount} ASHA Workers
          </Badge>
        </div>

        <div className="overflow-x-auto relative min-h-[200px]">
          {isPending && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-15">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          )}
          
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status (Doctors)</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground italic">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  // Role Badge mapping
                  const getRoleBadge = (role) => {
                    switch (role) {
                      case "PATIENT":
                        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">PATIENT</Badge>;
                      case "DOCTOR":
                        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">DOCTOR</Badge>;
                      case "ASHA_WORKER":
                        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">ASHA WORKER</Badge>;
                      case "ADMIN":
                        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none">ADMIN</Badge>;
                      default:
                        return <Badge className="bg-slate-400 hover:bg-slate-500 text-white border-none">{role || "UNASSIGNED"}</Badge>;
                    }
                  };

                  // Verification Status Badge mapping (Only for doctors)
                  const getStatusBadge = (user) => {
                    if (user.role !== "DOCTOR") return <span className="text-muted-foreground/40">—</span>;
                    switch (user.verificationStatus) {
                      case "VERIFIED":
                        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-100">VERIFIED</Badge>;
                      case "PENDING":
                        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 hover:bg-amber-100">PENDING</Badge>;
                      case "REJECTED":
                        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-200 hover:bg-red-100">REJECTED</Badge>;
                      default:
                        return <Badge className="bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-100">UNKNOWN</Badge>;
                    }
                  };

                  const joinDate = u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "N/A";

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{u.name || "Unnamed User"}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{u.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-4">{getStatusBadge(u)}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{joinDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {u.role !== "ADMIN" && u.role !== "OWNER" && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleMakeAdmin(u.id)}
                              disabled={isPending}
                              className="text-[10px] h-7 px-2.5 bg-background border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Make Admin
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
