const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ADODB = require('node-adodb');

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// Sätt upp anslutningen till forskningsdatabasen
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/researchdata.mdb;');

router.post('/', async (request, response) =>
{
    // Kontrollera att användaren är inloggad
    if(!request.session.loggedin)
    {
        response.send("Not logged in");
        return;
    }

    // Kontrollera SecurityAccessLevel
    if(request.session.securityAccessLevel !== 'A')
    {
        response.send("Access denied");
        return;
    }

    const paniccode = request.body.paniccode || "";
    // Hashen av "Arias"
    const correctHash = crypto.createHash('md5').update('Arias').digest('hex');

    // Om användaren skriver fel panic code
    if(paniccode !== correctHash)
    {
        response.send("Wrong panic code");
        return;
    }

    try
    {
        // Logga att panik-knappen har aktiverats på användarens dator
        const logPath = path.resolve(__dirname, '../data/panic.log');
        const logRow = new Date().toISOString() + " | PANIC ACTIVATED BY " + request.session.username + "\n";
        fs.appendFileSync(logPath, logRow);

        // ====================================================================
                        // BEVISFÖRSTÖRELSE STARTAR HÄR
        // ====================================================================

        // Töm tabellerna i databasen
        await connection.execute('DELETE FROM ResearchObjects');
        
        await connection.execute('DELETE FROM ResearchEntries'); 
        console.log("Tabellerna ResearchObjects och ResearchEntries har tömts.");

        // Ta bort virusdatabase.js från index.js så att appen inte kraschar efter panic har körts
        const indexPath = path.resolve(__dirname, '../index.js'); // Leta upp index.js i rotmappen
        if (fs.existsSync(indexPath)) {
            
            let indexContent = fs.readFileSync(indexPath, 'utf8');

            indexContent = indexContent.replace("const virusdatabase = require('./routes/virusdatabase');", "// borttagen route");
            indexContent = indexContent.replace("app.use('/api/virusdatabase', virusdatabase);", "// borttagen route");

            fs.writeFileSync(indexPath, indexContent, 'utf8');
            console.log("Referenser till virusdatabase har raderats från index.js.");
        }

        // Radera filen virusdatabase.js 
        const routeFileToDelete = path.join(__dirname, 'virusdatabase.js');
        if (fs.existsSync(routeFileToDelete)) {
            fs.unlinkSync(routeFileToDelete);
            console.log("Routen virusdatabase.js har raderats permanent.");
        }

        // Radera uppladdade filer och mappar 
        const directoriesToEmpty = [
            path.resolve(__dirname, '../data/safetydatasheets')
        ];

        for (const dir of directoriesToEmpty) {
            if (fs.existsSync(dir)) {
                // Använder rmSync för att radera hela mappen och allt innehåll direkt
                fs.rmSync(dir, { recursive: true, force: true });
                
                // Skapa en ny, tom mapp med samma namn efteråt så att servern inte kraschar om någon annan del av koden letar efter mappen
                fs.mkdirSync(dir);
                
                console.log(`Mappen ${dir} har utplånats och återskapats tom.`);
            }
        }

        // Returnera lyckat resultat
        response.send("<span style='color:red; font-weight:bold;'>Panic sequence activated. All research data, routing and files have been purged.</span>");
    }
    // Annars:
    catch(err)
    {
        console.error("Ett fel uppstod vid radering av bevismaterial: ", err);
        response.send("Panic failed");
    }
});

module.exports = router;
