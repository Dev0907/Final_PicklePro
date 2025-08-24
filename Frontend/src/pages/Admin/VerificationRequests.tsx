import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VerificationRequest {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const VerificationRequests = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchVerificationRequests = async () => {
      try {
        // In a real app, you would fetch this from your API
        // const response = await axios.get('/api/admin/verification-requests', {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        // });
        // setRequests(response.data);
        
        // Mock data for now
        setRequests([
          {
            id: 1,
            userId: 101,
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phone: '(555) 123-4567',
            address: '123 Main St, Anytown, USA',
            documentUrl: 'https://example.com/documents/john-doe-id.jpg',
            status: 'pending',
            createdAt: '2023-05-15T10:30:00Z',
          },
          {
            id: 2,
            userId: 102,
            fullName: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '(555) 987-6543',
            address: '456 Oak Ave, Somewhere, USA',
            documentUrl: 'https://example.com/documents/jane-smith-id.jpg',
            status: 'pending',
            createdAt: '2023-05-14T14:20:00Z',
          },
        ]);
      } catch (error) {
        console.error('Error fetching verification requests:', error);
        toast.error('Failed to load verification requests');
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationRequests();
  }, []);

  const handleApprove = async (requestId: number) => {
    try {
      // In a real app, you would call your API to approve the request
      // await axios.post(
      //   `/api/admin/verification-requests/${requestId}/approve`,
      //   {},
      //   { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      // );
      
      // Update the local state to reflect the change
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));
      
      toast.success('Verification request approved');
    } catch (error) {
      console.error('Error approving verification request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      // In a real app, you would call your API to reject the request
      // await axios.post(
      //   `/api/admin/verification-requests/${selectedRequest.id}/reject`,
      //   { reason: rejectionReason },
      //   { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      // );
      
      // Update the local state to reflect the change
      setRequests(requests.map(req => 
        req.id === selectedRequest.id ? { ...req, status: 'rejected' } : req
      ));
      
      setIsModalOpen(false);
      setRejectionReason('');
      toast.success('Verification request rejected');
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      toast.error('Failed to reject request');
    }
  };

  const openRejectModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ocean-teal"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Verification Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and manage owner verification requests
          </p>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      User
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Requested
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-sm text-gray-500 text-center">
                        No verification requests found
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{request.fullName}</div>
                              <div className="text-gray-500">{request.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-1" />
                            {request.phone}
                          </div>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="truncate max-w-xs">{request.address}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.open(request.documentUrl, '_blank')}
                              className="text-ocean-teal hover:text-teal-700"
                            >
                              View Document
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(request.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openRejectModal(request)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Reject Verification Request
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to reject {selectedRequest?.fullName}'s verification request?
                    </p>
                    <div className="mt-4">
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 text-left mb-1">
                        Reason for rejection (optional)
                      </label>
                      <textarea
                        id="rejectionReason"
                        rows={3}
                        className="shadow-sm focus:ring-ocean-teal focus:border-ocean-teal mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder="Provide a reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleReject}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-teal sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationRequests;
