const qaService = require('../services/qaService');
const productService = require('../services/productService');
const emailService = require('../services/emailService');
const bidService = require('../services/bidService');

const getQAbyProduct = async (req, res) => {
    try {
        const { product_id } = req.params;
        const comments = await qaService.getCommentsByProduct(product_id);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

const addComment = async (req, res) => {
    const { product_id, parent_comment_id, content } = req.body;
    const user_id = req.user?.user_id;
    
    try {
        // Get product details including seller info
        const product = await productService.getProductById(product_id);
        //console.log(product);
        const name = product.product_name;
        console.log(name);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const seller_id = product.seller_id;
        const seller_email = product.seller?.email || await productService.getSellerEmail(product_id);
        
        // Create the comment first
        const newComment = await qaService.addComment(product_id, user_id, parent_comment_id, content);
        
        // Determine who to notify based on who is commenting
        if (user_id !== seller_id) {
            // A bidder/user is commenting -> Notify the seller
            const link = `${process.env.FRONTEND_URL}/product/${product_id}`;
            const message = `Có câu hỏi mới về sản phẩm "${name}" của bạn.`;
            
            await emailService.sendQAEmail(seller_email, message, link);
            
        } else {
            // The seller is commenting (replying) -> Notify all bidders
            const emailList = await bidService.getBidddedUsersEmailsFromProduct(product_id);
            console.log(emailList);
            
            if (emailList && emailList.length > 0) {    
                const link = `${process.env.FRONTEND_URL}/product/${product_id}`;
                const message = `Người bán đã trả lời câu hỏi về sản phẩm "${name}".`;
                
                await emailService.sendQAEmail(emailList, message, link);
            }
        }
        
        res.status(201).json(newComment);
        
    } catch (error) {
        console.error('Error in addComment:', error);
        res.status(500).json({ error: error.message });
    }
};




module.exports = {
    getQAbyProduct,
    addComment
};