import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        return null;
    }
    const responce = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return responce;
};

const deleteFromCloudinary = async (url) => {
    const public_id = url.split("/").pop().split(".")[0];
    console.log(public_id);
    try {
        const responce = await cloudinary.uploader.destroy(public_id);
        return responce;
    } catch (error) {
        console.log(error);
        // return null;
        return error;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };







/*
responce return
{
    asset_id: '0ff02767c4e9751d57b07fb84b559d3a',
    public_id: 'tv69hdfkykrcj5fypn5l',
    version: 1706020588,
    version_id: '1e1800f9e06ea350874ac60e7edc0ec2',
    signature: '6145d3f7c11dc3b87b4507ad755c18b6378dd6d5',
    width: 2880,
    height: 1800,
    format: 'jpg',
    resource_type: 'image',
    created_at: '2024-01-23T14:36:28Z',
    tags: [],
    bytes: 667980,
    type: 'upload',
    etag: '8971ea0ca97b3da1f10cbfa010412620',
    placeholder: false,
    url: 'http://res.cloudinary.com/daceywhty/image/upload/v1706020588/tv69hdfkykrcj5fypn5l.jpg',
    secure_url: 'https://res.cloudinary.com/daceywhty/image/upload/v1706020588/tv69hdfkykrcj5fypn5l.jpg',
    folder: '',
    original_filename: 'wp1809623-grand-theft-auto-v-wallpapers',
    api_key: '656468122263997'
  }
  */
