import db from '../config/db.js';
import { decrypt } from '../config/crypto.js';
import formatDateForMySQL from '../utils/formatDateForMySQL.js';


// GET NOTIFICATIONS
export const getNotifications = async (req, res) => {
    const user_id = req.userData?.user_id;

    if (!user_id) {
        return res.status(401).json({ message: "Unauthorized: no user id" });
    }

    const limit = parseInt(req.query.limit, 10) || 10;
    const cursorDate = req.query.cursorDate || null;
    const cursorId = req.query.cursorId || null;

    try {
        let query = `
            SELECT 
                n.notif_id,
                n.message,
                n.read_status,
                n.create_date,
                n.notif_type,
                p.post_id,
                p.heading AS post_heading,
                p.content AS post_content,
                p.total_likes,
                p.total_saves,
                c.content AS comment_content,
                parent_c.content AS parent_comment_content
            FROM notifications n
            LEFT JOIN posts p ON n.post_id = p.post_id
            LEFT JOIN comments c ON n.comment_id = c.comment_id
            LEFT JOIN comments parent_c ON c.parent_comment_id = parent_c.comment_id
            WHERE n.recipient_id = $1
        `;

        const params = [user_id];

        // Cursor pagination (Postgres-safe)
        if (cursorDate && cursorId) {
            query += `
                AND (
                    n.create_date < $2
                    OR (n.create_date = $3 AND n.notif_id < $4)
                )
            `;

            params.push(cursorDate, cursorDate, cursorId);
        }

        // LIMIT must always be last parameter index
        query += `
            ORDER BY n.create_date DESC, n.notif_id DESC
            LIMIT $${params.length + 1}
        `;

        params.push(limit);

        const { rows } = await db.query(query, params);

        const notifications = rows.map(notif => ({
            ...notif,
            post_heading: notif.post_heading ? decrypt(notif.post_heading) : null,
            post_content: notif.post_content ? decrypt(notif.post_content) : null,
            comment_content: notif.comment_content ?? null
        }));

        const nextCursor =
            notifications.length === limit
                ? {
                    create_date: notifications[notifications.length - 1].create_date,
                    notif_id: notifications[notifications.length - 1].notif_id
                }
                : null;

        return res.status(200).json({
            notifications,
            nextCursor
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// UPDATE NOTIFICATION AS READ
export const updateNotificationRead = async (req, res) => {
    try {
        const user_id = req.userData?.user_id;
        const { notif_id } = req.body;

        if (!user_id) {
            return res.status(401).json({
                message: "Unauthorized: no user id"
            });
        }

        if (!notif_id) {
            return res.status(400).json({
                message: "notif_id is required"
            });
        }

        // ✅ PostgreSQL boolean uses TRUE/FALSE
        const result = await db.query(
            `
            UPDATE notifications
            SET read_status = TRUE
            WHERE notif_id = $1
            AND recipient_id = $2
            `,
            [notif_id, user_id]
        );

        // Optional safety check
        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            message: "Notification marked as read"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// GET UNREAD NOTIFICATION COUNT
export const getUnreadNotificationCount = async (req, res) => {
    const user_id = req.userData?.user_id;

    try {
        if (!user_id) {
            return res.status(401).json({
                message: "Unauthorized: no user id"
            });
        }

        const result = await db.query(
            `
            SELECT COUNT(*) AS "unreadCount"
            FROM notifications
            WHERE recipient_id = $1
            AND read_status = false
            `,
            [user_id]
        );

        return res.status(200).json({
            unreadCount: Number(result.rows[0].unreadCount)
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

