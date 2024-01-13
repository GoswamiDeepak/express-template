import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    ccloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        return null;
    }
    const responce = await cloudinary.uploader.upload(localFilePath, {
        resource_type: 'auto',
    });
    fs.unlinkSync(localFilePath);
    return responce;
};

const deleteFromCloudinary = async (pulbicId) => {
    if (!pulbicId) return null;
    const result = await cloudinary.uploader.destroy(pulbicId);
    if (!result) {
        return false;
    } else {
        return result;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
