const config = require('../config/globals.json');
const express = require('express');
const router = express.Router();

router.get('/', (request, response) =>
{
   // Öppna databasen
   const ADODB = require('node-adodb');
   const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

    async function sqlQuery()
    {
        // Skicka SQL-query till databasen och läs in variabler
        const result = await connection.query('SELECT * FROM chat');
        
        // Loopa genom alla chat-meddelanden
        var count =  result.length;
        let i;
        var newmessages = 0;
        for(i=0; i<count; i++)
        {   
            str_id = result[i]['id'];      
            str_employeecode = result[i]['employeecode'];
            str_message = result[i]['message'];
            str_postdate = result[i]['postdate'];
            str_posttime = result[i]['posttime'];
            str_readby = "" + result[i]['readby'];

            // Kolla vilka meddelanden som är nya (om användarens namn finns i readby-kolumnen)
            if(str_readby.indexOf(request.session.username) == -1 )
            {
                newmessages ++;
            }       
        }  
        // Skicka respons, antalet nya meddelanden
        response.send(newmessages.toString());
    }
    sqlQuery();         
});

module.exports = router;
