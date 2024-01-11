import express from "express";
import Joi from "joi";
import { prisma } from "../utils/prisma/index.js";
import authMiddlewares from "../middlewares/auth.middlewars.js";
import imageUploader from "../middlewares/imageUploader.js";

const router = express.Router();

const checkOrder = Joi.object({
  name: Joi.string().min(2).max(20).required(),
  description: Joi.string().min(5).max(40).required(),
  image: Joi.string(),
  price: Joi.number(),
  order: Joi.number(),
  status: Joi.string(),
});
// 이미지 등록 API입니다.

// 메뉴를 등록하는 API입니다.
router.post(
  "/categories/:categoryId/menus",
  authMiddlewares,
  imageUploader.single("image"),
  async (req, res, next) => {
    try {
      if (req.user.authorization !== "OWNER") {
        next(new Error("OnlyOwner"));
      }
      // 유효성 검사를 합니다.
      const { name, description, image, price, status } =
        await checkOrder.validateAsync(req.body);
      // 메뉴 가격이 0으로 표시되면 오류 메시지를 반환합니다.
      if (price === 0) {
        return next(new Error("noZero"));
      }
      // 일부가 등록 데이터가 누락되었을 경우 오류를 반환합니다.
      if (!name || !description || !price || !status) {
        return next(new Error("unqualified"));
      }

      // 등록하려는 메뉴의 카테고리가 없을 경우에도 오류 메시지를 반환합니다.
      // 먼저 해당 카테고리가 존재하는지 검색합니다.
      const { categoryId } = req.params;
      const category = await prisma.categories.findFirst({
        where: { id: +categoryId },
      });
      // 검색해서 안 나올 경우, 오류 메시지를 반환합니다.
      if (!category) {
        return next(new Error("noCategory"));
      }
      // order를 생성하는 메서드 입니다.
      const maxOrder = await prisma.menu.findFirst({
        orderBy: {
          order: "desc",
        },
      });
      const order = maxOrder ? maxOrder.order + 1 : 1;
      req.body.image = req.file.location;

      // 해당 조건이 다 만족되었을 경우, sql에 해당 메뉴를 등록합니다.
      const menu = await prisma.menu.create({
        data: {
          name: name,
          description: description,
          image: req.file.location,
          price: price,
          order: order,
          status: status,
          CategoryId: +categoryId,
        },
      });
      // 메뉴 등록이 완료되면 클라이언트에게 완료 메시지를 반환합니다.
      return res.status(201).json({ Message: "메뉴를 등록하였습니다." });
    } catch (error) {
      console.log(error);
    }
  }
);

// 카테고리별 메뉴를 조회하는 API입니다.
router.get("/categories/:categoryId/menus", async (req, res, next) => {
  try {
    // 카테고리가 존재하지 않을 경우, 오류 메시지를 반환합니다.
    const { categoryId } = req.params;
    const category = await prisma.categories.findFirst({
      where: { id: +categoryId },
    });
    if (!category) {
      return next(new Error("noCategory"));
    }
    // 카테고리를 조건으로 삼아 메뉴 목록을 찾습니다.
    const menus = await prisma.menu.findMany({
      where: { CategoryId: +categoryId },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        order: true,
        status: true,
      },
      orderBy: { order: "asc" },
    });

    // 찾은 메뉴 목록을 클라이언트에게 전달합니다.
    return res.status(200).json({ data: menus });
  } catch (error) {
    next(error);
  }
});

// 메뉴를 상세 조회하는 API입니다.
router.get("/categories/:categoryId/menus/:menuId", async (req, res, next) => {
  try {
    // 카테고리가 존재하지 않을 경우, 오류 메시지를 반환합니다.
    const { categoryId } = req.params;
    const category = await prisma.categories.findFirst({
      where: { id: +categoryId },
    });
    if (!category) {
      return next(new Error("noCategory"));
    }
    // 메뉴가 존재하지 않을 경우에도, 마찬가지로 오류 메시지를 반환합니다.
    // 동시에, 메뉴를 상세 조회합니다.
    const { menuId } = req.params;
    const menu = await prisma.menu.findFirst({
      where: { id: +menuId },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        price: true,
        order: true,
        status: true,
        CategoryId: false,
      },
    });
    if (!menu) {
      return next(new Error("noMenu"));
    }

    // 상세 조회된 메뉴를 클라이언트에게 반환합니다.
    return res.status(200).json({ data: menu });
  } catch (error) {
    next(error);
  }
});

// 선택한 메뉴를 수정하는 API입니다.
router.patch(
  "/categories/:categoryId/menus/:menuId",
  authMiddlewares,
  async (req, res, next) => {
    try {
      if (req.user.authorization !== "OWNER") {
        next(new Error("OnlyOwner"));
      }
      // 유효성 검사를 합니다.
      const { name, description, price, order, status } =
        await checkOrder.validateAsync(req.body);
      // 메뉴 가격이 0으로 표시되면 오류 메시지를 반환합니다.
      if (price === 0) {
        return next(new Error("noZero"));
      }
      // 데이터 형식이 올바른지 확인을 합니다.
      if (!name || !description || !order || !price || !status) {
        return next(new Error("unqualified"));
      }
      // 카테고리가 존재하지 않을 경우, 오류 메시지를 반환합니다.
      const { categoryId } = req.params;
      const category = await prisma.categories.findFirst({
        where: { id: +categoryId },
      });
      if (!category) {
        return next(new Error("noCategory"));
      }
      // 메뉴 조회
      const { menuId } = req.params;
      const existingmenu = await prisma.menu.findFirst({
        where: { id: +menuId },
      });
      if (!existingmenu) {
        return next(new Error("noMenu"));
      }

      // 이후 데이터를 수정합니다.
      const modiedMenu = await prisma.menu.update({
        where: { id: +menuId },
        data: {
          name,
          description,
          price,
          order,
          status,
        },
      });

      return res.status(200).json({ Message: "메뉴를 수정하였습니다." });
    } catch (error) {
      next(error);
    }
  }
);

// 특정 메뉴를 삭제하는 API입니다.
router.delete(
  "/categories/:categoryId/menus/:menuId",
  authMiddlewares,
  async (req, res, next) => {
    try {
      if (req.user.authorization !== "OWNER") {
        next(new Error("OnlyOwner"));
      }
      const { categoryId } = req.params;
      // 먼저 특정 카테고리를 조회합니다.
      const existingPost = await prisma.categories.findUnique({
        where: {
          id: +categoryId,
        },
      });
      // 조회를 해서 없을 경우 에러 메시지를 클라이언트에게 전달합니다.
      if (!existingPost) {
        return next(new Error("noCategory"));
      }
      // 메뉴 id를 조회해서 존재 여부를 확인합니다.
      const { menuId } = req.params;
      const existingmenu = await prisma.menu.findFirst({
        where: { id: +menuId },
      });
      if (!existingmenu) {
        return next(new Error("noMenu"));
      }

      // 이후 삭제를 진행합니다.
      const menu = await prisma.menu.delete({
        where: { id: +menuId },
      });

      // 삭제 메서드까지 진행되었을 경우 삭제완료 메시지를 클라이언트게 전달합니다.
      return res.status(202).json({ Message: "메뉴를 삭제하였습니다." });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
