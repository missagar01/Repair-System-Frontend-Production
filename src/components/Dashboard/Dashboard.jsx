import React, { useEffect, useState } from "react";
import { FileText, CheckCircle, DollarSign, BarChart3 } from "lucide-react";
import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";
import { mockDashboardMetrics } from "../../data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

// Skeleton Loader Components
const MetricCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-8 bg-gray-200 rounded-full w-8"></div>
    </div>
    <div className="mt-4">
      <div className="h-8 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="mt-4 h-2 bg-gray-200 rounded"></div>
  </div>
);

const BarChartSkeleton = () => (
  <div className="h-64 w-full animate-pulse">
    <div className="h-full bg-gray-200 rounded"></div>
  </div>
);

const ListItemSkeleton = () => (
  <div className="flex items-center justify-between py-2 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    <div className="flex items-center space-x-3">
      <div className="w-20 bg-gray-200 rounded-full h-2"></div>
      <div className="h-4 bg-gray-200 rounded w-8"></div>
    </div>
  </div>
);

const Dashboard = () => {
  const metrics = mockDashboardMetrics;

  const [tasks, setTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [totalCompletedTask, setTotalCompletedTask] = useState([]);
  const [totalRepairBill, setTotalRepairBill] = useState(0);
  const [repairStatusByDepartment, setRepairStatusByDepartment] = useState([]);
  const [paymentTypeDistribution, setPaymentTypeDistribution] = useState([]);
  const [vendorWiseRepairCosts, setVendorWiseRepairCosts] = useState([]);

  const [loading, setLoading] = useState(true);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwuV7jpPBbsRCe_6Clke9jfkk32GStqyzaCve0jK1qlPcyfBNW3NG-GB7dE12UiZH7E/exec";
  const SHEET_Id = "1-j3ydNhMDwa-SfvejOH15ow7ZZ10I1zwdV4acAirHe4";
  const FOLDER_ID = "1IUX8rnhuodWWPQ2PPAFurz-S1Xoz-9h5";

  const API_URL = import.meta.env.VITE_API_BASE_URL;

const fetchAllTasks = async () => {
  try {
    setLoading(true);

    // const res = await fetch("http://localhost:5050/api/dashboard");
    const res = await fetch(`${API_URL}/dashboard`);
    const result = await res.json();

    if (!result.success) {
      console.error("Dashboard API Error:", result.message);
      return;
    }

    const data = result.data;

    // Assign to your states
    setTasks(data.tasks || []);
    setPendingTasks(data.pendingCount || 0);
    setTotalCompletedTask(data.completedCount || 0);
    setTotalRepairBill(data.totalRepairCost || 0);
    setRepairStatusByDepartment(data.departmentStatus || []);
    setPaymentTypeDistribution(data.paymentTypeDistribution || []);
    setVendorWiseRepairCosts(data.vendorWiseCosts || []);

  } catch (err) {
    console.error("Error fetching dashboard data:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAllTasks();
  }, []);


  // console.log("vendorWiseRepairCosts",vendorWiseRepairCosts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Indents"
              value={tasks?.length}
              icon={FileText}
              color="bg-blue-500"
            />
            <MetricCard
              title="Repairs Completed"
              value={totalCompletedTask?.length}
              icon={CheckCircle}
              color="bg-green-500"
            />
            <MetricCard
              title="Total Repair Cost"
              value={`₹${totalRepairBill}`}
              icon={DollarSign}
              color="bg-orange-500"
              trend={{ value: 5, isPositive: false }}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair Status by Department */}
        <ChartCard title="📊 Repair Status by Department">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {repairStatusByDepartment.map((dept, index) => (
                <div
                  key={dept.department}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {dept.department}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (dept.count /
                              Math.max(
                                ...repairStatusByDepartment.map(
                                  (d) => d.count
                                )
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">
                      {dept.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Task Status Overview */}
        <ChartCard title="📈 Task Status Overview">
          {loading ? (
            <BarChartSkeleton />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Pending', value: pendingTasks.length },
                    { name: 'Completed', value: totalCompletedTask.length },
                  ]}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  >
                    <LabelList dataKey="value" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Payment Type Distribution */}
        <ChartCard title="💸 Payment Type Distribution">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {paymentTypeDistribution.map((payment, index) => {
                const colors = ["bg-blue-500", "bg-green-500", "bg-orange-500"];
                return (
                  <div
                    key={payment.type}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          colors[index % colors.length]
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {payment.type}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {/* ₹{payment.amount.toLocaleString()} */}
                      ₹{Number(payment.amount || 0).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        {/* Vendor-Wise Repair Costs */}
        <ChartCard title="📦 Vendor-Wise Repair Costs">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {vendorWiseRepairCosts.map((vendor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {vendor.vendor}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (vendor.cost /
                              Math.max(
                                ...vendorWiseRepairCosts.map(
                                  (v) => v.cost
                                )
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-16">
                      {/* ₹{vendor.cost.toLocaleString()} */}
                      ₹{Number(vendor.cost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;