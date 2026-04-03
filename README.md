# DJINN - Backend Development Project
# Test for branch 

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

## Project Description

This is a university group project focused on **backend development** using **Node.js**.  

The application is a full-featured web system with user authentication, employee management, research entries handling, and dynamic HTML rendering. 

This project demonstrates practical skills in:
- Building a Node.js/Express server
- User authentication & authorization (with middleware)
- Dynamic HTML template composition
- File system operations and data management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (inferred from typical structure + `routes/`, `views/`, `public/`)
- **Templating**: Custom HTML fragments + `readHTML.js`
- **Authentication**: Custom middleware (`authMiddleware.js`)
- **Database/Data**: JSON, MDB, XML support (see `/data/`)
- **Other**: Static file serving, admin tools, backup scripts

## 📁 Project Structure

```bash
.
├── config/
│   └── globals.json                 # Global configuration
├── data/                            # Application data
│   ├── */attachments/               # Attachment folders (per entry)
│   ├── json/
│   ├── mdb/
│   └── xml/
├── masterframe/                     # Reusable HTML fragments
│   ├── head.html
│   ├── header.html
│   ├── footer.html
│   ├── menu.html
│   ├── loggedinmenu*.html
│   ├── newemployee*.html
│   ├── editemployee.html
│   ├── researchentries*.html
│   └── ...
├── public/                          # Static assets
│   ├── css/
│   ├── images/
│   ├── photos/
│   ├── scripts/
│   ├── virusphoto/
│   └── ... (theme folders: t-veronica, tyrant, uroboros, etc.)
├── routes/                          # Route handlers
├── views/                           # View templates
├── authMiddleware.js                # Authentication middleware
├── backup.js                        # Database/backup utility
├── index.js                         # Main entry point
├── readHTML.js                      # Custom HTML template loader
├── setadmin.js                      # Admin user setup script
├── tmp-check.js / tmp-debug.js      # Development utilities
├── startup.bat                      # Windows startup script
├── web.config                       # IIS deployment config (optional)
├── package.json
├── .gitignore
└── LICENSE
