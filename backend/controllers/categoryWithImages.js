import Product from "../models/product.model.js";
import Category from "../models/categoy.model.js";
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

    // First, find the category to get its name
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Case-insensitive check for products using this category
    const productsUsingCategory = await Product.countDocuments({
      category: { $regex: new RegExp(`^${category.name}$`, "i") },
    });

    if (productsUsingCategory > 0) {
      return res.status(400).json({
        message: `Cannot delete category "${category.name}". It's being used by ${productsUsingCategory} product(s).`,
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    // Log the deletion
    const requestInfo = AuditLogger.getRequestInfo(req);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: ACTIONS.DELETE_CATEGORY,
      entityType: ENTITY_TYPES.CATEGORY,
      entityId: category._id,
      entityName: category.name,
      ...requestInfo,
      additionalInfo: "Category permanently deleted",
    });

    res.json({
      message: "Category deleted successfully",
      deletedCategory: category,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};