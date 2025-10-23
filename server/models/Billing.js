module.exports = (sequelize, DataTypes) => {
  const Billing = sequelize.define('Billing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    service_type: {
      type: DataTypes.ENUM('Bed', 'Medication', 'LabTest', 'Procedure', 'Consultation', 'Other'),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    service_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    description: {
      type: DataTypes.STRING(255)
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'billing',
    hooks: {
      beforeSave: (billing) => {
        if (billing.quantity && billing.unit_price) {
          billing.total_amount = billing.quantity * billing.unit_price;
        }
      }
    }
  });

  // Changed to static associate method
  Billing.associate = function(models) {
    Billing.belongsTo(models.Patient, { 
      foreignKey: 'patient_id', 
      as: 'patient' 
    });
    Billing.belongsTo(models.Admission, { 
      foreignKey: 'admission_id', 
      as: 'admission' 
    });
    Billing.belongsTo(models.Service, { 
      foreignKey: 'service_id', 
      as: 'service' 
    });
    Billing.belongsTo(models.User, { 
      foreignKey: 'added_by', 
      as: 'added_by_user' 
    });
  };

  return Billing;
};