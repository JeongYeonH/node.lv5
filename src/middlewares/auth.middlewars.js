import jwt from "jsonwebtoken";
import {prisma} from '../utils/prisma/index.js'

export default async function (req, res, next) {
  try {
    // 먼저 쿠키를 클라이언트로부터 가져옵니다.
    const { authoriazation } = req.cookies;
    // 토큰 존재 여부를 확인합니다.
    if(!authoriazation){
      return res.status(400).json({message: '로그인이 필요한 서비스입니다.'});
    }
    // 쿠키가 Bearar형식인지 검사를 합니다.
    const [tokenType, token] = authoriazation.split(" ");
    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    // 토큰이 JWT인지 비밀키를 사용해 검증을 합니다.
    const decodedToken = jwt.verify(token, "customized_secret_key");
    // 이후 토큰에서 id와 user_type을 추출합니다.
    const id = decodedToken.id;
    const user_type = decodedToken.user_type;

    // ID을 기준으로 해서 db에서 사용자를 조회합니다.
    const user = await prisma.users.findFirst({
        where: { id: +id },
    })
    // 사용자가 없을 시 쿠키 삭제 및 에러를 전달합니다.
    if(!user){
        res.clearCookie('authoriazation');
        throw new Error('토큰 사용자가 존재하지 않습니다.');
    }
    req.user = user;
    next();

  } catch (err) {
    // 에러 발생 시, 검증에 사용한 쿠키를 삭제합니다.
    res.clearCookie('authoriazation');
    switch (err.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다." });
        break;
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰 인증에 실패하였습니다." });
        break;
      default:
        return res.status(401).json({ message: err.message ?? "비 정상적인 요청입니다." });
    }
  }
}
