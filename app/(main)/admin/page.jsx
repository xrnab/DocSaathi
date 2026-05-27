import { TabsContent } from "@/components/ui/tabs";
import { PendingDoctors } from "./components/pending-doctors";
import { VerifiedDoctors } from "./components/verified-doctors";
import { PendingPayouts } from "./components/pending-payouts";
import { VerifiedPatients } from "./components/verified-patients";
import { UserManagement } from "./components/user-management";
import { NabhaImpact } from "./components/nabha-impact";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getPendingPayouts,
  getPatients,
  getAllUsers,
  verifyOwner,
  getNabhaImpactStats,
} from "@/actions/admin";

export default async function AdminPage() {
  const isOwner = await verifyOwner();

  // Fetch all data in parallel
  const [
    pendingDoctorsData,
    verifiedDoctorsData,
    pendingPayoutsData,
    patientsData,
    allUsersData,
    nabhaStatsData,
  ] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getPendingPayouts(),
    getPatients(),
    isOwner ? getAllUsers() : Promise.resolve({ users: [] }),
    getNabhaImpactStats(),
  ]);

  return (
    <>
      <TabsContent value="pending" className="border-none p-0">
        <PendingDoctors doctors={pendingDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="doctors" className="border-none p-0">
        <VerifiedDoctors doctors={verifiedDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="patients" className="border-none p-0">
        <VerifiedPatients patients={patientsData.patients || []} />
      </TabsContent>

      <TabsContent value="payouts" className="border-none p-0">
        <PendingPayouts payouts={pendingPayoutsData.payouts || []} />
      </TabsContent>

      <TabsContent value="nabha" className="border-none p-0">
        <NabhaImpact stats={nabhaStatsData} />
      </TabsContent>

      {isOwner && (
        <TabsContent value="users" className="border-none p-0">
          <UserManagement users={allUsersData.users || []} />
        </TabsContent>
      )}
    </>
  );
}
