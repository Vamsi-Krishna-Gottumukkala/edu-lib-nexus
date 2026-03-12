import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { mockQuestionPapers } from "@/lib/mockData";
import { StatsCard } from "@/components/StatsCard";
import { FileText, Download, TrendingUp } from "lucide-react";

const QPDashboard = () => {
  const totalDownloads = mockQuestionPapers.reduce((a, p) => a + p.downloads, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Question Paper Dashboard" description="Overview of question paper repository" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Papers" value={mockQuestionPapers.length} icon={FileText} color="primary" />
        <StatsCard title="Total Downloads" value={totalDownloads} icon={Download} color="success" />
        <StatsCard title="Most Popular" value="CS301" icon={TrendingUp} color="info" />
      </div>

      <DataTable
        columns={[
          { header: "Subject", accessor: "subjectName" },
          { header: "Code", accessor: "subjectCode" },
          { header: "Department", accessor: "department" },
          { header: "Semester", accessor: "semester" },
          { header: "Exam Type", accessor: "examType" },
          { header: "Year", accessor: "academicYear" },
          { header: "Downloads", accessor: "downloads" },
        ]}
        data={mockQuestionPapers}
      />
    </div>
  );
};

export default QPDashboard;
