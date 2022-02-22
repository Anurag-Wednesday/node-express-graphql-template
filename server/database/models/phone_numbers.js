export function getAttributes(sequelize, DataTypes) {
  return {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    addressId: {
      field: 'address_id',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'addresses',
        key: 'id'
      }
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.fn('now')
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedAt: {
      field: 'deleted_at',
      type: DataTypes.DATE,
      allowNull: true
    }
  };
}

export function model(sequelize, DataTypes) {
  const phoneNumbers = sequelize.define('phone_numbers', getAttributes(sequelize, DataTypes), {
    tableName: 'phone_numbers',
    paranoid: true,
    timestamps: true
  });
  phoneNumbers.associate = function(models) {
    phoneNumbers.belongsTo(models.addresses, {
      targetKey: 'id',
      sourceKey: 'address_id'
    });
  };
  return phoneNumbers;
}
