import { TabsContent } from "@/components/ui/tabs";
import { PendingDoctors } from "./components/pending-doctors";
import { VerifiedDoctors } from "./components/verified-doctors";
import { PendingPayouts } from "./components/pending-payouts";
import { VerifiedPatients } from "./components/verified-patients";
import { UserManagement } from "./components/user-management";
import { NabhaImpact } from "./components/nabha-impact";
import { MaternalHealth } from "./components/maternal-health";
import UsersTable from "./_components/users-table-wrapper";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getPendingPayouts,
  getPatients,
  getAllUsers,
  verifyOwner,
  getNabhaImpactStats,
  getMaternalHealthStats,
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
    maternalData,
  ] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getPendingPayouts(),
    getPatients(),
    getAllUsers().catch(() => ({ users: [] })), // accessible to any admin now
    getNabhaImpactStats(),
    getMaternalHealthStats().catch(() => ({ pregnancies: [], stats: { activeCases: 0, highRiskCases: 0, dueSoonCount: 0, zeroAncCount: 0 } })),
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

      <TabsContent value="all_users" className="border-none p-0">
        <UsersTable users={allUsersData.users || []} />
      </TabsContent>

      <TabsContent value="maternal_health" className="border-none p-0">
        <MaternalHealth pregnancies={maternalData.pregnancies || []} stats={maternalData.stats || { activeCases: 0, highRiskCases: 0, dueSoonCount: 0, zeroAncCount: 0 }} />
      </TabsContent>

      {isOwner && (
        <TabsContent value="users" className="border-none p-0">
          <UserManagement users={allUsersData.users || []} />
        </TabsContent>
      )}
    </>
  );
}
