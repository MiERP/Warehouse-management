const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');
const { rememberDialogResult } = require('../src/main/file_guard');
const { runMigrations } = require('../src/main/database/migrations');
const { runHardeningMigrations } = require('../src/main/database/hardening_migrations');

(async () => {
  await app.whenReady();
  runMigrations();
  runHardeningMigrations();
  const documents = require('../src/main/documents');
  const tempFile = path.join(os.tmpdir(), `wm-doc-test-${Date.now()}.txt`);
  fs.writeFileSync(tempFile, 'document test');
  rememberDialogResult({ canceled: false, filePaths: [tempFile] });
  let rejected = false;
  try { documents.createDocumentFromFile(tempFile, { title: 'Bad txt' }); } catch (_) { rejected = true; }
  assert.ok(rejected, 'txt extension must be rejected');

  const pdfFile = path.join(os.tmpdir(), `wm-doc-test-${Date.now()}.pdf`);
  fs.writeFileSync(pdfFile, '%PDF test');
  rememberDialogResult({ canceled: false, filePaths: [pdfFile] });
  const doc = documents.createDocumentFromFile(pdfFile, { title: 'Hồ sơ test', document_type: 'Hồ sơ', tags: 'test,hoso' });
  assert.ok(doc.id, 'document id exists');
  assert.ok(fs.existsSync(doc.stored_path), 'stored file exists');
  assert.strictEqual(doc.extension, 'pdf');

  const link = documents.linkDocument(doc.id, 'constructions', 1, 'attachment', 'test link');
  assert.ok(link.id, 'link id exists');
  const entityDocs = documents.listDocumentsForEntity('constructions', 1);
  assert.ok(entityDocs.some(item => item.id === doc.id), 'entity documents includes doc');
  documents.unlinkDocument(link.id);
  assert.ok(!documents.listDocumentsForEntity('constructions', 1).some(item => item.id === doc.id), 'unlink removes relation');
  documents.deleteDocument(doc.id);
  assert.ok(!documents.getDocument(doc.id), 'soft deleted document hidden');
  console.log('Documents service OK');
  app.quit();
})().catch(error => { console.error(error); app.quit(); process.exit(1); });
