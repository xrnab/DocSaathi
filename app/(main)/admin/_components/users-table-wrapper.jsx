"use client";

import dynamic from "next/dynamic";

const UsersTable = dynamic(() => import("./users-table"), {
  ssr: false,
});

export default function UsersTableWrapper({ users }) {
  return <UsersTable users={users} />;
}
