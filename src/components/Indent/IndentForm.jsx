import React, { useEffect, useState } from "react";
import { Plus, X, Upload, Loader2Icon } from "lucide-react";
import Button from "../ui/Button";
import toast from "react-hot-toast";

const IndentForm = ({ onSubmit, onCancel, taskList }) => {
  const [sheetData, setSheetData] = useState([]); // MACHINE LIST
  const [serialData, setSerialData] = useState([]); // SERIAL LIST WITH EXTRA DATA

  const [doerName, setDoerName] = useState([]);
  const [giveByData, setGivenByData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  const [selectedMachine, setSelectedMachine] = useState("");
  const [filteredSerials, setFilteredSerials] = useState([]);

  const [selectedSerialNo, setSelectedSerialNo] = useState("");
  const [selectedGivenBy, setSelectedGivenBy] = useState("");
  const [selectedDoerName, setSelectedDoerName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  const [machinePartName, setMachinePartName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setPromblemInMachine] = useState("");

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTaskDate, setEndTaskDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const [enableReminder, setEnableReminder] = useState(false);
  const [requireAttachment, setRequireAttachment] = useState(false);

  const [userManualFile, setUserManualFile] = useState(null);
  const [loaderSubmit, setLoaderSubmit] = useState(false);
  const [loaderMasterSheetData, setLoaderMasterSheetData] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // --------------------------------------------
  // 🔵 FETCH OPTIONS FROM POSTGRESQL BACKEND
  // --------------------------------------------
  const fetchFormOptions = async () => {
    try {
      setLoaderMasterSheetData(true);

      const res = await fetch(`${API_URL}/repair-options/form-options`)

      const result = await res.json();

      if (result.success) {
        setSheetData(result.machines);   // Machine names
        setSerialData(result.serials);   // serial list with machine_name

        setDoerName(result.doerNames);
        setGivenByData(result.givenBy);
        setPriorityData(result.priority);
        setDepartmentData(result.departments);
      }
    } catch (err) {
      console.error("❌ Error fetching form options:", err);
    } finally {
      setLoaderMasterSheetData(false);
    }
  };

  // Load from backend on mount
  useEffect(() => {
    fetchFormOptions();
  }, []);

  // --------------------------------------------
  // 🔵 MATCH SERIAL BASED ON MACHINE NAME
  // --------------------------------------------
  useEffect(() => {
    if (selectedMachine) {
      const filtered = serialData
        .filter((item) => item.machine_name === selectedMachine)
        .map((item) => item.serial_no);

      setFilteredSerials(filtered);
    }
  }, [selectedMachine]);

  // --------------------------------------------
  // 🔵 FILE UPLOAD FUNCTION (UNCHANGED)
  // --------------------------------------------
  const uploadFileToDrive = async (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          resolve(""); // remove Google Script upload logic
        } catch (err) {
          resolve("");
        }
      };
      reader.onerror = () => reject("File read error");
      reader.readAsDataURL(file);
    });
  };

  const clearFormState = () => {
    setSelectedSerialNo("");
    setSelectedMachine("");
    setSelectedGivenBy("");
    setSelectedDoerName("");
    setStartDate("");
    setEndTaskDate("");
    setEndTime("");
    setStartTime("");
    setPromblemInMachine("");
    setSelectedPriority("");
    setMachinePartName("");
    setLocation("");
    setEnableReminder(false);
    setRequireAttachment(false);
    setUserManualFile(null);
    setSelectedDepartment("");
  };

  // --------------------------------------------
  // 🔵 SUBMIT FORM (UNCHANGED)
  // --------------------------------------------
const handleSubmitForm = async (e) => {
  e.preventDefault();

  // ----------------------------
  // 1️⃣ VALIDATION
  // ----------------------------
  if (!selectedMachine) return toast.error("Please select Machine Name");
  if (!selectedSerialNo) return toast.error("Please select Serial No");
  if (!selectedGivenBy) return toast.error("Please select Given By");
  if (!selectedDoerName) return toast.error("Please select Doer Name");

  if (!startDate || !startTime)
    return toast.error("Please select Task Start Date & Time");

  if (!endTaskDate || !endTime)
    return toast.error("Please select Task End Date & Time");

  // ----------------------------
  // 2️⃣ SAFE TIMESTAMP BUILDER
  // ----------------------------
  const buildTimestamp = (date, time) => {
    if (!date || !time) return null;
    return `${date} ${time}:00`;
  };

  // ----------------------------
  // 3️⃣ CURRENT TIMESTAMP
  // ----------------------------
  const now = new Date();
  const timeStamp = now.toISOString().replace("T", " ").substring(0, 19);

  // ---------------------------------------------------------
  // 4️⃣ BUILD FORM-DATA (IMPORTANT FOR FILE UPLOAD)
  // ---------------------------------------------------------
  const formData = new FormData();

  formData.append("time_stamp", timeStamp);
  formData.append("serial_no", selectedSerialNo);
  formData.append("machine_name", selectedMachine);
  formData.append("given_by", selectedGivenBy);
  formData.append("doer_name", selectedDoerName);

  formData.append("enable_reminders", enableReminder);
  formData.append("require_attachment", requireAttachment);

  formData.append("task_start_date", buildTimestamp(startDate, startTime));
  formData.append("task_ending_date", buildTimestamp(endTaskDate, endTime));

  formData.append("problem_with_machine", description || "");
  formData.append("department", selectedDepartment || "");
  formData.append("location", location || "");
  formData.append("machine_part_name", machinePartName || "");
  formData.append("priority", selectedPriority || "");

  // ⭐ FILE → append only if exists
  if (userManualFile) {
    formData.append("image", userManualFile); // MUST MATCH multer.single("image")
  }

  console.log("📤 FormData sending to backend...");

  // ---------------------------------------------------------
  // 5️⃣ SEND REQUEST (NO HEADERS FOR FORM-DATA)
  // ---------------------------------------------------------
  try {
    setLoaderSubmit(true);

    const response = await fetch(`${API_URL}/repair/create`, {
      method: "POST",
      body: formData, // ⭐ IMPORTANT
    });

    const result = await response.json();
    console.log("📩 Backend Response:", result);

    if (result.success) {
      toast.success("✅ Repair Task Created Successfully!");
      clearFormState();
      if (onSubmit) onSubmit();
      onCancel();
    } else {
      toast.error(result.message || "Server Error!");
    }
  } catch (error) {
    console.error("❌ Backend error:", error);
    toast.error("Unable to submit!");
  } finally {
    setLoaderSubmit(false);
  }
};



  // --------------------------------------------
  // 🔵 JSX (UNCHANGED)
  // --------------------------------------------
  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* MACHINE NAME DROPDOWN */}
        <div>
          <label className="block mb-1 text-sm">Machine Name *</label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            // className="w-full border p-2 rounded"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"

          >
            <option value="">Select Machine</option>
            {sheetData.map((machine, i) => (
              <option key={i} value={machine}>{machine}</option>
            ))}
          </select>
        </div>

        {/* SERIAL NO */}
        {selectedMachine && (
          <div>
            <label className="block mb-1 text-sm">Serial No *</label>
            <select
              value={selectedSerialNo}
              onChange={(e) => setSelectedSerialNo(e.target.value)}
              // className="w-full border p-2 rounded"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"

            >
              <option value="">Select Serial</option>
              {filteredSerials.map((serial, i) => (
                <option key={i} value={serial}>{serial}</option>
              ))}
            </select>
          </div>
        )}

        {/* DOER NAME */}
        <div>
          <label className="block mb-1 text-sm">Doer Name *</label>
          <select
            value={selectedDoerName}
            onChange={(e) => setSelectedDoerName(e.target.value)}
            // className="w-full border p-2 rounded"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"

          >
            <option value="">Select Doer Name</option>
            {doerName.map((d, i) => (
              <option key={i} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* GIVEN BY */}
        <div>
          <label className="block mb-1 text-sm">Given By *</label>
          <select
            value={selectedGivenBy}
            onChange={(e) => setSelectedGivenBy(e.target.value)}
            // className="w-full border p-2 rounded"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"

          >
            <option value="">Select Given By</option>
            {giveByData.map((name, i) => (
              <option key={i} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* DEPARTMENT */}
        <div>
          <label className="block mb-1 text-sm">Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            // className="w-full border p-2 rounded"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"

          >
            <option value="">Select Department</option>
            {departmentData.map((dp, i) => (
              <option key={i} value={dp}>{dp}</option>
            ))}
          </select>
        </div>


        {/* MACHINE PART NAME */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Machine Part Name
  </label>
  <input
    type="text"
    value={machinePartName}
    onChange={(e) => setMachinePartName(e.target.value)}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
               focus:border-indigo-500 focus:ring-indigo-500 
               sm:text-sm border p-2"
    placeholder="Enter part name"
  />
</div>


        {/* PRIORITY */}
        <div>
          <label className="block mb-1 text-sm">Priority</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            // className="w-full border p-2 rounded"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"

          >
            <option value="">Select Priority</option>
            {priorityData.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Task Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        {/* Task Start Time */}
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700"
          >
            Task Start Time
          </label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="endTaskDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Task End Date
          </label>
          <input
            type="date"
            id="endTaskDate"
            value={endTaskDate}
            onChange={(e) => setEndTaskDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        {/* Task End Time */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700"
          >
            Task End Time
          </label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Problem With Machine
        </label>
        <textarea
          id="description"
          onChange={(e) => setPromblemInMachine(e.target.value)}
          value={description}
          rows={4}
          className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter Machine Problem..."
        />
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Location
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* upload Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image of the Machine
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors duration-200">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload a file</span>
                <input
                  type="file"
                  name="imageOfTheMachine"
                  onChange={(e) => setUserManualFile(e.target.files[0])}
                  className="sr-only"
                  accept="image/*"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            {userManualFile && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {userManualFile.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="enableReminders"
            checked={enableReminder}
            onChange={() => setEnableReminder((prev) => !prev)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable Reminders</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="requireAttachment"
            checked={requireAttachment}
            onChange={() => setRequireAttachment((prev) => !prev)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Require Attachment</span>
        </label>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loaderSubmit}>
          {loaderSubmit && <Loader2Icon className="animate-spin mr-2" />}
          Save Indent
        </Button>
      </div>
    </form>
  );
};

export default IndentForm;