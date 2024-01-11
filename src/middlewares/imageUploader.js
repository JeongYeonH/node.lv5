import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";

AWS.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: "ap-northeast-2",
});

const s3 = new AWS.S3();
const imageUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "yeonz90dash",
    acl: "public-read",
    key: function (req, file, cb) {
      const extension = path.extname(file.originalname);
      cb(null, `${Date.now().toString()}${extension}`);
    },
  }),
});

export default imageUploader;
