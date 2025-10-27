import React from 'react';
import { CreditCard, FileText, Plus } from 'lucide-react';

const QuickActions = ({ onChargePatient, onProcessPayment, onGenerateFinalBill }) => {
  const actions = [
    {
      icon: Plus,
      title: 'Charge Patient',
      description: 'Create service charges for patients',
      onClick: onChargePatient,
      color: 'text-blue-600'
    },
    {
      icon: CreditCard,
      title: 'Process Payment',
      description: 'Record payments for patient bills',
      onClick: onProcessPayment,
      color: 'text-green-600'
    },
    {
      icon: FileText,
      title: 'Generate Final Bill',
      description: 'Create final bill for discharged patients',
      onClick: onGenerateFinalBill,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <div key={index} className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <Icon className={`h-8 w-8 ${action.color} mx-auto mb-4`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
            <p className="text-gray-600 mb-4">{action.description}</p>
            <button
              onClick={action.onClick}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {action.title}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default QuickActions;