'use strict';

const mongoose = require('mongoose');
const OnboardingTemplate = require('../models/OnboardingTemplate');
const OnboardingAssignment = require('../models/OnboardingAssignment');
const User = require('../models/User');

const HR_ROLES = new Set(['Admin', 'CompanyAdmin', 'SuperAdmin']);
const isHrRole = (role) => HR_ROLES.has(role);

const ensureObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

const clampStr = (s, max = 5000) => {
  if (s == null) return '';
  const t = String(s);
  return t.length > max ? t.slice(0, max) : t;
};

const safeJsonParse = (val, fallback = null) => {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  if (typeof val !== 'string') return fallback;
  const t = val.trim();
  if (!t) return fallback;
  try { return JSON.parse(t); } catch { return fallback; }
};

/** SuperAdmin can pass companyId in query/body; HR must use own companyId */
const getCompanyIdForHr = (req) => {
  if (req.user?.role === 'SuperAdmin') {
    const cid = req.query.companyId || req.body.companyId;
    return cid && ensureObjectId(cid) ? String(cid) : null;
  }
  return req.user?.companyId ? String(req.user.companyId) : null;
};

/** Accept items OR legacy steps/checklist and normalize to template.items schema */
const normalizeTemplateItems = (body) => {
  // Prefer items
  let items = body?.items;
  if (!items) items = body?.steps ?? body?.checklist;

  const arr = Array.isArray(items) ? items : safeJsonParse(items, []);
  if (!Array.isArray(arr)) return [];

  return arr
    .map((x) => {
      if (typeof x === 'string') {
        const title = x.trim();
        if (!title) return null;
        return {
          title,
          description: '',
          dueDays: 0,
          ownerRole: 'Employee',
          requiresAck: false,
          attachments: []
        };
      }

      const title = String(x?.title || x?.name || '').trim();
      if (!title) return null;

      const description = clampStr(String(x?.description || ''), 5000);
      const dueDays = Number(x?.dueDays || 0) || 0;

      let ownerRole = String(x?.ownerRole || 'Employee');
      if (!['HR', 'Manager', 'Employee'].includes(ownerRole)) ownerRole = 'Employee';

      const requiresAck = Boolean(x?.requiresAck);

      // attachments safe normalize
      const attachmentsRaw = Array.isArray(x?.attachments) ? x.attachments : [];
      const attachments = attachmentsRaw
        .map((a) => ({
          type: a?.type === 'file' ? 'file' : 'link',
          url: String(a?.url || ''),
          name: String(a?.name || '')
        }))
        .slice(0, 10);

      return { title, description, dueDays, ownerRole, requiresAck, attachments };
    })
    .filter(Boolean);
};

/** Assignment status from items */
const computeAssignmentStatus = (items) => {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return 'Active';
  const allDone = arr.every((it) => it.status === 'Done' || it.status === 'Skipped');
  return allDone ? 'Completed' : 'Active';
};

/** Convert template item -> assignment item schema (preserve attachments by appending into description) */
const makeAssignedItems = (templateItems, baseDate, prevItems = []) => {
  const prevByTemplateItemId = new Map(
    (Array.isArray(prevItems) ? prevItems : []).map((p) => [String(p.templateItemId), p])
  );

  return (Array.isArray(templateItems) ? templateItems : []).map((it) => {
    const prev = prevByTemplateItemId.get(String(it._id));

    const dueAt = it?.dueDays
      ? new Date(baseDate.getTime() + Number(it.dueDays) * 86400000)
      : null;

    let desc = it.description || '';
    if (it.requiresAck) {
      desc = `${desc}${desc ? '\n\n' : ''}⚠ Requires Acknowledgement`;
    }

    if (Array.isArray(it.attachments) && it.attachments.length) {
      const attachText = it.attachments
        .map((a) => `• ${a.type === 'file' ? 'File' : 'Link'}: ${a.name || ''} ${a.url || ''}`.trim())
        .join('\n');
      desc = `${desc}${desc ? '\n\n' : ''}Attachments:\n${attachText}`;
    }

    // Preserve previous progress if same templateItemId exists
    const status = prev?.status && ['Pending', 'Done', 'Skipped'].includes(prev.status) ? prev.status : 'Pending';
    const doneAt = status === 'Done' ? (prev?.doneAt || new Date()) : null;
    const comment = prev?.comment ? String(prev.comment) : '';

    let ownerRole = it.ownerRole || 'Employee';
    if (!['HR', 'Manager', 'Employee'].includes(ownerRole)) ownerRole = 'Employee';

    return {
      templateItemId: it._id,
      title: it.title || '',
      description: clampStr(desc, 5000),
      ownerRole,
      dueAt,
      status,
      doneAt,
      comment
    };
  });
};

/* ==========================
   TEMPLATE APIs (HR)
   ========================== */

const createTemplate = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });

    const templateName = String(req.body?.name || req.body?.title || '').trim();
    if (!templateName) return res.status(400).json({ message: 'Template name required' });

    const items = normalizeTemplateItems(req.body || {});
    if (!items.length) return res.status(400).json({ message: 'At least 1 onboarding item required' });

    const doc = await OnboardingTemplate.create({
      companyId,
      name: templateName,
      items,
      isActive: req.body?.isActive !== false
    });

    return res.status(201).json({ message: 'Template created ✅', template: doc });
  } catch (e) {
    console.error('createTemplate error:', e);
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
};

const listTemplates = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });

    const q = { companyId };
    if (req.query.active === 'true') q.isActive = true;
    if (req.query.active === 'false') q.isActive = false;

    const templates = await OnboardingTemplate.find(q).sort({ createdAt: -1 }).lean();
    return res.json(templates);
  } catch (e) {
    console.error('listTemplates error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getTemplate = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    const id = req.params.id;

    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });
    if (!ensureObjectId(id)) return res.status(400).json({ message: 'Invalid templateId' });

    const template = await OnboardingTemplate.findOne({ _id: id, companyId }).lean();
    if (!template) return res.status(404).json({ message: 'Template not found' });

    return res.json(template);
  } catch (e) {
    console.error('getTemplate error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    const id = req.params.id;

    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });
    if (!ensureObjectId(id)) return res.status(400).json({ message: 'Invalid templateId' });

    const updates = {};

    if (req.body?.name != null || req.body?.title != null) {
      updates.name = String(req.body?.name || req.body?.title || '').trim();
      if (!updates.name) return res.status(400).json({ message: 'Template name required' });
    }

    if (req.body?.isActive != null) {
      updates.isActive = Boolean(req.body.isActive);
    }

    if (req.body?.items != null || req.body?.steps != null || req.body?.checklist != null) {
      const items = normalizeTemplateItems(req.body || {});
      if (!items.length) return res.status(400).json({ message: 'At least 1 onboarding item required' });
      updates.items = items;
    }

    const template = await OnboardingTemplate.findOneAndUpdate(
      { _id: id, companyId },
      { $set: updates },
      { new: true }
    );

    if (!template) return res.status(404).json({ message: 'Template not found' });
    return res.json({ message: 'Template updated ✅', template });
  } catch (e) {
    console.error('updateTemplate error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    const id = req.params.id;

    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });
    if (!ensureObjectId(id)) return res.status(400).json({ message: 'Invalid templateId' });

    const out = await OnboardingTemplate.deleteOne({ _id: id, companyId });
    if (!out.deletedCount) return res.status(404).json({ message: 'Template not found' });

    return res.json({ message: 'Template deleted ✅' });
  } catch (e) {
    console.error('deleteTemplate error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ==========================
   ASSIGNMENT APIs (HR)
   NOTE: No user record creation happens here.
   HR only assigns onboarding to an EXISTING employee userId.
   ========================== */

const assignTemplateToUser = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });

    const templateId = req.body?.templateId;
    const targetUserId = req.body?.userId || req.body?.employeeId;
    if (!ensureObjectId(templateId)) return res.status(400).json({ message: 'Valid templateId required' });
    if (!ensureObjectId(targetUserId)) return res.status(400).json({ message: 'Valid userId required' });

    // ✅ ensure employee exists (NO auto-create)
    const user = await User.findOne({ _id: targetUserId, companyId, isDeleted: { $ne: true } })
      .select('_id joiningDate role')
      .lean();

    if (!user) return res.status(404).json({ message: 'Employee not found in your company' });
    if (user.role && user.role !== 'Employee') {
      return res.status(400).json({ message: 'Onboarding can be assigned only to Employee users' });
    }

    const template = await OnboardingTemplate.findOne({ _id: templateId, companyId }).lean();
    if (!template) return res.status(404).json({ message: 'Template not found' });

    // base date for dueAt (joiningDate if available else today)
    const baseDate = user.joiningDate ? new Date(user.joiningDate) : new Date();

    // If assignment already exists (unique index), preserve progress
    const existing = await OnboardingAssignment.findOne({ companyId, userId: targetUserId });

    const prevItems = existing?.items || [];
    const items = makeAssignedItems(template.items || [], baseDate, prevItems);
    const nextStatus = computeAssignmentStatus(items);

    const assignment = await OnboardingAssignment.findOneAndUpdate(
      { companyId, userId: targetUserId },
      {
        $set: {
          templateId: template._id,
          status: nextStatus,
          items
        }
      },
      { new: true, upsert: true }
    );

    return res.status(201).json({ message: 'Onboarding assigned ✅', assignment });
  } catch (e) {
    console.error('assignTemplateToUser error:', e);
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
};

const listAssignments = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });

    const q = { companyId };
    if (req.query.userId && ensureObjectId(req.query.userId)) q.userId = req.query.userId;
    if (req.query.templateId && ensureObjectId(req.query.templateId)) q.templateId = req.query.templateId;
    if (req.query.status && ['Active', 'Completed'].includes(req.query.status)) q.status = req.query.status;

    const list = await OnboardingAssignment.find(q)
      .populate('templateId', 'name')
      .populate('userId', 'name email designation employeeCode')
      .sort({ updatedAt: -1 })
      .limit(300)
      .lean();

    return res.json(list);
  } catch (e) {
    console.error('listAssignments error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAssignment = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    const id = req.params.id;

    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });
    if (!ensureObjectId(id)) return res.status(400).json({ message: 'Invalid assignmentId' });

    const doc = await OnboardingAssignment.findOne({ _id: id, companyId })
      .populate('templateId', 'name')
      .populate('userId', 'name email designation employeeCode')
      .lean();

    if (!doc) return res.status(404).json({ message: 'Assignment not found' });
    return res.json(doc);
  } catch (e) {
    console.error('getAssignment error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** HR can set item status: Pending/Done/Skipped (by itemId or idx) */
const updateAssignmentItem = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = getCompanyIdForHr(req);
    const assignmentId = req.params.id;

    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });
    if (!ensureObjectId(assignmentId)) return res.status(400).json({ message: 'Invalid assignmentId' });

    const { itemId, idx, status, comment, done } = req.body || {};

    const doc = await OnboardingAssignment.findOne({ _id: assignmentId, companyId });
    if (!doc) return res.status(404).json({ message: 'Assignment not found' });

    let itemIndex = -1;
    if (itemId) {
      itemIndex = (doc.items || []).findIndex((it) => String(it._id) === String(itemId));
    } else if (Number.isInteger(Number(idx))) {
      itemIndex = Number(idx);
    }

    if (itemIndex < 0 || !doc.items || !doc.items[itemIndex]) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // normalize status
    let nextStatus = status;
    if (done === true) nextStatus = 'Done';
    if (!['Pending', 'Done', 'Skipped'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid item status' });
    }

    doc.items[itemIndex].status = nextStatus;
    doc.items[itemIndex].doneAt = nextStatus === 'Done' ? new Date() : null;
    if (comment != null) doc.items[itemIndex].comment = clampStr(comment, 2000);

    doc.status = computeAssignmentStatus(doc.items);
    await doc.save();

    return res.json({ message: 'Item updated ✅', assignment: doc });
  } catch (e) {
    console.error('updateAssignmentItem error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ==========================
   EMPLOYEE SELF-SERVICE
   ========================== */

const getMyOnboarding = async (req, res) => {
  try {
    const companyId = req.user?.companyId ? String(req.user.companyId) : null;
    if (!companyId) return res.status(400).json({ message: 'CompanyId missing' });

    const userId = String(req.user?._id || '');
    if (!ensureObjectId(userId)) return res.status(400).json({ message: 'Invalid user' });

    const doc = await OnboardingAssignment.findOne({ companyId, userId })
      .populate('templateId', 'name')
      .lean();

    // ✅ FIX: Return null (200 OK) instead of 404 to avoid console errors
    if (!doc) return res.json(null);
    return res.json(doc);
  } catch (e) {
    console.error('getMyOnboarding error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateMyOnboardingItem = async (req, res) => {
  try {
    const companyId = req.user?.companyId ? String(req.user.companyId) : null;
    const userId = String(req.user?._id || '');
    if (!companyId || !userId) return res.status(400).json({ message: 'User context missing' });

    const { itemId, idx, status, done, comment } = req.body || {};
    let nextStatus = status;

    if (done === true) nextStatus = 'Done';
    if (!['Pending', 'Done', 'Skipped'].includes(nextStatus)) {
      // default safe behavior: only allow Done/Pending from employee
      if (done === false) nextStatus = 'Pending';
    }

    // employee cannot "Skipped" unless you want; keep it restricted:
    if (nextStatus === 'Skipped') {
      return res.status(403).json({ message: 'Skipping items is not allowed' });
    }

    const doc = await OnboardingAssignment.findOne({ companyId, userId });
    if (!doc) return res.status(404).json({ message: 'No onboarding assigned yet' });

    let itemIndex = -1;
    if (itemId) {
      itemIndex = (doc.items || []).findIndex((it) => String(it._id) === String(itemId));
    } else if (Number.isInteger(Number(idx))) {
      itemIndex = Number(idx);
    }

    if (itemIndex < 0 || !doc.items || !doc.items[itemIndex]) {
      return res.status(404).json({ message: 'Item not found' });
    }

    doc.items[itemIndex].status = nextStatus;
    doc.items[itemIndex].doneAt = nextStatus === 'Done' ? new Date() : null;
    if (comment != null) doc.items[itemIndex].comment = clampStr(comment, 2000);

    doc.status = computeAssignmentStatus(doc.items);
    await doc.save();

    return res.json({ message: 'Updated ✅', assignment: doc });
  } catch (e) {
    console.error('updateMyOnboardingItem error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // templates
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,

  // assignments
  assignTemplateToUser,
  listAssignments,
  getAssignment,
  updateAssignmentItem,

  // employee self
  getMyOnboarding,
  updateMyOnboardingItem
};
