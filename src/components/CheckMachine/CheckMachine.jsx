import React, { useEffect, useState } from "react";
import { Search, Filter, CheckCircle, Loader2Icon } from "lucide-react";
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
import { mockRepairTasks } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import useDataStore from "../../store/dataStore";
import toast from "react-hot-toast";

const CheckMachine = () => {
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
  const [loaderSubmit, setLoaderSubmit] = useState(false);

  const [formData, setFormData] = useState({
    bill_image: null,
    bill_no: "",
    type_of_bill: "",
    total_bill_amount: "",
    payment_type: "",
    to_be_paid_amount: "",
    transporterName: "",
    transportationAmount: "",
  });

  const filteredTasks = repairTasks.filter(
    (task) => user?.role === "admin" || task.nameOfIndenter === user?.name
  );

  const handleMaterialClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwuV7jpPBbsRCe_6Clke9jfkk32GStqyzaCve0jK1qlPcyfBNW3NG-GB7dE12UiZH7E/exec";
  const SHEET_Id = "1-j3ydNhMDwa-SfvejOH15ow7ZZ10I1zwdV4acAirHe4";
  const FOLDER_ID = "1ZOuHUXUjONnHb4TBWqztjQcI5Pjvy_n0";

  // const API_BASE = "http://localhost:5050/api/repair-check";
  const API_BASE = import.meta.env.VITE_API_BASE_URL + "/repair-check";



const fetchAllTasks = async () => {
  try {
    setLoadingTasks(true);

    const res = await fetch(`${API_BASE}/all`);
    const result = await res.json();

    if (!result.success) {
      toast.error("Failed to fetch tasks");
      return;
    }

    const tasks = result.tasks || [];

    setRepairTasks(tasks);

    const pending = tasks.filter(t => t.planned_2 && !t.actual_2);
    const history = tasks.filter(t => t.actual_2);

    setPendingRepairTasks(pending);
    setHistoryRepairTasks(history);

  } catch (err) {
    console.error(err);
    toast.error("Error fetching tasks");
  } finally {
    setLoadingTasks(false);
  }
};


  useEffect(() => {
    fetchAllTasks();
  }, []);

const uploadBillToS3 = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload-bill`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.success) return data.url;

  toast.error("S3 Upload Failed");
  return "";
};


const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoaderSubmit(true);

    // 1️⃣ Upload bill image to drive (same function you already have)
   let bill_imageUrl = "";
if (formData.bill_image) {
  bill_imageUrl = await uploadBillToS3(formData.bill_image);
}


    // 2️⃣ Prepare payload
    const payload = {
  transporterName: formData.transporterName,
  transportationAmount: formData.transportationAmount,
  billImage: bill_imageUrl,
  billNo: formData.bill_no,
  typeOfBill: formData.type_of_bill,
  totalBillAmount: Number(formData.total_bill_amount),
  toBePaidAmount:
    selectedTask?.how_much != null
      ? Number(formData.total_bill_amount) - Number(selectedTask.how_much)
      : Number(formData.total_bill_amount),
};


    // 3️⃣ Send to Node backend
    const res = await fetch(`${API_BASE}/update/${selectedTask.task_no}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.success) {
      toast.success("Task updated successfully");

      // Update Zustand
      updateRepairTask(selectedTask.task_no, {
        ...payload,
        actual2: new Date().toISOString(),
      });

      setIsModalOpen(false);
      fetchAllTasks(); // refresh list
    } else {
      toast.error("Failed to update task");
    }
  } catch (err) {
    console.error(err);
    toast.error("Error submitting form");
  } finally {
    setLoaderSubmit(false);
  }
};


const computedToBePaid = React.useMemo(() => {
  const total = Number(formData.total_bill_amount);
  const advance = Number(selectedTask?.how_much);

  if (!total) return "";
  if (selectedTask?.payment_type === "Advance") {
    return total - advance >= 0 ? total - advance : "";
  }
  return total;
}, [formData.total_bill_amount, selectedTask]);

 

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Check Machine</h1>
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
              Pending ({pendingRepairTasks.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              History ({historyRepairTasks.length})
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {activeTab === "pending" && (
          <div>
            <Table>
              <TableHeader>
                <TableHead>Action</TableHead>
                <TableHead>Task Number</TableHead>
                <TableHead>Machine Name</TableHead>

                <TableHead>Planned Date</TableHead>

                <TableHead>Serial No</TableHead>
                <TableHead>Indenter</TableHead>

                <TableHead>Vendor</TableHead>
                <TableHead>Transpoter Charges</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>How Much</TableHead>
              </TableHeader>
              <TableBody>
                {pendingRepairTasks.map((task) => (
                  <TableRow key={task.task_no}>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleMaterialClick(task)}
                        className="flex items-center"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Material
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {task.task_no}
                    </TableCell>
                    <TableCell>{task.machine_name}</TableCell>

                    <TableCell>{task.planned_1}</TableCell>

                    <TableCell>{task.serial_no}</TableCell>
                    <TableCell>{task.doerName}</TableCell>
                    <TableCell>{task.vendor_name || "-"}</TableCell>
                    <TableCell>{task.transportation_charges}</TableCell>
                    <TableCell>{task.lead_time_to_deliver_days}</TableCell>
                    <TableCell>{task.payment_type || "-"}</TableCell>
                    <TableCell>{task.how_much || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

           {loadingTasks && pendingRepairTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center w-[75vw] mt-10">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <Table>
              <TableHeader>
                <TableHead>Task Number</TableHead>
                <TableHead>Machine Name</TableHead>

                <TableHead>Serial No</TableHead>
                <TableHead>Planned Date</TableHead>
                <TableHead>Indenter</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>How Much</TableHead>
                <TableHead>Transporter Name</TableHead>

                
                <TableHead>Total Amount</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Bill Type</TableHead>
                <TableHead>To Be Paid</TableHead>
                <TableHead>Bill Image</TableHead>
              </TableHeader>
              <TableBody>
                {historyRepairTasks.map((task) => (
                  <TableRow key={task.task_no}>
                    <TableCell className="font-medium text-blue-600">
                      {task.task_no}
                    </TableCell>
                    <TableCell>{task.machine_name}</TableCell>
                    <TableCell>{task.serial_no}</TableCell>
                    <TableCell>{task.planned_1}</TableCell>
                    <TableCell>{task.doerName}</TableCell>
                    <TableCell>{task.vendor_name || "-"}</TableCell>
                    <TableCell>{task.lead_time_to_deliver_days}</TableCell>
                    <TableCell>{task.payment_type || "-"}</TableCell>
                    <TableCell>{task.how_much || "-"}</TableCell>
                    <TableCell>{task.transporter_name_2 || "-"}</TableCell>
                    <TableCell>
                      ₹{task.to_be_paid_amount?.toLocaleString() || "-"}
                    </TableCell>

                    <TableCell>{task.bill_no || "-"}</TableCell>
                    <TableCell>{task.type_of_bill || "-"}</TableCell>

                    <TableCell>
                      ₹{task.total_bill_amount?.toLocaleString() || "-"}
                    </TableCell>

                    <TableCell>
                      {task.bill_image ? (
                        <Button
                          size="sm"
                          variant="primary"

                          onClick={() =>
                            window.open(
                              task.bill_image,
                              "_blank"
                            )
                          }
                        >
                          View
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    
                  </TableRow>
                ))}
              </TableBody>
            </Table>

             {loadingTasks && historyRepairTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center w-[75vw] mt-10">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Check Material Details"
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
                value={selectedTask?.task_no || ""}
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
                value={selectedTask?.machine_name || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            {/* Existing fields... */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.payment_type || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            {/* ONLY show this field if payment_type is "Advance" */}
            {selectedTask?.payment_type === "Advance" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How Much (Advance Amount)
                </label>
                <input
                  type="text"
                  value={selectedTask?.how_much || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transporter Name *
              </label>
              <input
                type="text"
                value={formData.transporterName || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transporterName: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transportation Amount *
              </label>
              <input
                type="number"
                value={formData.transportationAmount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transportationAmount: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill No. *
              </label>
              <input
                type="text"
                value={formData.bill_no}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bill_no: e.target.value }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Bill *
              </label>
              <select
                value={formData.type_of_bill}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type_of_bill: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Bill Type</option>
                <option value="Service Bill">Service Bill</option>
                <option value="Material Bill">Material Bill</option>
                <option value="Labor Bill">Labor Bill</option>
                <option value="Combined Bill">Combined Bill</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Bill Amount *
              </label>
              <input
                type="number"
                value={formData.total_bill_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    total_bill_amount: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bill_image: e.target.files[0],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type *
              </label>
              <select
                value={formData.payment_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_type: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Payment Type</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div> */}
{selectedTask && (
  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      To Be Paid Amount
    </label>

    <input
      type="number"
      value={computedToBePaid}
      readOnly
      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
    />
  </div>
)}


          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {loaderSubmit && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CheckMachine;
