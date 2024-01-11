import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddlewars from "../middlewares/auth.middlewars.js";

const router = express.Router();

// 메뉴를 주문하는 API입니다.
router.post("/orders", authMiddlewars, async (req, res, next) => {
  try {
    if (req.user.authorization !== "CLIENT") {
      next(new Error("OnlyClient"));
    }
    const { menuId, quantity } = req.body;
    if (!menuId || !quantity) {
      return next(new Error("unqualified"));
    }

    const menu = await prisma.menu.findFirst({
      where: { id: +menuId },
    });
    if (!menu) {
      return next(new Error("noOrder"));
    }

    const totalPrice = menu.price * quantity;

    const order = await prisma.orders.create({
      data: {
        UserId: +req.user.id,

        MenuId: +menu.id,

        quantity: +quantity,
        status: "PENDING",
        totalPrice: totalPrice,
      },
    });

    return res.status(200).json({ Message: "메뉴 주문이 완료되었습니다." });
  } catch (err) {
    next(err);
  }
});

// 소비자가 주문 내역을 조회하는 API입니다.
router.get("/orders/customer", authMiddlewars, async (req, res, next) => {
  try {
    if (req.user.authorization !== "CLIENT") {
      next(new Error("OnlyClient"));
    }

    const orders = await prisma.orders.findMany({
      where: { UserId: +req.user.id },
    });
    if (!orders) {
      return next(new Error("noOrder"));
    }

    return res.status(200).json({ data: orders });
  } catch (err) {
    next(err);
  }
});


// 사장님이 주문 내역을 조회하는 API입니다.
router.get("/orders/owner", authMiddlewars, async (req, res, next) => {
  try {
    if (req.user.authorization !== "OWNER") {
      next(new Error("OnlyOwner"));
    }

    const ordersWith = await prisma.orders.findMany({
      include: {
        User: {
          select: {
            id: true,
            nickname: true,
          }
        },
      },
      include: {
        Menu: {
          select: {
            name: true,
            price: true,
          }
        },
      },
    });
    if (!ordersWith) {
      return next(new Error("noOrder"));
    }

    return res.status(200).json({ data: ordersWith });
  } catch (err) {
    next(err);
  }
});

// 주문 내역을 수정하는 API입니다.
router.get("/orders/:orderId/status", authMiddlewars, async (req, res, next) => {
  try {
    if (req.user.authorization !== "OWNER") {
      next(new Error("OnlyOwner"));
    }
    const {orderId} = req.params;
    const {status} = req.body;
    if(!status){
      return next(new Error("unqualified"));
    }
    const order = await prisma.orders.update({
      where: {id: +orderId},
      data: {
        status,
      }
    });
    if (!order) {
      return next(new Error("noOrder"));
    }
    

    return res.status(200).json({ Message: "주문 내역을 수정하였습니다." });
  } catch (err) {
    next(err);
  }
});

export default router;
