import React from "react";
import { FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
}

const RecordNotification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-md shadow-lg flex items-center space-x-2 z-50 transition-all duration-300 ${
        type === "success"
          ? "bg-green-100 text-green-800"
          : type === "error"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {type === "success" ? (
        <FiCheckCircle size={24} />
      ) : type === "error" ? (
        <FiXCircle size={24} />
      ) : (
        <FiAlertCircle size={24} />
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-lg font-bold">
        &times;
      </button>
    </div>
  );
};

export default RecordNotification;
