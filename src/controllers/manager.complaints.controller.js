const sql = require('mssql');
const { pool } = require('../config/db');
const { ApiError } = require('../utils/ApiError');
const { uploadToStorage } = require('../utils/storage');

const managerComplaintsController = {
  async getComplaints(req, res) {
    try {
      const { pgId } = req.params;
      const { managerId } = req.user;

      // Verify manager belongs to PG
      const request = pool.request();
      const verifyResult = await request
        .input('pgId', sql.Int, pgId)
        .input('managerId', sql.Int, managerId)
        .query('SELECT 1 FROM PGs WHERE PGID = @pgId AND ManagerID = @managerId');

      if (!verifyResult.recordset.length) {
        throw new ApiError('Not authorized for this PG', 403);
      }

      // Get complaints with tenant and room details
      const result = await request
        .input('pgId', sql.Int, pgId)
        .query(`
          SELECT 
            c.ComplaintID,
            c.PGID,
            c.TenantID,
            c.CategoryID,
            c.Title,
            c.Description,
            c.Priority,
            c.Status,
            c.IsEmergency,
            c.IsEscalated,
            c.CreatedAt,
            c.UpdatedAt,
            c.ResolvedAt,
            c.LastActivityAt,
            t.FullName as TenantName,
            t.Room_No as RoomNumber,
            cc.Name as CategoryName,
            cc.Icon as CategoryIcon
          FROM Complaints c
          JOIN Tenants t ON c.TenantID = t.TenantID
          LEFT JOIN ComplaintCategories cc ON c.CategoryID = cc.CategoryID
          WHERE c.PGID = @pgId
          ORDER BY c.LastActivityAt DESC
        `);

      res.json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      console.error('Error in getComplaints:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getStats(req, res) {
    try {
      const { pgId } = req.params;
      const { managerId } = req.user;

      // Verify manager belongs to PG
      const request = pool.request();
      const verifyResult = await request
        .input('pgId', sql.Int, pgId)
        .input('managerId', sql.Int, managerId)
        .query('SELECT 1 FROM PGs WHERE PGID = @pgId AND ManagerID = @managerId');

      if (!verifyResult.recordset.length) {
        throw new ApiError('Not authorized for this PG', 403);
      }

      // Get complaint statistics
      const result = await request
        .input('pgId', sql.Int, pgId)
        .query(`
          SELECT
            COUNT(*) as Total,
            SUM(CASE WHEN Status = 'submitted' THEN 1 ELSE 0 END) as Pending,
            SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as InProgress,
            SUM(CASE WHEN Status = 'resolved' THEN 1 ELSE 0 END) as Resolved,
            SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) as Cancelled,
            AVG(CASE 
              WHEN Status = 'resolved' AND ResolvedAt IS NOT NULL 
              THEN DATEDIFF(hour, CreatedAt, ResolvedAt) 
              ELSE NULL 
            END) as AvgResolutionTime,
            AVG(CAST(
              (SELECT TOP 1 Rating FROM ComplaintFeedback cf WHERE cf.ComplaintID = c.ComplaintID)
              AS FLOAT)
            ) as AvgRating
          FROM Complaints c
          WHERE c.PGID = @pgId
        `);

      // Get category breakdown
      const categoryStats = await request
        .input('pgId', sql.Int, pgId)
        .query(`
          SELECT 
            c.CategoryID,
            cc.Name as CategoryName,
            COUNT(*) as Count
          FROM Complaints c
          LEFT JOIN ComplaintCategories cc ON c.CategoryID = cc.CategoryID
          WHERE c.PGID = @pgId
          GROUP BY c.CategoryID, cc.Name
        `);

      // Get priority breakdown
      const priorityStats = await request
        .input('pgId', sql.Int, pgId)
        .query(`
          SELECT 
            c.Priority,
            COUNT(*) as Count
          FROM Complaints c
          WHERE c.PGID = @pgId
          GROUP BY c.Priority
        `);

      res.json({
        success: true,
        data: {
          ...result.recordset[0],
          byCategory: categoryStats.recordset,
          byPriority: priorityStats.recordset
        }
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message
      });
    }
  },

  async addResponse(req, res) {
    const transaction = new sql.Transaction(pool);
    try {
      const { complaintId } = req.params;
      const { managerId } = req.user;
      const { message } = req.body;
      const files = req.files || [];

      await transaction.begin();

      // Verify manager has access to this complaint
      const request = new sql.Request(transaction);
      const verifyResult = await request
        .input('complaintId', sql.Int, complaintId)
        .input('managerId', sql.Int, managerId)
        .query(`
          SELECT c.PGID 
          FROM Complaints c
          JOIN PGs p ON c.PGID = p.PGID
          WHERE c.ComplaintID = @complaintId AND p.ManagerID = @managerId
        `);

      if (!verifyResult.recordset.length) {
        throw new ApiError('Not authorized to respond to this complaint', 403);
      }

      // Add response
      const responseResult = await request
        .input('complaintId', sql.Int, complaintId)
        .input('message', sql.NVarChar, message)
        .input('managerId', sql.Int, managerId)
        .query(`
          INSERT INTO ComplaintResponses (ComplaintID, Message, RespondedBy, RespondedByType)
          OUTPUT INSERTED.ResponseID
          VALUES (@complaintId, @message, @managerId, 'manager')
        `);

      const responseId = responseResult.recordset[0].ResponseID;

      // Upload attachments if any
      if (files.length) {
        const uploadPromises = files.map(async (file) => {
          const fileUrl = await uploadToStorage(file);
          await request
            .input('responseId', sql.Int, responseId)
            .input('fileUrl', sql.NVarChar, fileUrl)
            .input('fileType', sql.NVarChar, file.mimetype)
            .input('fileName', sql.NVarChar, file.originalname)
            .input('fileSize', sql.Int, file.size)
            .query(`
              INSERT INTO ResponseAttachments (ResponseID, FileURL, FileType, FileName, FileSize)
              VALUES (@responseId, @fileUrl, @fileType, @fileName, @fileSize)
            `);
        });

        await Promise.all(uploadPromises);
      }

      // Update complaint last activity
      await request
        .input('complaintId', sql.Int, complaintId)
        .query(`
          UPDATE Complaints 
          SET LastActivityAt = GETDATE()
          WHERE ComplaintID = @complaintId
        `);

      await transaction.commit();

      res.json({
        success: true,
        message: 'Response added successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in addResponse:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message
      });
    }
  },

  async updateStatus(req, res) {
    const transaction = new sql.Transaction(pool);
    try {
      const { complaintId } = req.params;
      const { managerId } = req.user;
      const { status, comment } = req.body;

      await transaction.begin();

      // Verify manager has access to this complaint
      const request = new sql.Request(transaction);
      const verifyResult = await request
        .input('complaintId', sql.Int, complaintId)
        .input('managerId', sql.Int, managerId)
        .query(`
          SELECT c.ComplaintID 
          FROM Complaints c
          JOIN PGs p ON c.PGID = p.PGID
          WHERE c.ComplaintID = @complaintId AND p.ManagerID = @managerId
        `);

      if (!verifyResult.recordset.length) {
        throw new ApiError('Not authorized to update this complaint', 403);
      }

      // Update complaint status
      await request
        .input('complaintId', sql.Int, complaintId)
        .input('status', sql.NVarChar, status)
        .input('managerId', sql.Int, managerId)
        .input('comment', sql.NVarChar, comment)
        .query(`
          EXEC sp_UpdateComplaintStatus 
            @ComplaintID = @complaintId,
            @NewStatus = @status,
            @Comment = @comment,
            @ChangedBy = @managerId,
            @ChangedByType = 'manager'
        `);

      await transaction.commit();

      res.json({
        success: true,
        message: 'Status updated successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in updateStatus:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = { managerComplaintsController }; 