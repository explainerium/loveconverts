import AuditLogClient from "./AuditLogClient";

export const dynamic = "force-dynamic";

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Audit Log</h1>
        <p className="text-muted text-sm mt-0.5">Track all admin actions across the site</p>
      </div>
      <AuditLogClient />
    </div>
  );
}
