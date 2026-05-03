"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, Mail, Calendar, Droplets, Search } from "lucide-react";
import { formatName } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function VerifiedPatients({ patients }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter((patient) => {
    const query = searchTerm.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.bloodType?.toLowerCase().includes(query)
    );
  });

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Registered Patients
            </CardTitle>
            <CardDescription>
              Overview of all patients registered on the platform
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-9 bg-background border-border focus-visible:ring-sky-500"
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
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Credits</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    {searchTerm ? "No patients match your search." : "No patients found."}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center border border-sky-200 dark:border-sky-800 shrink-0 overflow-hidden">
                          {patient.imageUrl ? (
                            <img src={patient.imageUrl} alt={patient.name} className="h-full w-full object-cover" />
                          ) : (
                            <Heart className="h-5 w-5 text-sky-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatName(patient.name)}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3 mr-1" />
                            {patient.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {patient.bloodType && (
                          <div className="flex items-center text-xs font-medium text-foreground">
                            <Droplets className="h-3 w-3 mr-1 text-red-500" />
                            Blood: {patient.bloodType}
                          </div>
                        )}
                        {patient.dateOfBirth && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            DOB: {format(new Date(patient.dateOfBirth), "PP")}
                          </div>
                        )}
                        {!patient.bloodType && !patient.dateOfBirth && (
                          <span className="text-xs text-muted-foreground italic">No profile details set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400">
                        {patient.credits} Credits
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {format(new Date(patient.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
