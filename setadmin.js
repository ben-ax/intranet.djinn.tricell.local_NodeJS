const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

async function updateAdmin() {
    try {
        await connection.execute("UPDATE employee SET securityAccessLevel='A' WHERE employeeCode='IT25-26'");
        console.log("Success: IT25-26 is now Admin (Level A).");
    } catch (err) {
        console.error("Database Error:", err.message);
    }
}

updateAdmin();
