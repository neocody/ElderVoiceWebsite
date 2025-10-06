import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import AddPatientModal from "@/components/AddUserModal";
import EditUserModal from "@/components/EditUserModal";
import PatientCallLogsModal from "@/components/PatientCallLogsModal";
import PatientViewModal from "@/components/PatientViewModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, PhoneCall, History } from "lucide-react";
import type { ElderlyUser } from "@shared/schema";

export default function Users() {
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [viewPatientModalOpen, setViewPatientModalOpen] = useState(false);
  const [callLogsModalOpen, setCallLogsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ElderlyUser | null>(null);

  const { data: elderlyUsers = [] } = useQuery<ElderlyUser[]>({
    queryKey: ["/api/elderly-users"],
  });

  const handleViewPatient = (user: any) => {
    setSelectedUser(user);
    setViewPatientModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const handleViewCallLogs = (user: any) => {
    setSelectedUser(user);
    setCallLogsModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-secondary/10 text-secondary';
      case 'needs_attention': return 'bg-accent/10 text-accent';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">Patients</h2>
              <p className="text-textSecondary">Manage patient profiles and settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-10 pr-4 py-2 w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary" size={16} />
              </div>
              <Button
                onClick={() => setAddUserModalOpen(true)}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Plus className="mr-2" size={16} />
                Add New Patient
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-surface rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Call Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Preferred Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {elderlyUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-textSecondary">
                        No elderly users found. Add your first user to get started.
                      </td>
                    </tr>
                  ) : (
                    elderlyUsers.map((user: any) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleEditUser(user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-textPrimary font-medium text-sm">
                                {getInitials(user.name)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-textPrimary">{user.name}</div>
                              {user.age && (
                                <div className="text-sm text-textSecondary">Age {user.age}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary capitalize">
                          {user.callFrequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                          {user.preferredCallTime ? (
                            new Date(`2000-01-01T${user.preferredCallTime}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })
                          ) : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status === 'active' ? 'Active' : 
                             user.status === 'needs_attention' ? 'Needs Attention' : 
                             user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="text-primary hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPatient(user);
                              }}
                              title="View Patient Profile"
                              data-testid="button-view-patient"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="text-textSecondary hover:text-textPrimary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUser(user);
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="text-primary hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Manual call functionality
                              }}
                            >
                              <PhoneCall size={16} />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCallLogs(user);
                              }}
                              title="View Call History"
                            >
                              <History size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <AddPatientModal 
        open={addUserModalOpen} 
        onOpenChange={setAddUserModalOpen} 
      />

      <PatientViewModal
        open={viewPatientModalOpen}
        onOpenChange={setViewPatientModalOpen}
        patient={selectedUser}
        onEditClick={() => {
          setViewPatientModalOpen(false);
          setEditUserModalOpen(true);
        }}
      />

      <EditUserModal 
        open={editUserModalOpen} 
        onOpenChange={setEditUserModalOpen}
        user={selectedUser}
      />

      {selectedUser && (
        <PatientCallLogsModal
          isOpen={callLogsModalOpen}
          onClose={() => setCallLogsModalOpen(false)}
          patientId={selectedUser.id}
          patientName={selectedUser.name}
        />
      )}
    </Layout>
  );
}
