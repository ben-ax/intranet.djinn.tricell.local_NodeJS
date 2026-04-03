const fs = require('fs');

function getVirusImagesHTML(virusId) {
    let html = '';

    // Lightbox modal (Här fick vi lite hjälp av AI)
    html += `
        <div id="image-lightbox" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center; cursor:pointer;" onclick="this.style.display='none';">
            <span style="position:absolute; top:20px; right:30px; color:#fff; font-size:36px; font-weight:bold; cursor:pointer; z-index:10000; line-height:1;" onclick="event.stopPropagation(); document.getElementById('image-lightbox').style.display='none';">&#x2715;</span>
            <img id="lightbox-img" src="" alt="Enlarged" style="max-width:90%; max-height:90%; object-fit:contain; border:2px solid #fff; cursor:default;" onclick="event.stopPropagation();">
        </div>
    `;

    html += '<div class="virusimages-section" style="margin-top:30px;">';

    // Header med titel och upload-knapp
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">';
    html += '<h3 style="margin:0;">Research images:</h3>';
    html += `Upload New Image <a id="upload-new-image-btn" onclick="document.getElementById('virusimage-input').click();" class="virusimages-upload-btn">+</a>`;

    //Skaffa en form för att ladda upp bilder
    html += `
        <form id="upload-image-form" action="/api/editvirusimage/newvirusimage/${virusId}" method="POST" enctype="multipart/form-data" style="display:none;">
            <input type="file" name="virusimage" id="virusimage-input" accept="image/jpeg" onchange="this.form.submit()">
        </form>
    `;

    html += '</div>';

    // Gallery grid
    html += '<div class="virusimages-gallery" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:15px;">';

    const imageDir = `./public/virusphoto/${virusId}`;
    if (fs.existsSync(imageDir)) {
        const files = fs.readdirSync(imageDir).filter(file => file.endsWith('.jpg')).sort((a, b) => {
            const numA = parseInt(a.replace('.jpg', ''));
            const numB = parseInt(b.replace('.jpg', ''));
            return numA - numB;
        });

        files.forEach(file => {
            const imageNumber = file.replace('.jpg', '');
            html += `
                <div class="image-item" style="position:relative; text-align:center;">
                    <img src="/virusphoto/${virusId}/${file}"
                         alt="Virus ${virusId} Image ${imageNumber}"
                         style="width:100%; height:120px; object-fit:cover; border:1px solid #ddd; cursor:pointer;"
                         onclick="event.stopPropagation(); var lb = document.getElementById('image-lightbox'); document.getElementById('lightbox-img').src=this.src; lb.style.display='flex';">
                    <a class="delete-image-btn" href="/api/editvirusimage/deletevirusimage/${virusId}/${imageNumber}">
                        &#x2715;
                    </a>
                </div>
            `;
        });
    }

    // Info text
    //html += '<p style="margin-top:15px; font-size:12px; color:#666;">Bilderna presenteras som miniatyrer. Ni behöver inte generera thumbnails</p>';

    html += '</div>';

    return html;
}

module.exports = { getVirusImagesHTML };
