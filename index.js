/* ----------------------------- 3:rd party-moduler------------------------------ */
const config = require('./config/globals.json');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();                  /* Skapa webbserver-objektet */


app.use(express.static('./public'));    /* Skapa global path till "public"-mappen */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(
    session({
        secret: 'thisisasecret',
        saveUninitialized: true,
        resave: false
    }));

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    }));

const pug = require('pug');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

/* ------------------------------ Egna moduler ----------------------------------- */
const readHTML = require('./readHTML.js');

/* Läs respektive HTML-text-sida för Masterframen */
var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlIndex = readHTML('./public/text/index.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

/* ------------- Skapa routes för de alternativa rutterna i webbapplikationen ------------------------- */
const info = require('./routes/info');
const personnelregistry = require('./routes/personnelregistry');
const login = require('./routes/login');
const logout = require('./routes/logout');
const virusdatabase = require('./routes/virusdatabase');
const newemployee = require('./routes/newemployee');
const deleteemployee = require('./routes/deleteemployee');
const editemployee = require('./routes/editemployee');
const entries = require('./routes/entries');
const getchat = require('./routes/getchat');
const chat = require('./routes/chat');
const fileUploadRouter = require('./routes/fileuploadvirus');
const editVirusImageRouter = require('./routes/editvirusimage');
const activityLogRouter = require('./routes/activityLog');
const panic = require('./routes/panic');

//  Livestream router 
const livestream = require('./routes/livestream.js');

/* -------------- Skapa default-router --------------------- */
app.get('/', function(request, response)
{
    response.setHeader('Content-type','text/html');
    response.write(htmlHead);

    if(request.session.loggedin)
    {
        const htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
        response.write(htmlLoggedinMenuCSS);
        
        const htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
        response.write(htmlLoggedinMenuJS);

        response.write(pug_loggedinmenu({
            employeecode: request.cookies.employeecode,
            name: request.cookies.name,
            logintimes: request.cookies.logintimes,
            lastlogin: request.cookies.lastlogin,
            securityaccesslevel: request.session.securityAccessLevel
        }));
    }

    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);
    
    const htmlInfo = readHTML('./public/text/index.html');
    response.write(htmlInfo);    

    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();
});

/* ------------------- Mount all routers ------------------- */
app.use('/api/info', info);
app.use('/api/personnelregistry', personnelregistry);
app.use('/api/login', login);
app.use('/api/logout', logout);
app.use('/api/virusdatabase', virusdatabase);
app.use('/api/newemployee', newemployee);
app.use('/api/deleteemployee', deleteemployee);
app.use('/api/editemployee', editemployee);
app.use('/api/entries', entries);
app.use('/api/getchat', getchat);
app.use('/api/chat', chat);
app.use('/api/data', fileUploadRouter);
app.use('/api/editvirusimage', editVirusImageRouter);
app.use('/api/userdatabase', require('./routes/userdatabase'));
app.use('/api/activitylog', activityLogRouter);
app.use('/api/panic', panic);

// Livestream router
app.use('/api/livestream', livestream);

/* ---------------------------------- Starta webbservern ------------------------------ */
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));