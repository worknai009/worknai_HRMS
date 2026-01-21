// Backend/controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const path = require('path');
const {
  sha256File,
  detectMagic,
  safeResolveUnderUploads
} = require('../utils/fileSecurity');

const isHrRole = (role) => ['Admin', 'CompanyAdmin', 'SuperAdmin'].includes(role);
const getCompanyId = (req) => req?.user?.companyId?.toString?.() || null;

const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(req.query.limit || '25', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const isValidHttpUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
};

const buildAttachmentFromFile = async (file) => {
  const kind = detectMagic(file.path);
  // Optional: strict check
  // if (!['pdf', 'zip', 'jpg', 'jpeg', 'png'].includes(kind)) throw new Error('Invalid file content'); 

  const hash = await sha256File(file.path);
  const rel = `uploads/tasks/${path.basename(file.path)}`;

  return {
    type: 'file',
    url: rel,
    name: file.originalname || path.basename(file.path),
    mime: file.mimetype,
    size: file.size,
    sha256: hash
  };
};

const attachmentUrlExistsInTask = (task, url) => {
  if (!task || !url) return false;
  const a1 = Array.isArray(task.attachments) ? task.attachments : [];
  const a2 = Array.isArray(task.submission?.attachments) ? task.submission.attachments : [];
  return [...a1, ...a2].some((a) => a?.url === url);
};

/* =========================================================================
   1) ASSIGN TASK (HR)
   ========================================================================= */
const assignTask = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!isHrRole(req.user.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId, title, description, priority, deadline, externalLink } = req.body || {};

    if (!userId || !title || !deadline) {
      return res.status(400).json({ message: 'userId, title, deadline required' });
    }

    const employee = await User.findById(userId).select('_id role companyId status isDeleted');
    if (!employee || employee.isDeleted) return res.status(404).json({ message: 'Employee not found' });

    const attachments = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const att = await buildAttachmentFromFile(file);
        attachments.push(att);
      }
    }

    if (externalLink && isValidHttpUrl(externalLink)) {
      attachments.push({ type: 'link', url: externalLink, name: 'External Resource' });
    }

    const newTask = await Task.create({
      title: String(title).trim(),
      description: description ? String(description) : '',
      priority: priority || 'Medium',
      deadline: new Date(deadline),
      assignedTo: userId,
      assignedBy: req.user._id,
      companyId: employee.companyId,
      status: 'Pending',
      attachments
    });

    return res.status(201).json({ message: 'Task Assigned Successfully ✅', task: newTask });
  } catch (err) {
    console.error('assignTask error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to assign task' });
  }
};

/* =========================================================================
   2) GET TASKS
   ========================================================================= */
const getMyTasks = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const q = { assignedTo: req.user._id, companyId: req.user.companyId };
    
    // Employee can filter by status
    if (req.query.status) q.status = req.query.status;

    const [items, total] = await Promise.all([
      Task.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Task.countDocuments(q)
    ]);
    return res.json({ page, limit, total, items });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching tasks' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    if (!isHrRole(req.user.role)) return res.status(403).json({ message: 'Access Denied' });
    const { page, limit, skip } = parsePagination(req);
    
    // HR sees all tasks for their company
    const q = { companyId: req.user.companyId };
    
    const [items, total] = await Promise.all([
      Task.find(q)
        .populate('assignedTo', 'name email designation')
        .populate('assignedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(q)
    ]);
    return res.json({ page, limit, total, items });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching tasks' });
  }
};

/* =========================================================================
   3) UPDATE STATUS (START TASK / ADMIN OVERRIDE) - ✅ FIXED LOGIC
   ========================================================================= */
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // ✅ FIX: If HR, they can update any task in their company. If Employee, only their own task.
    const query = { _id: taskId };
    if (!isHrRole(req.user.role)) {
        query.assignedTo = req.user._id;
    } else {
        query.companyId = req.user.companyId;
    }

    const task = await Task.findOne(query);
    if (!task) return res.status(404).json({ message: 'Task not found or access denied' });

    // Validate Status
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Verified', 'Rejected', 'Needs Rework'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    task.status = status;
    await task.save();
    return res.json({ message: `Task marked as ${status}`, task });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Update failed' });
  }
};

/* =========================================================================
   4) COMPLETE TASK (SUBMIT WORK)
   ========================================================================= */
const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { notes, link } = req.body || {};

    const task = await Task.findOne({ _id: taskId, assignedTo: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const subAttachments = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const att = await buildAttachmentFromFile(file);
        subAttachments.push(att);
      }
    }

    if (link && isValidHttpUrl(link)) {
      subAttachments.push({ type: 'link', url: link, name: 'Work Link' });
    }

    task.submission = {
      notes: notes ? String(notes) : '',
      submittedAt: new Date(),
      attachments: subAttachments
    };

    task.status = 'Completed'; // Sends to HR for review
    await task.save();

    return res.json({ message: 'Work Submitted Successfully 🎉', task });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

/* =========================================================================
   5) REVIEW TASK (HR) - ✅ FIXED LOGIC
   ========================================================================= */
const reviewTask = async (req, res) => {
  try {
    if (!isHrRole(req.user.role)) return res.status(403).json({ message: 'Access Denied' });
    const { taskId } = req.params;
    
    // Accept 'action' OR 'status' to be flexible with frontend
    const { action, comment, status } = req.body;
    const finalAction = action || status; 

    const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.review = {
      status: finalAction,
      comment: comment || '',
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };

    // Update main status based on review
    if (finalAction === 'Approved' || finalAction === 'Verified') task.status = 'Verified';
    else if (finalAction === 'Rejected') task.status = 'Rejected';
    else if (finalAction === 'Needs Rework' || finalAction === 'In Progress') task.status = 'Needs Rework';
    
    await task.save();
    return res.json({ message: `Task status updated to ${task.status}`, task });
  } catch (err) {
    return res.status(500).json({ message: 'Review failed' });
  }
};

/* =========================================================================
   6) DOWNLOAD
   ========================================================================= */
const downloadTaskAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL required' });

    const task = await Task.findById(taskId).lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Security check: is user related to task?
    const isHr = isHrRole(req.user.role);
    const isOwner = task.assignedTo.toString() === req.user._id.toString();
    
    // If not HR and not Owner, block
    if (!isHr && !isOwner) return res.status(403).json({ message: 'Unauthorized' });

    if (!attachmentUrlExistsInTask(task, url)) {
        return res.status(403).json({ message: 'File not linked to task' });
    }

    const fullPath = safeResolveUnderUploads(url.replace(/^uploads\//, ''));
    return res.download(fullPath);
  } catch (err) {
    return res.status(500).json({ message: 'Download error' });
  }
};

module.exports = {
  assignTask,
  getMyTasks,
  getAllTasks,
  updateTaskStatus,
  completeTask,
  reviewTask,
  downloadTaskAttachment
};