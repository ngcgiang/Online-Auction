const {QA } = require('../models');
const sequelize = require('../config/db');

class qaService {
    async addComment(productId, userId, parentCommentId, content) {
        try{
            const newComment = await QA.create({
                product_id: productId,
                user_id: userId,
                parent_comment_id: parentCommentId,
                content: content
            });
            return newComment;
        } catch (error) {
            console.error("addComment error:", error);
            throw new Error('Failed to add comment');
        }
    }
    async getCommentsByProduct(productId) {
    try {
        const comments = await QA.findAll({
            where: { product_id: productId, parent_comment_id: null }, // get top-level
            include: [
                {
                    model: QA,
                    as: 'replies',
                    include: [
                        {
                            model: QA,
                            as: 'replies'
                        }
                    ]
                }
            ]
        });

        return comments;
    } catch (error) {
        console.error("getCommentsByProduct error:", error);
        throw new Error('Failed to fetch comments');
    }
}

}

module.exports = new qaService();