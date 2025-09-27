import React from 'react';
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminNotificationCenter } from "@/components/admin/AdminNotificationCenter";

export default function AdminNotifications() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminNotificationCenter />
      </div>
    </AdminLayout>
  );
}