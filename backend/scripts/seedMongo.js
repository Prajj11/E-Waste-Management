import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initDb, closeDb } from '../src/config/db.js';
import { User, Category, Facility, Request, ProcessingRecord } from '../src/models/index.js';

async function seed() {
  console.log('Connecting to MongoDB for seeding...');
  await initDb();

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Facility.deleteMany({}),
    Request.deleteMany({}),
    ProcessingRecord.deleteMany({}),
  ]);

  console.log('Seeding Users...');
  const [adminHash, collectorHash, userHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('collect123', 10),
    bcrypt.hash('user123', 10),
  ]);

  const admin = await User.create({
    fullName: 'Admin User',
    email: 'admin@ecocycle.in',
    passwordHash: adminHash,
    phone: '9800000001',
    role: 'ADMIN',
    address: 'EcoCycle HQ, Panaji, Goa',
  });

  const rahul = await User.create({
    fullName: 'Rahul Naik',
    email: 'rahul@ecocycle.in',
    passwordHash: collectorHash,
    phone: '9800000002',
    role: 'COLLECTOR',
    address: 'Margao, Goa',
    vehicleNo: 'GA-07-T-4421',
    area: 'South Goa',
  });

  const meera = await User.create({
    fullName: 'Meera Kamat',
    email: 'meera@ecocycle.in',
    passwordHash: collectorHash,
    phone: '9800000003',
    role: 'COLLECTOR',
    address: 'Mapusa, Goa',
    vehicleNo: 'GA-03-K-9087',
    area: 'North Goa',
  });

  const priya = await User.create({
    fullName: 'Priya Desai',
    email: 'priya@example.com',
    passwordHash: userHash,
    phone: '9800000004',
    role: 'USER',
    address: '12, Rua de Ourem, Panaji, Goa',
  });

  const arjun = await User.create({
    fullName: 'Arjun Shetty',
    email: 'arjun@example.com',
    passwordHash: userHash,
    phone: '9800000005',
    role: 'USER',
    address: 'Vasco da Gama, Goa',
  });

  const sneha = await User.create({
    fullName: 'Sneha Fernandes',
    email: 'sneha@example.com',
    passwordHash: userHash,
    phone: '9800000006',
    role: 'USER',
    address: 'Porvorim, Goa',
  });

  console.log('Seeding Categories...');
  const categories = await Category.insertMany([
    { name: 'Mobile Phones', description: 'Smartphones, feature phones and accessories', hazardLevel: 'Medium' },
    { name: 'Laptops & Computers', description: 'Laptops, desktops, monitors, keyboards', hazardLevel: 'Medium' },
    { name: 'Batteries', description: 'Li-ion, lead-acid and alkaline batteries', hazardLevel: 'High' },
    { name: 'Large Appliances', description: 'Refrigerators, washing machines, ACs', hazardLevel: 'Medium' },
    { name: 'Small Appliances', description: 'Mixers, irons, toasters, hair dryers', hazardLevel: 'Low' },
    { name: 'Televisions & Displays', description: 'CRT, LCD and LED televisions', hazardLevel: 'High' },
    { name: 'Printers & Peripherals', description: 'Printers, scanners, routers, cables', hazardLevel: 'Low' },
    { name: 'Lighting Equipment', description: 'CFL, LED tubes and fixtures', hazardLevel: 'Medium' },
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  console.log('Seeding Recycling Facilities...');
  const facilities = await Facility.insertMany([
    { name: 'GreenLoop Recyclers', location: 'Verna Industrial Estate', capacityKg: 5000, certification: 'CPCB Authorised' },
    { name: 'Eco Reclaim Pvt Ltd', location: 'Pilerne, Bardez', capacityKg: 3200, certification: 'ISO 14001' },
    { name: 'Urban Mine Works', location: 'Tivim Industrial Area', capacityKg: 2400, certification: 'CPCB Authorised' },
  ]);

  console.log('Seeding Collection Requests & Processing Records...');
  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Request 1: Recycled
  const req1 = await Request.create({
    userId: priya._id,
    categoryId: catMap['Mobile Phones'],
    itemName: 'Samsung Galaxy S8',
    quantity: 2,
    condition: 'Dead',
    pickupAddress: '12, Rua de Ourem, Panaji, Goa',
    preferredDate: daysAgo(93).toISOString().slice(0, 10),
    status: 'Recycled',
    collectorId: rahul._id,
    scheduledDate: daysAgo(88).toISOString().slice(0, 10),
    collectedOn: daysAgo(85).toISOString().slice(0, 10),
    history: [
      { status: 'Pending', at: daysAgo(93) },
      { status: 'Assigned', at: daysAgo(88) },
      { status: 'Collected', at: daysAgo(85) },
      { status: 'Processing', at: daysAgo(80) },
      { status: 'Recycled', at: daysAgo(70) },
    ],
  });

  await ProcessingRecord.create({
    requestId: req1._id,
    facilityId: facilities[0]._id,
    weightKg: 0.4,
    processStatus: 'Completed',
    finalStatus: 'Recycled',
    processedOn: daysAgo(70).toISOString().slice(0, 10),
  });

  // Request 2: Assigned
  await Request.create({
    userId: arjun._id,
    categoryId: catMap['Laptops & Computers'],
    itemName: 'Dell Inspiron 15',
    quantity: 1,
    condition: 'Damaged',
    pickupAddress: 'Vasco da Gama, Goa',
    preferredDate: daysAgo(86).toISOString().slice(0, 10),
    status: 'Assigned',
    collectorId: rahul._id,
    scheduledDate: daysAhead(1),
    history: [
      { status: 'Pending', at: daysAgo(86) },
      { status: 'Assigned', at: daysAgo(1) },
    ],
  });

  // Request 3: Disposed
  const req3 = await Request.create({
    userId: sneha._id,
    categoryId: catMap['Batteries'],
    itemName: 'UPS Lead-acid Batteries',
    quantity: 4,
    condition: 'Dead',
    pickupAddress: 'Porvorim, Goa',
    preferredDate: daysAgo(78).toISOString().slice(0, 10),
    status: 'Disposed',
    collectorId: meera._id,
    scheduledDate: daysAgo(75).toISOString().slice(0, 10),
    collectedOn: daysAgo(72).toISOString().slice(0, 10),
    history: [
      { status: 'Pending', at: daysAgo(78) },
      { status: 'Assigned', at: daysAgo(75) },
      { status: 'Collected', at: daysAgo(72) },
      { status: 'Processing', at: daysAgo(68) },
      { status: 'Disposed', at: daysAgo(60) },
    ],
  });

  await ProcessingRecord.create({
    requestId: req3._id,
    facilityId: facilities[1]._id,
    weightKg: 62.0,
    processStatus: 'Completed',
    finalStatus: 'Disposed',
    processedOn: daysAgo(60).toISOString().slice(0, 10),
  });

  // Request 4: Collected (ready for processing)
  await Request.create({
    userId: priya._id,
    categoryId: catMap['Televisions & Displays'],
    itemName: 'Sony CRT Television',
    quantity: 1,
    condition: 'Working',
    pickupAddress: '12, Rua de Ourem, Panaji, Goa',
    preferredDate: daysAgo(70).toISOString().slice(0, 10),
    status: 'Collected',
    collectorId: rahul._id,
    scheduledDate: daysAgo(65).toISOString().slice(0, 10),
    collectedOn: daysAgo(62).toISOString().slice(0, 10),
    history: [
      { status: 'Pending', at: daysAgo(70) },
      { status: 'Assigned', at: daysAgo(65) },
      { status: 'Collected', at: daysAgo(62) },
    ],
  });

  // Request 5 & 6: Pending
  await Request.create({
    userId: priya._id,
    categoryId: catMap['Batteries'],
    itemName: 'Laptop Batteries',
    quantity: 5,
    condition: 'Dead',
    pickupAddress: '12, Rua de Ourem, Panaji, Goa',
    preferredDate: daysAhead(2),
    status: 'Pending',
    history: [{ status: 'Pending', at: new Date() }],
  });

  await Request.create({
    userId: arjun._id,
    categoryId: catMap['Large Appliances'],
    itemName: 'Whirlpool Washing Machine',
    quantity: 1,
    condition: 'Damaged',
    pickupAddress: 'Vasco da Gama, Goa',
    preferredDate: daysAhead(3),
    status: 'Pending',
    history: [{ status: 'Pending', at: new Date() }],
  });

  console.log('EcoCycle MongoDB database seeded successfully!');
  await closeDb();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});

