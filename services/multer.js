const multer = require("multer")
const path = require("path")
const fs = require("fs")
const nanoid = require("nano-id")
const filetype = {
    Image: ["image/jpeg", "image/jpg", "image/png"],
    Video: ["video/mp4", "video/mkv", "video/avi", "video/mov"],
}

function myMulter(customPath, customvalid) {
    if (!customPath) {
        customPath = "general"
    }
    const fullPath = path.join(__dirname, `../uploads/${customPath}`)
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
    }
    function filterfile(req, file, cb) {
        if (customvalid.includes(file.mimtype)) {
            cb(null, true)
        } else {
            req.imagevalidtype = true
            cb(null, false)
        }
    }
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            req.destination = `uploads/${customPath}`
            cb(null, fullPath)
        }, filename: function (req, file, cb) {
            const filestoragename = nanoid() + "_" + file.originalname
            cb(null, filestoragename)
        }
    })
    const upload = multer({ dest: fullPath, limits: { fileSize: 50 * 1024 * 1024 }, filterfile, storage })
    return upload
}
module.exports = { myMulter, filetype }