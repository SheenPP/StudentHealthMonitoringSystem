import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiUpload, FiFileText, FiEdit, FiTrash, FiDownload } from 'react-icons/fi';
import ConfirmationDialog from "./ConfirmationDialog";

interface Consultation {
  name: string;
}

interface Student {
  student_id: string; // ✅ Fixed from number to string
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
}

interface ConsultationCardsProps {
  selectedStudent: Student | null;
}

const ConsultationCards: React.FC<ConsultationCardsProps> = ({ selectedStudent }) => {
  const [consultations] = useState<Consultation[]>([
    { name: "Medical Consultation" },
    { name: "Medical Referral" },
    { name: "Pre-Enrollment" },
    { name: "Dental Consultation" },
    { name: "Waivers" },
    { name: "Guidance Referral" },
    { name: "Pre-Employment" },
    { name: "Laboratory Req" }
  ]);

  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [editingFile, setEditingFile] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: number; path: string } | null>(null);

  const openModal = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsOpen(true);
    fetchUploadedFiles();
  };

  const closeModal = () => {
    setIsOpen(false);
    setFile(null);
    setUploadedFiles([]);
    setEditingFile(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedConsultation) {
      setError("No file selected or no consultation selected");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_id', selectedStudent!.student_id.toString());
    formData.append('consultation_type', selectedConsultation.name);

    if (editingFile) {
      formData.append('file_id', editingFile.toString());
      formData.append('new_file', file.name);
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(editingFile ? '/api/update' : '/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(editingFile ? 'File update failed' : 'File upload failed');
      }

      setSuccessMessage(editingFile ? 'File updated successfully!' : 'File uploaded successfully!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      await fetchUploadedFiles();
      closeModal();
    }
  };

  const fetchUploadedFiles = async () => {
    if (!selectedConsultation) return;

    try {
      const response = await fetch(`/api/files?student_id=${selectedStudent!.student_id}&consultation_type=${encodeURIComponent(selectedConsultation.name)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const result = await response.json();
      setUploadedFiles(result.files || []);
    } catch (error: any) {
      setError('No files found');
      setUploadedFiles([]);
    }
  };

  const handleEdit = (fileId: number) => {
    setEditingFile(fileId);
    setIsOpen(true);
  };

  const confirmDelete = (fileId: number, filePath: string) => {
    setFileToDelete({ id: fileId, path: filePath });
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedConsultation || !fileToDelete) {
      setError("No consultation type specified or file to delete.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: fileToDelete.id,
          file_path: fileToDelete.path,
          student_id: selectedStudent!.student_id,
          consultation_type: selectedConsultation.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete file.");
      }

      setSuccessMessage(`File moved to recycle bin: ${fileToDelete.path}`);
      setFileToDelete(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      fetchUploadedFiles();
      setIsConfirmOpen(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    if (!selectedConsultation) {
      setError("No consultation type specified.");
      return;
    }

    try {
      const response = await fetch(`/api/download?consultation_type=${encodeURIComponent(selectedConsultation.name)}&filename=${encodeURIComponent(filePath)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filePath.split('/').pop() || 'download');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: any) {
      setError('Error downloading file');
    }
  };

  useEffect(() => {
    if (isOpen && selectedConsultation) {
      fetchUploadedFiles();
    }
  }, [isOpen, selectedConsultation]);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {consultations.map((consultation, index) => (
          <div
            key={index}
            className="p-4 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-blue-500"
            onClick={() => openModal(consultation)}
          >
            <h3 className="font-semibold text-lg text-gray-800">{consultation.name}</h3>
          </div>
        ))}
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl p-10 bg-white rounded-lg shadow-lg transform transition-all">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                    {selectedConsultation?.name}
                  </Dialog.Title>

                  {error && <p className="mt-2 text-red-600">{error}</p>}
                  {successMessage && <p className="mt-2 text-green-600">{successMessage}</p>}

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
                    >
                      {loading ? "Uploading..." : editingFile ? "Update File" : "Upload File"}
                    </button>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold">Uploaded Files</h4>
                    <ul className="space-y-4">
                      {uploadedFiles.length === 0 && <li>No files uploaded yet.</li>}
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span className="text-gray-700">{file.file_name}</span>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleEdit(file.id)}>
                              <FiEdit className="text-blue-600" />
                            </button>
                            <button onClick={() => confirmDelete(file.id, file.file_path)}>
                              <FiTrash className="text-red-600" />
                            </button>
                            <button onClick={() => handleDownload(file.file_path)}>
                              <FiDownload className="text-green-600" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this file? This action cannot be undone."
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ConsultationCards;
