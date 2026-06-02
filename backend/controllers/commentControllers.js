import db from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// CREATE COMMENT
export const createComment = async (req, res) => {
    const userId = req.userData?.user_id;
    const { post_id, content, parent_comment_id = null } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!post_id) {
        return res.status(400).json({ error: "Post ID is required." });
    }

    if (!content || !content.trim()) {
        return res.status(400).json({ error: "Comment content is required." });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // 🔍 Check post exists
        const postResult = await client.query(
            `SELECT post_id, user_id FROM posts WHERE post_id = $1`,
            [post_id]
        );

        if (postResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Post not found." });
        }

        // 🔍 Validate parent comment
        let parentOwnerId = null;

        if (parent_comment_id) {
            const parentResult = await client.query(
                `SELECT comment_id, user_id 
                 FROM comments 
                 WHERE comment_id = $1`,
                [parent_comment_id]
            );

            if (parentResult.rowCount === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ error: "Parent comment not found." });
            }

            parentOwnerId = parentResult.rows[0].user_id;
        }

        // 💬 Insert comment (RETURNING id instead of insertId)
        const insertResult = await client.query(
            `INSERT INTO comments (post_id, user_id, parent_comment_id, content)
             VALUES ($1, $2, $3, $4)
             RETURNING comment_id`,
            [post_id, userId, parent_comment_id, content.trim()]
        );

        const commentId = insertResult.rows[0].comment_id;

        // 📈 Update counter
        await client.query(
            `UPDATE posts 
             SET total_comments = total_comments + 1 
             WHERE post_id = $1`,
            [post_id]
        );

        // 🔔 Notifications
        if (parent_comment_id && parentOwnerId && parentOwnerId !== userId) {
            await client.query(
                `INSERT INTO notifications 
                    (recipient_id, actor_id, post_id, comment_id, read_status, create_date, message, notif_type)
                 VALUES ($1, $2, $3, $4, false, NOW(), $5, $6)`,
                [
                    parentOwnerId,
                    userId,
                    post_id,
                    commentId,
                    "Someone replied to your comment",
                    "reply"
                ]
            );
        }
        else if (!parent_comment_id && postResult.rows[0].user_id !== userId) {
            await client.query(
                `INSERT INTO notifications 
                    (recipient_id, actor_id, post_id, comment_id, read_status, create_date, message, notif_type)
                VALUES ($1, $2, $3, $4, false, NOW(), $5, $6)`,
                [
                    postResult.rows[0].user_id,
                    userId,
                    post_id,
                    commentId,
                    "Someone commented on your story",
                    "comment"
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Comment created successfully."
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create Comment Error:", error);

        return res.status(500).json({
            error: "Internal server error."
        });

    } finally {
        client.release();
    }
};

// GET COMMENTS
export const getCommentsByPost = async (req, res) => {
    const { post_id } = req.params;
    const user_id = req.userData?.user_id || null;

    if (!post_id) {
        return res.status(400).json({ message: "Post ID is required." });
    }

    try {
        let query;
        let params;

        // 🔐 Logged-in user
        if (user_id) {
            query = `
                SELECT 
                    c.comment_id,
                    c.content,
                    c.create_date,
                    c.user_id,
                    c.parent_comment_id,
                    c.is_edited,
                    COALESCE(c.total_like_count, 0) AS total_like_count,

                    CASE WHEN c.user_id = $1 THEN 1 ELSE 0 END AS is_owner,
                    CASE WHEN cl.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked,
                    CASE WHEN c.user_id = p.user_id THEN 1 ELSE 0 END AS is_author,
                    CASE WHEN p.user_id = $1 THEN 1 ELSE 0 END AS is_post_owner

                FROM comments c
                JOIN posts p ON c.post_id = p.post_id
                LEFT JOIN comment_likes cl 
                    ON c.comment_id = cl.comment_id 
                   AND cl.user_id = $1

                WHERE c.post_id = $2
                ORDER BY c.create_date ASC
            `;

            params = [user_id, post_id];

        }
        // 🔓 Guest user
        else {
            query = `
                SELECT 
                    c.comment_id,
                    c.content,
                    c.create_date,
                    c.user_id,
                    c.parent_comment_id,
                    c.is_edited,
                    COALESCE(c.total_like_count, 0) AS total_like_count,

                    CASE WHEN c.user_id = p.user_id THEN 1 ELSE 0 END AS is_author,
                    0 AS is_owner,
                    0 AS is_liked,
                    0 AS is_post_owner

                FROM comments c
                JOIN posts p ON c.post_id = p.post_id
                WHERE c.post_id = $1
                ORDER BY c.create_date ASC
            `;

            params = [post_id];
        }

        const result = await db.query(query, params);
        const comments = result.rows;

        const formattedComments = comments.map(comment => ({
            ...comment,
            is_owner: Boolean(comment.is_owner),
            is_author: Boolean(comment.is_author),
            is_post_owner: Boolean(comment.is_post_owner),
            is_edited: Boolean(comment.is_edited),
            is_liked: Boolean(comment.is_liked),
            total_like_count: comment.total_like_count
        }));

        return res.json(formattedComments);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to fetch comments."
        });
    }
};

// DELETE COMMENT
export const deleteComment = async (req, res) => {
    const { comment_id } = req.params;
    const userId = req.userData?.user_id;

    if (!comment_id) {
        return res.status(400).json({ message: "Comment ID is required." });
    }

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // 🔍 Get comment + post ownership
        const commentResult = await client.query(
            `SELECT 
                c.comment_id,
                c.post_id,
                c.user_id AS comment_owner_id,
                p.user_id AS post_owner_id
             FROM comments c
             JOIN posts p ON c.post_id = p.post_id
             WHERE c.comment_id = $1`,
            [comment_id]
        );

        if (commentResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Comment not found." });
        }

        const comment = commentResult.rows[0];

        const isCommentOwner = comment.comment_owner_id === userId;
        const isPostOwner = comment.post_owner_id === userId;

        if (!isCommentOwner && !isPostOwner) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                message: "You are not allowed to delete this comment."
            });
        }

        const postId = comment.post_id;

        // 🌳 Recursive CTE to get all descendants
        const treeResult = await client.query(
            `
            WITH RECURSIVE comment_tree AS (
                SELECT comment_id
                FROM comments
                WHERE comment_id = $1

                UNION ALL

                SELECT c.comment_id
                FROM comments c
                INNER JOIN comment_tree ct
                    ON c.parent_comment_id = ct.comment_id
            )
            SELECT comment_id FROM comment_tree;
            `,
            [comment_id]
        );

        const toDeleteIds = treeResult.rows.map(r => r.comment_id);

        if (toDeleteIds.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Nothing to delete." });
        }

        // 🧹 Delete likes
        await client.query(
            `DELETE FROM comment_likes 
             WHERE comment_id = ANY($1)`,
            [toDeleteIds]
        );

        // 🧹 Delete notifications
        await client.query(
            `DELETE FROM notifications 
             WHERE comment_id = ANY($1)`,
            [toDeleteIds]
        );

        // 🧹 Delete comments
        await client.query(
            `DELETE FROM comments 
             WHERE comment_id = ANY($1)`,
            [toDeleteIds]
        );

        // 📉 Update counter safely
        await client.query(
            `UPDATE posts 
             SET total_comments = GREATEST(total_comments - $1, 0)
             WHERE post_id = $2`,
            [toDeleteIds.length, postId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Comment and its replies deleted successfully."
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Delete Comment Error:", error);

        return res.status(500).json({
            message: "Internal server error."
        });

    } finally {
        client.release();
    }
};

// UPDATE COMMENT
export const updateComment = async (req, res) => {
    const userId = req.userData?.user_id;
    const { comment_id, content } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
    }

    if (!comment_id) {
        return res.status(400).json({ error: "Comment ID is required." });
    }

    if (!content || !content.trim()) {
        return res.status(400).json({ error: "Comment content is required." });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // 🔍 Check comment ownership
        const commentResult = await client.query(
            `SELECT post_id, user_id 
             FROM comments 
             WHERE comment_id = $1`,
            [comment_id]
        );

        if (commentResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Comment not found." });
        }

        const comment = commentResult.rows[0];

        if (comment.user_id !== userId) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                error: "You are not allowed to edit this comment."
            });
        }

        // ✏️ Update comment
        await client.query(
            `UPDATE comments 
             SET content = $1, is_edited = true 
             WHERE comment_id = $2`,
            [content.trim(), comment_id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Comment updated successfully."
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Edit Comment Error:", error);

        return res.status(500).json({
            error: "Internal server error."
        });

    } finally {
        client.release();
    }
};

// ADD COMMENT LIKE
export const addCommentLike = async (req, res) => {
    const { comment_id } = req.body;
    const user_id = req.userData?.user_id;
    const actor_id = user_id;

    if (!user_id) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // 🔍 Get comment owner + post_id
        const commentResult = await client.query(
            `
            SELECT user_id, post_id
            FROM comments
            WHERE comment_id = $1
            `,
            [comment_id]
        );

        if (commentResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Comment not found"
            });
        }

        const recipient_id = commentResult.rows[0].user_id;
        const post_id = commentResult.rows[0].post_id;

        // ❤️ Insert like
        await client.query(
            `
            INSERT INTO comment_likes (user_id, comment_id)
            VALUES ($1, $2)
            `,
            [user_id, comment_id]
        );

        // 📈 Increment count
        await client.query(
            `
            UPDATE comments
            SET total_like_count = total_like_count + 1
            WHERE comment_id = $1
            `,
            [comment_id]
        );

        // 🔔 Notification
        if (recipient_id !== user_id) {
            await client.query(
                `
                INSERT INTO notifications
                    (
                        message,
                        actor_id,
                        recipient_id,
                        post_id,
                        comment_id,
                        notif_type
                    )
                VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [
                    "Someone liked your comment",
                    actor_id,
                    recipient_id,
                    post_id,
                    comment_id,
                    "comment_like"
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            success: true
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        client.release();
    }
};


// DELETE COMMENT LIKE
export const deleteCommentLike = async (req, res) => {
    const { comment_id } = req.body;
    const user_id = req.userData?.user_id;

    if (!user_id) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // 🔍 Check comment exists
        const commentResult = await client.query(
            `
            SELECT post_id
            FROM comments
            WHERE comment_id = $1
            `,
            [comment_id]
        );

        if (commentResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Comment not found"
            });
        }

        // ❌ Delete like
        const deleteResult = await client.query(
            `
            DELETE FROM comment_likes
            WHERE user_id = $1
            AND comment_id = $2
            `,
            [user_id, comment_id]
        );

        if (deleteResult.rowCount > 0) {

            // 📉 Decrement safely
            await client.query(
                `
                UPDATE comments
                SET total_like_count = GREATEST(total_like_count - 1, 0)
                WHERE comment_id = $1
                `,
                [comment_id]
            );

            // 🧹 Remove notification
            await client.query(
                `
                DELETE FROM notifications
                WHERE actor_id = $1
                AND comment_id = $2
                AND notif_type = $3
                `,
                [user_id, comment_id, "comment_like"]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Like removed"
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        client.release();
    }
};