module.exports = (sequelize, DataTypes) => {
  const PatientVisit = sequelize.define('PatientVisit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    blood_pressure: {
      type: DataTypes.STRING(20)
    },
    temperature: {
      type: DataTypes.DECIMAL(4, 2)
    },
    pulse: {
      type: DataTypes.INTEGER
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2)
    },
    height: {
      type: DataTypes.DECIMAL(5, 2)
    },
    symptoms: {
      type: DataTypes.TEXT
    },
    diagnosis: {
      type: DataTypes.TEXT
    },
    doctor_notes: {
      type: DataTypes.TEXT
    },
    prescription: {
      type: DataTypes.TEXT
    },
    admission_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    visit_type: {
      type: DataTypes.ENUM('outpatient', 'inpatient', 'emergency'),
      defaultValue: 'outpatient'
    },
    visit_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('registered', 'vitals_taken', 'doctor_seen', 'admitted', 'discharged'),
      defaultValue: 'registered'
    }
  }, {
    tableName: 'patient_visits'
  });

  // Changed to static associate method
  PatientVisit.associate = function(models) {
    PatientVisit.belongsTo(models.Patient, { 
      foreignKey: 'patient_id', 
      as: 'patient' 
    });
    PatientVisit.belongsTo(models.User, { 
      foreignKey: 'doctor_id', 
      as: 'doctor' 
    });
    PatientVisit.hasOne(models.Admission, { 
      foreignKey: 'visit_id', 
      as: 'admission' 
    });
  };

  return PatientVisit;
};