function backupVirus(result) {
    return new Promise((resolve, reject) => {
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');

        // Läs in databasinformationen om viruset
        str_virusID = result[0]['ID'];
        str_objectNumber = result[0]['objectNumber'];
        str_objectName = result[0]['objectName'];
        str_objectCreator = result[0]['objectCreator'];
        str_objectCreateDate = result[0]['objectCreatedDate'];
        str_objectCreateTime = result[0]['objectCreatedTime'];
        str_objectText = result[0]['objectText'];
        str_objectStatus = result[0]['objectStatus'];
        var str_presentationVideoLink = "";
        var str_securityVideoLink = "";
        if (result[0]['presentationVideoLink']) {
            str_presentationVideoLink = result[0]['presentationVideoLink'];
        }
        if (result[0]['securityVideoLink']) {
            str_securityVideoLink = result[0]['securityVideoLink'];
        }

        // gather date and time for backup naming
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // månader är 0–11
        const year = today.getFullYear();

        const date = `${day}.${month}.${year}`;

        const time = new Date().toLocaleTimeString('sv-SE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(":", "."); // replace with . for usable file naming

        try {
            //create pdf document
            const doc = new PDFDocument();

            // Create folder if needed
            const folderPath = `C:/secretbackup/${str_virusID}/backup_${date}_${time}`;
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            // Copy the safety data sheet if it exists
            const oldPath = path.resolve(__dirname, `data/safetydatasheets/${str_objectNumber}.pdf`);
            const newPath = `C:/secretbackup/${str_virusID}/backup_${date}_${time}/SafetyDataSheet_${date}_${time}.pdf`;

            fs.existsSync(oldPath) && fs.copyFileSync(oldPath, newPath);

            // Copy the virus folder
            const source = path.resolve(__dirname, `data/${str_virusID}`);
            const destination = `C:/secretbackup/${str_virusID}/backup_${date}_${time}/`;

            if (fs.existsSync(source)) {
                fs.cp(source, destination, { recursive: true }, (err) => {
                    if (err) {
                        console.error("Copy failed:", err);
                    }
                })
            };

            // changes the object name to be used in the PDF file name, replacing spaces with dots
            objectNameWithoutSpaces = str_objectName.replace(/\s+/g, '.');

            // specifies the path to write the PDF file to
            const filepath = path.join(`C:/secretbackup/${str_virusID}/backup_${date}_${time}/`, `${objectNameWithoutSpaces}_${date}_${time}.pdf`);

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // PDF-info and content
            doc.fontSize(20).text(`Virus Backup: ${str_objectName}`, { underline: true });
            doc.moveDown();

            doc.fontSize(12).text(`ID: ${str_virusID}`);
            doc.text(`Object Number: ${str_objectNumber}`);
            doc.text(`Name: ${str_objectName}`);
            doc.text(`Creator: ${str_objectCreator}`);
            doc.text(`Created Date: ${str_objectCreateDate}`);
            doc.text(`Created Time: ${str_objectCreateTime}`);
            doc.text(`Status: ${str_objectStatus}`);
            doc.moveDown();

            doc.fontSize(14).text("Description:", { underline: true });
            doc.fontSize(12).text(str_objectText, { width: 400 });
            doc.moveDown();

            if (str_presentationVideoLink) doc.text(`Presentation Video: ${str_presentationVideoLink}`);
            if (str_securityVideoLink) doc.text(`Security Video: ${str_securityVideoLink}`);

            doc.moveDown();
            doc.text(`Backup created on ${date} at ${time}`);

            doc.end();

            // resolve the promise when the PDF has been written
            stream.on('finish', () => resolve(true));
            stream.on('error', () => resolve(false));
        }
        catch (err) {
            console.error(err);
        }
    });
}
module.exports = backupVirus;
