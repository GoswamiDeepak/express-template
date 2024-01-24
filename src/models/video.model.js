import mongoose from mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = mongoose.Schema({
    videoFile : {
        type : String, //cloudinary url
        required : true
    },
    thumbnail : {
        type : String, //cloudinary url
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    duration : {
        type : String,
        required : true
    },
    views : {
        type : Number,
        default : 0
    },
    isPublished: {
        type : Boolean,
        default : true
    }
},
    { timestamp: true }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)