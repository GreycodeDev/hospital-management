module.exports = (sequelize, DataTypes) => {
  const Billing = sequelize.define('Billing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Make it nullable since not all charges need admission
      references: {
        model: 'admissions',
        key: 'id'
      }
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'services',
        key: 'id'
      }
    },
    service_type: {
      type: DataTypes.ENUM('Bed', 'Medication', 'LabTest', 'Procedure', 'Consultation', 'X-Ray', 'Laboritory', 'Pharmacy',  'Other'),
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
    notes: {
      type: DataTypes.TEXT
    },
    added_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'billing',
    // IMPORTANT: Ensure admission_id is not excluded
    defaultScope: {
      attributes: { exclude: [] }
    },
    hooks: {
      beforeSave: (billing) => {
        if (billing.quantity && billing.unit_price) {
          billing.total_amount = billing.quantity * billing.unit_price;
        }
      }
    }
  });

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