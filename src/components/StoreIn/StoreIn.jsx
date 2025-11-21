import React, { useEffect, useState } from "react";
import { Search, Filter, Package, Loader2Icon } from "lucide-react";
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
import { useAuth } from "../../context/AuthContext";
import useDataStore from "../../store/dataStore";
import toast from "react-hot-toast";

const StoreIn = () => {
  const { user } = useAuth();
  const {
    repairTasks,
    pendingRepairTasks,
    historyRepairTasks,
    setRepairTasks,
    setPendingRepairTasks,
    setHistoryRepairTasks,
    updateRepairTask
  } = useDataStore();
  
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    receivedQuantity: "",
    billMatch: false,
    productImage: "",
    billNo: ""
  });

  // Safe filtering with search functionality
  const filteredPendingTasks = pendingRepairTasks
    .filter((task) => user?.role === "admin" || task.nameOfIndenter === user?.name)
    .filter((task) =>
      (task.taskNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.machineName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.serialNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredHistoryTasks = historyRepairTasks
    .filter((task) => user?.role === "admin" || task.nameOfIndenter === user?.name)
    .filter((task) =>
      (task.taskNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.machineName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.serialNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleMaterialClick = (task) => {
    setSelectedTask(task);
    setFormData({
      receivedQuantity: task.receivedQuantity || "",
      billMatch: task.billMatch === "Yes",
      productImage: "",
      billNo: task.billNo || ""
    });
    setIsModalOpen(true);
  };

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwuV7jpPBbsRCe_6Clke9jfkk32GStqyzaCve0jK1qlPcyfBNW3NG-GB7dE12UiZH7E/exec";
  const SHEET_Id = "1-j3ydNhMDwa-SfvejOH15ow7ZZ10I1zwdV4acAirHe4";
  const FOLDER_ID = "1ZOuHUXUjONnHb4TBWqztjQcI5Pjvy_n0";

  // const API_URL = `${import.meta.env.VITE_API_BASE_URL}/store-in`;
  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/store-in`;



const fetchAllTasks = async () => {
  try {
    setLoadingTasks(true);

    // const res = await fetch(`${API_URL}/repair-system/stage3`);
    const res = await fetch(`${API_URL}/all`);
    const data = await res.json();

    if (!data.success) {
      toast.error("Failed to fetch tasks");
      return;
    }

    const formattedTasks = data.tasks;

    setRepairTasks(formattedTasks);

    // Pending → planned_3 exists AND actual_3 is null
    const pendingTasks = formattedTasks.filter(
      (task) => task.planned_3 && !task.actual_3
    );
    setPendingRepairTasks(pendingTasks);

    // History → both exist
    const historyTasks = formattedTasks.filter(
      (task) => task.planned_3 && task.actual_3
    );
    setHistoryRepairTasks(historyTasks);

  } catch (err) {
    toast.error("Error fetching tasks");
  } finally {
    setLoadingTasks(false);
  }
};

  useEffect(() => {
    fetchAllTasks();
  }, []);

const uploadProductToS3 = async (file) => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_URL}/upload-product`, {
    method: "POST",
    body: fd,
  });

  const data = await res.json();
  if (data.success) return data.url;

  toast.error("Image upload failed");
  return "";
};

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setSubmitLoading(true);

    let uploadedImageUrl = "";

    if (formData.productImage) {
  uploadedImageUrl = await uploadProductToS3(formData.productImage);
}


    const body = {
      actual_3: new Date().toISOString(),   // ⭐ FIX: Send actual_3
      receivedQuantity: formData.receivedQuantity,
      billMatch: formData.billMatch ? "Yes" : "No",
      billImage: uploadedImageUrl,
      billNo: formData.billNo,
      productImage: uploadedImageUrl,
    };

    const res = await fetch(`${API_URL}/update/${selectedTask.taskNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (!result.success) {
      toast.error("Failed to update task");
      return;
    }

    toast.success("Task updated successfully");
    setIsModalOpen(false);
    await fetchAllTasks();

  } catch (err) {
    console.error(err);
    toast.error("Error submitting form");
  } finally {
    setSubmitLoading(false);
  }
};



  const formatCurrency = (amount) => {
    if (!amount || isNaN(Number(amount))) return "-";
    return `₹${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Store In</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending ({filteredPendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              History ({filteredHistoryTasks.length})
            </button>
          </nav>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
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
              onClick={fetchAllTasks}
              disabled={loadingTasks}
            >
              {loadingTasks ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {activeTab === "pending" && (
          <div className="overflow-x-auto">
            {loadingTasks ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            ) : filteredPendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">No pending tasks found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Action</TableHead>
                  <TableHead>Task Number</TableHead>
                  <TableHead>Machine Name</TableHead>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Planned Date</TableHead>
                  <TableHead>Indenter</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Transporter Amount</TableHead>
                  <TableHead>Bill Image</TableHead>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Total Bill Amount</TableHead>
                  <TableHead>To Be Paid</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredPendingTasks.map((task) => (
                    <TableRow key={task.id || task.taskNo}>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleMaterialClick(task)}
                          className="flex items-center"
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Material
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {task.taskNo || "-"}
                      </TableCell>
                      <TableCell>{task.machineName || "-"}</TableCell>
                      <TableCell>{task.serialNo || "-"}</TableCell>
                      <TableCell>{task.planned_3 || "-"}</TableCell>
                      <TableCell>{task.doerName || "-"}</TableCell>
                      <TableCell>{task.vendorName || "-"}</TableCell>
                      <TableCell>{task.leadTimeToDeliverDays || "-"}</TableCell>
                      <TableCell>{task.paymentType || "-"}</TableCell>
                      <TableCell>{task.howMuch || "-"}</TableCell>
                      <TableCell>
                        {task.billImage ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => window.open(task.billImage, "_blank")}
                          >
                            View
                          </Button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{task.billNo || "-"}</TableCell>
                      <TableCell>{formatCurrency(task.totalBillAmount)}</TableCell>
                      <TableCell>{formatCurrency(task.toBePaidAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="overflow-x-auto">
            {loadingTasks ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            ) : filteredHistoryTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">No history tasks found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Task Number</TableHead>
                  <TableHead>Machine Name</TableHead>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Received Quantity</TableHead>
                  <TableHead>Bill Image</TableHead>
                  <TableHead>Bill Amount</TableHead>
                  <TableHead>To Be Paid</TableHead>
                  <TableHead>Bill Match</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredHistoryTasks.map((task) => (
                    <TableRow key={task.id || task.taskNo}>
                      <TableCell className="font-medium text-blue-600">
                        {task.taskNo || "-"}
                      </TableCell>
                      <TableCell>{task.machineName || "-"}</TableCell>
                      <TableCell>{task.serialNo || "-"}</TableCell>
                      <TableCell>{task.machinePartName || "-"}</TableCell>
                      <TableCell>{task.vendorName || "-"}</TableCell>
                      <TableCell>{task.receivedQuantity || "-"}</TableCell>
                      <TableCell>
                        {task.billImage ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => window.open(task.billImage, "_blank")}
                          >
                            View
                          </Button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(task.totalBillAmount)}</TableCell>
                      <TableCell>{formatCurrency(task.toBePaidAmount)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.billMatch === "Yes"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {task.billMatch === "Yes" ? "Matched" : "Not Matched"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Store In Material"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repair Task Number (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.taskNo || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine Name (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.machineName || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Name (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.vendorName || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Received *
              </label>
              <select
                value={formData.receivedQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    receivedQuantity: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  productImage: e.target.files[0] || "",
                }))
              }
              className="block w-full text-sm text-gray-500
               file:mr-4 file:py-2 file:px-4
               file:rounded-full file:border-0
               file:text-sm file:font-semibold
               file:bg-blue-50 file:text-blue-700
               hover:file:bg-blue-100"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.billMatch}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billMatch: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Bill Match</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitLoading}>
              {submitLoading && <Loader2Icon className="animate-spin mr-2" />}
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StoreIn;