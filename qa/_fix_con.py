import codecs
path = r'D:\PROJECT\Agentic-AI\Warehouse-management\src\renderer\js\modules\constructions.js'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

# Check save method to verify IDs match
idx = content.find('async save()')
if idx >= 0:
    print(content[idx:idx+600])