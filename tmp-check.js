const ADODB = require('node-adodb');
const c = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');
(async () => {
  try {
    const r = await c.query("SELECT TOP 5 * FROM userdatabase");
    console.log('userdatabase result: ', r);
  } catch (e) {
    console.log('userdatabase error: ', e.message);
  }
})();
