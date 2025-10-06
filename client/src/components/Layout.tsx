import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="main-content flex flex-col min-h-0 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="table-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}