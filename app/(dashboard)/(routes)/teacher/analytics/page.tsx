import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { getAnalytics } from "@/actions/get-analytics";

import { DataCard } from "./_components/data-card";
import { Chart } from "./_components/chart";
import { CourseAnalyticsTable } from "./_components/course-analytics-table";
import { TimeSeriesChart } from "./_components/time-series-chart";
import { ChapterCompletionList } from "./_components/chapter-completion-list";

const AnalyticsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const {
    data,
    totalRevenue,
    totalSales,
    courseAnalytics,
    timeSeriesData,
    mostCompletedChapters,
    leastCompletedChapters
  } = await getAnalytics(userId);

  return ( 
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">Course Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground dark:text-slate-400">Monitor your course performance and student engagement</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataCard
          label="Total Revenue"
          value={totalRevenue}
          shouldFormat
        />
        <DataCard
          label="Total Sales"
          value={totalSales}
        />
      </div>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Revenue by Course</h2>
          <Chart data={data} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Revenue Trends (Last 30 Days)</h2>
          <TimeSeriesChart data={timeSeriesData} />
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2 dark:text-white">Course Performance Summary</h2>
        <CourseAnalyticsTable data={courseAnalytics} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Most Completed Chapters</h2>
          <ChapterCompletionList data={mostCompletedChapters} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Least Completed Chapters</h2>
          <ChapterCompletionList data={leastCompletedChapters} />
        </div>
      </div>
    </div>
   );
}
 
export default AnalyticsPage;