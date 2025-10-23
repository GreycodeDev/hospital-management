import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Bed, 
  Stethoscope, 
  CreditCard,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { patientAPI, bedAPI, admissionAPI, billingAPI } from '../../services/api';
import Loader from '../../components/ui/Loader';

const StatCard = ({ title, value, icon: Icon, color, link }) => {
  return (
    <Link to={link} className="block">
      <div className="card p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const { data: patientStats, loading: patientLoading } = useApi(patientAPI.getStats);
  const { data: bedStats, loading: bedLoading } = useApi(bedAPI.getStats);
  const { data: admissionStats, loading: admissionLoading } = useApi(admissionAPI.getStats);
  const { data: billingStats, loading: billingLoading } = useApi(billingAPI.getStats);

  const loading = patientLoading || bedLoading || admissionLoading || billingLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Patients',
      value: patientStats?.data?.totalPatients || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/patients'
    },
    {
      title: 'Available Beds',
      value: bedStats?.data?.availableBeds || 0,
      icon: Bed,
      color: 'bg-green-500',
      link: '/beds'
    },
    {
      title: 'Current Admissions',
      value: admissionStats?.data?.currentAdmissions || 0,
      icon: Stethoscope,
      color: 'bg-purple-500',
      link: '/admissions'
    },
    {
      title: 'Total Revenue',
      value: `$${billingStats?.data?.totalRevenue?.toLocaleString() || '0'}`,
      icon: CreditCard,
      color: 'bg-yellow-500',
      link: '/billing'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Real-time Data</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/patients/register"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-center"
            >
              <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Register Patient</span>
            </Link>
            <Link
              to="/admissions/new"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-center"
            >
              <Stethoscope className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Admit Patient</span>
            </Link>
            <Link
              to="/beds"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-center"
            >
              <Bed className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Manage Beds</span>
            </Link>
            <Link
              to="/billing"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-center"
            >
              <CreditCard className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">View Billing</span>
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bed Occupancy Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {bedStats?.data?.occupancyRate || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Stay (Days)</span>
              <span className="text-sm font-medium text-gray-900">
                {admissionStats?.data?.averageLengthOfStay || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Revenue</span>
              <span className="text-sm font-medium text-gray-900">
                ${billingStats?.data?.pendingRevenue?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;