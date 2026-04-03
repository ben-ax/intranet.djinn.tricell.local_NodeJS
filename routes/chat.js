const express = require('express');
const session = require('express-session');
const router = express.Router();
const bodyParser = require('body-parser');
var formidable = require('formidable');



router.post('/', (request, response) =>
{
    if(request.session.loggedin)
    {

    const message = request.body.chatmessage;
    const employeeid = request.session.username;
     
        // Skapa datumn
        let ts = Date.now();
        let date_ob = new Date(ts);
        let date = date_ob.getDate();
        let month = date_ob.getMonth() + 1;
        let year = date_ob.getFullYear();
        let postdate = date+"."+month+"."+year;

        // Skapa klockslag
        let hour = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let posttime = hour+":"+minutes;

        // Öppna databasen
        const ADODB = require('node-adodb');
        const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');
   
        async function sqlQuery()
        {
            // Skriv in nytt meddelande 
            const result = await connection.execute("INSERT INTO chat (message,employeeid,postdate,posttime,readby) VALUES ('"+message+"','"+employeeid+"','"+postdate+"','"+posttime+"','"+employeeid+"')");

            // Radera gamla meddelanden ur chatten
            async function sqlQuery2()
            {
                const result2 = await connection.execute("DELETE from chat WHERE id < (SELECT max(ID)-20 FROM chat)");
                response.send(""); 
            }
            sqlQuery2();
        }
        sqlQuery();
    }
});

router.get('/', (request, response) =>
{
    if(request.session.loggedin)
    {

   // Öppna databasen
   const ADODB = require('node-adodb');
   const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

    async function sqlQuery()
    {
        var chatbody ="";
        
        // Skicka SQL-query till databasen och läs in variabler
        const result = await connection.query("SELECT * FROM chat o INNER JOIN employee i ON o.employeeid = i.employeeCode ORDER BY o.ID");
        var str_id;
        var str_name = "";
        var str_employeecode = "";
        var str_message = "";
        var str_postdate = "";
        var str_posttime = "";
        var str_readby = "";
        var new_readby ="";

        // Loopa genom alla chat-meddelanden
        var count =  result.length;        
        let i;
        var newmessages = 0;
        for(i=0; i<count; i++)
        {   
            str_id = result[i]['o.id'];      
            str_employeecode = result[i]['employeeid'];
            str_message = result[i]['message'];
            str_postdate = result[i]['postdate'];
            str_posttime = result[i]['posttime'];
            str_readby = "" + result[i]['readby'];
            str_name =  "" + result[i]['name'];
        
             // Kolla om användaren läst meddelandet
              if(str_readby.indexOf(request.session.username) == -1 )
              {
                    new_readby = str_readby + " " +request.session.username;
                     // Uppdatera readby-kolumnen med användarens employeecode
                    async function sqlQuery2()
                    {
                        const result2 = await connection.execute("UPDATE chat SET readby='"+new_readby+"' WHERE id="+str_id+"");
                     
                    }   
                    sqlQuery2();   
              } 

            // Kolla om meddelandet skrivits av användaren själv
            if(str_employeecode != request.session.username)
            {
                chatbody +=
                "<div style=\"width:230px;text-align:left;font-size:11px;color:#ffffff;\">"+
                str_name + " ("+str_employeecode+") <br />\n"+
                str_postdate+" | "+ str_posttime + "<br />\n"+
                "</div>"+
                "<div style=\"background-color:#ffffff;padding:5px;margin:5px;margin-bottom:20px;border-radius:5px\">"+
                str_message+
                "</div>";
            }
            else
            {
                chatbody +=
                "<div style=\"width:230px;text-align:right;font-size:11px;color:#ffffff;\">"+
                "You ("+str_employeecode+") <br />\n"+
                str_postdate+" | "+ str_posttime + "<br />\n"+
                "</div>"+
                "<div style=\"background-color:#99ccff;padding:5px;margin:5px;margin-bottom:20px;border-radius:5px\">"+
                str_message+
                "</div>";
            }           
        }
        // Skicka respons, antalet nya meddelanden
        response.send(chatbody);
    }
    sqlQuery();         
    }
});

module.exports = router;
