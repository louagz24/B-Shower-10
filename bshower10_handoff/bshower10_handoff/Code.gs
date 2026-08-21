/**
 * B-SHOWER 10 — ASM · Backend Apps Script
 * ---------------------------------------------------------------
 * Reprend l'architecture validée sur TalentsPool (Sheet + Drive,
 * doGet = lecture, doPost = écriture/édition/suppression).
 *
 * MISE EN PLACE (à faire une seule fois) :
 * 1. Créer un Google Sheet vide → Extensions > Apps Script
 * 2. Coller ce fichier dans Code.gs
 * 3. Modifier FOLDER_ID plus bas (ou laisser vide pour auto-création)
 * 4. Déployer > Nouveau déploiement > Application Web
 *    - Exécuter en tant que : Moi
 *    - Accès : Tous
 * 5. Copier l'URL /exec obtenue dans SCRIPT_URL des deux fichiers HTML
 *
 * IMPORTANT (leçon TalentsPool) : SpreadsheetApp.flush() est appelé
 * après chaque écriture avant toute lecture qui pourrait en dépendre.
 */

var SHEET_NAME   = 'Inscriptions';
var FOLDER_NAME  = 'B-Shower 10 — CV candidats';
var HEADERS = [
  'id','horodatage','nom','telephone','whatsapp','email',
  'statut','etablissement','niveau_etudes','filiere',
  'domaines_interet','disponibilite','duree_stage','langues',
  'competences','cv_mode','cv_url','cv_filename','cv_json',
  'commentaires','rgpd'
];

function _sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function _folder() {
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(FOLDER_NAME);
}

function doGet(e) {
  var sh   = _sheet();
  var data = sh.getDataRange().getValues();
  var out  = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var c = 0; c < HEADERS.length; c++) row[HEADERS[c]] = data[i][c];
    row._row = i + 1; // ligne réelle dans la feuille, utile pour update/delete
    if (row.id) out.push(row);
  }
  return ContentService.createTextOutput(JSON.stringify({ok:true, data:out}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error:'JSON invalide'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var action = body.action || 'create';
  var result;
  if (action === 'update')      result = _update(body);
  else if (action === 'delete') result = _delete(body);
  else                          result = _create(body);

  SpreadsheetApp.flush(); // toujours avant de rendre la main
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function _create(body) {
  var sh  = _sheet();
  var id  = 'BS10-' + new Date().getTime();
  var cvUrl = '', cvFilename = '';

  // Fichier CV uploadé (base64) → sauvegarde Drive
  if (body.cv_mode === 'upload' && body.cv_file && body.cv_file.data) {
    try {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(body.cv_file.data),
        body.cv_file.mimeType || 'application/pdf',
        (body.nom || id) + ' — ' + (body.cv_file.name || 'CV.pdf')
      );
      var file = _folder().createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      cvUrl = file.getUrl();
      cvFilename = file.getName();
    } catch (err) {
      cvUrl = ''; cvFilename = 'Erreur upload : ' + err.message;
    }
  }

  var row = [
    id, new Date(), body.nom || '', body.telephone || '', body.whatsapp || '',
    body.email || '', body.statut || '', body.etablissement || '',
    body.niveau_etudes || '', body.filiere || '',
    (body.domaines_interet || []).join(', '), body.disponibilite || '',
    body.duree_stage || '', body.langues || '', body.competences || '',
    body.cv_mode || '', cvUrl, cvFilename,
    body.cv_mode === 'genere' ? JSON.stringify(body.cv_json || {}) : '',
    body.commentaires || '', body.rgpd ? 'oui' : 'non'
  ];
  sh.appendRow(row);
  return {ok:true, id:id};
}

function _update(body) {
  var sh = _sheet();
  var id = body.id;
  if (!id) return {ok:false, error:'id manquant'};
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var rowNum = i + 1;
      for (var c = 0; c < HEADERS.length; c++) {
        var key = HEADERS[c];
        if (key === 'id' || key === 'horodatage') continue;
        if (body.fields && Object.prototype.hasOwnProperty.call(body.fields, key)) {
          var val = body.fields[key];
          sh.getRange(rowNum, c + 1).setValue(Array.isArray(val) ? val.join(', ') : val);
        }
      }
      return {ok:true};
    }
  }
  return {ok:false, error:'id introuvable'};
}

function _delete(body) {
  var sh = _sheet();
  var id = body.id;
  if (!id) return {ok:false, error:'id manquant'};
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sh.deleteRow(i + 1);
      return {ok:true};
    }
  }
  return {ok:false, error:'id introuvable'};
}
