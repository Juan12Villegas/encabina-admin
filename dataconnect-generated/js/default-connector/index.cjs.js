const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'encabina-dj',
  location: 'southamerica-east1'
};
exports.connectorConfig = connectorConfig;

