import Product from "../models/product.model.js";
import Category from "../models/categoy.model.js";
import cloudinary from "../lib/cloudinary.js";
import redis from "../lib/redis.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";

export const categoryImage = async (req, res) => {
  try {
    // Step 1: Get all distinct category names from products
    const categoryNames = await Product.distinct("category");

    // Step 2: For each category, get one random product image
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

    // First, find the category to get its name - save it before deletion
    const categoryToDelete = await Category.findById(id);

    if (!categoryToDelete) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Save category info before deletion
    const categoryInfo = {
      _id: categoryToDelete._id,
      name: categoryToDelete.name,
      createdAt: categoryToDelete.createdAt,
    };

    // Get all products in this category (case-insensitive)
    const productsInCategory = await Product.find({
      category: { $regex: new RegExp(`^${categoryToDelete.name}$`, "i") },
    });

    let actionMessage = "";
    let affectedProductsCount = productsInCategory.length;

    if (productsInCategory.length > 0) {
      if (deleteType === "archive") {
        // SOFT DELETE: Archive all products
        const updateResult = await Product.updateMany(
          { _id: { $in: productsInCategory.map((p) => p._id) } },
          {
            $set: {
              archived: true,
              isActive: false,
              archivedAt: new Date(),
            },
          }
        );

        // Log product archiving
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
        // HARD DELETE: Permanently delete all products and their images
        for (const product of productsInCategory) {
          // Delete images from Cloudinary
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
                // Continue with deletion even if image deletion fails
              }
            }
          }

          // Log product deletion
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

        // Delete all products from database
        await Product.deleteMany({
          _id: { $in: productsInCategory.map((p) => p._id) },
        });

        actionMessage = `${affectedProductsCount} product(s) have been permanently deleted.`;
      }
    }

    // NOW delete the category - this comes after processing products
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res
        .status(404)
        .json({ message: "Category not found during deletion" });
    }

    // Log the category deletion using the saved category info
    const requestInfo = AuditLogger.getRequestInfo(req);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: ACTIONS.DELETE_CATEGORY,
      entityType: ENTITY_TYPES.CATEGORY,
      entityId: categoryInfo._id, // Use saved ID
      entityName: categoryInfo.name, // Use saved name
      ...requestInfo,
      additionalInfo: `Category deleted. ${actionMessage}`,
    });

    // Clear featured products cache if any featured products were affected
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

    // Count products in this category (case-insensitive)
    const productCount = await Product.countDocuments({
      category: { $regex: new RegExp(`^${category.name}$`, "i") },
      archived: { $ne: true }, // Only count non-archived products
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