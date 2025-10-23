module.exports = (sequelize, DataTypes) => {
  const Ward = sequelize.define('Ward', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ward_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ward_type: {
      type: DataTypes.ENUM('General', 'ICU', 'Maternity', 'Pediatric', 'Surgical', 'Orthopedic', 'Cardiac'),
      allowNull: false
    },
    gender_specific: {
      type: DataTypes.ENUM('Male', 'Female', 'Mixed'),
      defaultValue: 'Mixed'
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'wards'
  });

  // Use static associate method instead of prototype
  Ward.associate = function(models) {
    Ward.hasMany(models.Bed, { 
      foreignKey: 'ward_id', 
      as: 'beds' 
    });
  };

  return Ward;
};