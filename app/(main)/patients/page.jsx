import { getCurrentUser } from "@/actions/onboarding";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  User, 
  Droplet, 
  Weight, 
  Ruler, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  HeartPulse,
  ClipboardList,
  Star,
  FileText
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";

export default async function PatientDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/");
  }

  // Redirect to onboarding if profile is not complete
  if (!user.isProfileComplete) {
    redirect("/patients/onboarding");
  }

  // Fetch recent appointments with doctor feedback
  const appointments = await db.appointment.findMany({
    where: { patientId: user.id },
    include: {
      doctor: true,
    },
    orderBy: { startTime: "desc" },
    take: 5,
  });

  // Calculate some stats from report card
  const gradedAppointments = appointments.filter(a => a.grading);
  const latestFeedback = gradedAppointments[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 sm:px-0">
      <PageHeader title="My Health Dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm bg-card overflow-hidden">
            <div className="bg-sky-500 h-2 w-full" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-24 h-24 rounded-full border-4 border-background shadow-md overflow-hidden mb-4">
                <img 
                  src={user.imageUrl || "/placeholder-user.png"} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex flex-col items-center text-center">
                  <User className="h-5 w-5 text-sky-500 mb-1" />
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Gender</span>
                  <span className="text-lg font-bold text-sky-700 dark:text-sky-300">{user.gender}</span>
                </div>
                <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex flex-col items-center text-center">
                  <Activity className="h-5 w-5 text-emerald-500 mb-1" />
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Age</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{user.age} Yrs</span>
                </div>
                <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex flex-col items-center text-center">
                  <Ruler className="h-5 w-5 text-sky-500 mb-1" />
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Height</span>
                  <span className="text-lg font-bold text-sky-700 dark:text-sky-300">{user.height} cm</span>
                </div>
                <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex flex-col items-center text-center">
                  <Weight className="h-5 w-5 text-sky-500 mb-1" />
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Weight</span>
                  <span className="text-lg font-bold text-sky-700 dark:text-sky-300">{user.weight} kg</span>
                </div>
                <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex flex-col items-center text-center col-span-2">
                  <Droplet className="h-5 w-5 text-red-500 mb-1" />
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Blood Group</span>
                  <span className="text-lg font-bold text-red-700 dark:text-red-400">{user.bloodType}</span>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-border">
                <div className="flex items-start gap-3">
                  <HeartPulse className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Allergies</h4>
                    <p className="text-sm text-muted-foreground">{user.allergies || "None reported"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Medications</h4>
                    <p className="text-sm text-muted-foreground">{user.medications || "No current medications"}</p>
                  </div>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400">
                <Link href="/patients/onboarding">Edit Medical Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Health Report Card */}
          <Card className="border-sky-100 dark:border-sky-900 shadow-lg bg-gradient-to-br from-background to-sky-50/30 dark:to-sky-950/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Star className="h-32 w-32 text-sky-500 fill-sky-500" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-sky-500" />
                Medical Report Card
              </CardTitle>
              <CardDescription>Your health improvement tracking based on recent consultations</CardDescription>
            </CardHeader>
            <CardContent>
              {latestFeedback ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 bg-white/50 dark:bg-black/20 p-6 rounded-3xl border border-sky-100 dark:border-sky-900">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Overall Grade</div>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-sky-500/30">
                        {latestFeedback.grading}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-foreground">Health Improvement</h3>
                          <Badge className={`${
                            latestFeedback.improvementStatus === 'Improving' ? 'bg-emerald-500' : 'bg-sky-500'
                          } text-white px-3 py-1`}>
                            {latestFeedback.improvementStatus || "Normal Progress"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Last Consultation</p>
                          <p className="font-bold text-foreground">{format(new Date(latestFeedback.startTime), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      
                      <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-2xl border border-sky-100 dark:border-sky-800">
                        <h4 className="text-sm font-bold text-sky-700 dark:text-sky-300 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Doctor's Summary
                        </h4>
                        <p className="text-sm text-foreground italic leading-relaxed">
                          "{latestFeedback.doctorSummary || "Maintain healthy habits and continue following the prescribed treatment plan."}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-3 text-right">
                          — Dr. {latestFeedback.doctor.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-foreground">Recent Feedbacks</h4>
                      <div className="space-y-3">
                        {gradedAppointments.slice(0, 3).map((app) => (
                          <div key={app.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border">
                            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center font-bold text-sky-600">
                              {app.grading}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">Dr. {app.doctor.name}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(app.startTime), "MMM d, yyyy")}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase">{app.improvementStatus}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-sky-900/5 dark:bg-sky-900/20 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                      <TrendingUp className="h-10 w-10 text-sky-400 mb-3" />
                      <h4 className="font-bold text-foreground mb-1">Health Trajectory</h4>
                      <p className="text-sm text-muted-foreground">You are showing positive signs of recovery. Continue your current regimen.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-16 w-16 text-sky-200 mb-4" />
                  <h3 className="text-xl font-bold text-foreground">No Report Data Yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Your medical report card will be updated after your first consultation with a doctor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Consultations */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Recent Consultations</CardTitle>
                <CardDescription>View your history with our doctors</CardDescription>
              </div>
              <Button variant="ghost" asChild size="sm">
                <Link href="/appointments" className="flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">No consultation history found.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border group hover:bg-muted/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center border border-sky-100 dark:border-sky-800">
                          <Calendar className="h-6 w-6 text-sky-500" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">Consultation with Dr. {app.doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(app.startTime), "EEEE, MMM d 'at' h:mm a")}</p>
                        </div>
                      </div>
                      <Badge className={`${
                        app.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'
                      } text-white`}>
                        {app.status}
                      </Badge>
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
