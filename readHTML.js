var fs = require('fs');

function readHTML(htmlfile)
{
 try 
  {
     var htmltext = fs.readFileSync(htmlfile) 
  } 
  catch (err) 
  {
    console.error(err);
  }
  return htmltext;
}
module.exports = readHTML;

