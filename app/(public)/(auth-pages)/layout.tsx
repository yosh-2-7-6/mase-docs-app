export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
