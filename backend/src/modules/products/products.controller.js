const apiResponse = require('../../utils/apiResponse');
const productsService = require('./products.service');

const createProduct = async (req, res) => {
  const product = await productsService.createProduct(req.validatedBody, req.organizationId, req.user.id);
  return apiResponse.created(res, product, 'Product created successfully');
};

const listProducts = async (req, res) => {
  const { data, pagination } = await productsService.listProducts(req.validatedQuery, req.organizationId);
  return apiResponse.paginated(res, data, pagination, 'Products fetched successfully');
};

const getProduct = async (req, res) => {
  const product = await productsService.getProduct(req.params.productId, req.organizationId);
  return apiResponse.success(res, product, 'Product fetched successfully');
};

const updateProduct = async (req, res) => {
  const product = await productsService.updateProduct(req.params.productId, req.validatedBody, req.organizationId);
  return apiResponse.success(res, product, 'Product updated successfully');
};

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
};
