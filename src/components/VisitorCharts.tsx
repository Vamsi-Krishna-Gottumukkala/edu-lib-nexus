import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Vibrant colour palette – cycles for any number of slices
const COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6",
  "#f97316", "#8b5cf6", "#06b6d4", "#84cc16", "#ef4444",
];

interface DegreeMap {
  [degree: string]: {
    [branchCode: string]: { branch_name: string; count: number };
  };
}
interface FacultyMap {
  [dept: string]: number;
}

interface Props {
  degreeMap: DegreeMap;
  facultyMap: FacultyMap;
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, count, branch_code,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (count < 1) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {branch_code}
      <tspan x={x} dy={13} fontSize={10} fontWeight={400}>{count}</tspan>
    </text>
  );
};

function DegreeChart({ degree, branches }: { degree: string; branches: Record<string, { branch_name: string; count: number }> }) {
  const data = Object.entries(branches).map(([code, v]) => ({
    name: v.branch_name,
    branch_code: code,
    count: v.count,
  }));

  return (
    <Card className="bg-card/60 border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground/80">{degree}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={75}
              dataKey="count"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: string) => [value, name]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            />
            <Legend
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function VisitorCharts({ degreeMap, facultyMap }: Props) {
  const degrees = Object.entries(degreeMap).filter(([, branches]) =>
    Object.values(branches).some(b => b.count > 0)
  );
  const facultyEntries = Object.entries(facultyMap).filter(([, c]) => c > 0);

  if (degrees.length === 0 && facultyEntries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No visitor data for today yet — charts will appear once students check in.
      </p>
    );
  }

  const facultyData = facultyEntries.map(([dept, count]) => ({ name: dept, count }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* One chart per degree */}
        {degrees.map(([degree, branches]) => (
          <DegreeChart key={degree} degree={degree} branches={branches} />
        ))}

        {/* Faculty chart */}
        {facultyEntries.length > 0 && (
          <Card className="bg-card/60 border border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground/80">Faculty</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={facultyData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="count"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, count, name }: any) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      if (count < 1) return null;
                      const short = name.split(" ")[0];
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
                          {short}
                          <tspan x={x} dy={13} fontSize={10}>{count}</tspan>
                        </text>
                      );
                    }}
                  >
                    {facultyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
