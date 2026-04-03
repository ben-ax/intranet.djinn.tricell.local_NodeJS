const express = require('express');
const router = express.Router();
const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/researchdata.mdb;');
const connection2 = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');
router.post('/:id', (request, response) =>
{
    const id = request.params.id;
    const entryHeading = request.body.entryHeading; 
    const entryText = request.body.entryText;
    const employeeid = request.session.username;

    const validAccessLevels = ["B", "A"];
    if(request.session.loggedin && validAccessLevels.includes(request.session.securityAccessLevel))
    {
        
        // Skapa datumn
        let ts = Date.now();
        let date_ob = new Date(ts);
        let date = date_ob.getDate();
        let month = date_ob.getMonth() + 1;
        if (month < 10)
        {
            month = "0"+month;
        }
        let year = date_ob.getFullYear();
        let postdate = date+"."+month+"."+year;

        // Skapa klockslag
        let hour = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        if(minutes < 10)
        {
            minutes = "0"+minutes;
        }
        let posttime = hour+":"+minutes;

        async function sqlQuery()
        {
            // Skriv in nytt meddelande 
            const result = await connection.execute(`INSERT INTO ResearchEntries (researchObjectId,entryHeading,entryText,entryWriter,entryDate, entryTime)
                                                     VALUES ('`+id+`','`+entryHeading+`','`+entryText+`','`+employeeid+`','`+postdate+`','`+posttime+`')`);
            response.send(""); 
        }
        sqlQuery();
        
    }
});
router.get('/:id', (request, response) =>
{
    const validAccessLevels = ["B", "A"];
    if(request.session.loggedin && validAccessLevels.includes(request.session.securityAccessLevel))
    {

        const virusid = request.params.id;
        async function sqlQuery()
        {
            
            // Läs in entries
            const entries = await connection.query("SELECT * FROM ResearchEntries WHERE researchObjectId='"+virusid+"' ORDER BY ID DESC");
            const entryCount = entries.length;
            let entryOutput ="";
            for(i = 0; i<entryCount; i++)
            {
                let entryId = entries[i]["ID"];
                let objectId = entries[i]["researchObjectId"];
                let entryHeading = entries[i]["entryHeading"];
                let entryText = entries[i]["entryText"];
                let entryWriter = entries[i]["entryWriter"];
                let entryDate = entries[i]["entryDate"];
                let entryTime = entries[i]["entryTime"];

                let writerNames = await connection2.query("SELECT e.name FROM users u LEFT JOIN employee e ON u.employeeCode = e.employeeCode WHERE u.employeeCode='"+entryWriter+"'");
                let writerName = "";
                if(writerNames[0] == undefined)
                {
                    writerName = "Not found";
                }
                else
                {
                    writerName = writerNames[0]["name"];
                }
                
                entryOutput += "<table class=\"entryTable\" cellspacing=\"0\" cellpadding=\"0\">" +
                                    "<tr>"+
                                        "<td style=\"width: 100%;\">"+entryWriter+" ("+writerName+") | "+entryDate+" | Kl "+entryTime+"</td><td rowspan=\"2\" style=\"text-align: right; vertical-align: bottom;\"><div class=\"deleteButton\" onClick=\"deleteEntry('"+entryId+"')\">D</div></td>"+
                                    "</tr>"+
                                    "<tr>"+
                                        "<td class=\"entryHeading\">"+entryHeading+"</td>"+
                                    "</tr>"+
                                    "<tr>"+
                                        "<td class=\"entryBox\" colspan=\"2\">"+entryText+"</td>"+
                                    "</tr>"+
                                "</table>";
     

            }
            response.send(entryOutput);
        }
        sqlQuery();
    }

       
});
router.delete('/:id', (request, response) =>
{
    const validAccessLevels = ["B", "A"];
    if(request.session.loggedin && validAccessLevels.includes(request.session.securityAccessLevel))
    {
        const id = request.params.id;
        async function sqlQuery()
        {
                // Skriv in nytt meddelande 
                const result = await connection.execute("DELETE FROM ResearchEntries WHERE CStr(ID)='"+id+"'");
                response.send(""); 
        }
        sqlQuery();
    }
    
});

module.exports = router;
