"use client";
import { useEffect, useState } from "react";
import {
  FileText,
  Eye,
  AlertCircle,
  Plus,
  X,
  Search,
  ChevronDown,
  Edit3,
  CheckCircle,
   AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// SearchableSelect Component
function SearchableSelect({ options, value, onChange, placeholder = "Search..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.email?.toLowerCase().includes(search.toLowerCase()) ||
      opt.type?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border rounded px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
      >
        <span className={selectedOption ? "" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border max-h-64 overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidate..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-3">No forms found</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition ${
                      value === opt.value ? "bg-indigo-100" : ""
                    }`}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-gray-500">
                      {opt.email} • {opt.type}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const REQUIRED_DOCUMENTS = [
  { type: "aadhaar", label: "Aadhaar Card" },
  { type: "pan", label: "PAN Card" },
  { type: "driving_license", label: "Driving License" },
  { type: "bank_passbook", label: "Bank Passbook / Cancelled Cheque" },
];

export default function FormsWithUpload() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedFormId, setSelectedFormId] = useState("");
  const [documentFiles, setDocumentFiles] = useState({
    aadhaar: null,
    pan: null,
    driving_license: null,
    bank_passbook: null,
  });

  const [extraFields, setExtraFields] = useState({
    bank_account_number: "",
    ifsc_code: "",
    applicant_name: "",
    applicant_email: "",
    emergency_contact_number: "",
    emergency_contact_name: "",
    emergency_relation: "",
    emergency_address: "",
    date_of_birth: "",
    date_of_joining: "",
  });

  const [updatingDoc, setUpdatingDoc] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);
  const [editingExtra, setEditingExtra] = useState(null);
  const [extraEditValues, setExtraEditValues] = useState({
    bank_account_number: "",
    ifsc_code: "",
    applicant_name: "",
    applicant_email: "",
    emergency_contact_number: "",
    emergency_contact_name: "",
    emergency_relation: "",
    emergency_address: "",
    date_of_birth: "",
    date_of_joining: "",
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handlePreview = (type, formId, filename) => {
    if (type === "resume") {
      if (!formId) return alert("Resume not available");
      window.open(`${API_URL}/form/resume/${formId}`, "_blank");
    } else if (type === "document" && filename) {
      const url = `https://qrvisitordocuments.s3.amazonaws.com/${filename}`;
      window.open(url, "_blank");
    }
  };

  const fetchForms = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/form?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const response = await res.json();
      setForms(response.data || []);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.totalRecords);
      setError("");
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Cannot connect to server. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchForms(currentPage);
  }, [token, currentPage]);

  const handleFileChange = (docType, file) => {
    setDocumentFiles((prev) => ({ ...prev, [docType]: file || null }));
  };

  const handleUpload = async () => {
    if (!selectedFormId) return alert("Please select a candidate");

    const selectedFiles = Object.values(documentFiles).filter((file) => file !== null);
    if (selectedFiles.length === 0) {
      return alert("Please select at least one document to upload");
    }

    setUploading(true);
    const data = new FormData();

    selectedFiles.forEach((file) => data.append("documents", file));

    const selectedTypes = REQUIRED_DOCUMENTS.filter((doc) => documentFiles[doc.type] !== null).map(
      (doc) => doc.type
    );
    data.append("document_types", JSON.stringify(selectedTypes));
    data.append("form_submission_id", selectedFormId);

    Object.entries(extraFields).forEach(([key, value]) => {
      if (value && value.toString().trim() !== "") {
        data.append(key, value.toString().trim());
      }
    });

    try {
      const res = await fetch(`${API_URL}/upload-multiple`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      alert(`${selectedFiles.length} document(s) uploaded successfully!`);
      closeModal();
      fetchForms(currentPage);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateDocument = async () => {
    if (!updateFile || !updatingDoc) return;

    const data = new FormData();
    data.append("document", updateFile);

    try {
      const res = await fetch(`${API_URL}/documents/${updatingDoc.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Document updated successfully!");
      setUpdatingDoc(null);
      setUpdateFile(null);
      fetchForms(currentPage);
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const handleUpdateExtra = async () => {
    if (!editingExtra || !editingExtra.id) return;

    const payload = {};
    Object.entries(extraEditValues).forEach(([key, value]) => {
      if (value && value.toString().trim() !== "") {
        payload[key] = value.toString().trim();
      }
    });

    if (Object.keys(payload).length === 0) {
      return alert("Please change at least one field");
    }

    try {
      const res = await fetch(`${API_URL}/documents/update-extra/${editingExtra.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Update failed");
      }

      alert("Additional information updated successfully!");
      setEditingExtra(null);
      fetchForms(currentPage);
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFormId("");
    setDocumentFiles({ aadhaar: null, pan: null, driving_license: null, bank_passbook: null });
    setExtraFields({
      bank_account_number: "",
      ifsc_code: "",
      applicant_name: "",
      applicant_email: "",
      emergency_contact_number: "",
      emergency_contact_name: "",
      emergency_relation: "",
      emergency_address: "",
      date_of_birth: "",
      date_of_joining: "",
    });
  };

  const formOptions = forms.map((f) => ({
    value: f.id,
    label: f.name,
    email: f.email,
    type: f.application_type,
  }));

  const hasAtLeastOneFile = Object.values(documentFiles).some((file) => file !== null);
  const uploadButtonDisabled = uploading || !selectedFormId || !hasAtLeastOneFile;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-lg shadow text-center max-w-lg"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-sm text-gray-700 mb-4 whitespace-pre-line">{error}</p><button onClick={() => fetchForms(currentPage)} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Retry</button></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 text-xs">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-600" />
                Document Management
              </h1>
              <p className="text-xs text-gray-600">Upload & manage legal documents</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 px-4 rounded flex items-center gap-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              Add Employee Information
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone or type..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
              // Note: Search is server-side filtered in backend (color_id=1), client search removed for pagination accuracy
            />
          </div>
        </div>

        {/* Records Info */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {forms.length} of {totalRecords} employees (Page {currentPage} of {totalPages})
        </div>

        {forms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No employees found on this page</p>
          </div>
        ) : (
          <div className="space-y-6">
            {forms.map((form) => {
              const hasExtraInfo = form.documents?.some((doc) =>
                doc.bank_account_number ||
                doc.ifsc_code ||
                doc.applicant_name ||
                doc.applicant_email ||
                doc.emergency_contact_number ||
                doc.emergency_contact_name ||
                doc.emergency_relation ||
                doc.emergency_address ||
                doc.date_of_birth ||
                doc.date_of_joining
              ) || false;

              return (
                <div key={form.id} className="bg-white rounded-lg shadow border overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">{form.name}</h3>
                        <p className="text-xs text-gray-600">
                          {form.email} • {form.number || "N/A"} • {form.application_type}
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                        {form.documents?.length || 0}/4 Documents
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    {form.resume && (
                      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-indigo-600" />
                          <div>
                            <p className="font-medium">Resume</p>
                            <p className="text-xs text-gray-600 truncate max-w-[200px]">{form.resume}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreview("resume", form.id)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded text-xs flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" /> View
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800">Legal Documents</h4>
                        {hasExtraInfo && (
                          <button
                            onClick={() => {
                              const docWithExtra = form.documents.find((d) =>
                                d.bank_account_number ||
                                d.ifsc_code ||
                                d.applicant_name ||
                                d.applicant_email ||
                                d.emergency_contact_number ||
                                d.emergency_contact_name ||
                                d.emergency_relation ||
                                d.emergency_address ||
                                d.date_of_birth ||
                                d.date_of_joining
                              ) || form.documents[0];

                              setEditingExtra(docWithExtra);
                              setExtraEditValues({
                                bank_account_number: docWithExtra.bank_account_number || "",
                                ifsc_code: docWithExtra.ifsc_code || "",
                                applicant_name: docWithExtra.applicant_name || "",
                                applicant_email: docWithExtra.applicant_email || "",
                                emergency_contact_number: docWithExtra.emergency_contact_number || "",
                                emergency_contact_name: docWithExtra.emergency_contact_name || "",
                                emergency_relation: docWithExtra.emergency_relation || "",
                                emergency_address: docWithExtra.emergency_address || "",
                                date_of_birth: docWithExtra.date_of_birth || "",
                                date_of_joining: docWithExtra.date_of_joining || "",
                              });
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit Additional Info
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {REQUIRED_DOCUMENTS.map((doc) => {
                          const uploadedDoc = form.documents?.find((d) => d.document_type === doc.type);

                          return (
                            <div
                              key={doc.type}
                              className={`border rounded-lg p-4 ${
                                uploadedDoc ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  {uploadedDoc ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <AlertTriangle className="h-5 w-5 text-gray-400" />
                                  )}
                                  <div>
                                    <p className="font-medium">{doc.label}</p>
                                    {uploadedDoc && (
                                      <p className="text-xs text-gray-600 truncate max-w-[180px]">
                                        {uploadedDoc.file_name.split("/").pop()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {uploadedDoc && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handlePreview("document", null, uploadedDoc.file_name)}
                                      className="text-indigo-600 hover:bg-indigo-100 p-2 rounded"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUpdatingDoc(uploadedDoc);
                                        setUpdateFile(null);
                                      }}
                                      className="text-green-600 hover:bg-green-100 p-2 rounded"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {!uploadedDoc && <p className="text-xs text-red-600 mt-2">Not uploaded yet</p>}
                            </div>
                          );
                        })}
                      </div>

                      {hasExtraInfo && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
                          <p className="font-medium text-xl text-gray-700">Additional Information</p>
                          <div className="text-xs space-y-2 text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {form.documents[0]?.bank_account_number && <div>A/c No: {form.documents[0].bank_account_number}</div>}
                            {form.documents[0]?.ifsc_code && <div>IFSC: {form.documents[0].ifsc_code}</div>}
                            {form.documents[0]?.applicant_name && <div>Name: {form.documents[0].applicant_name}</div>}
                            {form.documents[0]?.applicant_email && <div>Email: {form.documents[0].applicant_email}</div>}
                            {form.documents[0]?.emergency_contact_number &&  <div>Emergency No: {form.documents[0].emergency_contact_number}</div>}
                            {form.documents[0]?.emergency_contact_name && <div>Emergency Contact: {form.documents[0].emergency_contact_name}</div>}
                            {form.documents[0]?.emergency_relation && <div>Relation: {form.documents[0].emergency_relation}</div>}
                            {form.documents[0]?.emergency_address && <div className="md:col-span-2">Emergency Address: {form.documents[0].emergency_address}</div>}
                            {form.documents[0]?.date_of_birth && <div>Date of Birth: {form.documents[0].date_of_birth}</div>}
                            {form.documents[0]?.date_of_joining && <div>Date of Joining: {form.documents[0].date_of_joining}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-5 py-2.5 border rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-5 py-2.5 border rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Total Employees", value: totalRecords },
            { label: "Total Documents", value: forms.reduce((a, f) => a + (f.documents?.length || 0), 0) },
            { label: "Complete (4/4)", value: forms.filter((f) => f.documents?.length === 4).length },
            { label: "With Resume", value: forms.filter((f) => f.resume).length },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded shadow text-center">
              <div className="text-2xl font-bold text-indigo-600">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Upload Information of Employee</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block font-medium mb-2">Select Candidate</label>
                <SearchableSelect
                  options={formOptions}
                  value={selectedFormId}
                  onChange={setSelectedFormId}
                  placeholder="Search by name..."
                />
              </div>

              <div>
                <h3 className="font-semibold mb-4">Legal Documents (Upload any number)</h3>
                <p className="text-xs text-gray-500 mb-4">You can upload 1, 2, 3 or all 4 documents</p>
                <div className="space-y-5">
                  {REQUIRED_DOCUMENTS.map((doc) => (
                    <div
                      key={doc.type}
                      className={`border-2 rounded-lg p-4 transition ${
                        documentFiles[doc.type] ? "border-green-500 bg-green-50" : "border-dashed border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="font-medium text-gray-800">{doc.label}</label>
                        {documentFiles[doc.type] && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleFileChange(doc.type, e.target.files[0] || null)}
                        className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                      />
                      {documentFiles[doc.type] && (
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-green-700 truncate">
                            Selected: {documentFiles[doc.type].name} ({(documentFiles[doc.type].size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                          <button
                            onClick={() => handleFileChange(doc.type, null)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="font-medium mb-3">Bank Details (Optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Bank A/c No" value={extraFields.bank_account_number} onChange={(e) => setExtraFields(prev => ({...prev, bank_account_number: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                    <input type="text" placeholder="IFSC Code" value={extraFields.ifsc_code} onChange={(e) => setExtraFields(prev => ({...prev, ifsc_code: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                    <input type="text" placeholder="Applicant Name" value={extraFields.applicant_name} onChange={(e) => setExtraFields(prev => ({...prev, applicant_name: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                    <input type="email" placeholder="Applicant Email" value={extraFields.applicant_email} onChange={(e) => setExtraFields(prev => ({...prev, applicant_email: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-3">Emergency Contact Information (Optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Contact Number" value={extraFields.emergency_contact_number} onChange={(e) => setExtraFields(prev => ({...prev, emergency_contact_number: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                    <input type="text" placeholder="Contact Person Name" value={extraFields.emergency_contact_name} onChange={(e) => setExtraFields(prev => ({...prev, emergency_contact_name: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                    <input type="text" placeholder="Relation with Contact" value={extraFields.emergency_relation} onChange={(e) => setExtraFields(prev => ({...prev, emergency_relation: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                    <input type="text" placeholder="Address" value={extraFields.emergency_address} onChange={(e) => setExtraFields(prev => ({...prev, emergency_address: e.target.value}))} className="col-span-2 border rounded px-3 py-2 text-xs" />
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-3">Personal Information (Optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date of Birth</label>
                      <input type="date" value={extraFields.date_of_birth} onChange={(e) => setExtraFields(prev => ({...prev, date_of_birth: e.target.value}))} className="w-full border rounded px-3 py-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date of Joining</label>
                      <input type="date" value={extraFields.date_of_joining} onChange={(e) => setExtraFields(prev => ({...prev, date_of_joining: e.target.value}))} className="w-full border rounded px-3 py-2 text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={closeModal} className="px-5 py-2.5 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleUpload}
                  disabled={uploadButtonDisabled}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : `Upload Selected Documents (${Object.values(documentFiles).filter(f => f).length})`}
                  {uploading && <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Document Modal */}
      {updatingDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Update {updatingDoc.document_type.replace("_", " ")}</h3>
            <p className="text-xs text-gray-600 mb-4">Current: {updatingDoc.file_name.split("/").pop()}</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
              className="w-full mb-5 text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-600 file:text-white"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setUpdatingDoc(null); setUpdateFile(null); }} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateDocument} disabled={!updateFile} className="px-5 py-2 bg-green-600 text-white rounded disabled:opacity-50">Update File</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Additional Info Modal */}
      {editingExtra && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-6">Update Additional Information</h3>

            <div className="space-y-6">
              <div>
                <p className="font-medium mb-3">Bank Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Bank A/c No" value={extraEditValues.bank_account_number} onChange={(e) => setExtraEditValues(prev => ({...prev, bank_account_number: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                  <input type="text" placeholder="IFSC Code" value={extraEditValues.ifsc_code} onChange={(e) => setExtraEditValues(prev => ({...prev, ifsc_code: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                  <input type="text" placeholder="Applicant Name" value={extraEditValues.applicant_name} onChange={(e) => setExtraEditValues(prev => ({...prev, applicant_name: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                  <input type="email" placeholder="Applicant Email" value={extraEditValues.applicant_email} onChange={(e) => setExtraEditValues(prev => ({...prev, applicant_email: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                </div>
              </div>

              <div>
                <p className="font-medium mb-3">Emergency Contact Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Contact Number" value={extraEditValues.emergency_contact_number} onChange={(e) => setExtraEditValues(prev => ({...prev, emergency_contact_number: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                  <input type="text" placeholder="Contact Person Name" value={extraEditValues.emergency_contact_name} onChange={(e) => setExtraEditValues(prev => ({...prev, emergency_contact_name: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                  <input type="text" placeholder="Relation with Contact" value={extraEditValues.emergency_relation} onChange={(e) => setExtraEditValues(prev => ({...prev, emergency_relation: e.target.value}))} className="border rounded px-3 py-2 text-xs" />
                  <input type="text" placeholder="Address" value={extraEditValues.emergency_address} onChange={(e) => setExtraEditValues(prev => ({...prev, emergency_address: e.target.value}))} className="col-span-2 border rounded px-3 py-2 text-xs" />
                </div>
              </div>

              <div>
                <p className="font-medium mb-3">Personal Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Date of Birth</label>
                    <input type="date" value={extraEditValues.date_of_birth} onChange={(e) => setExtraEditValues(prev => ({...prev, date_of_birth: e.target.value}))} className="w-full border rounded px-3 py-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Date of Joining</label>
                    <input type="date" value={extraEditValues.date_of_joining} onChange={(e) => setExtraEditValues(prev => ({...prev, date_of_joining: e.target.value}))} className="w-full border rounded px-3 py-2 text-xs" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditingExtra(null)} className="px-5 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateExtra} className="px-6 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}