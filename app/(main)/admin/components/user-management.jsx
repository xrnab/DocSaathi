"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ShieldCheck, UserCog, Mail, Search, ShieldAlert, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateUserRole } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { formatName } from "@/lib/utils";

export function UserManagement({ users }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { loading, fn: updateRole } = useFetch(updateUserRole);

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId, newRole) => {
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("role", newRole);
      
      const result = await updateRole(formData);
      if (result?.success) {
        toast.success(`User role updated to ${newRole}`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm border-t-4 border-t-sky-500">
      <CardHeader className="border-b border-border pb-4 bg-sky-50/30 dark:bg-sky-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <UserCog className="h-5 w-5 text-sky-500" />
              Role Management
            </CardTitle>
            <CardDescription className="text-sky-600/80 dark:text-sky-400/80 font-medium mt-1">
              Super Admin Authorization Required: Only Arnab Chowdhury can access this panel.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-9 bg-background border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Current Role</th>
                <th className="px-6 py-4 font-semibold">Change To</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted border border-border overflow-hidden shrink-0">
                          {user.imageUrl ? (
                            <img src={user.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold">
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            {formatName(user.name)}
                            {(user.role === "ADMIN" || user.role === "OWNER") && (
                              <ShieldCheck className={`h-3.5 w-3.5 ${user.role === "OWNER" ? "text-amber-500" : "text-sky-500"}`} />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === "OWNER"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          : user.role === "ADMIN" 
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400"
                          : user.role === "DOCTOR"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                        disabled={loading || user.role === "OWNER"} // Can't demote owner
                      >
                        <SelectTrigger className="w-32 h-8 text-xs bg-background">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                          <SelectItem value="PATIENT">PATIENT</SelectItem>
                          <SelectItem value="UNASSIGNED">UNASSIGNED</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "OWNER" ? (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 italic">
                          Platform Owner
                        </span>
                      ) : user.role !== "ADMIN" ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs border-sky-200 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-950 text-sky-600 dark:text-sky-400"
                          onClick={() => handleRoleChange(user.id, "ADMIN")}
                          disabled={loading}
                        >
                          Promote to Admin
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-xs text-muted-foreground italic"
                          disabled
                        >
                          Already Admin
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        )}
        
        <div className="p-4 bg-muted/20 border-t border-border flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            Note: Promoting a user to Admin grants them full access to platform settings, doctor verifications, and payout processing. 
            Only the primary owner (Arnab Chowdhury) can assign or revoke administrative privileges.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
