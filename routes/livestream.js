const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// FIXED PATH (from inside routes folder)
const readHTML = require('../readHTML.js');

// Load Pug for logged-in menu
const pug = require('pug');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

// Load all masterframe components
var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');    
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

var htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
var htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');

// Hjälpfunktion för XML
function getXmlValue(content, tag) {
    try {
        const regex = new RegExp(`<${tag}>[\\s\\S]*?<current>(.*?)<\\/current>`, 'i');
        const match = content.match(regex);
        return match ? match[1].trim() : "--";
    } catch (e) { return "ERR"; }
}

function getAllBioData() {
    const pathTyrant   = path.join(__dirname, '../data/xml/tyrant.xml');
    const pathVeronica = path.join(__dirname, '../data/xml/t-veronica.xml');
    const pathUroboros = path.join(__dirname, '../data/xml/uroboros.xml');
    let data = {
        T: { temp: "--", hum: "--", light: "--" },
        V: { temp: "--", hum: "--", light: "--" },
        U: { temp: "--", hum: "--", light: "--" }
    };
    try {
        if (fs.existsSync(pathTyrant)) {
            const c = fs.readFileSync(pathTyrant, 'utf8');
            data.T = { temp: getXmlValue(c, 'temperature'), hum: getXmlValue(c, 'humidity'), light: getXmlValue(c, 'lightSensitivity') };
        }
        if (fs.existsSync(pathVeronica)) {
            const c = fs.readFileSync(pathVeronica, 'utf8');
            data.V = { temp: getXmlValue(c, 'temperature'), hum: getXmlValue(c, 'humidity'), light: getXmlValue(c, 'lightSensitivity') };
        }
        if (fs.existsSync(pathUroboros)) {
            const c = fs.readFileSync(pathUroboros, 'utf8');
            data.U = { temp: getXmlValue(c, 'temperature'), hum: getXmlValue(c, 'humidity'), light: getXmlValue(c, 'lightSensitivity') };
        }
    } catch (err) {
        console.error("XML Error:", err);
    }
    return data;
}

router.get('/', (request, response) => {
    try {
        // Security check: Only level A and B can view livestream
        if (request.session.securityAccessLevel !== 'A' && request.session.securityAccessLevel !== 'B') {
            response.write('Access Denied. You do not have the required security clearance to view the Virus Livestream.');
            response.end();
            return;
        }

        const bioData = getAllBioData();
        
        if (request.query.format === 'json') {
            return response.json(bioData);
        }
        
        response.setHeader('Content-type', 'text/html');
        response.write(htmlHead);
        
        //logged-in menu CSS and JS if user is logged in
        if(request.session.loggedin) {
            response.write(htmlLoggedinMenuCSS);
            response.write(htmlLoggedinMenuJS);
            response.write(pug_loggedinmenu({
                employeecode: request.cookies.employeecode,
                name: request.cookies.name,
                logintimes: request.cookies.logintimes,
                lastlogin: request.cookies.lastlogin,
                securityaccesslevel: request.session.securityAccessLevel,
                webaddress: 'http://djinn.tricell.local',
            }));
        }
        
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);
        
        let htmloutput = `
        <style>
            .grid-container { 
                display: grid; 
                grid-template-columns: 400px 1fr; 
                gap: 20px; 
                background: transparent; 
                border: none; 
                max-width: 100%; 
                margin: 0 auto; 
            }
            .monitor-box { 
                position: relative; 
                width: 400px; 
                height: 225px; 
                background:#000; 
                overflow: hidden; 
                border: 2px solid #444; 
            }
            .monitor-overlay { 
                position: absolute; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                z-index: 10; 
                pointer-events: none; 
            }
            .monitor-box::after { 
                content: ""; 
                position: absolute; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background-image: url('/images/noise-transparent.png'); 
                opacity: 0.15; 
                z-index: 99; 
                pointer-events: none; 
                animation: noise-move 0.2s infinite steps(2); 
            }
            @keyframes noise-move { 
                0% { background-position: 0 0; } 
                50% { background-position: 5% 5%; } 
                100% { background-position: -5% 10%; } 
            }
            .glitch-img { 
                width: 100%; 
                height: 100%; 
                object-fit: cover; 
            }
            .data-box { 
                font-family: 'Courier New', Courier, monospace; 
                color: #000; 
            }
            .blue-info { 
                width: 220px; 
                height: 28px; 
                padding-top: 6px; 
                margin-bottom: 10px; 
                background-color: #cfe7fd; 
                text-align: center; 
                font-weight: bold; 
                border: 1px solid #9dbcdb; 
                color: #222; 
                transition: background-color 0.3s; 
            }
            .alarm { 
                background-color: #ff0000 !important; 
                color: white !important; 
                animation: blink 0.5s infinite; 
            }
            @keyframes blink { 
                0% { opacity: 1; } 
                50% { opacity: 0.6; } 
                100% { opacity: 1; } 
            }
            .label { 
                color: #555; 
                font-size: 11px; 
                text-transform: uppercase; 
                display: block; 
                font-weight: bold; 
            }
            .spacer { 
                grid-column: span 2; 
                height: 20px; 
                border-bottom: 1px dashed #ccc; 
                margin-bottom: 20px; 
            }
        </style>
        <div class="grid-container">
            <div class="monitor-box">
                <img src="/images/screen.png" class="monitor-overlay" onerror="this.style.display='none'">
                <img id="img_v" class="glitch-img" src="/t-veronica/images/t-veronica.jpg">
            </div>
            <div class="data-box">
                <b>OBJECT: TCL#3 (T-Veronica)</b><br><br>
                <span class="label">Temperature (&lt;12 C):</span>
                <div id="v_temp" class="blue-info ${Number(bioData.V.temp) > 12 ? 'alarm' : ''}">${bioData.V.temp} C</div>
                <span class="label">Humidity (&lt;20%):</span>
                <div id="v_hum" class="blue-info ${Number(bioData.V.hum) > 20 ? 'alarm' : ''}">${bioData.V.hum} %</div>
                <span class="label">Light (&lt;150 Lm):</span>
                <div id="v_light" class="blue-info ${Number(bioData.V.light) > 150 ? 'alarm' : ''}">${bioData.V.light} Lm</div>
            </div>
            <div class="spacer"></div>
            <div class="monitor-box">
                <img src="/images/screen.png" class="monitor-overlay" onerror="this.style.display='none'">
                <img id="img_t" class="glitch-img" src="/tyrant/images/tyrant.jpg">
            </div>
            <div class="data-box">
                <b>OBJECT: TCL#2 (Tyrant)</b><br><br>
                <span class="label">Temperature (&lt;15 C):</span>
                <div id="t_temp" class="blue-info ${Number(bioData.T.temp) > 15 ? 'alarm' : ''}">${bioData.T.temp} C</div>
                <span class="label">Humidity (&lt;20%):</span>
                <div id="t_hum" class="blue-info ${Number(bioData.T.hum) > 20 ? 'alarm' : ''}">${bioData.T.hum} %</div>
                <span class="label">Light (&lt;10 Lm):</span>
                <div id="t_light" class="blue-info ${Number(bioData.T.light) > 10 ? 'alarm' : ''}">${bioData.T.light} Lm</div>
            </div>
            <div class="spacer"></div>
            <div class="monitor-box">
                <img src="/images/screen.png" class="monitor-overlay" onerror="this.style.display='none'">
                <img id="img_u" class="glitch-img" src="/uroboros/images/uroboros.jpg">
            </div>
            <div class="data-box">
                <b>OBJECT: TCL#4 (Uroboros)</b><br><br>
                <span class="label">Temperature (&lt;10 C):</span>
                <div id="u_temp" class="blue-info ${Number(bioData.U.temp) > 10 ? 'alarm' : ''}">${bioData.U.temp} C</div>
                <span class="label">Humidity (&lt;20%):</span>
                <div id="u_hum" class="blue-info ${Number(bioData.U.hum) > 20 ? 'alarm' : ''}">${bioData.U.hum} %</div>
                <span class="label">Light (&lt;210 Lm):</span>
                <div id="u_light" class="blue-info ${Number(bioData.U.light) > 210 ? 'alarm' : ''}">${bioData.U.light} Lm</div>
            </div>
        </div>
        <script>
            function loadChat() { 
                console.log("Tricell Telemetry System: Online"); 
            }
            
            function updateImages() { 
                const t = new Date().getTime(); 
                if(document.getElementById("img_v")) document.getElementById("img_v").src = "/t-veronica/images/t-veronica.jpg?t=" + t; 
                if(document.getElementById("img_t")) document.getElementById("img_t").src = "/tyrant/images/tyrant.jpg?t=" + t; 
                if(document.getElementById("img_u")) document.getElementById("img_u").src = "/uroboros/images/uroboros.jpg?t=" + t; 
            }
            
            async function updateData() { 
                try { 
                    const res = await fetch(window.location.pathname + '?format=json'); 
                    if (!res.ok) throw new Error('Network error'); 
                    const data = await res.json(); 
                    
                    updateElement("v_temp", data.V.temp, 12, " C"); 
                    updateElement("v_hum", data.V.hum, 20, " %"); 
                    updateElement("v_light", data.V.light, 150, " Lm"); 
                    updateElement("t_temp", data.T.temp, 15, " C"); 
                    updateElement("t_hum", data.T.hum, 20, " %"); 
                    updateElement("t_light", data.T.light, 10, " Lm"); 
                    updateElement("u_temp", data.U.temp, 10, " C"); 
                    updateElement("u_hum", data.U.hum, 20, " %"); 
                    updateElement("u_light", data.U.light, 210, " Lm"); 
                } catch (e) { 
                    console.log("Sync error:", e); 
                } 
            }
            
            function updateElement(id, val, limit, unit) { 
                const el = document.getElementById(id); 
                if(!el) return; 
                el.innerHTML = val + unit; 
                if(parseFloat(val) > limit) el.classList.add("alarm"); 
                else el.classList.remove("alarm"); 
            }
            
            window.addEventListener('load', function() { 
                loadChat(); 
                setInterval(updateImages, 1000); 
                setInterval(updateData, 3000); 
            });
        </script>
        `;
        
        response.write(htmloutput);
        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
        
    } catch (err) {
        console.error("Livestream route error:", err);
        response.status(500).send('<h2 style="color:red">Error loading Livestream page. Please check server console.</h2>');
    }
});

module.exports = router;
