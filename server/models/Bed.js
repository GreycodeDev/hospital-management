module.exports = (sequelize, DataTypes) => {
  const Bed = sequelize.define('Bed', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bed_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('Available', 'Occupied', 'Maintenance', 'Reserved'),
      defaultValue: 'Available'
    },
    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100.00
    },
    bed_type: {
      type: DataTypes.ENUM('Standard', 'ICU', 'Maternity', 'Pediatric', 'Private'),
      defaultValue: 'Standard'
    }
  }, {
    tableName: 'beds'
  });

  // Use static associate method instead of prototype
  Bed.associate = function(models) {
    Bed.belongsTo(models.Ward, { 
      foreignKey: 'ward_id', 
      as: 'ward' 
    });
    Bed.hasMany(models.Admission, { 
      foreignKey: 'bed_id', 
      as: 'admissions' 
    });
  };

  return Bed;
};