import Product from "../models/product.model.js";
import Category from "../models/categoy.model.js";
import cloudinary from "../lib/cloudinary.js";
import redis from "../lib/redis.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";

export const categoryImage = async (req, res) => {
  try {

    const categoryNames = await Product.distinct("category");

    const categoriesWithImages = await Promise.all(
      categoryNames.map(async (catName) => {
        const randomProduct = await Product.aggregate([
          { $match: { category: catName } },
          { $sample: { size: 1 } },
        ]);

        return {
          name: catName,
          href: `/${catName.toLowerCase().replace(/\s+/g, "")}`,
          imageUrl: randomProduct[0]?.images?.[0] || "/default-category.jpg",
        };
      })
    );

    res.status(200).json(categoriesWithImages);
  } catch (error) {
    console.error("Error fetching categories with images:", error.message);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const createCategory =  async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error creating category", error });
  }
};

export const getCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const getNewCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteType = "archive" } = req.body;

    const categoryToDelete = await Category.findById(id);

    if (!categoryToDelete) {
      return res.status(404).json({ message: "Category not found" });
    }

    const categoryInfo = {
      _id: categoryToDelete._id,
      name: categoryToDelete.name,
      createdAt: categoryToDelete.createdAt,
    };

    const productsInCategory = await Product.find({
      category: { $regex: new RegExp(`^${categoryToDelete.name}$`, "i") },
    });

    let actionMessage = "";
    let affectedProductsCount = productsInCategory.length;

    if (productsInCategory.length > 0) {
      if (deleteType === "archive") {

       
        for (const product of productsInCategory) {
          const requestInfo = AuditLogger.getRequestInfo(req);
          await AuditLogger.log({
            adminId: req.user._id,
            adminName: `${req.user.firstname} ${req.user.lastname}`,
            action: ACTIONS.ARCHIVE_PRODUCT,
            entityType: ENTITY_TYPES.PRODUCT,
            entityId: product._id,
            entityName: product.name,
            changes: {
              before: {
                archived: product.archived,
                isActive: product.isActive,
                category: product.category,
              },
              after: {
                archived: true,
                isActive: false,
                category: product.category,
              },
            },
            ...requestInfo,
            additionalInfo: `Product archived due to category "${categoryToDelete.name}" deletion`,
          });
        }

        actionMessage = `${affectedProductsCount} product(s) have been archived.`;
      } else if (deleteType === "permanent") {

        for (const product of productsInCategory) {

          if (product.images?.length > 0) {
            for (const imageUrl of product.images) {
              try {
                const urlParts = imageUrl.split("/");
                const filename = urlParts[urlParts.length - 1];
                const publicId = filename.split(".")[0];
                await cloudinary.uploader.destroy(`products/${publicId}`);
              } catch (cloudinaryError) {
                console.error(
                  `Error deleting image for product ${product._id}:`,
                  cloudinaryError
                );
                
              }
            }
          }

          const requestInfo = AuditLogger.getRequestInfo(req);
          await AuditLogger.log({
            adminId: req.user._id,
            adminName: `${req.user.firstname} ${req.user.lastname}`,
            action: ACTIONS.PERMANENT_DELETE_PRODUCT,
            entityType: ENTITY_TYPES.PRODUCT,
            entityId: product._id,
            entityName: product.name,
            changes: {
              deleted: {
                name: product.name,
                imagesCount: product.images?.length || 0,
                variantsCount: product.variants?.length || 0,
                price: product.price,
              },
            },
            ...requestInfo,
            additionalInfo: `Product permanently deleted due to category "${categoryToDelete.name}" deletion`,
          });
        }

        await Product.deleteMany({
          _id: { $in: productsInCategory.map((p) => p._id) },
        });

        actionMessage = `${affectedProductsCount} product(s) have been permanently deleted.`;
      }
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res
        .status(404)
        .json({ message: "Category not found during deletion" });
    }

    const requestInfo = AuditLogger.getRequestInfo(req);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: ACTIONS.DELETE_CATEGORY,
      entityType: ENTITY_TYPES.CATEGORY,
      entityId: categoryInfo._id, 
      entityName: categoryInfo.name,
      ...requestInfo,
      additionalInfo: `Category deleted. ${actionMessage}`,
    });

    const hadFeaturedProducts = productsInCategory.some((p) => p.isFeatured);
    if (hadFeaturedProducts) {
      await redis.del("featured_products");
    }

    res.json({
      success: true,
      message: `Category "${categoryInfo.name}" deleted successfully. ${actionMessage}`,
      deletedCategory: categoryInfo,
      affectedProductsCount,
      deleteType,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getCategoryWithProductCount = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const productCount = await Product.countDocuments({
      category: { $regex: new RegExp(`^${category.name}$`, "i") },
      archived: { $ne: true },
    });

    res.json({
      success: true,
      category: {
        _id: category._id,
        name: category.name,
        imageUrl: category.imageUrl,
        createdAt: category.createdAt,
      },
      productCount,
      hasProducts: productCount > 0,
    });
  } catch (error) {
    console.error("Error getting category with product count:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};