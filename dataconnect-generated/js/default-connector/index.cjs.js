const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'agenda_laps',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

