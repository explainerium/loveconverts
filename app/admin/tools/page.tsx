import ToolsManageClient from "./ToolsManageClient";

export const dynamic = "force-dynamic";

export default function AdminToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Tool Management</h1>
        <p className="text-muted text-sm mt-0.5">Enable or disable tools across the site</p>
      </div>
      <ToolsManageClient />
    </div>
  );
}
