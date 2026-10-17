// Seed data for the in-browser mock server. Mirrors database/seed.sql so the UI looks the same
// whether it runs against the mock or the real Oracle-backed API.

const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const day = (daysAgo) => d(daysAgo).slice(0, 10);

export const seedData = () => {
  const categories = [
    { id: 1, name: 'Mobile Phones', hazardLevel: 'Medium', description: 'Smartphones, feature phones and accessories' },
    { id: 2, name: 'Laptops & Computers', hazardLevel: 'Medium', description: 'Laptops, desktops, monitors, keyboards' },
    { id: 3, name: 'Batteries', hazardLevel: 'High', description: 'Li-ion, lead-acid and alkaline batteries' },
    { id: 4, name: 'Large Appliances', hazardLevel: 'Medium', description: 'Refrigerators, washing machines, ACs' },
    { id: 5, name: 'Small Appliances', hazardLevel: 'Low', description: 'Mixers, irons, toasters, hair dryers' },
    { id: 6, name: 'Televisions & Displays', hazardLevel: 'High', description: 'CRT, LCD and LED televisions' },
    { id: 7, name: 'Printers & Peripherals', hazardLevel: 'Low', description: 'Printers, scanners, routers, cables' },
    { id: 8, name: 'Lighting Equipment', hazardLevel: 'Medium', description: 'CFL, LED tubes and fixtures' },
  ];

  const users = [
    { id: 1, fullName: 'Admin User', email: 'admin@ecocycle.in', password: 'admin123', phone: '9800000001', role: 'ADMIN', address: 'EcoCycle HQ, Panaji, Goa', createdAt: d(200) },
    { id: 2, fullName: 'Rahul Naik', email: 'rahul@ecocycle.in', password: 'collect123', phone: '9800000002', role: 'COLLECTOR', address: 'Margao, Goa', createdAt: d(180) },
    { id: 3, fullName: 'Meera Kamat', email: 'meera@ecocycle.in', password: 'collect123', phone: '9800000003', role: 'COLLECTOR', address: 'Mapusa, Goa', createdAt: d(170) },
    { id: 4, fullName: 'Priya Desai', email: 'priya@example.com', password: 'user123', phone: '9800000004', role: 'USER', address: '12, Rua de Ourém, Panaji, Goa', createdAt: d(150) },
    { id: 5, fullName: 'Arjun Shetty', email: 'arjun@example.com', password: 'user123', phone: '9800000005', role: 'USER', address: 'Vasco da Gama, Goa', createdAt: d(120) },
    { id: 6, fullName: 'Sneha Fernandes', email: 'sneha@example.com', password: 'user123', phone: '9800000006', role: 'USER', address: 'Porvorim, Goa', createdAt: d(90) },
  ];

  const collectors = [
    { id: 1, userId: 2, fullName: 'Rahul Naik', vehicleNo: 'GA-07-T-4421', area: 'South Goa', available: true },
    { id: 2, userId: 3, fullName: 'Meera Kamat', vehicleNo: 'GA-03-K-9087', area: 'North Goa', available: true },
  ];

  const facilities = [
    { id: 1, name: 'GreenLoop Recyclers', location: 'Verna Industrial Estate', capacityKg: 5000, certification: 'CPCB Authorised' },
    { id: 2, name: 'Eco Reclaim Pvt Ltd', location: 'Pilerne, Bardez', capacityKg: 3200, certification: 'ISO 14001' },
    { id: 3, name: 'Urban Mine Works', location: 'Tivim Industrial Area', capacityKg: 2400, certification: 'CPCB Authorised' },
  ];

  // [userId, categoryId, itemName, qty, condition, status, collectorId, ageInDays]
  const rows = [
    [4, 1, 'Samsung Galaxy S8', 2, 'Dead', 'Recycled', 1, 95],
    [5, 2, 'Dell Inspiron 15', 1, 'Damaged', 'Recycled', 1, 88],
    [6, 3, 'UPS Lead-acid Batteries', 4, 'Dead', 'Disposed', 2, 80],
    [4, 6, 'Sony CRT Television', 1, 'Working', 'Recycled', 2, 72],
    [5, 5, 'Philips Mixer Grinder', 1, 'Damaged', 'Recycled', 1, 60],
    [6, 2, 'HP LaserJet Printer', 1, 'Dead', 'Recycled', 2, 52],
    [4, 4, 'LG Refrigerator 190L', 1, 'Damaged', 'Processing', 1, 33],
    [5, 7, 'TP-Link Routers (box)', 6, 'Working', 'Processing', 2, 28],
    [6, 1, 'iPhone 6s', 1, 'Damaged', 'Collected', 2, 19],
    [4, 8, 'CFL Tube Lights', 12, 'Dead', 'Collected', 1, 14],
    [5, 2, 'Lenovo ThinkPad T440', 2, 'Working', 'Assigned', 1, 8],
    [6, 6, 'Samsung LED Monitor 22"', 1, 'Damaged', 'Assigned', 2, 5],
    [4, 3, 'Laptop Batteries', 5, 'Dead', 'Pending', null, 2],
    [5, 4, 'Whirlpool Washing Machine', 1, 'Damaged', 'Pending', null, 1],
  ];

  const requests = rows.map((r, i) => {
    const [userId, categoryId, itemName, quantity, condition, status, collectorId, age] = r;
    const u = users.find((x) => x.id === userId);
    const history = [{ status: 'Pending', at: d(age) }];
    const flow = ['Assigned', 'Collected', 'Processing', 'Recycled'];
    const target = status === 'Disposed' ? 'Recycled' : status;
    const idx = flow.indexOf(target);
    for (let k = 0; k <= idx; k++) {
      history.push({ status: k === idx && status === 'Disposed' ? 'Disposed' : flow[k], at: d(Math.max(age - (k + 1) * 3, 0)) });
    }
    return {
      id: i + 1,
      userId,
      userName: u.fullName,
      categoryId,
      itemName,
      quantity,
      condition,
      pickupAddress: u.address,
      preferredDate: day(age - 2),
      status,
      collectorId,
      scheduledDate: collectorId ? day(age - 4) : null,
      collectedOn: ['Collected', 'Processing', 'Recycled', 'Disposed'].includes(status) ? day(Math.max(age - 6, 0)) : null,
      remarks: '',
      createdAt: d(age),
      history,
    };
  });

  // processing: [requestId, facilityId, weightKg, processStatus, finalStatus]
  const proc = [
    [1, 1, 0.4, 'Completed', 'Recycled'],
    [2, 1, 2.3, 'Completed', 'Recycled'],
    [3, 2, 62, 'Completed', 'Disposed'],
    [4, 3, 18, 'Completed', 'Recycled'],
    [5, 2, 1.8, 'Completed', 'Recycled'],
    [6, 3, 9.5, 'Completed', 'Recycled'],
    [7, 1, 48, 'In Progress', null],
    [8, 2, 2.1, 'In Progress', null],
  ];
  const processing = proc.map((p, i) => ({
    id: i + 1,
    requestId: p[0],
    facilityId: p[1],
    weightKg: p[2],
    processStatus: p[3],
    finalStatus: p[4],
    processedOn: p[4] ? day(Math.max(requests[p[0] - 1].createdAt ? 20 - i * 2 : 0, 1)) : null,
  }));

  return { categories, users, collectors, facilities, requests, processing, seq: { user: 7, category: 9, request: 15, collector: 3, facility: 4, processing: 9 } };
};
