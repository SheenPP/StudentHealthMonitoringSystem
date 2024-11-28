import React from 'react';

interface EmergencyContactsProps {
  name: string;
  relation: string;
  phone: string;
}

const EmergencyContacts: React.FC<EmergencyContactsProps> = ({ name, relation, phone }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Emergency Contacts</h2>
      <p className="text-gray-700">Name: <span className="font-medium">{name}</span></p>
      <p className="text-gray-700">Relation: <span className="font-medium">{relation}</span></p>
      <p className="text-gray-700">Contact: <span className="font-medium">{phone}</span></p>
      {/* Add more details here if needed */}
    </div>
  );
};

export default EmergencyContacts;
