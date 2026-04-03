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
var htmlVirusimagesCSS = readHTML('./masterframe/virusimages_css.html');

router.get('/deletevirusimage/:virusId/:imageNumber', function(request, response) {
    let virusId = request.params.virusId;
    let imageNumber = request.params.imageNumber;

    if (!request.session.loggedin || !(request.session.securityAccessLevel === 'A' || request.session.securityAccessLevel === 'B')) {
        return response.status(401).send('Unauthorized');
    }

    let imagePath = path.join(__dirname, '..', 'public', 'virusphoto', virusId.toString(), imageNumber + '.jpg');

    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        const virusImageDir = path.join(__dirname, '..', 'public', 'virusphoto', virusId.toString());

        if (fs.existsSync(virusImageDir)) {
            const files = fs.readdirSync(virusImageDir)
                .filter(file => file.toLowerCase().endsWith('.jpg'))
                .sort((a, b) => parseInt(a.replace('.jpg', '')) - parseInt(b.replace('.jpg', '')));

            files.forEach((file, index) => {
                const oldPath = path.join(virusImageDir, file);
                const newFileName = `${index + 1}.jpg`;
                const newPath = path.join(virusImageDir, newFileName);
                if (oldPath !== newPath) {
                    fs.renameSync(oldPath, newPath);
                }
            });
        }
    }

    return response.redirect(`/api/virusdatabase/${virusId}`);
});

router.post('/newvirusimage/:id', function(request, response) {
    
    let virusId = request.params.id;

    if(request.session.loggedin && (request.session.securityAccessLevel == "B" || request.session.securityAccessLevel == "A")) {
        var form = new formidable.IncomingForm();
        form.parse(request, function(err, fields, files) {
            try {
                // Kolla om mappen för viruset finns, annars skapa den
                let virusImageDir = path.join(__dirname, '..', 'public', 'virusphoto', virusId.toString());
                if (!fs.existsSync(virusImageDir)) {
                    fs.mkdirSync(virusImageDir, { recursive: true });
                }

                //Räkna antal bilder som finns för viruset
                let imageNumber = 0;
                while (fs.existsSync(path.join(virusImageDir, `${imageNumber + 1}.jpg`))) {
                    imageNumber++;
                }

                //Ladda upp bilden
                var ffile = Array.isArray(files.virusimage) ? files.virusimage[0] : files.virusimage;
                if (ffile && ffile.originalFilename) {
                    var oldpath = ffile.filepath;
                    var newpath = path.join(virusImageDir, `${imageNumber + 1}.jpg`);
                    try {
                        fs.renameSync(oldpath, newpath);
                    } catch (e) {
                        fs.copyFileSync(oldpath, newpath);
                        fs.unlinkSync(oldpath);
                    }
                }

                return response.redirect(`/api/virusdatabase/${virusId}`);
            } catch (err) {
                console.error('upload image error:', err);
                return response.status(500).send('Image upload failed: ' + err.message);
            }
        });
    }
    else {
        response.writeHead(401, {'Content-Type': 'text/html'});
        response.write(htmlHead);
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);
        response.write('<h1>Unauthorized</h1><p>You must be logged in with appropriate permissions to upload images.</p>');
        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
    }
});

module.exports = router;
