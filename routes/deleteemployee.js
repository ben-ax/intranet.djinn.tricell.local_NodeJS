const config = require('../config/globals.json');
const express = require('express');
const router = express.Router();

router.use(express.static('./public'));
const path = require('path');

const pug = require('pug');
const { response } = require('express');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');

    var htmlHead = readHTML('./masterframe/head.html');
    var htmlHeader = readHTML('./masterframe/header.html');
    var htmlMenu = readHTML('./masterframe/menu.html');    
    var htmlInfoStart = readHTML('./masterframe/infoStart.html');
    var htmlInfoStop = readHTML('./masterframe/infoStop.html');
    var htmlFooter = readHTML('./masterframe/footer.html');
    var htmlBottom = readHTML('./masterframe/bottom.html');

    var htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
    var htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
    var htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');


// ---------------------- Radera person ------------------------------------------------
router.get('/:id', function(request, response)
{
    const id = parseInt(request.params.id);

    // Öppna databasen
    const ADODB = require('node-adodb');
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

    async function sqlQuery()
    {
        response.setHeader('Content-type','text/html');
        response.write(htmlHead);
        if(request.session.loggedin)
        {
            response.write(htmlLoggedinMenuCSS);
            response.write(htmlLoggedinMenuJS);
            //response.write(htmlLoggedinMenu);
            response.write(pug_loggedinmenu({
                employeecode: request.cookies.employeecode,
                name: request.cookies.name,
                logintimes: request.cookies.logintimes,
                lastlogin: request.cookies.lastlogin,
                webaddress : config.webaddress,
              }));
        }
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);

        if(request.session.loggedin)
        {

            // Ta reda på användarens employeecode (för att kunna radera bilden)
            const result = await connection.query("SELECT employeeCode FROM employee WHERE id="+id+"");
            let employeecode = "" + result[0]['employeeCode'];

            // Skicka SQL-query till databasen 
            const result2 = await connection.execute("DELETE FROM employee WHERE id="+id+"");

            // Radera bilden
            const path = "./public/photos/"+str_employeeCode+".jpg";
            if(fs.existsSync(path))
            {
                fs.unlinkSync(path)
            }
            
            // Ge respons till användaren
            response.write("Employee deleted<br/><p /><a href=\""+config.webaddress+"/api/personnelregistry\" style=\"color:#336699;text-decoration:none;\">Delete another employee</a>");
        }
        else
        {
            response.write("Not logged in");
        }

        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
    }
    sqlQuery();
});


module.exports = router;
