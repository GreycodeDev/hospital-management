module.exports = (sequelize, DataTypes) => {
  const Bill = sequelize.define('Bill', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bill_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    payment_status: {
      type: DataTypes.ENUM('Pending', 'Partial', 'Paid', 'Overdue'),
      defaultValue: 'Pending'
    },
    bill_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    due_date: {
      type: DataTypes.DATE
    },
    payment_date: {
      type: DataTypes.DATE
    },
    payment_method: {
      type: DataTypes.ENUM('Cash', 'Insurance', 'Card', 'Mobile Money', 'Bank Transfer')
    },
    insurance_claim_number: {
      type: DataTypes.STRING(100)
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'bills',
    hooks: {
      beforeSave: (bill) => {
        bill.balance = bill.total_amount - bill.amount_paid;
        
        if (bill.balance <= 0 && bill.amount_paid > 0) {
          bill.payment_status = 'Paid';
          bill.payment_date = bill.payment_date || new Date();
        } else if (bill.amount_paid > 0) {
          bill.payment_status = 'Partial';
        }
      }
    }
  });

  // Changed to static associate method
  Bill.associate = function(models) {
    Bill.belongsTo(models.Patient, { 
      foreignKey: 'patient_id', 
      as: 'patient' 
    });
    Bill.belongsTo(models.Admission, { 
      foreignKey: 'admission_id', 
      as: 'admission' 
    });
  };

  return Bill;
};