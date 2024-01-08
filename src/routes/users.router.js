import express from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();
const validateSign = Joi.object({
  nickname: Joi.string().min(3).max(15).alphanum().required(),
  password: Joi.string().min(8).max(20).required().not(Joi.ref('nickname')),
  authorization: Joi.string(),
});

// 회원가입을 하는 API입니다.
router.post("/sign-up", async (req, res, next) => {
  try {
    // 데이터가 잘 입력되었는지 확인하는 메서드입니다.
    const { nickname, password, authorization } = req.body;
    if (!nickname || !password || !authorization) {
      return next(new Error("unqualified"));
    }
    // Joi의 유효성 검사입니다.
    await validateSign.validateAsync(req.body);
    
    // 동일한 닉네임이 존재하는지 확인합니다.
    const isExistUser = await prisma.users.findFirst({
      where: { nickname },
    });
    if (isExistUser) {
      return next(new Error("already"));
    }

    // 조건을 만족하면 유저 테이블에 데이터를 집어넣습니다.
    const user = await prisma.users.create({
      data: {
        nickname,
        password,
        authorization: authorization.toUpperCase(),
      },
    });
    // 회원가입 완료 메시지를 클라이언트에게 전달합니다.
    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    next(err);
  }
});

// 로그인을 하는 API입니다.
router.post("/sign-in", async (req, res, next) => {
  try {
    const { nickname, password } = req.body;
    // 데이터가 잘 입력되었는지 확인하는 메서드입니다.
    if (!nickname || !password) {
      return next(new Error("unqualified"));
    }
    // 닉네임이 존재하는지 확인합니다.
    const isExistUser = await prisma.users.findFirst({
      where: { nickname },
    });
    if (!isExistUser) {
      return next(new Error("noNickname"));
    }

    // 해당 닉네임과 비밀번호가 일치하는지 확인합니다.
    if (isExistUser.password !== password) {
      return next(new Error("notMatch"));
    }

    // 닉네임과 비밀번호가 일치하면 JWT토큰을 발급합니다.
    const token = jwt.sign(
      {
        id: isExistUser.id,
        user_type: isExistUser.authorization,
      },
      "customized_secret_key"
    );
    res.cookie("authoriazation", `Bearer ${token}`);

    // 과정이 완료되면 클라이언트에게 성공 메시지를 보냅니다.
    return res.status(200).json({ message: "로그인에 성공했습니다." });
  } catch (err) {
    next(err);
  }
});

export default router;
