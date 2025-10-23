module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    service_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    service_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    service_type: {
      type: DataTypes.ENUM('Medication', 'LabTest', 'Procedure', 'Consultation', 'Room', 'Other'),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    category: {
      type: DataTypes.STRING(100)
    }
  }, {
    tableName: 'services'
  });

  // Changed to static associate method
  Service.associate = function(models) {
    Service.hasMany(models.Billing, { 
      foreignKey: 'service_id', 
      as: 'billings' 
    });
  };

  return Service;
};