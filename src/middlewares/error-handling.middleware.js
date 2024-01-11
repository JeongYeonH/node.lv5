import Joi from "joi";

export default function (err, req, res, next) {
  try {
    console.log("errrrrrrrr", err);
    if (err instanceof Joi.ValidationError) {
      return res.status(400).json({ errorMessage: err.message });
    }
    if (err.message === "repeated category") {
      res.status(401).json({ errorMessage: "이미 존재하는 카테고리입니다." });
    }
    if (err.message === "noCategory") {
      res.status(401).json({ errorMessage: "존재하지 않는 카테고리입니다." });
    }

    if (err.message === "unqualified") {
      res
        .status(400)
        .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
    }
    if (err.message === "already") {
      res.status(409).json({ errorMessage: "중복된 닉네임입니다." });
    }
    if (err.message === "noNickname") {
      res.status(401).json({ errorMessage: "존재하지 않는 닉네입입니다." });
    }
    if (err.message === "notMatch") {
      res.status(401).json({ errorMessage: "비밀번호가 일치하지 않습니다." });
    }
    if (err.message === "OnlyOwner"){
      res.status(401).json({ errorMessage: "사장님만 사용할 수 있는 API입니다." });
    }
    if (err.message === "noMenu"){
      res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." });
    }
    if (err.message === "OnlyClient"){
      res.status(401).json({ errorMessage: "소비자만 사용할 수 있는 API입니다." });
    }
    if (err.message === "noOrder"){
      res.status(401).json({ errorMessage: "존재하지 않는 주문내역입니다." });
    }
    if (err.message === "noMenu"){
      res.status(401).json({ errorMessage: "존재하지 않는 메뉴입니다." });
    }
    if (err.message === "noZero"){
      res.status(400).json({ errorMessage:  "메뉴 가격은 0보다 작을 수 없습니다." });
    }

    return res
      .status(500)
      .json({ errorMessage: "서버 내부에서 에러가 발생했습니다." });
  } catch (err) {
    return res
      .status(500)
      .json({ errorMessage: "서버 내부에서 에러가 발생했습니다." });
  }
}
