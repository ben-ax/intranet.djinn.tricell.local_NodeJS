const express = require('express');
const router = express.Router();

const path = require('path');
const pug = require('pug');
const fs = require('fs');

// router.use(express.static('./public'));

const readHTML = require('../readHTML.js');
const ADODB = require('node-adodb');

// Pre-compile Pug once (good)
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

// Load masterframe parts once (outside routes)
const htmlHead = readHTML('./masterframe/head.html');
const htmlHeader = readHTML('./masterframe/header.html');
const htmlMenu = readHTML('./masterframe/menu.html');
const htmlInfoStart = readHTML('./masterframe/infoStart.html');
const htmlInfoStop = readHTML('./masterframe/infoStop.html');
const htmlBottom = readHTML('./masterframe/bottom.html');

const canEdit = (req) => {
  if (!req.session.loggedin) return false;
  const level = req.session.securityAccessLevel;
  return ['A', 'B'].includes(level);
};

// Helper to write common header/menu
function writeCommonHeader(req, res) {
  res.write(htmlHead);
  if (req.session.loggedin) {
    const htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
    const htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
    res.write(htmlLoggedinMenuCSS);
    res.write(htmlLoggedinMenuJS);
    res.write(pug_loggedinmenu({
      employeecode: req.cookies.employeecode,
      name: req.cookies.name,
      logintimes: req.cookies.logintimes,
      lastlogin: req.cookies.lastlogin,
    }));
  }
  res.write(htmlHeader);
  res.write(htmlMenu);
  res.write(htmlInfoStart);
}

// GET / - List activity log
router.get('/', async (req, res) => {
  if (!canEdit(req)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    writeCommonHeader(req, res);
    res.write('<h2>You are not authorised to access this.</h2>');
    res.write(htmlInfoStop + htmlBottom);
    return res.end();
  }

  const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/activity_log.mdb;');

  try {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    writeCommonHeader(req, res);

    let sortAmount = parseInt(req.cookies.sortAmount, 10) || 20;
    let sortType = req.cookies.sortType || 'ID';

    // Whitelist sortType to prevent injection
    const allowedSortTypes = ['ID', 'Activity', 'EmployeeCode', 'Date', 'Time', 'Name'];
    if (!allowedSortTypes.includes(sortType)) sortType = 'ID';

    // Limit sortAmount reasonably
    if (sortAmount < 1 || sortAmount > 500) sortAmount = 20;

    let result;
    const sql = sortType === 'ID'
      ? `SELECT TOP ${sortAmount} ID, Activity, EmployeeCode, Name, Date, Time FROM Log ORDER BY ${sortType} DESC`
      : `SELECT TOP ${sortAmount} ID, Activity, EmployeeCode, Name, Date, Time FROM Log ORDER BY ${sortType} DESC, ID DESC`;

    result = await connection.query(sql);

    // Build HTML (still string-based — consider full Pug template)
    let htmlOutput = `
      <link rel="stylesheet" href="css/personnel_registry.css" />
      <script src="./scripts/activitylogsorting.js"></script>
      <table border="0">
        <tr>
          <td width="100px" align="left"><h2>Activity Log</h2></td>
          <td width="80" align="center"><h2>Sort By:</h2></td>
          <td width="52" align="left" onclick="sorting(20, '${sortType}')"><a style="text-decoration: none; color: black; cursor: pointer;"><h2><b>20</b></h2></a></td>
          <!-- ... repeat for 50, 100, 150 ... -->
          <td width="88" align="center"><h2>Sort By:</h2></td>
          <td onclick="sorting(${sortAmount}, 'Activity')"><h2><b>Activity</b></h2></td>
          <!-- ... other sort options ... -->
        </tr>
      </table>
      <div id="table-resp">
        <div id="table-header">
          <div class="table-header-cell-light">Activity</div>
          <div class="table-header-cell-dark">User</div>
          <div class="table-header-cell-light">Name</div>
          <div class="table-header-cell-light">Date</div>
          <div class="table-header-cell-light">Time</div>
          ${canEdit(req) ? '<div class="table-header-cell-light">Delete</div>' : ''}
        </div>
        <div id="table-body">
    `;

    for (const row of result) {
      htmlOutput += `
        <div class="resp-table-row">
          <div class="table-body-cell">${row.Activity || ''}</div>
          <div class="table-body-cell-bigger">${row.EmployeeCode || ''}</div>
          <div class="table-body-cell">${row.Name || ''}</div>
          <div class="table-body-cell">${row.Date || ''}</div>
          <div class="table-body-cell">${row.Time || ''}</div>
          ${canEdit(req) ? `<div class="table-body-cell"><a href="/api/activitylog/${row.ID}" style="color:red;text-decoration:none;">D</a></div>` : ''}
        </div>
      `;
    }

    htmlOutput += '</div></div>';

    res.write(htmlOutput);
    res.write(htmlInfoStop + htmlBottom);
    res.end();

  } catch (error) {
    console.error('Activity log error:', error);
    res.write('<p>Error loading activity log data.</p>');
    res.write(htmlInfoStop + htmlBottom);
    res.end();
  }
});

// DELETE route (GET for now — better to use POST/DELETE method + CSRF in production)
router.get('/:id', async (req, res) => {
  const deleteID = parseInt(req.params.id, 10);
  if (!deleteID || isNaN(deleteID)) {
    return res.status(400).send('Invalid ID');
  }

  const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/activity_log.mdb;');

  try {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    writeCommonHeader(req, res);

    if (!canEdit(req)) {
      res.write('<p>You are not authorised to do this.</p>');
    } else {
      // First check if exists (optional)
      const exists = await connection.query(`SELECT ID FROM Log WHERE ID=${deleteID}`);
      
      if (exists.length > 0) {
        await connection.execute(`DELETE FROM Log WHERE ID=${deleteID}`);
        res.write('Activity log deleted.<br>');
        res.write('<a href="/api/activitylog">Back to Activity Log</a>');
      } else {
        res.write('Object not found.');
      }
    }

    res.write(htmlInfoStop + htmlBottom);
    res.end();

  } catch (error) {
    console.error('Delete error:', error);
    res.write('Error deleting activity log.');
    res.write(htmlInfoStop + htmlBottom);
    res.end();
  }
});

module.exports = router;
