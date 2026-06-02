import db from '../config/db.js';
import { encrypt, decrypt } from '../config/crypto.js';
import { Document, Packer, Paragraph, AlignmentType, TextRun } from "docx";
import formatDateForMySQL from '../utils/formatDateForMySQL.js';

// CREATE STORY
export const createStory = async (req, res) => {
    const {
        heading,
        content,
        audience,
        canComment,
        category = [],
        createdAt
    } = req.body.story;

    const userID = req.userData.user_id;

    if (!content) { return res.status(400).json({ message: "Story's content cannot be empty." }); }

    if (!Array.isArray(category) || category.length === 0) { return res.status(400).json({ message: "Story's category cannot be empty." }); }

    if (typeof canComment !== "boolean") { return res.status(400).json({ message: "canComment must be a boolean." }); }

    try {
        const encryptedHeading = heading ? encrypt(heading) : null;
        const encryptedContent = encrypt(content);
        const stringedCategory = category.join(", ");
        const createDate = createdAt ? new Date(createdAt) : new Date();

        await db.query(
            `
            INSERT INTO posts 
                (heading, user_id, content, audience, can_comment, category, create_date)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
            `,
            [encryptedHeading, userID, encryptedContent, audience, canComment, stringedCategory, createDate]
        );

        return res.status(201).json({ message: "Story uploaded successfully." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// UPDATE STORY
export const updateStory = async (req, res) => {
    const user_id = req.userData.user_id;
    const {
        post_id,
        heading,
        content,
        audience,
        canComment,
        category = []
    } = req.body;

    if (!post_id) { return res.status(400).json({ message: "Post ID is required." }); }
    if (!content) { return res.status(400).json({ message: "Story's content cannot be empty." }); }
    if (!Array.isArray(category) || category.length === 0) { return res.status(400).json({ message: "Story's category cannot be empty." }); }
    if (typeof canComment !== "boolean") { return res.status(400).json({ message: "canComment must be a boolean." }); }

    try {
        const encryptedHeading = heading ? encrypt(heading) : null;
        const encryptedContent = encrypt(content);
        const stringedCategory = category.join(", ");

        const query = `
            UPDATE posts 
            SET 
                heading = $1,
                content = $2,
                audience = $3,
                can_comment = $4,
                category = $5
            WHERE post_id = $6 AND user_id = $7
        `;

        const values = [encryptedHeading, encryptedContent, audience, canComment, stringedCategory, post_id, user_id];
        const result = await db.query(query, values);

        if (result.rowCount === 0) { return res.status(403).json({ message: "You are not allowed to edit this story." }); }

        return res.status(200).json({
            message: "Story updated successfully."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// DELETE STORY
export const deleteStory = async (req, res) => {
    const { post_id } = req.params;
    const user_id = req.userData.user_id;

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // delete child comments first
        await client.query(
            `DELETE FROM comments 
             WHERE post_id = $1 AND parent_comment_id IS NOT NULL`,
            [post_id]
        );

        await client.query(
            `DELETE FROM comments 
             WHERE post_id = $1`,
            [post_id]
        );

        await client.query(
            `DELETE FROM likes 
             WHERE post_id = $1`,
            [post_id]
        );

        await client.query(
            `DELETE FROM saved_stories 
             WHERE post_id = $1`,
            [post_id]
        );

        await client.query(
            `DELETE FROM notifications 
             WHERE post_id = $1`,
            [post_id]
        );

        // delete post (ownership check included)
        const result = await client.query(
            `DELETE FROM posts 
             WHERE post_id = $1 AND user_id = $2`,
            [post_id, user_id]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Story not found." });
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Story deleted successfully."
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });

    } finally {
        client.release();
    }
};

// GET SAVED STORIES
export const getSavedStories = async (req, res) => {
    const user_id = req.userData.user_id;

    if (!user_id) {
        return res.status(400).json({ message: "No user" });
    }

    const limit = parseInt(req.query.limit, 10) || 10;
    const cursorDate = req.query.cursorDate || null;
    const cursorId = req.query.cursorId || null;

    try {
        let query = `
            SELECT 
                p.post_id,
                p.heading,
                p.content,
                p.audience,
                p.can_comment,
                p.create_date,
                p.total_likes,
                p.total_reads,
                p.total_saves,
                p.total_comments,
                p.category,
                s.saved_at,
                CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked,
                CASE WHEN p.user_id = $1 THEN 1 ELSE 0 END AS is_owner,
                CASE WHEN s.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_saved
            FROM posts p
            JOIN saved_stories s ON p.post_id = s.post_id
            LEFT JOIN likes l ON l.post_id = p.post_id AND l.user_id = $1
            WHERE s.user_id = $1 
              AND p.audience = 'public'
        `;

        const params = [user_id];

        // Cursor pagination
        if (cursorDate && cursorId) {
            params.push(cursorDate, cursorDate, cursorId);

            query += `
                AND (
                    s.saved_at < $2
                    OR (s.saved_at = $2 AND p.post_id < $3)
                )
            `;
        }

        params.push(limit);

        query += `
            ORDER BY s.saved_at DESC, p.post_id DESC
            LIMIT $${params.length}
        `;

        const result = await db.query(query, params);
        const stories = result.rows;

        // Decrypt
        const decryptedStories = stories.map(story => ({
            ...story,
            heading: story.heading ? decrypt(story.heading) : null,
            content: story.content ? decrypt(story.content) : null,
            category: story.category
                ? story.category.split(",").map(c => c.trim())
                : [],
            can_comment: Boolean(story.can_comment),
            is_liked: Boolean(story.is_liked),
            is_owner: Boolean(story.is_owner),
            is_saved: Boolean(story.is_saved),
        }));

        const lastStory = decryptedStories[decryptedStories.length - 1];

        const nextCursor =
            decryptedStories.length === limit && lastStory
                ? {
                    cursorDate: lastStory.saved_at,
                    cursorId: lastStory.post_id
                }
                : null;

        return res.status(200).json({
            stories: decryptedStories,
            nextCursor
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET PRIVATE STORIES
export const getPrivateStories = async (req, res) => {
    const user_id = req.userData?.user_id;

    if (!user_id) {
        return res.status(401).json({ message: "No user" });
    }

    const limit = parseInt(req.query.limit, 10) || 10;
    const cursor = req.query.cursor ? JSON.parse(req.query.cursor) : null;

    try {
        let query = `
            SELECT 
                p.post_id,
                p.heading,
                p.content,
                p.total_likes,
                p.audience,
                p.can_comment,
                p.create_date,
                p.total_reads,
                p.total_saves,
                p.total_comments,
                p.category,

                CASE WHEN s.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_saved
            FROM posts p
            LEFT JOIN saved_stories s 
                ON s.post_id = p.post_id 
                AND s.user_id = $1
            WHERE p.user_id = $1
        `;

        const params = [user_id];

        // cursor pagination
        if (cursor) {
            params.push(cursor.create_date, cursor.post_id);

            query += `
                AND (
                    p.create_date < $2
                    OR (p.create_date = $2 AND p.post_id < $3)
                )
            `;
        }

        params.push(limit);

        query += `
            ORDER BY p.create_date DESC, p.post_id DESC
            LIMIT $${params.length}
        `;

        const result = await db.query(query, params);
        const stories = result.rows;

        const decryptedStoryContent = stories.map(story => ({
            ...story,
            heading: story.heading ? decrypt(story.heading) : null,
            content: story.content ? decrypt(story.content) : null,
            can_comment: Boolean(story.can_comment),
            is_saved: Boolean(story.is_saved), // 👈 important
            category: story.category
                ? story.category.split(",").map(c => c.trim())
                : [],
            is_owner: true
        }));

        const nextCursor =
            stories.length > 0
                ? {
                    create_date: stories[stories.length - 1].create_date,
                    post_id: stories[stories.length - 1].post_id
                }
                : null;

        return res.status(200).json({
            stories: decryptedStoryContent,
            nextCursor
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// GET PUBLIC STORIES
export const getPublicStories = async (req, res) => {
    const user_id = req.userData?.user_id || null;

    const limit = parseInt(req.query.limit) || 10;
    const cursorDate = req.query.cursorDate || null;
    const cursorId = req.query.cursorId || null;

    const categories = req.query.categories
        ? Array.isArray(req.query.categories)
            ? req.query.categories
            : [req.query.categories]
        : [];

    try {
        let query = "";
        let params = [];
        let whereAdded = false;

        // BASE QUERY
        if (user_id) {
            query = `
                SELECT 
                    p.post_id,
                    p.heading,
                    p.content,
                    p.can_comment,
                    p.create_date,
                    p.total_likes,
                    p.total_reads,
                    p.total_saves,
                    p.total_comments,
                    p.category,
                    CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked,
                    CASE WHEN p.user_id = $1 THEN 1 ELSE 0 END AS is_owner,
                    CASE WHEN s.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_saved
                FROM posts p
                LEFT JOIN likes l 
                    ON p.post_id = l.post_id AND l.user_id = $1
                LEFT JOIN saved_stories s
                    ON p.post_id = s.post_id AND s.user_id = $1
                WHERE p.audience = $2
            `;

            params = [user_id, "public"];
        } else {
            query = `
                SELECT 
                    p.post_id,
                    p.heading,
                    p.content,
                    p.can_comment,
                    p.create_date,
                    p.total_likes,
                    p.total_reads,
                    p.total_saves,
                    p.total_comments,
                    p.category
                FROM posts p
                WHERE p.audience = $1
            `;

            params = ["public"];
        }

        // helper for WHERE chaining
        const addWhere = (condition) => {
            query += ` AND ${condition}`;
        };

        // CATEGORY FILTER
        if (categories.length > 0) {
            const conditions = categories.map(
                (_, i) => `p.category ILIKE $${params.length + i + 1}`
            );

            addWhere(`(${conditions.join(" OR ")})`);

            categories.forEach(c => params.push(`%${c}%`));
        }

        // CURSOR PAGINATION
        if (cursorDate && cursorId) {
            addWhere(`
                (p.create_date < $${params.length + 1}
                OR (p.create_date = $${params.length + 2} AND p.post_id < $${params.length + 3}))
            `);

            params.push(cursorDate, cursorDate, cursorId);
        }

        // ORDER + LIMIT
        query += `
            ORDER BY p.create_date DESC, p.post_id DESC
            LIMIT $${params.length + 1}
        `;

        params.push(limit);

        // EXECUTE
        const { rows } = await db.query(query, params);

        // FORMAT
        const decryptedStoryContent = rows.map(story => ({
            ...story,
            audience: "public",
            heading: story.heading ? decrypt(story.heading) : null,
            content: decrypt(story.content),
            can_comment: !!story.can_comment,
            is_liked: !!story.is_liked,
            is_owner: !!story.is_owner,
            is_saved: !!story.is_saved,
            category: story.category
                ? story.category.split(",").map(s => s.trim())
                : []
        }));

        const nextCursor =
            rows.length > 0
                ? {
                    cursorDate: rows[rows.length - 1].create_date,
                    cursorId: rows[rows.length - 1].post_id
                }
                : null;

        return res.status(200).json({
            stories: decryptedStoryContent,
            nextCursor
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// ADD LIKE
export const addLike = async (req, res) => {
    const { post_id } = req.body;
    const user_id = req.userData?.user_id;
    const actor_id = user_id;

    if (!post_id) {
        return res.status(400).json({ message: "Post ID required" });
    }

    if (!user_id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // Get post owner
        const postResult = await client.query(
            `SELECT user_id FROM posts WHERE post_id = $1`,
            [post_id]
        );

        if (postResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Post not found." });
        }

        const recipient_id = postResult.rows[0].user_id;

        // Insert like
        await client.query(
            `INSERT INTO likes (user_id, post_id)
             VALUES ($1, $2)`,
            [user_id, post_id]
        );

        // Update counter
        await client.query(
            `UPDATE posts 
             SET total_likes = total_likes + 1 
             WHERE post_id = $1`,
            [post_id]
        );

        // Notification (avoid self-notification)
        if (recipient_id !== 0 && recipient_id !== user_id) {
            await client.query(
                `INSERT INTO notifications 
                    (message, actor_id, recipient_id, post_id, notif_type)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    "Someone liked your story",
                    actor_id,
                    recipient_id,
                    post_id,
                    "post_like"
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({ success: true });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);
        return res.status(500).json({ message: "Internal server error." });

    } finally {
        client.release();
    }
};

// DELETE LIKE
export const deleteLike = async (req, res) => {
    const { post_id } = req.body;
    const user_id = req.userData?.user_id;

    if (!post_id) {
        return res.status(400).json({ message: "post_id is required" });
    }

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required" });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // 1. Delete like
        const result = await client.query(
            `DELETE FROM likes 
             WHERE user_id = $1 AND post_id = $2`,
            [user_id, post_id]
        );

        if (result.rowCount > 0) {
            // 2. Update counter safely
            await client.query(
                `UPDATE posts 
                 SET total_likes = GREATEST(total_likes - 1, 0)
                 WHERE post_id = $1`,
                [post_id]
            );

            // 3. Remove notification
            await client.query(
                `DELETE FROM notifications 
                 WHERE actor_id = $1 
                   AND post_id = $2 
                   AND notif_type = $3`,
                [user_id, post_id, "post_like"]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Post like removed"
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);
        return res.status(500).json({
            message: "Internal server error."
        });

    } finally {
        client.release();
    }
};

export const incrementReadCount = async (req, res) => {
    const { post_id } = req.params;
    const user_id = req.userData?.user_id;

    if (!post_id) {
        return res.status(400).json({ message: "Post ID is required!" });
    }

    try {
        // Get story owner
        const storyResult = await db.query(
            `SELECT user_id FROM posts WHERE post_id = $1`,
            [post_id]
        );

        if (storyResult.rowCount === 0) {
            return res.status(404).json({ message: "Story not found." });
        }

        const story = storyResult.rows[0];

        // Ignore author views
        if (user_id && user_id === story.user_id) {
            return res.status(200).json({ message: "Author read ignored" });
        }

        // Increment read count
        await db.query(
            `UPDATE posts 
             SET total_reads = total_reads + 1 
             WHERE post_id = $1`,
            [post_id]
        );

        return res.status(200).json({
            message: "Read count incremented."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

// GET INDIVIDUAL POSTS FOR SHARING 
export const getIndividualPublicPost = async (req, res) => {
    const user_id = req.userData?.user_id || null;
    const post_id = req.params.post_id;

    try {
        let query;
        let params;

        // 🔓 public (not logged in)
        if (!user_id) {
            query = `
                SELECT 
                    post_id,
                    create_date,
                    heading,
                    content,
                    audience,
                    total_reads,
                    total_likes,
                    total_saves,
                    total_comments,
                    category
                FROM posts
                WHERE post_id = $1
                  AND audience = 'public'
            `;
            params = [post_id];

        }
        // 🔐 Logged in user
        else {
            query = `
                SELECT 
                    p.post_id,
                    p.create_date,
                    p.heading,
                    p.content,
                    p.audience,
                    p.can_comment,
                    p.total_reads,
                    p.total_saves,
                    p.total_likes,
                    p.total_comments,
                    p.category,
                    CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked,
                    CASE WHEN p.user_id = $2 THEN 1 ELSE 0 END AS is_owner,
                    CASE WHEN s.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_saved
                FROM posts p
                LEFT JOIN likes l 
                    ON p.post_id = l.post_id 
                   AND l.user_id = $2
                LEFT JOIN saved_stories s
                    ON p.post_id = s.post_id
                   AND s.user_id = $2
                WHERE p.post_id = $1
                  AND (p.audience = 'public' OR p.user_id = $2)
            `;

            params = [post_id, user_id];
        }

        const result = await db.query(query, params);
        const rows = result.rows;

        if (!rows || rows.length === 0) {
            return res.status(404).send("Post not found!");
        }

        const post = rows[0];

        // safer decrypt handling
        const heading = post.heading ? decrypt(post.heading) : null;
        const content = post.content ? decrypt(post.content) : null;

        const response = {
            post_id: post.post_id,
            create_date: post.create_date,
            heading,
            content,
            audience: post.audience,
            can_comment: Boolean(post.can_comment),
            total_reads: post.total_reads,
            total_likes: post.total_likes,
            total_saves: post.total_saves,
            total_comments: post.total_comments,
            category: post.category
                ? post.category.split(",").map(c => c.trim())
                : [],
        };

        if (user_id) {
            response.is_liked = Boolean(post.is_liked);
            response.is_owner = Boolean(post.is_owner);
            response.is_saved = Boolean(post.is_saved);
        }

        return res.json(response);

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
};

// SAVE STORY
export const saveStory = async (req, res) => {
    const { post_id } = req.body;
    const user_id = req.userData.user_id;
    const actor_id = user_id;

    if (!post_id) {
        return res.status(400).json({ message: "Story ID required" });
    }

    if (!user_id) {
        return res.status(400).json({ message: "User ID required" });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // Check post owner
        const postResult = await client.query(
            `SELECT user_id FROM posts WHERE post_id = $1`,
            [post_id]
        );

        if (postResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Post not found." });
        }

        const recipient_id = postResult.rows[0].user_id;

        // Save story
        await client.query(
            `INSERT INTO saved_stories (user_id, post_id)
             VALUES ($1, $2)`,
            [user_id, post_id]
        );

        // Update save count
        await client.query(
            `UPDATE posts 
             SET total_saves = total_saves + 1 
             WHERE post_id = $1`,
            [post_id]
        );

        // Notification (skip self-notification)
        if (recipient_id !== 0 && recipient_id !== user_id) {
            await client.query(
                `INSERT INTO notifications 
                    (message, actor_id, recipient_id, post_id, notif_type)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    "Someone saved your story",
                    actor_id,
                    recipient_id,
                    post_id,
                    "save"
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({ message: "Story saved" });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        return res.status(500).json({ message: "Server error" });

    } finally {
        client.release();
    }
};

// REMOVE SAVED STORY
export const unsaveStory = async (req, res) => {
    const { post_id } = req.body;
    const user_id = req.userData.user_id;
    const actor_id = user_id;

    if (!post_id) {
        return res.status(400).json({ message: "Story ID required" });
    }

    if (!user_id) {
        return res.status(400).json({ message: "User ID required" });
    }

    try {
        // Remove saved story
        await db.query(
            `DELETE FROM saved_stories 
             WHERE user_id = $1 AND post_id = $2`,
            [user_id, post_id]
        );

        // Decrement save counter safely (prevent negative values)
        await db.query(
            `UPDATE posts 
             SET total_saves = GREATEST(total_saves - 1, 0)
             WHERE post_id = $1`,
            [post_id]
        );

        // Remove notification
        await db.query(
            `DELETE FROM notifications 
             WHERE actor_id = $1 
               AND post_id = $2 
               AND notif_type = 'save'`,
            [actor_id, post_id]
        );

        return res.status(200).json({ message: "Story unsaved" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// DOWNLOAD STORIES
export const downloadStories = async (req, res) => {
    const user_id = req.userData?.user_id;

    if (!user_id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { rows: stories } = await db.query(
            `
            SELECT heading, content, category, create_date
            FROM posts
            WHERE user_id = $1
            ORDER BY create_date ASC
            `,
            [user_id]
        );

        const decryptedStories = stories.map(story => ({
            heading: story.heading ? decrypt(story.heading) : null,
            content: story.content ? decrypt(story.content) : null,
            category: story.category
                ? story.category.split(",").map(c => c.trim())
                : [],
            create_date: story.create_date
        }));

        const formatDate = (rawDate) => {
            const date = new Date(rawDate);

            const datePart = date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });

            const timePart = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });

            return `${datePart} - ${timePart}`;
        };

        const paragraphs = [];

        decryptedStories.forEach(story => {

            paragraphs.push(
                new Paragraph({
                    children: [new TextRun("")],
                    spacing: { after: 100 }
                })
            );

            const hasHeading = story.heading && story.heading.trim() !== "";

            if (hasHeading) {
                paragraphs.push(
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [
                            new TextRun({
                                text: story.heading,
                                bold: true,
                                size: 28
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            }

            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Date: ${formatDate(story.create_date)}`,
                            bold: true,
                            size: 22
                        })
                    ],
                    spacing: { after: 400 }
                })
            );

            story.content
                ?.split("\n")
                .map(line => line.trim())
                .filter(Boolean)
                .forEach(line => {
                    paragraphs.push(
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            children: [
                                new TextRun({
                                    text: line,
                                    size: 24
                                })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                });

            paragraphs.push(
                new Paragraph({
                    children: [],
                    spacing: { after: 200 }
                })
            );

            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "====================================================",
                            size: 24,
                            bold: true
                        })
                    ],
                    spacing: { before: 200, after: 200 }
                })
            );
        });

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: "Calibri",
                            size: 24
                        }
                    }
                }
            },
            sections: [{ children: paragraphs }]
        });

        const buffer = await Packer.toBuffer(doc);

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=my_stories.docx"
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

