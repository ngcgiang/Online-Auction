const productService = require('../services/productService');

const fetchTopValueProducts = async (req, res) => {
    try {
        const products = await productService.getTopValueProducts();   
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in fetchTopValueProducts controller:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const fetchTopLeastTimeLeftProducts = async (req, res) => {
    try {
        const products = await productService.getTopLeastTimeLeftProducts();   
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in fetchTopLeastTimeLeftProducts controller:', error);
        res.status(500).json({ message: 'Internal server error' }); 
    }
}

const fetchTopMostBiddedProducts = async (req,res) => {
    try{
        const products = await productService.getTopMostBiddedProducts();
        res.status(200).json(products);
    } catch (error){
        console.error('Error in fetchTopMostBiddedProducts controller:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const fetchProductById = async (req,res) =>{
    const {product_id} = req.params;
    try{
        const product = await productService.getProductById(product_id);
        if(!product){
            return res.status(404).json({message: 'Product not found'});
        }
        res.status(200).json(product);
    } catch (error){
        console.error('Error in fetchProductById controller:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    fetchTopValueProducts, 
    fetchTopLeastTimeLeftProducts, 
    fetchTopMostBiddedProducts, 
    fetchProductById
};