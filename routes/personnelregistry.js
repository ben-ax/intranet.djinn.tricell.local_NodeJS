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
const { json } = require('express');

var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');    
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

// ---------------------- Lista all personal, Metod 4: Databas -------------------------------
router.get('/', (request, response) =>
{    
    // Öppna databasen
    const ADODB = require('node-adodb');
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

    async function sqlQuery()
    {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(htmlHead);
        if(request.session.loggedin)
        {
            htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
            response.write(htmlLoggedinMenuCSS);
            htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
            response.write(htmlLoggedinMenuJS);
            //htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
            //response.write(htmlLoggedinMenu);
            response.write(pug_loggedinmenu({
                employeecode: request.cookies.employeecode,
                name: request.cookies.name,
                logintimes: request.cookies.logintimes,
                lastlogin: request.cookies.lastlogin,
                securityaccesslevel: request.session.securityAccessLevel, // <--- Added here!
                webaddress : config.webaddress,
              }));
        }
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);

        // Skapa HTML-textsträng för tabellen för utskrift av XML-data
        let htmlOutput =""+
        "<link rel=\"stylesheet\" href=\"css/personnel_registry.css\" \/>";

        if(request.session.loggedin)
        {
            htmlOutput +="<table border=\"0\">";
            htmlOutput +="<tr><td width=\"350\" align=\"left\">";
            htmlOutput +="<h2>Personnel Registry:</h2>\n";
            htmlOutput +="</td><td width=\"350\" align=\"right\">";
            htmlOutput +="<a href=\"/api/newemployee\" style=\"color:#336699;text-decoration:none;\">Add new employee</a>";
            htmlOutput +="</td></tr></table>";
        }
        else
        {
            htmlOutput +="<h2>Personnel Registry:</h2>\n";
        }

        htmlOutput +="<div id=\"table-resp\">"+
        "<div id=\"table-header\">\n"+
        "<div class=\"table-header-cell-light\">Employee Code</div>\n"+
        "<div class=\"table-header-cell-dark\">Name</div>\n"+
        "<div class=\"table-header-cell-light\">Signature Date</div>\n"+
        "<div class=\"table-header-cell-light\">Rank</div>\n"+
        "<div class=\"table-header-cell-light\">Access Level</div>\n";
        if(request.session.loggedin)
        {
            htmlOutput +="<div class=\"table-header-cell-light\">Edit</div>\n"+
            "<div class=\"table-header-cell-light\">Delete</div>\n";
        }
        htmlOutput +="</div>\n\n"+
        "<div id=\"table-body\">\n";
        "";

        // Skicka SQL-query till databasen och läs in variabler
        const result = await connection.query('SELECT id, employeeCode, name, signatureDate, rank, securityAccessLevel FROM employee');
            
        // Ta reda på antalet employees
        var count =  result.length;

        // Loopa genom och skriv ut varje person
        let i;
        for(i=0; i<count; i++)
        {   
            str_id = result[i]['id'];      
            str_employeeCode = result[i]['employeeCode'];
            str_name = result[i]['name'];
            str_rank = result[i]['rank'];
            str_securityAccessLevel = result[i]['securityAccessLevel'];
            str_signatureDate = result[i]['signatureDate'];
                         
            // Lägg till respektive employee till utskrift-variabeln
            htmlOutput += "<div class=\"resp-table-row\">\n";
            htmlOutput += "<div class=\"table-body-cell\">" + str_employeeCode + "</div>\n";
            htmlOutput += "<div class=\"table-body-cell-bigger\"><a href=\"/api/personnelregistry/" + str_employeeCode + "\">" + str_name + "</a></div>\n";
            htmlOutput += "<div class=\"table-body-cell\"> " + str_signatureDate + "</div>\n";
            htmlOutput += "<div class=\"table-body-cell\"> " + str_rank + "</div>\n";
            htmlOutput += "<div class=\"table-body-cell\"> " + str_securityAccessLevel + "</div>\n";
            if(request.session.loggedin)
            {
                htmlOutput += "<div class=\"table-body-cell\"><a href=\"/api/editemployee/" + str_id + "\" style=\"color:#336699;text-decoration:none;\">E</a></div>\n";
                htmlOutput += "<div class=\"table-body-cell\"><a href=\"/api/deleteemployee/" + str_id + "\" style=\"color:#336699;text-decoration:none;\">D</a></div>\n";
            }
            htmlOutput += "</div>\n";
        }  

        htmlOutput += "</div></div>\n\n";
        response.write(htmlOutput); // Skriv ut XML-datat

        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
    }
    sqlQuery();
});


// --------------------- Läs en specifik person -----------------------------
router.get('/:employeeid', function(request, response)
{
    var employeeid = request.params.employeeid;
    
    // Öppna databasen
    const ADODB = require('node-adodb');
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

    async function sqlQuery()
    {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(htmlHead);
        if(request.session.loggedin)
        {
            htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
            response.write(htmlLoggedinMenuCSS);
            htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
            response.write(htmlLoggedinMenuJS);
            //htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
            //response.write(htmlLoggedinMenu);
            response.write(pug_loggedinmenu({
                employeecode: request.cookies.employeecode,
                name: request.cookies.name,
                logintimes: request.cookies.logintimes,
                lastlogin: request.cookies.lastlogin,
                securityaccesslevel: request.session.securityAccessLevel,
                webaddress : config.webaddress,
              }));
        }
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);

        // Skicka SQL-query till databasen och läs in variabler
        const result = await connection.query("SELECT employeeCode, name, signatureDate, rank, securityAccessLevel, dateOfBirth, sex, bloodType, height, weight, department, background, strengths, weaknesses FROM employee WHERE employeeCode='"+employeeid+"'");
        str_employeeCode = result[0]['employeeCode'];
        str_name = result[0]['name'];
        str_rank = result[0]['rank'];
        str_securityAccessLevel = result[0]['securityAccessLevel'];
        str_signatureDate = result[0]['signatureDate'];
        str_dateOfBirth = result[0]['dateOfBirth'];
        str_sex = result[0]['sex'];
        str_bloodType = result[0]['bloodType'];
        str_height = result[0]['height'];
        str_weight = result[0]['weight'];
        str_department = result[0]['department'];
        str_background = result[0]['background'];
        str_strengths = result[0]['strengths'];
        str_weaknesses = result[0]['weaknesses'];

         // Skapa HTML-textsträng för tabellen för utskrift av XML-data
        let htmlOutput =""+
        "<link rel=\"stylesheet\" href=\"css/personnel_registry_employee.css\" \/>\n"+ 
        "<h1>Personnel Registry - " + employeeid + "</h1>\n"+
        "<table id=\"infomiddle\">\n"+
        "<tr><td width=\"166\" valign=\"top\">\n"+
             "<table id=\"photocol\"><tr><td id=\"photobox\"><img src=\"photos/" + str_employeeCode + ".jpg\" alt=\"" + str_employeeCode + "\" width=\"164\" /></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td id=\"employeecode\">EMPLOYEE CODE: </b><br /><b>" + str_employeeCode + "</b></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr> <td id=\"securitylevel\">SECURITY CLEARANCE LEVEL: </b><br /><big><big><big>" +str_securityAccessLevel+ "</big></big></big></td></tr></table>\n"+
        "</td><td width=\"135\" valign=\"top\">\n"+
             "<table><tr><td class=\"variablecol\">NAME: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"variablecol\">DATE OF BIRTH: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"variablecol\">SEX: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"variablecol\">BLOOD TYPE: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"variablecol\">HEIGHT: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"variablecol\">WEIGHT: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"variablecol\">DEPARTMENT: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"variablecol\">RANK: &nbsp;</td></tr><tr><td class=\"tablespacer\"></tr></table>\n"+
        "</td><td width=\"245\" valign=\"top\">\n"+
             "<table><tr><td class=\"valuecol\">" +str_name+ "</td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"valuecol\">" +str_dateOfBirth+ "</div></td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"valuecol\">" +str_sex+ "</td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"valuecol\">" +str_bloodType+ "</td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"valuecol\">" +str_height+ "</td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"valuecol\">" +str_weight+ "</td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"valuecol\">" +str_department+ "</td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr>\n"+
            "<tr><td class=\"valuecol\">" +str_rank+ "</td></tr><tr><td class=\"blackline\"></td></tr><tr><td class=\"tablespacer\"></tr></table>\n"+
            "<td width=\"182\" valign=\"top\">\n"+
            "</td>\n"+
        "</td></tr></table>\n";  

        htmlOutput =htmlOutput +
        "<h1>Background</h1>\n"+ str_background +
        "<p />"+
        "<h1>Strengths</h1>\n"+ str_strengths +
        "<p />"+
        "<h1>Weaknesses</h1>\n"+ str_weaknesses +
        "<p />";
    
        response.write(htmlOutput); // Skriv ut 

        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
    }
    sqlQuery();
});

module.exports = router;
