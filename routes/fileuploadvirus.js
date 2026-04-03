const express = require('express');
const router = express.Router();
const multer = require('multer');
router.use(express.json());
const path = require('path');

const checkAuth = require('../authMiddleware.js');

router.use(express.static('./public'));
const readHTML = require('../readHTML.js');
const fs = require('fs');
const { request } = require('http');

// Multer tar enom filen och sparar den i rätt mapp genom att hämta id't från requesten
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const virusId = req.params.id;

        const safeVirusId = String(virusId).replace(/[^a-zA-Z0-9_-]/g, ''); // Skyddar mot injections.

        const uploadPath = path.join(__dirname, '..', 'data', safeVirusId, 'attachments');

        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, '');

        cb(null, `${Date.now()}-${baseName}${ext}`);
    }
});
const upload = multer({ storage: storage });

// ---------------------- Lägg till en ny attachment ------------------------------------------------
router.post('/:id', upload.single('fileadd'), function (request, response) {

    const targetid = request.params.id;
    response.redirect(`/api/data/${targetid}`);

});

// ---------------------- Radera en attachment ------------------------------------------------
router.post('/:id/delete-file', checkAuth, function(request, response) {
    const targetid = request.params.id;
    const safeVirusId = String(targetid).replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = request.body.fileName;
    const filePath = path.join(__dirname, '..', 'data', safeVirusId, 'attachments', fileName);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    response.redirect(`/api/data/${targetid}`);
});




// ---------------------- Formulär för att lägga till ny fil ------------------------------
router.get('/:id', checkAuth, (request, response) => {
    const currentUserId = request.session.userId || null;
    const idForFile = request.params.id;
    const safeVirusId = String(idForFile).replace(/[^a-zA-Z0-9_-]/g, '');

    const dirPath = path.join(__dirname, '..', 'data', safeVirusId, 'attachments');
    let attachmentsHTML = '';

    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);

        attachmentsHTML = files.map(file => {
            const fullPath = path.join(dirPath, file);
            const stats = fs.statSync(fullPath);
            return `
                <div class="source_row">
                    <span class="source_value">${file}</span>
                    <span class="source_size">${(stats.size / 1024).toFixed(1)} KB</span>
                    <form method="POST" action="/api/data/${safeVirusId}/delete-file" style="display:inline; margin-left:10px;">
                        <input type="hidden" name="fileName" value="${file}">
                        <button type="submit">🗑️</button>
                    </form>
                </div>`;
        }).join('');
    } else {
        attachmentsHTML = `<div class="source_row">Inga filer</div>`;
    }

    const newdata = `
        <link rel="stylesheet" type="text/css" href="/css/viruscss.css" />
        <div style="padding: 20px;">
            <h1>File upload for ${safeVirusId}</h1>
            <div id="newDatacontainer">
                <form name="addData" action="/api/data/${safeVirusId}" method="POST" enctype="multipart/form-data">
                    <p>Välj fil: <input type="file" name="fileadd" id="fileadd" /></p>
                    <p><button type="submit">Upload file</button></p>
                </form>
            </div>

            <div id="sources_container" style="margin-top: 20px;">
                <h2>Attachments</h2>
                ${attachmentsHTML}
            </div>
        </div>`;

    response.render('user', {
        userId: currentUserId,
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
        content: newdata
    });
});

module.exports = router;
