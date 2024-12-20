import sharp from "sharp";
import fs from "fs";
import path from "path";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

const bufferToBase64 = (buffer, mimeType = "image/jpeg") => {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form:", err);
        return res.status(500).json({ success: false, message: "Error parsing form" });
      }

      try {
        const { width, height } = fields;
        const filesArray = Array.isArray(files.file) ? files.file : [files.file];
        let imagesResized = [];
        let imagesData = [];
        for (const file of filesArray) {
          //NECESITO SACAR EL WIDTH Y EL HEIGHT DE LA IMAGEN
          if (!file || !file.filepath) {
            console.error("No image file provided");
            return res.status(400).json({ success: false, message: "No image file provided" });
          }
          const inputPath = file.filepath;
          // Obtener dimensiones originales de la imagen
          const metadata = await sharp(inputPath).metadata();
          const fileWidth = metadata.width;
          const fileHeight = metadata.height;
          
          let outputWidth, outputHeight;

          if (fileWidth / fileHeight > width / height) {
            outputHeight = parseInt(height);
            outputWidth = null;
          } else {
            outputWidth = parseInt(width);
            outputHeight = null;
          }
          const { data, info } = await sharp(inputPath)
            .resize(
              outputWidth,
              outputHeight,
              {
                fit: sharp.fit.cover,
                position: "center",
              }
            )
            .jpeg({ quality: 100 })
            .toBuffer({ resolveWithObject: true });
          const imageSrc = bufferToBase64(data, "image/jpeg");
          imagesResized.push(imageSrc);
          imagesData.push(info);
        }

        return res.status(200).json({
          success: true,
          path: `/resized/resized-${width}x${height}-${filesArray[0].originalFilename}`,
          image: imagesResized,
          data: imagesData,
        });
      } catch (error) {
        console.error("Error resizing image:", error);
        return res.status(500).json({ success: false, message: "Error resizing image" });
      }
    });
  } else {
    console.log("Method not allowed");
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
}
