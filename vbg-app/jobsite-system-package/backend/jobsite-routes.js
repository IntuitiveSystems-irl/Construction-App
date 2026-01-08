/**
 * Job Site Management API Routes
 * Extracted from Rooster Construction system
 * 
 * This file contains all the Express routes for job site management including:
 * - Creating and managing job sites
 * - Assigning users to job sites
 * - Sending notifications/messages to job site teams
 * - Job site collaboration (uploads, comments, activity)
 * - User access control
 */

import { Router } from 'express';
import { sendEmail } from './email-service.js';

const router = Router();

/**
 * GET /api/admin/job-sites
 * Get all job sites (Admin only)
 */
export function getAllJobSitesRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const jobSites = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          js.*,
          u.name as client_name,
          COUNT(ja.user_id) as assigned_users
        FROM job_sites js
        LEFT JOIN users u ON js.client_id = u.id
        LEFT JOIN job_assignments ja ON js.id = ja.job_site_id
        GROUP BY js.id
        ORDER BY js.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    res.json(jobSites);
  });
}

/**
 * POST /api/admin/job-sites
 * Create new job site (Admin only)
 */
export function createJobSiteRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const {
      name, description, address, city, state, zip_code,
      client_id, project_manager, start_date, end_date,
      budget, status, client_notes, contractor_notes, safety_requirements
    } = req.body;
    
    if (!name || !address || !city || !state || !zip_code || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Required fields: name, address, city, state, zip_code, start_date, end_date' 
      });
    }
    
    const jobSiteId = `JOB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO job_sites (
          id, name, description, address, city, state, zip_code,
          client_id, project_manager, start_date, end_date,
          budget, status, client_notes, contractor_notes, safety_requirements
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        jobSiteId, name, description, address, city, state, zip_code,
        client_id || null, project_manager, start_date, end_date,
        budget || 0, status || 'planning', client_notes, contractor_notes, safety_requirements
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ success: true, id: jobSiteId, message: 'Job site created successfully' });
  });
}

/**
 * GET /api/admin/job-sites/:id
 * Get specific job site details (Admin only)
 */
export function getJobSiteByIdRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const jobSite = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          js.*,
          u.name as client_name,
          u.email as client_email,
          u.company_name as client_company
        FROM job_sites js
        LEFT JOIN users u ON js.client_id = u.id
        WHERE js.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!jobSite) {
      return res.status(404).json({ error: 'Job site not found' });
    }
    
    // Get assigned users
    const assignments = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          ja.*,
          u.name as user_name,
          u.email as user_email,
          u.company_name,
          u.user_type
        FROM job_assignments ja
        JOIN users u ON ja.user_id = u.id
        WHERE ja.job_site_id = ?
        ORDER BY ja.user_type, u.name
      `, [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    res.json({ ...jobSite, assignments });
  });
}

/**
 * POST /api/admin/job-sites/:id/assign
 * Assign users to job site (Admin only)
 */
export function assignUsersToJobSiteRoute(db, authenticateAdmin, asyncHandler, sendEmail) {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }
    
    // Remove existing assignments
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM job_assignments WHERE job_site_id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Get job site details for notifications
    const jobSite = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM job_sites WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Add new assignments and send notifications
    for (const assignment of assignments) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO job_assignments (
            job_site_id, user_id, user_type, role, assigned_date
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          id,
          assignment.user_id,
          assignment.user_type,
          assignment.role || '',
          new Date().toISOString().split('T')[0]
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Send email notification
      try {
        const user = await new Promise((resolve, reject) => {
          db.get('SELECT name, email FROM users WHERE id = ?', [assignment.user_id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (user && user.email) {
          const emailSubject = `New Job Assignment - ${jobSite.name}`;
          const emailMessage = `
            <h2>🏗️ New Job Site Assignment</h2>
            <p>Hello ${user.name},</p>
            <p>You have been assigned to a new job site:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e67e22; margin: 0 0 15px 0;">${jobSite.name}</h3>
              <p><strong>Role:</strong> ${assignment.role || 'Team Member'}</p>
              <p><strong>Location:</strong> ${jobSite.address}, ${jobSite.city}, ${jobSite.state}</p>
              <p><strong>Start Date:</strong> ${new Date(jobSite.start_date).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> ${new Date(jobSite.end_date).toLocaleDateString()}</p>
              ${jobSite.safety_requirements ? `<p><strong>Safety Requirements:</strong> ${jobSite.safety_requirements}</p>` : ''}
            </div>
            
            <p>Please log in to your dashboard to view complete details.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/job-sites" style="background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Sites</a></p>
            
            <p>Best regards,<br>Your Company Team</p>
          `;
          
          await sendEmail({
            to: user.email,
            subject: emailSubject,
            html: emailMessage
          });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }
    
    res.json({ success: true, message: 'Users assigned successfully' });
  });
}

/**
 * DELETE /api/admin/job-sites/:id
 * Delete job site (Admin only)
 */
export function deleteJobSiteRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Delete assignments first
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM job_assignments WHERE job_site_id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Delete job site
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM job_sites WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ success: true, message: 'Job site deleted successfully' });
  });
}

/**
 * POST /api/admin/job-sites/:id/message
 * Send message to all job site users (Admin only)
 */
export function sendJobSiteMessageRoute(db, authenticateAdmin, asyncHandler, sendEmail) {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, message_type = 'update', priority = 'normal', send_sms = true } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get job site details
    const jobSite = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM job_sites WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!jobSite) {
      return res.status(404).json({ error: 'Job site not found' });
    }
    
    // Save message to database
    const messageId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO job_messages (
          job_site_id, admin_id, message, message_type, priority, send_sms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [id, req.user.id, message, message_type, priority, send_sms ? 1 : 0], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Get assigned users
    const assignedUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT u.id, u.name, u.email, ja.user_type, ja.role
        FROM job_assignments ja
        JOIN users u ON ja.user_id = u.id
        WHERE ja.job_site_id = ?
      `, [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    let emailResults = [];
    
    // Send email notifications
    if (send_sms) {
      for (const user of assignedUsers) {
        try {
          if (user.email) {
            const priorityEmoji = priority === 'high' ? '⚠️' : priority === 'urgent' ? '🚨' : '💬';
            const typeText = message_type === 'safety' ? 'SAFETY ALERT' : 
                            message_type === 'schedule' ? 'SCHEDULE UPDATE' :
                            message_type === 'weather' ? 'WEATHER ALERT' : 'JOB UPDATE';
            
            const emailSubject = `${typeText} - ${jobSite.name}`;
            const emailMessage = `
              <h2>${priorityEmoji} ${typeText}</h2>
              <p>Hello ${user.name},</p>
              
              <div style="background: ${priority === 'urgent' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : '#f0f9ff'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#f59e0b' : '#3b82f6'};">
                <h3 style="color: #1f2937; margin: 0 0 15px 0;">Job Site: ${jobSite.name}</h3>
                <p style="font-size: 16px; line-height: 1.5; margin: 0;">${message}</p>
              </div>
              
              <p>Please log in to your dashboard for complete details.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/job-sites" style="background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Sites</a></p>
              
              <p>Best regards,<br>Your Company Team</p>
            `;
            
            await sendEmail({
              to: user.email,
              subject: emailSubject,
              html: emailMessage
            });
            
            emailResults.push({ user: user.name, status: 'sent' });
          }
        } catch (emailError) {
          console.error(`Error sending email to ${user.name}:`, emailError);
          emailResults.push({ user: user.name, status: 'failed', error: emailError.message });
        }
      }
    }
    
    res.json({ 
      success: true, 
      message_id: messageId,
      recipients: assignedUsers.length,
      sms_results: emailResults,
      message: 'Message sent successfully' 
    });
  });
}

/**
 * GET /api/admin/job-sites/:id/messages
 * Get messages for job site (Admin only)
 */
export function getJobSiteMessagesRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const messages = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          jm.*,
          u.name as admin_name
        FROM job_messages jm
        JOIN users u ON jm.admin_id = u.id
        WHERE jm.job_site_id = ?
        ORDER BY jm.created_at DESC
      `, [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    res.json(messages);
  });
}

/**
 * GET /api/user/job-sites
 * Get job sites for current user
 */
export function getUserJobSitesRoute(db, authenticate, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const jobSites = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          js.*,
          ja.role,
          ja.assigned_date,
          ja.status as assignment_status,
          u.name as client_name
        FROM job_sites js
        JOIN job_assignments ja ON js.id = ja.job_site_id
        LEFT JOIN users u ON js.client_id = u.id
        WHERE ja.user_id = ?
        ORDER BY js.start_date DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else {
          // Filter information based on user type
          const filteredRows = rows.map(row => {
            const userType = req.user.user_type || 'subcontractor';
            
            if (userType === 'client') {
              return {
                ...row,
                notes: row.client_notes,
                contractor_notes: undefined
              };
            } else {
              return {
                ...row,
                notes: row.contractor_notes,
                client_notes: undefined
              };
            }
          });
          
          resolve(filteredRows || []);
        }
      });
    });
    
    res.json(jobSites);
  });
}

/**
 * GET /api/user/job-sites/:id
 * Get specific job site details for user
 */
export function getUserJobSiteDetailsRoute(db, authenticate, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const jobSite = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          js.*,
          ja.role,
          ja.assigned_date
        FROM job_sites js
        JOIN job_assignments ja ON js.id = ja.job_site_id
        WHERE js.id = ? AND ja.user_id = ?
      `, [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!jobSite) {
      return res.status(404).json({ error: 'Job site not found or access denied' });
    }
    
    res.json(jobSite);
  });
}

// Export all route functions
export default {
  getAllJobSitesRoute,
  createJobSiteRoute,
  getJobSiteByIdRoute,
  assignUsersToJobSiteRoute,
  deleteJobSiteRoute,
  sendJobSiteMessageRoute,
  getJobSiteMessagesRoute,
  getUserJobSitesRoute,
  getUserJobSiteDetailsRoute
};
