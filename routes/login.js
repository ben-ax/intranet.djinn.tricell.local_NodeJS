const config = require('../config/globals.json');
const express = require('express');
const router = express.Router();

var cookieParser = require('cookie-parser');
router.use(cookieParser());

router.use(express.static('./public'));
const path = require('path');

const pug = require('pug');
const { response } = require('express');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

// --------------------- Läs in Masterframen --------------------------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');

var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');    
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');


// --------------------- Router -----------------------------------------------
router.get('/', function(request, response)
{
    // Ta emot formulär-variablerna
    const employeeid = request.query.femployeecode;
    const passwd = request.query.fpassword;
    
    // Öppna databasen och kolla uppgifterna
    const ADODB = require('node-adodb');
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');
    
    async function sqlQuery1()
    {
        const result = await connection.query("SELECT passwd, logintimes, lastlogin, lockout FROM users WHERE employeeCode='"+employeeid+"'");        
        if(result=="")
        {
            response.redirect('/api/login/unsuccess'); // Användaren finns inte
        }
        else
        {
            // Läs in variabler
            str_passwd = result[0]['passwd'];
            str_logintimes= result[0]['logintimes'];    
            str_lastlogin= result[0]['lastlogin'];    
            str_lockout= result[0]['lockout'];    

            // Öppna employee-tabellen, och ta reda på användarens namn och security access level
            async function sqlQuery2()
            {
                // FIX: Added the WHERE clause to specifically grab the logged-in user's data!
                const result2 = await connection.query("SELECT * FROM employee WHERE employeeCode='"+employeeid+"'");
                var str_name = result2[0]['name'];
                var str_securtyaccesslevel= result2[0]['securityAccessLevel'];    
                              
                if(str_lockout==null)
                {
                    if(str_passwd==passwd)    
                    {
                        // Uppdatera user-variabler
                        int_logintimes = parseInt(str_logintimes)+1;
                        let ts = Date.now();
                        let date_ob = new Date(ts);
                        let date = date_ob.getDate();
                        let month = date_ob.getMonth() + 1;
                        let year = date_ob.getFullYear();
                        str_lastlogin = date+"."+month+"."+year;

                        // Set cookies
                        response.cookie("employeecode", employeeid);
                        response.cookie("name", str_name);
                        response.cookie("lastlogin", str_lastlogin);
                        response.cookie("logintimes", int_logintimes);

                        //Starta sessions
                        request.session.loggedin = true;
                        request.session.username = employeeid;
                        request.session.securityAccessLevel = str_securtyaccesslevel;

                        // Uppdatera databasen
                        async function sqlQuery3()
                        {
                            const result3 = await connection.execute("UPDATE users SET logintimes='"+int_logintimes+"', lastlogin='"+str_lastlogin+"' WHERE employeeCode='"+employeeid+"'");
                        }
                        sqlQuery3();

                        response.redirect('/api/login/success'); // Inloggning lyckades
                    }
                    else
                    {
                        response.redirect('/api/login/unsuccess'); // Användaren är lockout
                    }
                }
                else
                {
                    response.redirect('/api/login/unsuccess'); // Lösenordet är fel
                }    
            }
            sqlQuery2();
        }
    }   
    sqlQuery1();
    
});


// --------------------- Router -----------------------------------------------
router.get('/:success', function(request, response)
{

    response.setHeader('Content-type','text/html');
    response.write(htmlHead);
    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);

        if(request.session.loggedin)
        {
            response.write("Login successful");
            htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
            response.write(htmlLoggedinMenuCSS);
            htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
            response.write(htmlLoggedinMenuJS);
            
            response.write(pug_loggedinmenu({
                employeecode: request.cookies.employeecode,
                name: request.cookies.name,
                logintimes: request.cookies.logintimes,
                lastlogin: request.cookies.lastlogin,
                securityaccesslevel: request.session.securityAccessLevel,
                webaddress : config.webaddress,
              }));
        }
        else
        {
            response.write("Not logged in");
        }

    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();
                
});

// --------------------- Router -----------------------------------------------
router.get('/:unsuccess', function(request, response)
{
    response.setHeader('Content-type','text/html');
    response.write(htmlHead);
    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);

    response.write("Login unsuccessful");

    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();   

});

module.exports = router;
