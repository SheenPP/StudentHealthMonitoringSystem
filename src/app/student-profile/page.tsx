"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit, FiX } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ConsultationCards from "../components/ConsultationCards";
import ClinicHistory from "../components/ClinicHistory";
import EmergencyContacts from "../components/EmergencyContacts";
import Image from "next/image";
import AddRecord from "../components/addrecord";
import EditRecord from "../components/editRecord";
import { Trie } from "../components/utils/trie";
import useAuth from "../hooks/useAuth";

interface UserProfile {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  present_address: string;
  home_address: string;
  course: string | null;
  year: string | null;
  department: string | null;
  medical_history: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  photo_path: string;
  role: "student" | "teacher";
}

const UserProfileManager: React.FC = () => {
  const { user, authChecked, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [randomProfiles, setRandomProfiles] = useState<UserProfile[]>([]);
  const [recentSearches, setRecentSearches] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [profileDetails, setProfileDetails] = useState<Record<string, UserProfile | null>>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recordAdded, setRecordAdded] = useState(false);
  const [trie, setTrie] = useState<Trie<UserProfile> | null>(null);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/user-profiles");
      const data: UserProfile[] = await res.json();

      const newTrie = new Trie<UserProfile>();
      data.forEach((profile) => {
        const fullName1 = `${profile.first_name} ${profile.last_name}`;
        const fullName2 = `${profile.last_name} ${profile.first_name}`;
        const id = profile.user_id;

        newTrie.insert(fullName1, profile);
        newTrie.insert(fullName2, profile);
        newTrie.insert(id, profile);
      });

      setTrie(newTrie);
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      setRandomProfiles(shuffled.slice(0, 5));
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/");
    } else if (authChecked) {
      fetchProfiles();
    }
  }, [authChecked, user]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase().trim();
    setSearchTerm(term);
    if (trie && term) {
      const results = trie.search(term);
      setProfiles(results);
    } else {
      setProfiles([]);
    }
  };

  const handleSelectProfile = (profile: UserProfile) => {
    const key = profile.last_name;
    setProfileDetails((prev) => ({ ...prev, [key]: profile }));
    if (!activeTabs.includes(key)) {
      setActiveTabs((prevTabs) => [...prevTabs, key]);
    }
    setActiveTab(key);
    setSearchTerm("");
    setProfiles([]);
    setRecentSearches((prev) => {
      const updated = [profile, ...prev.filter((p) => p.user_id !== profile.user_id)];
      return updated.slice(0, 5);
    });
  };

  const handleCloseDetails = (key: string) => {
    setActiveTabs((prevTabs) => prevTabs.filter((tab) => tab !== key));
    setProfileDetails((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    if (activeTab === key) {
      setActiveTab(activeTabs[0] || null);
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setRecordAdded(false);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    if (recordAdded) toast.success("Record successfully added!");
  };

  const openEditModal = () => setIsEditModalOpen(true);

  const closeEditModal = (updatedProfile?: UserProfile) => {
    setIsEditModalOpen(false);
    if (updatedProfile) {
      setProfileDetails((prev) => ({
        ...prev,
        [updatedProfile.last_name]: updatedProfile,
      }));
      toast.success("Record updated successfully!");
    }
    setTimeout(fetchProfiles, 100);
  };

  const handleAddSuccess = () => {
    setRecordAdded(true);
    setIsAddModalOpen(false);
    toast.success("Record successfully added!");
    fetchProfiles();
  };

  const handleAddFailure = (errorType: string) => {
    if (errorType === "duplicate") {
      toast.error("Duplicate entry. This record already exists.");
    } else {
      toast.error("Failed to add record. Please try again.");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-12 bg-gray-200 rounded w-3/4" />
      <div className="h-10 bg-gray-200 rounded w-1/4" />
      <div className="h-24 bg-gray-200 rounded" />
    </div>
  );

  if (authLoading || isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header />
      <ToastContainer />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-4 flex items-center space-x-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name or ID..."
              className="p-3 border border-gray-300 rounded-lg shadow-md focus:ring-blue-500 w-full sm:w-3/4"
            />
            <button
              onClick={openAddModal}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
            >
              Add Record
            </button>
          </div>

          {isAddModalOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
              <div className="p-6 rounded-lg shadow-lg max-w-5xl h-5/6 overflow-y-auto bg-white relative">
                <button
                  onClick={closeAddModal}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
                <AddRecord onAddSuccess={handleAddSuccess} onAddFailure={handleAddFailure} />
              </div>
            </div>
          )}

          {isEditModalOpen && activeTab && profileDetails[activeTab] && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
              <div className="p-6 rounded-lg shadow-lg max-w-5xl w-full h-5/6 overflow-y-auto bg-white relative">
                <button
                  onClick={() => closeEditModal()}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
                <EditRecord
                  userId={profileDetails[activeTab]!.user_id}
                  onClose={closeEditModal}
                />
              </div>
            </div>
          )}

          {!activeTab && !searchTerm && (
            <div className="mb-6 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="text-gray-700 font-semibold">Recent Searches</h3>
                  <ul className="bg-white rounded shadow divide-y">
  {recentSearches.map((profile) => (
    <li
      key={profile.user_id}
      onClick={() => handleSelectProfile(profile)}
      className="p-3 cursor-pointer hover:bg-gray-100 transition"
    >
      {profile.last_name.toUpperCase()}, {profile.first_name}
    </li>
  ))}
</ul>

                </div>
              )}
              {randomProfiles.length > 0 && (
                <div>
                  <h3 className="text-gray-700 font-semibold pb-3">Suggestions</h3>
                  <ul className="bg-white rounded shadow divide-y-2 ">
  {randomProfiles.map((profile) => (
    <li
      key={profile.user_id}
      onClick={() => handleSelectProfile(profile)}
      className="p-3 cursor-pointer hover:bg-blue-50 transition text-black-800"
    >
      {profile.last_name.toUpperCase()}, {profile.first_name}
    </li>
  ))}
</ul>

                </div>
              )}
            </div>
          )}

          {searchTerm && profiles.length > 0 && (
            <ul className="bg-white rounded-lg shadow-lg">
              {profiles.map((profile) => (
                <li
                  key={profile.user_id}
                  onClick={() => handleSelectProfile(profile)}
                  className="cursor-pointer p-4 hover:bg-blue-100 transition-colors"
                >
                  {profile.last_name.toUpperCase()}, {profile.first_name}
                </li>
              ))}
            </ul>
          )}

          {searchTerm && profiles.length === 0 && (
            <p className="text-gray-600">No profiles found...</p>
          )}

          <div className="mb-4 flex flex-wrap">
            {activeTabs.map((lastName) => (
              <div key={lastName} className="flex items-center mr-2 mb-2">
                <button
                  onClick={() => setActiveTab(lastName)}
                  className={`p-2 rounded-lg ${
                    activeTab === lastName
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {lastName.toUpperCase()}
                </button>
                <button
                  onClick={() => handleCloseDetails(lastName)}
                  className="ml-1 p-1 text-red-500 hover:bg-red-100 rounded-full"
                >
                  <FiX size={20} />
                </button>
              </div>
            ))}
          </div>

          {activeTab && profileDetails[activeTab] && (
            <div className="mt-4 bg-white rounded-lg p-4 shadow-lg relative">
              <button
                onClick={openEditModal}
                className="absolute top-2 right-2 text-blue-500 hover:text-blue-700"
              >
                <FiEdit size={20} />
              </button>

              <section className="flex gap-4 mb-4">
                <Image
                  src={profileDetails[activeTab]!.photo_path || "/profile.png"}
                  alt="Profile photo"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-full border"
                />
                <div>
                  <p className="text-xl font-semibold">
                    Name: {profileDetails[activeTab]!.last_name.toUpperCase()},{" "}
                    {profileDetails[activeTab]!.first_name}
                  </p>
                  <p>ID: {profileDetails[activeTab]!.user_id}</p>
                  <p>Present Address: {profileDetails[activeTab]!.present_address}</p>
                  <p>Home Address: {profileDetails[activeTab]!.home_address}</p>
                  <p>
                    Course - Year: {profileDetails[activeTab]!.course} -{" "}
                    {profileDetails[activeTab]!.year}
                  </p>
                  <p>Date of Birth: {formatDate(profileDetails[activeTab]!.date_of_birth)}</p>
                  <p>Email: {profileDetails[activeTab]!.email}</p>
                  <p>Phone: {profileDetails[activeTab]!.phone_number}</p>
                </div>
              </section>

              <ConsultationCards selectedProfile={profileDetails[activeTab]!} />
              <ClinicHistory id={profileDetails[activeTab]!.user_id} />
            </div>
          )}
        </main>

        {activeTab && profileDetails[activeTab] && (
          <EmergencyContacts
            name={profileDetails[activeTab]!.emergency_contact_name}
            relation={profileDetails[activeTab]!.emergency_contact_relation}
            phone={profileDetails[activeTab]!.emergency_contact_phone}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfileManager;
