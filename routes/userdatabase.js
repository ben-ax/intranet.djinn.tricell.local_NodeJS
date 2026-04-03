/* =========================================================================
   USERDATABASE.JS - Administratörsverktyg för Användarhantering
   =========================================================================
   Detta skript hanterar CRUD-operationer (Create, Read, Update, Delete)
   för både inloggningsuppgifter (tabell: users) och profiler (tabell: employee).
*/

const config = require('../config/globals.json');
const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // Används för att MD5-hasha lösenord
const ADODB = require('node-adodb');

// Öppna anslutningen till Microsoft Access-databasen (.mdb) via Jet OLEDB-drivrutinen
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

// Gör "public"-mappen tillgänglig för statiska filer (CSS/Bilder)
router.use(express.static('./public'));

// Importera Pug för att kunna rendera den dynamiska menyn (loggedinmenu)
const pug = require('pug');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');
const readHTML = require('../readHTML.js');

// Ladda in Masterframe-komponenter 
var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');    
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

/**
 * HJÄLPFUNKTION: Kontrollera om användaren har behörighet (Nivå A)
 * Hämtar employeeCode från cookies/session och kollar mot tabellen 'employee'.
 */
async function hasAccess(request) {
    let empCode = request.cookies.employeecode || request.session.username;
    if (!empCode) return false;
    try {
        let result = await connection.query(`SELECT securityAccessLevel FROM employee WHERE employeeCode='${empCode}'`);
        // Returnerar true endast om användaren finns och har nivån 'A'
        return (result.length > 0 && result[0].securityAccessLevel === 'A');
    } catch (err) {
        return false;
    }
}

/**
 * Visar ett tydligt rött felmeddelande vid nekad åtkomst
 */
function accessDeniedResponse(response) {
    return response.send("<h1 style='color:red;'>Access Denied</h1><p>You must have <b>Administrator Level A</b> to view this page.</p><a href='/'>Back to start</a>");
}

/**
 * HJÄLPFUNKTIONER FÖR RENDERING
 * Bygger upp sidans topp och botten med Masterframe.
 */
function renderPageTop(request, response, pageTitle) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(htmlHead);
    response.write(readHTML('./masterframe/loggedinmenu_css.html'));
    response.write(readHTML('./masterframe/loggedinmenu_js.html'));
    // Rendera menyn med Pug och skicka med användardata från cookies
    response.write(pug_loggedinmenu({
        employeecode: request.cookies.employeecode,
        name: request.cookies.name,
        logintimes: request.cookies.logintimes,
        lastlogin: request.cookies.lastlogin,
        securityaccesslevel: 'A', 
        webaddress : config.webaddress || "", 
    }));
    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);
    // Lägg till specifik CSS för personregistret
    response.write(`<link rel="stylesheet" href="/css/personnel_registry.css" />`);
}

function renderPageBottom(response) {
    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();
}

// -------------------------------------------------------------------------
// 1. ROUTE: LISTA ALLA ANVÄNDARE (GET /)
// -------------------------------------------------------------------------
router.get('/', async (request, response) => {
    if (!(await hasAccess(request))) return accessDeniedResponse(response);
    
    renderPageTop(request, response, "User Management");

    let htmlOutput = `
    <table border="0" width="100%">
        <tr>
            <td align="left"><h2>User Database</h2></td>
            <td align="right"><a href="/api/userdatabase/add" style="color:green; text-decoration:none; font-weight:bold; border:1px solid green; padding:5px; border-radius:4px;">[+] Add New User</a></td>
        </tr>
    </table>
    <div id="table-resp">
        <div id="table-header">
            <div class="table-header-cell-light">Username</div>
            <div class="table-header-cell-dark">Employee Name</div>
            <div class="table-header-cell-light">Login Times</div>
            <div class="table-header-cell-light">Last Login</div>
            <div class="table-header-cell-light">Lockout</div>
            <div class="table-header-cell-light" style="text-align:center;">Edit</div>
            <div class="table-header-cell-light" style="text-align:center;">Delete</div>
        </div>
        <div id="table-body">`;

    try {
        // Hämta data från users och employee tabeller, nära dina kolumner
        const result = await connection.query(`
            SELECT u.employeeCode, e.[name], u.logintimes, u.lastlogin, u.lockout
            FROM users u
            LEFT JOIN employee e ON u.employeeCode = e.employeeCode`);

        for (let user of result) {
            let isLocked = (user.lockout != null && user.lockout != 0 && user.lockout != false && String(user.lockout).toLowerCase() !== 'false');
            let lockoutText = isLocked ? "LOCKED" : "Active";

            htmlOutput += `
            <div class="resp-table-row">
                <div class="table-body-cell">${user.employeeCode}</div>
                <div class="table-body-cell-bigger">${user.name || '<i>No name set</i>'}</div>
                <div class="table-body-cell">${user.logintimes || '0'}</div>
                <div class="table-body-cell">${user.lastlogin || '-'}</div>
                <div class="table-body-cell">${lockoutText}</div>
                <div class="table-body-cell" style="text-align:center;">
                    <a href="/api/userdatabase/edit/${user.employeeCode}" style="color:#0056b3; font-weight:bold; text-decoration:none;">[E]</a>
                </div>
                <div class="table-body-cell" style="text-align:center;">
                    <a href="/api/userdatabase/delete/${user.employeeCode}" style="color:red; text-decoration:none;" onclick="return confirm('Radera?');">[X]</a>
                </div>
            </div>`;
        }
    } catch (err) { htmlOutput += `Error: ${err.message}`; }

    htmlOutput += `</div></div>`;
    response.write(htmlOutput);
    renderPageBottom(response);
});

// -------------------------------------------------------------------------
// 2. ROUTE: FORMULÄR FÖR ATT LÄGGA TILL (GET /add)
// -------------------------------------------------------------------------
router.get('/add', async (request, response) => {
    if (!(await hasAccess(request))) return accessDeniedResponse(response);
    renderPageTop(request, response, "Add User");
    
    // Generera IT-koder dynamiskt för rullistan
    let itCodes = "";
    for(let i=1; i<=30; i++) { 
        let c = `IT25-${i.toString().padStart(2,'0')}`; 
        itCodes += `<option value="${c}">${c}</option>`; 
    }
    
    response.write(`
        <h2>Add User & Profile</h2>
        <form action="/api/userdatabase/add" method="POST" style="border:1px solid #ccc; padding:20px; width:400px; background:#f9f9f9;">
            <p>Username (Max 7): <br>
               <input type="text" name="customUsername" maxlength="7" placeholder="Custom name..."> 
                eller <select name="itUsername"><option value="">-Välj IT-kod-</option>${itCodes}</select>
            </p>
            <p>Full Name (No limit): <br>
               <input type="text" name="fullName" placeholder="t.ex. Thomas Anderson" style="width:100%;">
            </p>
            <p>Password (Max 7): <br>
               <input type="password" name="password" maxlength="7" required style="width:100%;">
            </p>
            <p>Security Level: <br>
               <select name="securityLevel" style="width:100%;">
                    <option value="C">C (Standard)</option>
                    <option value="B">B (Manager)</option>
                    <option value="A">A (Admin)</option>
               </select>
            </p>
            <button type="submit" style="padding:10px 20px; background:green; color:white; border:none; border-radius:4px; cursor:pointer;">Create User</button>
        </form>`);
    renderPageBottom(response);
});

// -------------------------------------------------------------------------
// 3. ROUTE: PROCESSA TILLÄGG (POST /add)
// -------------------------------------------------------------------------
router.post('/add', async (request, response) => {
    if (!(await hasAccess(request))) return response.send("Denied");
    
    // LOGIK FÖR PRECEDENCE:
    // Om 'customUsername' har ett värde används det, annars används valet från rullistan 'itUsername'.
    let user = (request.body.customUsername && request.body.customUsername.trim() !== "") 
               ? request.body.customUsername.trim() 
               : request.body.itUsername;
    
    let name = request.body.fullName || user; // Om fullständigt namn saknas, använd användarnamnet
    let pass = request.body.password;
    let lvl = request.body.securityLevel;

    // Säkerhetskontroll för längd (Double-check även på serversidan)
    if (!user || user.length > 7 || pass.length > 7) {
        return response.send("<h2>Error</h2><p>Username/Pass max 7 chars.</p><a href='javascript:history.back()'>Back</a>");
    }

    try {
        // DUBBLETTKONTROLL: Kolla om användaren redan finns i databasen
        let check = await connection.query(`SELECT employeeCode FROM users WHERE employeeCode='${user}'`);
        if (check.length > 0) {
            return response.send(`<h2>Error</h2><p>User <b>${user}</b> already exists!</p><a href='javascript:history.back()'>Back</a>`);
        }

        // Hasha lösenordet med MD5 (matchar login.js)
        let hashedPass = crypto.createHash('md5').update(pass).digest('hex');
        
        // Utför INSERT i båda tabellerna
        // 'lockout' sätts till NULL för att kontot ska vara aktivt direkt
        await connection.execute(`INSERT INTO users (employeeCode, passwd, lockout, logintimes) VALUES ('${user}', '${hashedPass}', NULL, 0)`);
        await connection.execute(`INSERT INTO employee (employeeCode, [name], securityAccessLevel) VALUES ('${user}', '${name}', '${lvl}')`);
        
        response.redirect('/api/userdatabase');
    } catch (err) { response.send("Error: " + err.message); }
});

// -------------------------------------------------------------------------
// 4. ROUTE: FORMULÄR FÖR ATT EDITERA (GET /edit/:username)
// -------------------------------------------------------------------------
router.get('/edit/:username', async (request, response) => {
    if (!(await hasAccess(request))) return accessDeniedResponse(response);
    
    let user = request.params.username;
    try {
        let res = await connection.query(`SELECT users.lockout, employee.[name], employee.securityAccessLevel FROM users LEFT JOIN employee ON users.employeeCode = employee.employeeCode WHERE users.employeeCode='${user}'`);
        let data = res[0];
        
        // Kontrollera om kontot är låst för att förifylla dropdownen korrekt
        let isLocked = (data.lockout != null && data.lockout != 0 && data.lockout != false && String(data.lockout).toLowerCase() !== 'false');

        renderPageTop(request, response, "Edit User");
        response.write(`
            <h2>Edit User: ${user}</h2>
            <form action="/api/userdatabase/edit/${user}" method="POST" style="border:1px solid #ccc; padding:20px; width:400px;">
                <p>Full Name: <br>
                    <input type="text" name="fullName" value="${data.name || ''}" style="width:100%;">
                </p>
                <p>Status: <br>
                    <select name="lockout" style="width:100%;">
                        <option value="false" ${!isLocked ? 'selected' : ''}>Active (NULL)</option>
                        <option value="true" ${isLocked ? 'selected' : ''}>Locked (True)</option>
                    </select>
                </p>
                <p>Level: <br>
                    <select name="securityLevel" style="width:100%;">
                        <option value="C" ${data.securityAccessLevel==='C'?'selected':''}>C</option>
                        <option value="B" ${data.securityAccessLevel==='B'?'selected':''}>B</option>
                        <option value="A" ${data.securityAccessLevel==='A'?'selected':''}>A</option>
                    </select>
                </p>
                <p>New Password (Max 7): <br>
                    <input type="password" name="password" maxlength="7" placeholder="Leave empty to keep current" style="width:100%;">
                </p>
                <button type="submit" style="padding:10px; background:#0056b3; color:white; border:none; border-radius:4px; cursor:pointer;">Save Changes</button>
            </form>`);
        renderPageBottom(response);
    } catch (err) { response.send(err.message); }
});

// -------------------------------------------------------------------------
// 5. ROUTE: PROCESSA ÄNDRINGAR (POST /edit/:username)
// -------------------------------------------------------------------------
router.post('/edit/:username', async (request, response) => {
    if (!(await hasAccess(request))) return response.send("Denied");
    
    let user = request.params.username;
    let name = request.body.fullName;
    // Om status sätts till false skickar vi 'NULL' till SQL för att låsa upp kontot helt
    let lockValue = (request.body.lockout === 'true') ? 'true' : 'NULL';
    let lvl = request.body.securityLevel;
    let newPass = request.body.password;

    try {
        // Om ett nytt lösenord har skrivits in, hashade och uppdatera det
        if (newPass && newPass.trim() !== "") {
            if (newPass.length > 7) return response.send("Error: Pass max 7");
            let hashedPass = crypto.createHash('md5').update(newPass).digest('hex');
            await connection.execute(`UPDATE users SET lockout=${lockValue}, passwd='${hashedPass}' WHERE employeeCode='${user}'`);
        } else {
            // Annars uppdatera bara status (lockout)
            await connection.execute(`UPDATE users SET lockout=${lockValue} WHERE employeeCode='${user}'`);
        }
        // Uppdatera profilinformationen i employee-tabellen
        await connection.execute(`UPDATE employee SET [name]='${name}', securityAccessLevel='${lvl}' WHERE employeeCode='${user}'`);
        
        response.redirect('/api/userdatabase');
    } catch (err) { response.send(err.message); }
});

// -------------------------------------------------------------------------
// 6. ROUTE: RADERA ANVÄNDARE (GET /delete/:username)
// -------------------------------------------------------------------------
router.get('/delete/:username', async (request, response) => {
    if (!(await hasAccess(request))) return accessDeniedResponse(response);
    
    try {
        // Radera från båda tabellerna för att hålla databasen ren
        await connection.execute(`DELETE FROM users WHERE employeeCode='${request.params.username}'`);
        await connection.execute(`DELETE FROM employee WHERE employeeCode='${request.params.username}'`);
        
        response.redirect('/api/userdatabase');
    } catch (err) { response.send(err.message); }
});


module.exports = router;
