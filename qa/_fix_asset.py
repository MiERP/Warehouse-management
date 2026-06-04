import codecs
path = r'D:\PROJECT\Agentic-AI\Warehouse-management\src\renderer\js\core\asset_crud.js'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

old = (
    'for (const field of config.technicalFields) {\r\n'
    '        grid.appendChild(createFormGroup({\r\n'
    '          label: field.label,\r\n'
    '          id: `${config.prefix}-${field.id}`,\r\n'
    '          type: field.type || \'number\',\r\n'
    '          value: current[field.name] || \'\',\r\n'
    '          placeholder: field.placeholder || \'\',\r\n'
    '          full: field.full || false\r\n'
    '        }));\r\n'
    '      }'
)

new = (
    'for (const field of config.technicalFields) {\r\n'
    '        if (field.name === \'investor\') {\r\n'
    '          grid.appendChild(createCatalogCombobox(investors, \'investors\', field.label, `${config.prefix}-${field.id}-input`, `${config.prefix}-${field.id}`, current[field.name] || \'\', { valueField: \'name\' }));\r\n'
    '        } else if (field.name === \'status\') {\r\n'
    '          grid.appendChild(createCatalogCombobox(statuses, \'statuses\', field.label, `${config.prefix}-${field.id}-input`, `${config.prefix}-${field.id}`, current[field.name] || \'\', { valueField: \'name\' }));\r\n'
    '        } else {\r\n'
    '          grid.appendChild(createFormGroup({\r\n'
    '            label: field.label,\r\n'
    '            id: `${config.prefix}-${field.id}`,\r\n'
    '            type: field.type || \'number\',\r\n'
    '            value: current[field.name] || \'\',\r\n'
    '            placeholder: field.placeholder || \'\',\r\n'
    '            full: field.full || false\r\n'
    '          }));\r\n'
    '        }\r\n'
    '      }'
)

if old in content:
    content = content.replace(old, new)
    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(content)
    print('OK: techFields replaced')
else:
    print('FAIL: old pattern not found in content')
    # Try debugging
    idx = content.find('for (const field of config.technicalFields)')
    if idx >= 0:
        snippet = content[idx:idx+300]
        print('Actual content:')
        print(repr(snippet))