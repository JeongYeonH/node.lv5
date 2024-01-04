import express from "express";
import Joi from 'joi';
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();
// joi를 이용해 입력되는 데이터의 조건을 제한하였습니다.
const checkCategory = Joi.object({
  name: Joi.string().min(2).max(20).required(),
  order: Joi.number(),
});

// 카테고리 생성하는 API 입니다.
router.post("/categories", async (req, res, next) => {
  try {
    // joi를 통한 유효성 검사입니다.
    const validatedName = await checkCategory.validateAsync(req.body)
    const { error, name } = validatedName;
    if(error){
      throw new Joi.ValidationError();
    }

    // 입력된 name이 존재하는지 확인합니다.
    if (!name) {
      return res
        .status(400)
        .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
    }
    // 입력된 name이 중복되는지 확인하는 메서드입니다.
    const foundName = await prisma.categories.findFirst({
      where: { name: name },
    });
    if (foundName) {
      return res
        .status(401)
        .json({ errorMessage: "이미 존재하는 카테고리 입니다." });
    }
    // order를 생성하는 메서드 입니다.
    const maxOrder = await prisma.categories.findFirst({
      orderBy: {
        order: "desc",
      },
    });
    const order = maxOrder ? maxOrder.order + 1 : 1;

    // 이제 카테고리를 sql에 등록합니다.
    const post = await prisma.categories.create({
      data: {
        name: name,
        order: order,
      },
    });
    // 결과를 클라이언트에게 전달합니다.
    return res.status(201).json({ Message: "카테고리를 등록하였습니다." });
  } catch (error) {
    next(error);
  }
});

// 카테고리 목록을 조회하는 API입니다.
router.get("/categories", async (req, res, next) => {
  try {
    const posts = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        order: true,
      },
      // 목록을 order 순으로 정렬해서 보여줍니다.
      orderBy: {
        order: "asc",
      },
    });
    // 생성된 목록을 클라이언트에게 전달합니다.
    return res.status(200).json({ data: posts });
  } catch (error) {
    next(error);
  }
});

// 특정 카테고리의 정보를 변경하는 API입니다.
router.patch("/categories/:categoryId", async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    // joi를 통한 유효성 검사입니다.
    const validatedName = await checkCategory.validateAsync(req.body)
    const { error, name, order  } = validatedName;
    if(error){
      throw new Joi.ValidationError();
    }
    // 일단 클라이언트가 입력한 데이터가 올바른지 확인합니다.
    if (!name || !order) {
      return res
        .status(400)
        .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
    }
    
    // categoryId가 존재하는지 확인하는 메서드 입니다.
    const existingPost = await prisma.categories.findUnique({
      where: {
        id: +categoryId,
      },
    });
    if (!existingPost) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다." });
    }

    // 카테고리가 존재하면, 클라이언트의 데이터를 sql에 넣어 수정합니다.
    const modifedPost = await prisma.categories.update({
      where: { id: +categoryId },
      data: {
        name,
        order: +order,
      },
    });
    // 수정이 완료되면 클라이언트에게 성공 메시지를 전달합니다.
    return res.status(201).json({ Message: "카테고리 정보를 수정했습니다." });
  } catch (error) {
    next(error);
  }
});

// 특정 카테고리를 삭제하는 API입니다.
router.delete("/categories/:categoryId", async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    // 먼저 특정 카테고리를 조회합니다.
    const existingPost = await prisma.categories.findUnique({
      where: {
        id: +categoryId,
      },
    });
    // 조회를 해서 없을 경우 에러 메시지를 클라이언트에게 전달합니다.
    if (!existingPost) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다." });
    }

    // 이후 해당 카테고리를 삭제를 진행합니다.
    const deletedPost = await prisma.categories.delete({
      where: {
        id: +categoryId,
      },
    });

    // 삭제 메서드까지 진행되었을 경우 삭제완료 메시지를 클라이언트게 전달합니다.
    return res.status(202).json({ Message: "카테고리 정보를 삭제하였습니다." });
  } catch (error) {
    next(error);
  }
});



export default router;
