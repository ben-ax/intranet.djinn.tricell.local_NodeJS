const config = require('../config/globals.json');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
var formidable = require('formidable');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.use(express.static('./public'));
const path = require('path');

const pug = require('pug');
const { response } = require('express');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');
const pug_editemployee = pug.compileFile('./masterframe/editemployee.html');



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


// ---------------------- Editera person ------------------------------------------------
router.post('/:id', function(request, response)
{
    var id = request.params.id;

     // Ta emot variablerna från formuläret
    if(request.session.loggedin)
    {
        var form = new formidable.IncomingForm();
        form.parse(request, function (err, fields, files) 
        {
                /*
                  var oldpath = files.ffile.filepath;
                  var newpath = path.resolve(__dirname, "../public/fileuploadtemp/"+employeecode+".jpg");
                  fs.renameSync(oldpath, newpath, function (err) 
                  {
                    if (err) throw err;
                  });
                */
                  var employeecode = fields.femployeecode;
                  var name = fields.fname;
                  var dateofbirth = fields.fdateofbirth;
                  var height = fields.fheight;
                  var weight = fields.fweight;
                  var bloodtype = fields.fbloodtype;
                  var sex = fields.fsex;
                  var rank = fields.frank;
                  var department = fields.fdepartment;
                  var securityaccesslevel = fields.fsecurityaccess;
                  var background = fields.fbackground;
                  var strengths = fields.fstrengths;
                  var weaknesses = fields.fweaknesses;
        
    /*
    const employeecode = request.body.femployeecode;
    const name = request.body.fname;
    const dateofbirth = request.body.fdateofbirth;
    const height = request.body.fheight;
    const weight = request.body.fweight;
    const bloodtype = request.body.fbloodtype;
    const sex = request.body.fsex;
    const rank = request.body.frank;
    const department = request.body.fdepartment;
    const securityaccesslevel = request.body.fsecurityaccess;
    const background = request.body.fbackground;
    const strengths = request.body.fstrengths;
    const weaknesses = request.body.fweaknesses;
    const file = request.body.ffile;
    */



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
        response.write(htmlLoggedinMenu);
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);
        


            // Skriv in i databasen
            const result = await connection.execute("UPDATE employee SET employeeCode='"+employeecode+"',name='"+name+"',dateOfBirth='"+dateofbirth+"',height='"+height+"',weight='"+weight+"',bloodType='"+bloodtype+"',sex='"+sex+"',rank='"+rank+"',department='"+department+"',securityAccessLevel='"+securityaccesslevel+"',background='"+background+"',strengths='"+strengths+"',weaknesses='"+weaknesses+"' WHERE id="+id+"");
           
            // Ladda upp filen
            if(files.ffile.originalFilename != "")
            {
                var oldpath = files.ffile.filepath;
                //var newpath = path.resolve(__dirname, "../public/fileuploadtemp/"+ files.ffile.originalFilename);
                var newpath = path.resolve(__dirname, "../public/photos/"+employeecode+".jpg");
                fs.renameSync(oldpath, newpath, function (err) 
                {
                if (err) throw err;
                });
            }

            // Ge respons till användaren
            response.write("Employee edited<br/><p /><a href=\""+config.webaddress+"/api/personnelregistry\" style=\"color:#336699;text-decoration:none;\">Edit another employee</a>");


        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
    }
    sqlQuery();


});
}
else
{
    response.setHeader('Content-type','text/html');
    response.write(htmlHead);
    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);

    response.write("Not logged in");

    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();
}

});


// ---------------------- Formulär för att redigera person ------------------------------
router.get('/:id', (request, response) =>
{  
    var id = request.params.id;

    // Öppna databasen
    const ADODB = require('node-adodb');
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');
   
    async function sqlQuery()
    {
        // Läs nuvarande värden ur databasen
        const result = await connection.query("SELECT employeeCode, name, signatureDate, rank, securityAccessLevel, dateOfBirth, sex, bloodType, height, weight, department, background, strengths, weaknesses FROM employee WHERE id="+id+"");
    
        let str_employeeCode = "" + result[0]['employeeCode'];
        let str_name = "" + result[0]['name'];
        let str_dateOfBirth = "" + result[0]['dateOfBirth'];
        let str_rank = "" + result[0]['rank'];
        let str_securityAccessLevel = "" + result[0]['securityAccessLevel'];
        let str_signatureDate = "" + result[0]['signatureDate'];
        let str_sex = "" + result[0]['sex'];
        let str_bloodType = "" + result[0]['bloodType'];
        let str_height = "" + result[0]['height'];
        let str_weight = "" + result[0]['weight'];
        let str_department = "" + result[0]['department'];
        let str_background = "" + result[0]['background'];
        let str_strengths = "" + result[0]['strengths'];
        let str_weaknesses = "" + result[0]['weaknesses'];

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
        }));
    }
    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);

    if(request.session.loggedin)
    {
        // Kollar om personen har ett foto
        const path = "./public/photos/"+str_employeeCode+".jpg";
        if(fs.existsSync(path))
        {
            photo = "photos/"+str_employeeCode+".jpg";
        }
        else
        {
            photo = "images/default.jpg";
        }


        htmlNewEmployeeCSS = readHTML('./masterframe/newemployee_css.html');
        response.write(htmlNewEmployeeCSS);
        htmlNewEmployeeJS = readHTML('./masterframe/newemployee_js.html');
        response.write(htmlNewEmployeeJS);
        //htmlNewEmployee = readHTML('./masterframe/editemployee.html');
        //response.write(htmlNewEmployee);
        response.write(pug_editemployee({
            photo: photo,
            id: id,
            employeecode: str_employeeCode,
            name:     str_name,
            dateofbirth: str_dateOfBirth,
            signaturedate: str_signatureDate,
            sex: str_sex,
            bloodtype: str_bloodType,
            height: str_height,
            weight: str_weight,
            rank: str_rank,
            securityaccesslevel: str_securityAccessLevel,
            department: str_department,
            background: str_background,
            strengths: str_strengths,
            weaknesses: str_weaknesses,
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

    }
    sqlQuery();

});

module.exports = router;
