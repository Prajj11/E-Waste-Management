import { Category, Facility, User, Request, ProcessingRecord } from '../models/index.js';
import { HttpError } from '../middleware/errors.js';

// ============================================================================
// Categories
// ============================================================================

export async function listCategories(req, res) {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories.map((c) => c.toJSON()));
}

export async function addCategory(req, res) {
  const { name, description, hazardLevel } = req.body;
  if (!name || !name.trim()) {
    throw new HttpError(400, 'Category name is required');
  }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    throw new HttpError(409, 'Category already exists');
  }

  const category = await Category.create({
    name: name.trim(),
    description: description ? description.trim() : null,
    hazardLevel: hazardLevel || 'Low',
  });

  res.status(201).json(category.toJSON());
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, description, hazardLevel } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    throw new HttpError(404, 'Category not found');
  }

  if (name) category.name = name.trim();
  if (description !== undefined) category.description = description ? description.trim() : null;
  if (hazardLevel) category.hazardLevel = hazardLevel;

  await category.save();
  res.json(category.toJSON());
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  const inUse = await Request.countDocuments({ categoryId: id });
  if (inUse > 0) {
    throw new HttpError(409, 'Category is used by existing requests');
  }

  const result = await Category.findByIdAndDelete(id);
  if (!result) {
    throw new HttpError(404, 'Category not found');
  }

  res.json({ deleted: true });
}

// ============================================================================
// Recycling Facilities
// ============================================================================

export async function listFacilities(req, res) {
  const facilities = await Facility.find().sort({ name: 1 });
  res.json(facilities.map((f) => f.toJSON()));
}

export async function addFacility(req, res) {
  const { name, location, capacityKg, certification } = req.body;
  if (!name || !location || !capacityKg) {
    throw new HttpError(400, 'Name, location and capacity are required');
  }

  const facility = await Facility.create({
    name: name.trim(),
    location: location.trim(),
    capacityKg: Number(capacityKg),
    certification: certification ? certification.trim() : null,
  });

  res.status(201).json(facility.toJSON());
}

export async function deleteFacility(req, res) {
  const { id } = req.params;
  const inUse = await ProcessingRecord.countDocuments({ facilityId: id });
  if (inUse > 0) {
    throw new HttpError(409, 'Facility has processing records');
  }

  const result = await Facility.findByIdAndDelete(id);
  if (!result) {
    throw new HttpError(404, 'Facility not found');
  }

  res.json({ deleted: true });
}

// ============================================================================
// Users & Collectors
// ============================================================================

export async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map((u) => u.toJSON()));
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  if (id === req.user.id) {
    throw new HttpError(400, 'You cannot delete your own account');
  }

  const hasRequests = await Request.countDocuments({ userId: id });
  if (hasRequests > 0) {
    throw new HttpError(409, 'This user has e-waste requests and cannot be deleted');
  }

  const hasAssignedPickups = await Request.countDocuments({ collectorId: id });
  if (hasAssignedPickups > 0) {
    throw new HttpError(409, 'This collector has assigned requests and cannot be deleted');
  }

  const result = await User.findByIdAndDelete(id);
  if (!result) {
    throw new HttpError(404, 'User not found');
  }

  res.json({ deleted: true });
}

export async function listCollectors(req, res) {
  const collectors = await User.find({ role: 'COLLECTOR' }).sort({ fullName: 1 });

  const results = await Promise.all(
    collectors.map(async (c) => {
      const activeJobs = await Request.countDocuments({
        collectorId: c._id,
        status: { $in: ['Assigned', 'Collected'] },
      });

      return {
        id: c.id,
        userId: c.id,
        fullName: c.fullName,
        vehicleNo: c.vehicleNo || '—',
        area: c.area || '—',
        available: c.available !== false,
        activeJobs,
      };
    })
  );

  res.json(results);
}
