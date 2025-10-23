module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    patient_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    id_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(20)
    },
    address: {
      type: DataTypes.TEXT
    },
    next_of_kin_name: {
      type: DataTypes.STRING(100)
    },
    next_of_kin_phone: {
      type: DataTypes.STRING(20)
    },
    blood_type: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    },
    allergies: {
      type: DataTypes.TEXT
    },
    emergency_contact: {
      type: DataTypes.STRING(20)
    }
  }, {
    tableName: 'patients'
  });

  // Changed to static associate method
  Patient.associate = function(models) {
    Patient.hasMany(models.PatientVisit, { 
      foreignKey: 'patient_id', 
      as: 'visits' 
    });
    Patient.hasMany(models.Admission, { 
      foreignKey: 'patient_id', 
      as: 'admissions' 
    });
    Patient.hasMany(models.Billing, { 
      foreignKey: 'patient_id', 
      as: 'billings' 
    });
    Patient.hasMany(models.Bill, { 
      foreignKey: 'patient_id', 
      as: 'bills' 
    });
  };

  return Patient;
};