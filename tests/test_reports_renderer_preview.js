const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeElement(id = '') {
  return {
    id,
    value: '',
    textContent: '',
    className: '',
    dataset: {},
    style: {},
    children: [],
    appendChild(child) { this.children.push(child); return child; },
    append(...children) { this.children.push(...children); },
    eventListeners: {},
    addEventListener(type, handler) { this.eventListeners[type] = handler; },
    replaceChildren(...children) { this.children = children; },
    querySelector() { return null; },
    getBoundingClientRect() { return { left: 0, width: 100 }; }
  };
}

const elements = new Map();
function element(id, value = '') {
  const el = makeElement(id);
  el.value = value;
  elements.set(id, el);
  return el;
}

element('report-name', 'Mau dang sua');
element('report-category', '');
element('report-source', 'warehouses');
element('report-page-size', 'A4');
element('report-orientation', 'portrait');
element('report-margin', '15');
element('report-font-family', 'Times New Roman');
element('report-font-size', '12');
element('report-category-filter', '');
element('report-template-list');
element('report-selected-fields');
element('report-preview');

let updatePayload = null;
let renderedId = null;
const documentListeners = {};
const context = {
  console,
  document: {
    createElement: makeElement,
    getElementById: id => elements.get(id) || null,
    addEventListener: (type, handler) => { documentListeners[type] = handler; },
    removeEventListener: type => { delete documentListeners[type]; }
  },
  window: {
    api: {
      reports: {
        listCategories: async () => [],
        listTemplates: async () => [],
        updateTemplate: async (id, payload) => {
          updatePayload = payload;
          return { id, ...payload };
        },
        createTemplate: async payload => ({ id: 99, ...payload }),
        renderTemplate: async id => {
          renderedId = id;
          return { template: { name: 'Mau dang sua' }, columns: updatePayload.layout_json.fields, rows: [] };
        }
      }
    }
  },
  clearElement: el => { if (el) el.children = []; },
  appendTextCell: (row, text) => row.appendChild({ textContent: String(text ?? '') }),
  createButton: () => makeElement('button'),
  showToast: () => {},
  confirmAction: async () => true
};

vm.createContext(context);
const source = fs.readFileSync(path.join(__dirname, '../src/renderer/js/modules/reports.js'), 'utf8');
vm.runInContext(`${source}; globalThis.reportsModule = reportsModule;`, context);

(async () => {
  context.reportsModule.editingId = 7;
  context.reportsModule.fields = [
    { field: 'name', label: 'Ten kho' },
    { field: 'province_name', label: 'Tinh/Thanh' },
    { field: 'ward_name', label: 'Xa/Phuong' }
  ];
  context.reportsModule.selectedFields = [
    { field: 'name', label: 'Ten kho' },
    { field: 'province_name', label: 'Tinh/Thanh' }
  ];
  context.reportsModule.insertFieldIntoReportField(1, 'ward_name', 'left');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.reportsModule.selectedFields[1])).fields, ['ward_name', 'province_name']);

  context.reportsModule.selectedFields = [
    { field: 'name', label: 'Ten kho' },
    { field: 'province_name', label: 'Tinh/Thanh' }
  ];
  context.reportsModule.insertFieldIntoReportField(1, 'ward_name', 'right');
  context.reportsModule.fields.push({ field: 'address', label: 'Dia chi' });
  context.reportsModule.insertFieldIntoReportField(1, 'address', 'right');
  context.reportsModule.moveReportFieldPart(1, 2, 0);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.reportsModule.selectedFields[1])).fields, ['address', 'province_name', 'ward_name']);
  context.reportsModule.moveReportFieldPart(1, 0, 2);
  context.reportsModule.selectedFields[1] = {
    ...context.reportsModule.selectedFields[1],
    label: 'Dia ban',
    customLabel: true
  };
  context.reportsModule.renderSelectedFields();
  const combinedRow = elements.get('report-selected-fields').children[1];
  const combinedEditor = combinedRow.children[1];
  const combinedHeader = combinedEditor.children[0];
  const expression = combinedEditor.children[1];
  assert.strictEqual(combinedHeader.children[0].placeholder, 'Tên cột hiển thị');
  assert.ok(combinedHeader.style.cssText.includes('grid-template-columns:minmax(0,1fr) 64px auto'));
  assert.ok(expression.style.cssText.includes('flex-wrap:nowrap'));
  assert.ok(expression.style.cssText.includes('overflow-x:auto'));
  assert.strictEqual(expression.children[1].placeholder, 'Dấu nối');
  assert.strictEqual(expression.children[3].placeholder, 'Dấu nối');
  assert.strictEqual(expression.children[4].textContent, 'Dia chi');
  context.reportsModule.insertionHint = { columnIndex: 1, partIndex: 1, side: 'left' };
  context.reportsModule.renderSelectedFields();
  const expressionWithCaret = elements.get('report-selected-fields').children[1].children[1].children[1];
  assert.ok(expressionWithCaret.children.some(child => child.textContent === '|'));

  const mainLayout = element('reports-main-layout');
  const savedPanel = element('report-template-card');
  const builderPanel = element('report-builder-card');
  mainLayout.getBoundingClientRect = () => ({ left: 0, width: 1000 });
  mainLayout.append(savedPanel, builderPanel);
  context.reportsModule.setupReportsLayoutResize();
  const mainHandle = savedPanel.children.find(child => child.className === 'report-resize-handle');
  assert.ok(mainHandle);
  assert.strictEqual(mainHandle.title, 'Kéo để thay đổi độ rộng khối này');
  mainHandle.eventListeners.mousedown({ preventDefault() {}, clientX: 500 });
  documentListeners.mousemove({ clientX: 650 });
  assert.strictEqual(context.reportsModule.resizeState.mainLayout, 65);
  assert.ok(mainLayout.style.gridTemplateColumns.includes('65%'));
  documentListeners.mouseup({});

  const fieldGroup = makeElement('report-field-layout');
  const fieldPalettePanel = makeElement('report-field-palette-panel');
  const fieldSelectedPanel = makeElement('report-selected-fields-panel');
  fieldGroup.append(fieldPalettePanel, fieldSelectedPanel);
  fieldGroup.getBoundingClientRect = () => ({ left: 0, width: 1000 });
  context.reportsModule.setupFieldLayoutResize(fieldGroup, fieldPalettePanel);
  const fieldHandle = fieldPalettePanel.children.find(child => child.className === 'report-resize-handle');
  assert.ok(fieldHandle);
  fieldHandle.eventListeners.mousedown({ preventDefault() {}, clientX: 500 });
  documentListeners.mousemove({ clientX: 620 });
  assert.strictEqual(context.reportsModule.resizeState.fieldLayout, 62);
  assert.ok(fieldGroup.style.gridTemplateColumns.includes('62%'));
  documentListeners.mouseup({});

  context.reportsModule.selectedFields = [
    { field: 'name', label: 'Ten kho' },
    { field: 'ward_name', label: 'Xa/Phuong' }
  ];
  context.reportsModule.draggedField = 'province_name';
  context.reportsModule.insertionHint = { columnIndex: 1, partIndex: 0, side: 'left' };
  context.reportsModule.handleExpressionDrop({ preventDefault() {} }, 1);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.reportsModule.selectedFields[1])).fields, ['province_name', 'ward_name']);

  context.reportsModule.selectedFields = [
    { field: 'name', label: 'Ten kho' },
    { field: 'ward_name', label: 'Xa/Phuong' },
    { field: 'province_name', label: 'Tinh/Thanh' }
  ];
  context.reportsModule.draggedFieldPart = { columnIndex: 2, partIndex: 0 };
  context.reportsModule.insertionHint = { columnIndex: 1, partIndex: 0, side: 'right' };
  context.reportsModule.handleExpressionDrop({ preventDefault() {}, stopPropagation() {} }, 1);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.reportsModule.selectedFields.map(field => field.field))), ['name', 'ward_name_province_name']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.reportsModule.selectedFields[1])).fields, ['ward_name', 'province_name']);

  context.reportsModule.selectedFields[1] = {
    ...context.reportsModule.selectedFields[1],
    label: 'Dia ban',
    customLabel: true
  };
  context.reportsModule.fields.push({ field: 'address', label: 'Dia chi' });
  context.reportsModule.insertFieldIntoReportField(1, 'address', 'right');

  context.reportsModule.draggedFieldPart = { columnIndex: 1, partIndex: 1 };
  context.reportsModule.handleSelectedDrop({ preventDefault() {} }, 2);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.reportsModule.selectedFields.map(field => field.field))), ['name', 'ward_name_address', 'province_name']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.reportsModule.selectedFields[1])).fields, ['ward_name', 'address']);
  assert.strictEqual(context.reportsModule.selectedFields[2].label, 'Tinh/Thanh');

  context.reportsModule.draggedFieldPart = { columnIndex: 2, partIndex: 0 };
  context.reportsModule.insertionHint = { columnIndex: 1, partIndex: 0, side: 'right' };
  context.reportsModule.handleExpressionDrop({ preventDefault() {}, stopPropagation() {} }, 1);
  context.reportsModule.selectedFields[1] = {
    ...context.reportsModule.selectedFields[1],
    label: 'Dia ban',
    customLabel: true
  };

  await context.reportsModule.previewTemplate();

  assert.strictEqual(renderedId, 7);
  const payloadFields = JSON.parse(JSON.stringify(updatePayload.layout_json.fields));
  assert.deepStrictEqual(payloadFields.map(field => field.field), ['name', 'ward_name_province_name_address']);
  assert.deepStrictEqual(payloadFields[1], {
    type: 'combined',
    field: 'ward_name_province_name_address',
    label: 'Dia ban',
    fields: ['ward_name', 'province_name', 'address'],
    separator: ', ',
    customLabel: true,
    width: null
  });
  console.log('Reports renderer preview OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
