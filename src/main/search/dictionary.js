const MODULES = {
  warehouse: 'warehouse',
  warehouses: 'warehouse',
  camera: 'camera',
  fire: 'fire',
  construction: 'construction'
};

const MODULE_KEYWORDS = {
  warehouse: ['kho', 'nha kho', 'xang dau', 'luong thuc', 'vat tu', 'chien dich', 'chien thuat'],
  camera: ['camera', 'cam', 'giam sat', 'an ninh', 'man hinh'],
  fire: ['cuu hoa', 'pccc', 'phong chay', 'chua chay', 'nha bom', 'so hong', 'he thong cuu hoa'],
  construction: ['cong trinh', 'du an', 'xay moi', 'xay dung', 'nang cap', 'quyet toan', 'thi cong', 'hop dong', 'nha thau']
};

const EXPANSIONS = {
  cam: ['camera'],
  pccc: ['cuu hoa', 'phong chay', 'chua chay'],
  hong: ['hong', 'loi', 'khong hoat dong', 'mat tin hieu', 'can sua chua'],
  loi: ['hong', 'loi', 'khong hoat dong'],
  sc: ['sua chua', 'cai tao', 'nang cap'],
  xd: ['xay dung', 'xay moi'],
  ct: ['cong trinh', 'du an'],
  hckt: ['hc kt', 'hau can ky thuat'],
  qlda: ['ban qlda', 'ban quan ly du an'],
  p: ['phong'],
  quyet_toan: ['quyet toan', 'nghiem thu', 'thanh toan', 'settlement'],
  cuu_hoa: ['cuu hoa', 'pccc', 'phong chay', 'chua chay']
};

const STATUS_KEYWORDS = {
  broken: ['hong', 'loi', 'khong hoat dong', 'mat tin hieu'],
  repair: ['can sua chua', 'sua chua', 'cai tao', 'bao tri'],
  missing: ['chua co', 'khong co', 'thieu', 'trong', 'chua nhap'],
  unsettled: ['chua quyet toan', 'chua nghiem thu', 'quyet toan'],
  inProgress: ['dang thi cong', 'thi cong', 'dang thuc hien'],
  completed: ['hoan thanh', 'da xong']
};

module.exports = { MODULES, MODULE_KEYWORDS, EXPANSIONS, STATUS_KEYWORDS };

