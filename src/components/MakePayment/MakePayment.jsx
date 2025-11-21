import React, { useEffect, useState } from "react";
import { Search, Filter, Package } from "lucide-react";
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

const MakePayment = () => {
  const { user } = useAuth();
  const {
    repairPayments,
    pendingRepairPayments,
    historyRepairPayments,
    setRepairPayments,
    setPendingRepairPayments,
    setHistoryRepairPayments,
    addRepairPayment
  } = useDataStore();
  
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    total_bill_amount: "",
    payment_type: "",
    to_be_paid_amount: "",
  });

  // const filteredTasks = tasks.filter(
  //   (task) => user?.role === "admin" || task.nameOfIndenter === user?.name
  // );


  
  // const pendingTasks = filteredTasks.filter((task) => task.status === "stored");
  // const historyTasks = filteredTasks.filter(
  //   (task) => task.status === "advanced"
  // );

  const handleMaterialClick = (task) => {
    setSelectedTask(task);
    setFormData({
      total_bill_amount: task.total_bill_amount?.toString() || "",
      payment_type: task.payment_type || "",
      to_be_paid_amount: task.to_be_paid_amount?.toString() || "",
    });
    setIsModalOpen(true);
  };

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwuV7jpPBbsRCe_6Clke9jfkk32GStqyzaCve0jK1qlPcyfBNW3NG-GB7dE12UiZH7E/exec";
  const SHEET_Id = "1-j3ydNhMDwa-SfvejOH15ow7ZZ10I1zwdV4acAirHe4";
  const FOLDER_ID = "1ZOuHUXUjONnHb4TBWqztjQcI5Pjvy_n0";

  const API = "http://localhost:5050/api/payment";  // Update if deployed

const fetchAllTasks = async () => {
  try {
    setLoadingTasks(true);
    const res = await fetch(`${API}/pending`);
    const data = await res.json();

    if (data.success) {
      setPendingRepairPayments(data.tasks);
    }
  } catch (err) {
    toast.error("Failed to load pending tasks");
  } finally {
    setLoadingTasks(false);
  }
};

const fetchPayments = async () => {
  try {
    setLoadingTasks(true);
    const res = await fetch(`${API}/history`);
    const data = await res.json();

    if (data.success) {
      setHistoryRepairPayments(data.payments);
      setRepairPayments(data.payments);
    }
  } catch (err) {
    toast.error("Failed to load payment history");
  } finally {
    setLoadingTasks(false);
  }
};

  useEffect(() => {
    fetchAllTasks();
    fetchPayments();
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!selectedTask) return;

  try {
    setSubmitLoading(true);

const newPayment = {
  time_stamp: new Date().toISOString(),
  payment_no: "",   // backend trigger will overwrite
  repair_task_no: selectedTask.task_no,
  serial_no: selectedTask.serial_no,
  machine_name: selectedTask.machine_name,
  vendor_name: selectedTask.vendor_name,
  bill_no: selectedTask.bill_no,
  total_bill_amount: selectedTask.total_bill_amount,
  payment_type: formData.payment_type,
  to_be_paid_amount: formData.to_be_paid_amount
};



    const res = await fetch("http://localhost:5050/api/payment/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPayment)
    });

    const result = await res.json();

    if (result.success) {
      toast.success("Payment added successfully!");

      // Update UI
      addRepairPayment(result.payment);
      setHistoryRepairPayments(prev => [...prev, result.payment]);

      setIsModalOpen(false);
      fetchPayments();
    } else {
      toast.error("Submit failed!");
    }
  } catch (err) {
    toast.error("Error submitting payment");
  } finally {
    setSubmitLoading(false);
  }
};


  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   try {
  //     setSubmitLoading(true);
  //     let bill_imageUrl = "";
  //     if (formData.productImage) {
  //       bill_imageUrl = await uploadFileToDrive(formData.productImage);
  //     }

  //     const payload = {
  //       action: "update1",
  //       sheetName: "Repair System",
  //       task_no: selectedTask.task_no,

  //       // Required Headers:
  //       Actual2: new Date().toLocaleString("en-GB", {
  //         timeZone: "Asia/Kolkata",
  //       }),
  //       "Received Quantity": formData.receivedQuantity,
  //       "Bill Match": formData.billMatch,
  //       "Bill Image": bill_imageUrl,
  //       "Bill No.": formData.bill_no,
  //       "Product Image": bill_imageUrl,
  //     };

  //     const response = await fetch(SCRIPT_URL, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded",
  //       },
  //       body: new URLSearchParams(payload).toString(),
  //     });

  //     const result = await response.json();
  //     console.log("Update result:", result);

  //     if (result.success) {
  //       alert("✅ Task updated successfully");
  //       setIsModalOpen(false);
  //       fetchAllTasks(); // refresh the table
  //     } else {
  //       alert("❌ Failed to update task: " + result.message);
  //     }
  //   } catch (error) {
  //     console.error("Submit error:", error);
  //     alert("❌ Something went wrong while submitting");
  //   } finally {
  //     setSubmitLoading(false);
  //   }
  // };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Repair Advance</h1>
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
              Pending ({pendingRepairPayments.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              History ({historyRepairPayments.length})
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

        {/* {activeTab === "pending" && (
          <div>
          <Table>
            <TableHeader>
              <TableHead>Action</TableHead>
              <TableHead>Task Number</TableHead>
              <TableHead>Machine Name</TableHead>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Bill No</TableHead>
              <TableHead>Total Bill Amount</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>To Be Paid Amount</TableHead>
            </TableHeader>
            <TableBody>
              {pendingTasks.map((task) => (
                <TableRow key={task.task_no}>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleMaterialClick(task)}
                      className="flex items-center"
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      Material
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {task.task_no}
                  </TableCell>
                  <TableCell>{task.machine_name}</TableCell>
                  <TableCell>{task.vendor_name || "-"}</TableCell>
                  <TableCell>{task.bill_no}</TableCell>
                  <TableCell>{task.total_bill_amount || "-"}</TableCell>
                  <TableCell>{task.payment_type || "-"}</TableCell>
                  <TableCell>{task.to_be_paid_amount || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loadingTasks && (
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
              <TableHead>Vendor Name</TableHead>
              <TableHead>Bill No</TableHead>
              <TableHead>Total Bill Amount</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>To Be Paid Amount</TableHead>
            </TableHeader>
            <TableBody>
              {historyTasks.map((task) => (
                <TableRow key={task.task_no}>
                  <TableCell className="font-medium text-blue-600">
                    {task.task_no}
                  </TableCell>
                  <TableCell>{task.machine_name}</TableCell>
                  <TableCell>{task.vendor_name || "-"}</TableCell>
                  <TableCell>{task.bill_no}</TableCell>
                  <TableCell>{task.total_bill_amount || "-"}</TableCell>
                  <TableCell>{task.payment_type || "-"}</TableCell>
                  <TableCell>{task.to_be_paid_amount || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loadingTasks && (
              <div className="flex flex-col items-center justify-center w-[75vw] mt-10">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            )}
          </div>
        )} */}



        {activeTab === "pending" && (
          <div>
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
                <TableHead>Transpoter Amount</TableHead>
                <TableHead>Bill Image</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Total Bill Amount</TableHead>
                <TableHead>To Be Paid</TableHead>
              </TableHeader>
              <TableBody>
                {pendingRepairPayments.map((task) => (
                  <TableRow key={task.task_no}>
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
                      {task.task_no}
                    </TableCell>
                    <TableCell>{task.machine_name}</TableCell>
                    <TableCell>{task.serial_no}</TableCell>

                    <TableCell>{task.planned_4}</TableCell>
                    <TableCell>{task.doerName}</TableCell>
                    <TableCell>{task.vendor_name || "-"}</TableCell>
                    <TableCell>{task.lead_time_to_deliver}</TableCell>
                    <TableCell>{task.payment_type || "-"}</TableCell>

                    <TableCell>{task.how_much || "-"}</TableCell> 

                    <TableCell>{task.bill_image || "-"}</TableCell>
                    <TableCell>{task.bill_no || "-"}</TableCell>
                    <TableCell>
                      ₹{task.total_bill_amount?.toLocaleString() || "-"}
                    </TableCell>
                    <TableCell>
                      ₹{task.to_be_paid_amount?.toLocaleString() || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

              {loadingTasks && pendingRepairPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center w-[75vw] mt-10">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading tasks...</p>
            </div>
          )}
           {!loadingTasks && pendingRepairPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center w-[75vw] mt-10">
              <p className="mt-4 text-gray-600">No pending payments found</p>
            </div>
          )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <Table>
              <TableHeader>
                <TableHead>Payment No.</TableHead>
                <TableHead>Repair Task No.</TableHead>

                <TableHead>Serial No</TableHead>

                <TableHead>Machine Name</TableHead>
                <TableHead>Vendor Name</TableHead>

                <TableHead>Bill No.</TableHead>

                <TableHead>Total Bill Amount</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>To Be Paid Amount</TableHead>

                <TableHead>Bill Match</TableHead>
              </TableHeader>
              <TableBody>
                {historyRepairPayments.map((task,index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-blue-600">
                      {task.payment_no}
                    </TableCell>
                    <TableCell>{task.repair_task_no}</TableCell>
                    <TableCell>{task.serial_no}</TableCell>
                    <TableCell>{task.machine_name}</TableCell>
                    <TableCell>{task.vendor_name || "-"}</TableCell>
                    <TableCell>{task.bill_no || "-"}</TableCell>

                    <TableCell>{task.total_bill_amount || "-"}</TableCell>
                    <TableCell>{task. payment_type || "-"}</TableCell>
                    <TableCell>{task.to_be_paid_amount || "-"}</TableCell>


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

            {loadingTasks && historyRepairPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center w-[75vw] mt-10">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading payment history...</p>
            </div>
          )}

          {!loadingTasks && historyRepairPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center w-[75vw] mt-10">
              <p className="mt-4 text-gray-600">No payment history found</p>
            </div>
          )}
        </div>
      )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Repair Advance Details"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment No. (Read-only)
              </label>
              <input
                type="text"
                value={"PN-001" || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
               Serial No (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.serial_no || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill No. (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.bill_no || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repair Task Number (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.task_no || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Name (Read-only)
              </label>
              <input
                type="text"
                value={selectedTask?.vendor_name || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Bill Amount *
              </label>
              <input
                type="number"
                value={selectedTask?.total_bill_amount}
                readOnly
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    total_bill_amount: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Be Paid Amount *
              </label>
              <input
                type="number"
                value={formData.to_be_paid_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    to_be_paid_amount: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MakePayment;
