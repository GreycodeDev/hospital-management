module.exports = (sequelize, DataTypes) => {
  const Admission = sequelize.define('Admission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    admission_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    discharge_date: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('Admitted', 'Discharged', 'Transferred'),
      defaultValue: 'Admitted'
    },
    expected_stay_days: {
      type: DataTypes.INTEGER
    },
    reason_for_admission: {
      type: DataTypes.TEXT
    },
    attending_physician: {
      type: DataTypes.STRING(100)
    },
    insurance_info: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'admissions'
  });

  // Changed to static associate method
  Admission.associate = function(models) {
    Admission.belongsTo(models.Patient, { 
      foreignKey: 'patient_id', 
      as: 'patient' 
    });
    Admission.belongsTo(models.Bed, { 
      foreignKey: 'bed_id', 
      as: 'bed' 
    });
    Admission.belongsTo(models.PatientVisit, { 
      foreignKey: 'visit_id', 
      as: 'visit' 
    });
    Admission.hasMany(models.Billing, { 
      foreignKey: 'admission_id', 
      as: 'billings' 
    });
    Admission.hasOne(models.Bill, { 
      foreignKey: 'admission_id', 
      as: 'final_bill' 
    });
  };

  return Admission;
};