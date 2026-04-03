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
      securityaccesslevel: req.session.securityAccessLevel || 'C',
      webaddress: 'http://djinn.tricell.local',
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

    // HTML output
    let htmlOutput = `
      <link rel="stylesheet" href="css/personnel_registry.css" />
      <script src="./scripts/activitylogsorting.js"></script>
      <style>
        .filter-container { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .show-max-btn { display: inline-block; padding: 4px 10px; margin-right: 8px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: white; }
        .show-max-btn:hover { background: #f0f0f0; }
        .show-max-btn.active { background: #0078d4; color: white; border-color: #0078d4; }
        .order-by-select { padding: 6px 12px; border-radius: 4px; border: 1px solid #ccc; }
      </style>
      <h2>Activity Log</h2>
      <div class="filter-container">
        <div>Show max: 
          <button class="show-max-btn ${sortAmount == 20 ? 'active' : ''}" onclick="sorting(20, '${sortType}')">20</button>
          <button class="show-max-btn ${sortAmount == 50 ? 'active' : ''}" onclick="sorting(50, '${sortType}')">50</button>
          <button class="show-max-btn ${sortAmount == 100 ? 'active' : ''}" onclick="sorting(100, '${sortType}')">100</button>
          <button class="show-max-btn ${sortAmount == 150 ? 'active' : ''}" onclick="sorting(150, '${sortType}')">150</button>
        </div>
        <div>Order by: 
          <select class="order-by-select" onchange="sorting(${sortAmount}, this.value)">
            <option value="Activity" ${sortType === 'Activity' ? 'selected' : ''}>Activity</option>
            <option value="EmployeeCode" ${sortType === 'EmployeeCode' ? 'selected' : ''}>User</option>
            <option value="Date" ${sortType === 'Date' ? 'selected' : ''}>Date</option>
          </select>
        </div>
      </div>
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
