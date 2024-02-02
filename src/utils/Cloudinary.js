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
    try {
        const responce = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        fs.unlinkSync(localFilePath);
        return responce;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    const public_id = url.split("/").pop().split(".")[0];
    try {
        const responce = await cloudinary.uploader.destroy(public_id);
        return responce;
    } catch (error) {
        console.log(error);
        return null;
        // return error;
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
    //video
  {
  asset_id: 'fab8408ffa6398939748a054957b339f',
  public_id: 'em8jitvdjyoj4e53tho4',
  version: 1706187533,
  version_id: 'a4fb5b834fd77de1ec8df949800e729d',
  signature: 'e3fa8cf63f4cb3b3e350e280180843f0079f1c34',
  width: 426,
  height: 240,
  format: 'mp4',
  resource_type: 'video',
  created_at: '2024-01-25T12:58:53Z',
  tags: [],
  pages: 0,
  bytes: 517805,
  type: 'upload',
  etag: '258f2cd39f2c07cb26b19aa863778816',
  placeholder: false,
  url: 'http://res.cloudinary.com/daceywhty/video/upload/v1706187533/em8jitvdjyoj4e53tho4.mp4',
  secure_url: 'https://res.cloudinary.com/daceywhty/video/upload/v1706187533/em8jitvdjyoj4e53tho4.mp4',
  playback_url: 'https://res.cloudinary.com/daceywhty/video/upload/sp_auto/v1706187533/em8jitvdjyoj4e53tho4.m3u8',
  folder: '',
  audio: {
    codec: 'aac',
    bit_rate: '62687',
    frequency: 48000,
    channels: 2,
    channel_layout: 'stereo'
  },
  video: {
    pix_format: 'yuv420p',
    codec: 'h264',
    level: 21,
    profile: 'High',
    bit_rate: '180680',
    time_base: '1/30'
  },
  is_audio: false,
  frame_rate: 30,
  bit_rate: 247976,
  duration: 16.705,
  rotation: 0,
  original_filename: 'videoClip',
  nb_frames: 501,
  api_key: '656468122263997'
}
*/
