// ===== Dataset extracted from EV_Fleet_Complete_Dataset_v2.xlsx =====

const MANAGERS = [
  { id: "MGR001", key: "MGRKEY001754", name: "Manager_01", email: "manager01@fleetev.in", phone: "+917107420369", city: "Delhi",     drivers: 20 },
  { id: "MGR002", key: "MGRKEY002859", name: "Manager_02", email: "manager02@fleetev.in", phone: "+918051802512", city: "Hyderabad", drivers: 20 },
  { id: "MGR003", key: "MGRKEY003328", name: "Manager_03", email: "manager03@fleetev.in", phone: "+917440213415", city: "Bangalore", drivers: 20 },
  { id: "MGR004", key: "MGRKEY004792", name: "Manager_04", email: "manager04@fleetev.in", phone: "+919342331444", city: "Nagpur",    drivers: 20 },
  { id: "MGR005", key: "MGRKEY005189", name: "Manager_05", email: "manager05@fleetev.in", phone: "+918812140441", city: "Surat",     drivers: 20 },
  { id: "MGR006", key: "MGRKEY006132", name: "Manager_06", email: "manager06@fleetev.in", phone: "+917402418010", city: "Mumbai",    drivers: 20 },
  { id: "MGR007", key: "MGRKEY007323", name: "Manager_07", email: "manager07@fleetev.in", phone: "+919170484433", city: "Chennai",   drivers: 20 },
  { id: "MGR008", key: "MGRKEY008716", name: "Manager_08", email: "manager08@fleetev.in", phone: "+919410529190", city: "Mumbai",    drivers: 20 },
  { id: "MGR009", key: "MGRKEY009303", name: "Manager_09", email: "manager09@fleetev.in", phone: "+919791232393", city: "Nagpur",    drivers: 20 },
  { id: "MGR010", key: "MGRKEY010818", name: "Manager_10", email: "manager10@fleetev.in", phone: "+918801823908", city: "Jaipur",    drivers: 20 },
  { id: "MGR011", key: "MGRKEY011325", name: "Manager_11", email: "manager11@fleetev.in", phone: "+919530876844", city: "Ahmedabad", drivers: 20 },
  { id: "MGR012", key: "MGRKEY012384", name: "Manager_12", email: "manager12@fleetev.in", phone: "+917027911967", city: "Bhopal",    drivers: 20 },
];

// Registered drivers storage (pre-seeded + new registrations)
const SEED_DRIVERS = [
  { driverId: "DR0001", userId: "USR0001", name: "Driver_001", email: "driver001@fleetev.in", phone: "+917667779376", managerId: "MGR001", vehicleId: "VH00001", status: "Active" },
  { driverId: "DR0002", userId: "USR0002", name: "Driver_002", email: "driver002@fleetev.in", phone: "+917186618211", managerId: "MGR001", vehicleId: "VH00002", status: "Inactive" },
];

function getDrivers() {
  const stored = localStorage.getItem("ev_drivers");
  return stored ? JSON.parse(stored) : [...SEED_DRIVERS];
}

function saveDrivers(drivers) {
  localStorage.setItem("ev_drivers", JSON.stringify(drivers));
}

function getManagers() { return MANAGERS; }

function findManager(id) {
  return MANAGERS.find(m => m.id === id);
}

function findDriver(driverId, password) {
  const drivers = getDrivers();
  const d = drivers.find(dr => dr.driverId === driverId);
  if (!d) return null;
  const passwords = getDriverPasswords();
  if (passwords[driverId] && passwords[driverId] === password) return d;
  return null;
}

function getDriverPasswords() {
  const stored = localStorage.getItem("ev_driver_passwords");
  if (!stored) {
    const defaults = {};
    SEED_DRIVERS.forEach(d => { defaults[d.driverId] = "Driver@123"; });
    localStorage.setItem("ev_driver_passwords", JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
}

function saveDriverPassword(driverId, password) {
  const pw = getDriverPasswords();
  pw[driverId] = password;
  localStorage.setItem("ev_driver_passwords", JSON.stringify(pw));
}

// Admin credentials (derived from Manager Master)
function findAdmin(adminId, password) {
  const mgr = MANAGERS.find(m => m.id === adminId);
  if (!mgr) return null;
  const passwords = getAdminPasswords();
  if (passwords[adminId] && passwords[adminId] === password) return mgr;
  return null;
}

function getAdminPasswords() {
  const stored = localStorage.getItem("ev_admin_passwords");
  // seed default passwords for demo
  if (!stored) {
    const defaults = {};
    MANAGERS.forEach(m => { defaults[m.id] = "Admin@123"; });
    localStorage.setItem("ev_admin_passwords", JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
}

function setSession(role, id, name) {
  sessionStorage.setItem("ev_role", role);
  sessionStorage.setItem("ev_id", id);
  sessionStorage.setItem("ev_name", name);
}

function getSession() {
  return {
    role: sessionStorage.getItem("ev_role"),
    id:   sessionStorage.getItem("ev_id"),
    name: sessionStorage.getItem("ev_name"),
  };
}
