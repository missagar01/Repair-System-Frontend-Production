import React, { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import IndentForm from "./IndentForm";
import { mockRepairTasks } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";

const Indent = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Safe filtering with null checks
  const filteredTasks = tasks
    .filter(
      (task) => user?.role === "admin" || task.nameOfIndenter === user?.name
    )
    .filter(
      (task) =>
        (task.machineName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.taskNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.serialNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.doerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.machinePartName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwuV7jpPBbsRCe_6Clke9jfkk32GStqyzaCve0jK1qlPcyfBNW3NG-GB7dE12UiZH7E/exec";
  const SHEET_Id = "1-j3ydNhMDwa-SfvejOH15ow7ZZ10I1zwdV4acAirHe4";
  const FOLDER_ID = "1ZOuHUXUjONnHb4TBWqztjQcI5Pjvy_n0";


  const API_URL = import.meta.env.VITE_API_BASE_URL;


const fetchAllTasks = async () => {
  try {
    setLoadingTasks(true);

    // const res = await fetch("http://localhost:5050/api/repair/all");
    const res = await fetch(`${API_URL}/repair/all`);
    const result = await res.json();

    if (result.success) {
      setTasks(result.tasks);
    } else {
      setTasks([]);
    }
  } catch (err) {
    console.error("Error fetching tasks:", err);
    setTasks([]);
  } finally {
    setLoadingTasks(false);
  }
};


  useEffect(() => {
    fetchAllTasks();
  }, [refreshTrigger]);

  const getPriorityColor = (priority) => {
    const priorityLower = (priority || "").toLowerCase();
    switch (priorityLower) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const handleAddIndent = () => {
    // Trigger refresh by incrementing the trigger
    setRefreshTrigger(prev => prev + 1);
    setIsModalOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString();
    } catch (error) {
      return "N/A";
    }
  };

  // Utility function to truncate text with ellipsis
  const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return "N/A";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Indent Management</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Indent
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by machine name or task number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              disabled={loadingTasks}
            >
              {loadingTasks ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white">
                <TableRow>
                  <TableHead className="min-w-[120px] whitespace-nowrap">Task Number</TableHead>
                  <TableHead className="min-w-[150px]">Machine Name</TableHead>
                  <TableHead className="min-w-[120px]">Serial No</TableHead>
                  <TableHead className="min-w-[120px]">Doer</TableHead>
                  <TableHead className="min-w-[120px]">Department</TableHead>
                  <TableHead className="min-w-[160px]">Machine Part Name</TableHead>
                  <TableHead className="min-w-[100px]">Priority</TableHead>
                  <TableHead className="min-w-[110px]">Start Date</TableHead>
                  <TableHead className="min-w-[110px]">End Date</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
            <Table>
              <TableBody>
                {loadingTasks ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Loading tasks...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <p className="text-gray-500">No tasks found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id || task.taskNo || Math.random()} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-blue-600 min-w-[120px] whitespace-nowrap">
                        {task.taskNo || "N/A"}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="break-words" title={task.machineName || ""}>
                          {truncateText(task.machineName, 25)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="break-words" title={task.serialNo || ""}>
                          {truncateText(task.serialNo, 15)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="break-words" title={task.doerName || ""}>
                          {truncateText(task.doerName, 15)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="break-words" title={task.department || ""}>
                          {truncateText(task.department, 15)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="break-words" title={task.machinePartName || ""}>
                          {truncateText(task.machinePartName, 20)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[110px] whitespace-nowrap">
                        {formatDate(task.taskStartDate)}
                      </TableCell>
                      <TableCell className="min-w-[110px] whitespace-nowrap">
                        {formatDate(task.taskEndDate)}
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize whitespace-nowrap ${getStatusColor(task.status)}`}>
                          {task.status || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Indent"
        size="xl"
      >
        <IndentForm
          onSubmit={handleAddIndent}
          onCancel={() => setIsModalOpen(false)}
          taskList={tasks}
        />
      </Modal>
    </div>
  );
};

export default Indent;