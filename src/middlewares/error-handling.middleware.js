import Joi from 'joi';

export default function (err, req, res, next) {
  if (err instanceof Joi.ValidationError) {
    return res.status(400).json({ errorMessage: err.message });
  }
  if(err.message ==='repeated category'){
    res.status(401).json({errorMessage:'이미 존재하는 카테고리입니다.'});
  }
  if(err.message ==='noCategory'){
    res.status(401).json({errorMessage:'존재하지 않는 카테고리입니다.'});
  }

  if(err.message ==='unqualified'){
    res.status(400).json({errorMessage:'데이터 형식이 올바르지 않습니다.'});
  }
  if(err.message ==='already'){
    res.status(409).json({errorMessage:'중복된 닉네임입니다.'});
  }
  if(err.message ==='noNickname'){
    res.status(401).json({errorMessage:'존재하지 않는 닉네입입니다.'});
  }
  if(err.message ==='notMatch'){
    res.status(401).json({errorMessage:'비밀번호가 일치하지 않습니다.'});
  }
  

  return res
    .status(500)
    .json({ errorMessage: "서버 내부에서 에러가 발생했습니다." });
}
