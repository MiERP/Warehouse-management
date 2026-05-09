// Mock API for Browser Subagent Testing
if (!window.api) {
  console.log('Running in browser mode. Mocking window.api...');
  
  // In-memory data store
  const store = {
    warehouses: [
      { id: 1, name: 'Kho Mẫu 1', warehouse_category: 'chien_thuat', address: 'Hải Phòng', year_built: 2010 }
    ],
    cameras: [],
    fireSystems: [],
    constructions: []
  };

  window.api = {
    dialog: {
      openFile: async () => ({ canceled: false, filePaths: ['mock_file.xlsx'] }),
      saveFile: async (name) => ({ canceled: false, filePath: 'export_' + name })
    },
    excel: {
      read: async (path) => [
        { name: 'Kho Nhập Từ Excel', warehouse_category: 'chien_dich', address: 'Quảng Ninh', warehouse_area: 500 }
      ],
      write: async (path, data, name) => true
    },
    warehouses: {
      getAll: async () => store.warehouses,
      create: async (data) => {
        const id = store.warehouses.length + 1;
        store.warehouses.push({ id, ...data });
        return { id };
      },
      stats: async () => ({
        totalCount: store.warehouses.length,
        totalArea: store.warehouses.reduce((sum, w) => sum + (Number(w.warehouse_area) || 0), 0)
      })
    },
    cameras: {
      getAll: async () => store.cameras,
      create: async (data) => store.cameras.push(data)
    },
    fireSystems: {
      getAll: async () => store.fireSystems,
      create: async (data) => store.fireSystems.push(data)
    },
    constructions: {
      getAll: async () => store.constructions,
      create: async (data) => store.constructions.push(data)
    },
    search: {
      global: async (q) => []
    }
  };
}
