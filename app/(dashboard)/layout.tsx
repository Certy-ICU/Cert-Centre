import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return ( 
    <div className="h-full">
      <div className="h-[60px] sm:h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
        <Navbar />
      </div>
      <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-56 pt-[60px] sm:pt-[80px] h-full bg-white dark:bg-slate-950">
        <div className="p-3 sm:p-6 h-full">
          {children}
        </div>
      </main>
    </div>
   );
}
 
export default DashboardLayout;