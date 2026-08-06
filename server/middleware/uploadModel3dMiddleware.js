import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const model3dStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "4u-toys-models3d",
    resource_type: "raw",           // required for non-image files like .glb / .usdz
    allowed_formats: ["glb", "usdz", "gltf"],
    public_id: `model_${Date.now()}_${file.originalname.replace(/\.[^.]+$/, "")}`,
  }),
});

const uploadModel3d = multer({
  storage: model3dStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["model/gltf-binary", "application/octet-stream", "model/vnd.usdz+zip", ""];
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (["glb", "usdz", "gltf"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .glb, .usdz, and .gltf files are allowed"), false);
    }
  },
});

export default uploadModel3d;
