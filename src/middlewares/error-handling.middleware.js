export default function (err, req, res, next) {
  if (err instanceof Joi.ValidationError) {
    return res.status(400).json({ errorMessage: err.message });
  }

  return res
    .status(500)
    .json({ errorMessage: "서버 내부에서 에러가 발생했습니다." });
}
