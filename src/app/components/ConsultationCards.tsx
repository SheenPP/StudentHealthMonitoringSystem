'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiEdit, FiArchive, FiDownload } from 'react-icons/fi';
import ConfirmationDialog from './ConfirmationDialog';
import useActiveUser from '../hooks/useActiveUser';
import { UserProfile } from './editRecord';

interface FileRecord {
  id: number;
  file_name: string;
  file_path: string;
}

interface Consultation {
  id?: number;
  name: string;
  for_role: 'student' | 'teacher' | 'both';
}

interface ConsultationCardsProps {
  selectedProfile: UserProfile | null;
}

const SkeletonCard = () => (
  <div className="p-6 bg-gray-100 border-l-4 border-gray-300 rounded-lg animate-pulse h-24" />
);

const ConsultationCards: React.FC<ConsultationCardsProps> = ({ selectedProfile }) => {
  const { user, loading: userLoading, authChecked } = useActiveUser();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileRecord[]>([]);
  const [editingFile, setEditingFile] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: number; path: string } | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openModal = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsOpen(true);
    fetchUploadedFiles(consultation);
  };

  const closeModal = () => {
    setIsOpen(false);
    setFile(null);
    setEditingFile(null);
    setMessage(null);
    setUploadedFiles([]);
    setSelectedFilePath(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const fetchUploadedFiles = useCallback(async (consultation: Consultation) => {
    if (!selectedProfile) return;
    setLoadingFiles(true);
    try {
      const response = await fetch(
        `/api/files?user_id=${selectedProfile.user_id}&consultation_type=${encodeURIComponent(
          consultation.name
        )}`
      );
      if (!response.ok) throw new Error();
      const result = await response.json();
      setUploadedFiles(result.files || []);
    } catch {
      setUploadedFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedProfile]);

  const handleUpload = async () => {
    if (!file || !selectedConsultation || !selectedProfile) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', selectedProfile.user_id);
    formData.append('consultation_type', selectedConsultation.name);

    if (editingFile) {
      formData.append('file_id', editingFile.toString());
      formData.append('new_file', file.name);
    }

    setLoading(true);
    try {
      const endpoint = editingFile ? '/api/update' : '/api/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error();

      setMessage({
        type: 'success',
        text: editingFile ? 'File updated successfully!' : 'File uploaded successfully!',
      });

      fetchUploadedFiles(selectedConsultation);
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload/update file.' });
    } finally {
      setLoading(false);
      setFile(null);
      setEditingFile(null);
    }
  };

  const confirmDelete = (fileId: number, filePath: string) => {
    setFileToDelete({ id: fileId, path: filePath });
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedConsultation || !fileToDelete || !user || !selectedProfile) return;

    setLoading(true);
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileToDelete.id,
          file_path: fileToDelete.path,
          user_id: selectedProfile.user_id,
          consultation_type: selectedConsultation.name,
          username: user.username,
        }),
      });

      if (!res.ok) throw new Error();

      setMessage({ type: 'success', text: 'File moved to recycle bin.' });
      fetchUploadedFiles(selectedConsultation);
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete file.' });
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const handleDownload = (filePath: string) => {
    if (!filePath) return;
    const a = document.createElement('a');
    a.href = filePath;
    a.target = '_blank';
    a.download = filePath.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const fetchConsultationTypes = async () => {
    try {
      setLoadingConsultations(true);
      const res = await fetch('/api/consultation-types');
      const data = await res.json();
      const filtered = data.filter(
        (item: Consultation) =>
          item.for_role === selectedProfile?.role || item.for_role === 'both'
      );
      setConsultations(filtered);
    } catch (error) {
      console.error('Error fetching consultation types', error);
    } finally {
      setLoadingConsultations(false);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      fetchConsultationTypes();
    }
  }, [selectedProfile]);

  useEffect(() => {
    if (isOpen && selectedConsultation) {
      fetchUploadedFiles(selectedConsultation);
    }
  }, [isOpen, selectedConsultation, fetchUploadedFiles]);

  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loadingConsultations
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : consultations.map((c, i) => (
              <div
                key={i}
                onClick={() => openModal(c)}
                className="p-4 sm:p-6 bg-white border-l-4 border-blue-600 rounded-lg shadow hover:shadow-md cursor-pointer transition-all"
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">{c.name}</h3>
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
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Dialog.Panel className="w-full max-w-3xl bg-white rounded-lg p-6 shadow-xl">
                <Dialog.Title className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-4">
                  {selectedConsultation?.name}
                </Dialog.Title>

                {message && (
                  <div
                    className={`text-sm text-center mb-4 p-2 rounded ${
                      message.type === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full mb-4 border border-gray-300 rounded px-4 py-2"
                />

                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className={`w-full py-2 text-white font-semibold rounded ${
                    loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Processing...' : editingFile ? 'Update File' : 'Upload File'}
                </button>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Uploaded Files</h4>
                  {loadingFiles ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : uploadedFiles.length === 0 ? (
                    <p className="text-gray-500">No files uploaded yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li
                          key={file.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded border"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-700 bg-blue-100 rounded-full">
                              {index + 1}
                            </span>
                            <span
                              className="text-blue-600 underline cursor-pointer"
                              onClick={() => {
                                setSelectedFilePath(file.file_path);
                                setIsPreviewOpen(true);
                              }}
                            >
                              {file.file_name}
                            </span>
                          </div>
                          <div className="flex space-x-3">
                            <FiEdit
                              className="text-blue-600 cursor-pointer"
                              onClick={() => setEditingFile(file.id)}
                            />
                            <FiArchive
                              className="text-red-600 cursor-pointer"
                              onClick={() => confirmDelete(file.id, file.file_path)}
                            />
                            <FiDownload
                              className="text-green-600 cursor-pointer"
                              onClick={() => handleDownload(file.file_path)}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="text-center mt-6">
                  <button
                    onClick={closeModal}
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isPreviewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setIsPreviewOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">
                  Document Preview
                </Dialog.Title>

                <div className="max-h-[75vh] overflow-y-auto border rounded p-4 bg-white">
                  {selectedFilePath?.endsWith('.pdf') ? (
                    <iframe
                      src={selectedFilePath}
                      className="w-full h-[70vh]"
                      title="PDF Preview"
                    />
                  ) : selectedFilePath?.endsWith('.docx') ? (
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(
                        selectedFilePath
                      )}&embedded=true`}
                      className="w-full h-[70vh]"
                      title="DOCX Preview"
                    />
                  ) : (
                    <p className="text-sm text-gray-500">Preview only available for .pdf and .docx files.</p>
                  )}
                </div>

                <div className="mt-4 text-right">
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Archive"
        message="Are you sure you want to archive this file?"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ConsultationCards;
