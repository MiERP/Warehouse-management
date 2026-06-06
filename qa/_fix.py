import codecs
path = r'D:\PROJECT\Agentic-AI\Warehouse-management\src\renderer\js\core\asset_crud.js'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

idx = content.find('function createCatalogCombobox')
if idx >= 0:
    print(repr(content[idx:idx+120]))
    
# Also check catalog load line
idx2 = content.find('window.api.units.getAll()')
if idx2 >= 0:
    print('\nLoad units context:')
    print(repr(content[idx2-50:idx2+120])[:200])